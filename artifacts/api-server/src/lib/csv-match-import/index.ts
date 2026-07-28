/**
 * CSV match import helpers: parsers, name resolution with confirmation, sheet build.
 */
import { db } from "@workspace/db";
import { playersTable, managersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { replaceCsaMatchSheet } from "../match-sheet";
import {
  buildConflictMessage,
  findNameMatches,
  normName,
  type NameCatalogEntry,
} from "./name-match";

export type NameResolution = {
  rowIndex: number;
  kind: "player" | "manager";
  rawName: string;
  action: "use" | "create";
  entityId?: number;
};

export type NameConflict = {
  rowIndex: number;
  date: string;
  opponent: string;
  kind: "player" | "manager";
  rawName: string;
  matchType: "exact" | "similar";
  candidates: Array<{
    id: number;
    name: string;
    yearFrom: number | null;
    yearTo: number | null;
  }>;
  importYear: number | null;
  message: string;
};

export class NameConflictError extends Error {
  conflicts: NameConflict[];
  constructor(conflicts: NameConflict[]) {
    super("name_conflicts");
    this.conflicts = conflicts;
  }
}

export function parsePenaltyShootout(
  raw: string | undefined,
): { for: number; against: number } | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d+)\s*[xX×]\s*(\d+)$/);
  if (!m) return null;
  return { for: parseInt(m[1], 10), against: parseInt(m[2], 10) };
}

/** "37'2T" | "37 2T" | "37'" | "48'1T" → absolute minute + injury */
export function parseMinuteToken(raw: string): {
  minute: number | null;
  injuryTimeMinute: number | null;
} {
  const s = (raw ?? "").trim();
  if (!s) return { minute: null, injuryTimeMinute: null };

  const halfMatch = s.match(/^(\d+)\s*'?\s*([12])\s*T$/i);
  if (halfMatch) {
    const X = parseInt(halfMatch[1], 10);
    const half = parseInt(halfMatch[2], 10) as 1 | 2;
    if (half === 1) {
      if (X <= 45) return { minute: X, injuryTimeMinute: null };
      return { minute: 45, injuryTimeMinute: X - 45 };
    }
    const abs = 45 + X;
    if (abs <= 90) return { minute: abs, injuryTimeMinute: null };
    return { minute: 90, injuryTimeMinute: abs - 90 };
  }

  const plain = s.match(/^(\d+)\s*'?$/);
  if (plain) {
    return { minute: parseInt(plain[1], 10), injuryTimeMinute: null };
  }
  return { minute: null, injuryTimeMinute: null };
}

function splitSemi(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function parseLineup(raw: string | undefined): string[] {
  return splitSemi(raw);
}

/** "Out->In (minute|empty)" */
export function parseSubstitutions(raw: string | undefined): Array<{
  outName: string;
  inName: string;
  minute: number | null;
  injuryTimeMinute: number | null;
}> {
  const out: Array<{
    outName: string;
    inName: string;
    minute: number | null;
    injuryTimeMinute: number | null;
  }> = [];
  for (const part of splitSemi(raw)) {
    const m = part.match(/^(.+?)\s*->\s*(.+?)(?:\s*\(([^)]*)\))?$/);
    if (!m) continue;
    const outName = m[1].trim();
    const inName = m[2].trim();
    const minRaw = (m[3] ?? "").trim();
    const { minute, injuryTimeMinute } = minRaw
      ? parseMinuteToken(minRaw)
      : { minute: null, injuryTimeMinute: null };
    if (outName && inName) out.push({ outName, inName, minute, injuryTimeMinute });
  }
  return out;
}

/** "Nome (amarelo|vermelho) minuto" */
export function parseCards(raw: string | undefined): Array<{
  playerName: string;
  cardType: "yellow" | "red";
  minute: number;
  injuryTimeMinute: number | null;
}> {
  const out: Array<{
    playerName: string;
    cardType: "yellow" | "red";
    minute: number;
    injuryTimeMinute: number | null;
  }> = [];
  for (const part of splitSemi(raw)) {
    const m = part.match(/^(.+?)\s*\(\s*(amarelo|vermelho|yellow|red)\s*\)\s*(.*)$/i);
    if (!m) continue;
    const playerName = m[1].trim();
    const kind = m[2].toLowerCase();
    const cardType: "yellow" | "red" =
      kind === "vermelho" || kind === "red" ? "red" : "yellow";
    const { minute, injuryTimeMinute } = parseMinuteToken(m[3] ?? "");
    if (playerName && minute != null) {
      out.push({ playerName, cardType, minute, injuryTimeMinute });
    }
  }
  return out;
}

export function pairScorersWithMinutes(
  scorersRaw: string | undefined,
  minutesRaw: string | undefined,
): Array<{ name: string; minute: number | null; injuryTimeMinute: number | null }> {
  const names = splitSemi(scorersRaw);
  const minutes = splitSemi(minutesRaw);
  return names.map((name, i) => {
    const slot = minutes[i] ?? "";
    const parsed = slot ? parseMinuteToken(slot) : { minute: null, injuryTimeMinute: null };
    return { name, ...parsed };
  });
}

export function resolutionKey(
  rowIndex: number,
  kind: "player" | "manager",
  rawName: string,
): string {
  return `${rowIndex}|${kind}|${normName(rawName)}`;
}

function importYearFromRow(row: Record<string, string>): number | null {
  const d = row.date?.trim();
  if (d && /^\d{4}/.test(d)) return parseInt(d.slice(0, 4), 10);
  const s = row.season?.trim();
  if (s && /^\d{4}/.test(s)) return parseInt(s.slice(0, 4), 10);
  return null;
}

async function yearsForPlayers(
  ids: number[],
): Promise<Map<number, { yearFrom: number | null; yearTo: number | null }>> {
  const map = new Map<number, { yearFrom: number | null; yearTo: number | null }>();
  for (const id of ids) map.set(id, { yearFrom: null, yearTo: null });
  if (!ids.length) return map;

  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const fromLineups = await db.execute(sql`
    SELECT ml.player_id AS id,
           MIN(EXTRACT(YEAR FROM m.match_date)::int) AS y_from,
           MAX(EXTRACT(YEAR FROM m.match_date)::int) AS y_to
    FROM match_lineups ml
    INNER JOIN matches m ON m.id = ml.match_id
    WHERE ml.player_id IN (${idList})
    GROUP BY ml.player_id
  `);

  for (const r of fromLineups.rows as Array<{ id: number; y_from: number; y_to: number }>) {
    map.set(Number(r.id), {
      yearFrom: r.y_from ?? null,
      yearTo: r.y_to ?? null,
    });
  }

  // Fallback: season stats text years
  const missing = ids.filter((id) => map.get(id)?.yearFrom == null);
  if (missing.length) {
    const missList = sql.join(
      missing.map((id) => sql`${id}`),
      sql`, `,
    );
    const stats = await db.execute(sql`
      SELECT player_id AS id, season
      FROM player_season_stats
      WHERE player_id IN (${missList})
    `);
    const agg = new Map<number, number[]>();
    for (const s of stats.rows as Array<{ id: number; season: string }>) {
      const y = parseInt(String(s.season).slice(0, 4), 10);
      if (!Number.isFinite(y)) continue;
      const arr = agg.get(Number(s.id)) ?? [];
      arr.push(y);
      agg.set(Number(s.id), arr);
    }
    for (const [id, years] of agg) {
      map.set(id, {
        yearFrom: Math.min(...years),
        yearTo: Math.max(...years),
      });
    }
  }
  return map;
}

async function yearsForManagers(
  ids: number[],
): Promise<Map<number, { yearFrom: number | null; yearTo: number | null }>> {
  const map = new Map<number, { yearFrom: number | null; yearTo: number | null }>();
  for (const id of ids) map.set(id, { yearFrom: null, yearTo: null });
  if (!ids.length) return map;

  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const fromMatches = await db.execute(sql`
    SELECT manager_id AS id,
           MIN(EXTRACT(YEAR FROM match_date)::int) AS y_from,
           MAX(EXTRACT(YEAR FROM match_date)::int) AS y_to
    FROM matches
    WHERE manager_id IN (${idList})
    GROUP BY manager_id
  `);
  for (const r of fromMatches.rows as Array<{ id: number; y_from: number; y_to: number }>) {
    map.set(Number(r.id), { yearFrom: r.y_from ?? null, yearTo: r.y_to ?? null });
  }

  const missing = ids.filter((id) => map.get(id)?.yearFrom == null);
  if (missing.length) {
    const missList = sql.join(
      missing.map((id) => sql`${id}`),
      sql`, `,
    );
    const stats = await db.execute(sql`
      SELECT manager_id AS id, season
      FROM manager_season_stats
      WHERE manager_id IN (${missList})
    `);
    const agg = new Map<number, number[]>();
    for (const s of stats.rows as Array<{ id: number; season: string }>) {
      const y = parseInt(String(s.season).slice(0, 4), 10);
      if (!Number.isFinite(y)) continue;
      const arr = agg.get(Number(s.id)) ?? [];
      arr.push(y);
      agg.set(Number(s.id), arr);
    }
    for (const [id, years] of agg) {
      map.set(id, {
        yearFrom: Math.min(...years),
        yearTo: Math.max(...years),
      });
    }
  }
  return map;
}

export type EntityMaps = {
  players: NameCatalogEntry[];
  managers: NameCatalogEntry[];
  playerIdByNorm: Map<string, number>;
  managerIdByNorm: Map<string, number>;
};

export async function loadEntityMaps(): Promise<EntityMaps> {
  const [players, managers] = await Promise.all([
    db.select({ id: playersTable.id, name: playersTable.name }).from(playersTable),
    db.select({ id: managersTable.id, name: managersTable.name }).from(managersTable),
  ]);
  const playerIdByNorm = new Map<string, number>();
  const managerIdByNorm = new Map<string, number>();
  for (const p of players) playerIdByNorm.set(normName(p.name), p.id);
  for (const m of managers) managerIdByNorm.set(normName(m.name), m.id);
  return { players, managers, playerIdByNorm, managerIdByNorm };
}

type ResolveCtx = {
  rowIndex: number;
  row: Record<string, string>;
  maps: EntityMaps;
  /** Prefer row-specific, then batch-wide kind|norm */
  resolutionByKey: Map<string, NameResolution>;
  /** Confirmed/created in this import run — reuse without re-asking */
  sessionResolved: Map<string, number>;
  pendingConflicts: NameConflict[];
};

function batchNameKey(kind: "player" | "manager", rawName: string): string {
  return `${kind}|${normName(rawName)}`;
}

async function resolveEntity(
  ctx: ResolveCtx,
  kind: "player" | "manager",
  rawName: string,
): Promise<number | null> {
  const raw = rawName.trim();
  if (!raw) return null;

  const batchKey = batchNameKey(kind, raw);
  const remembered = ctx.sessionResolved.get(batchKey);
  if (remembered != null) return remembered;

  const rowKey = resolutionKey(ctx.rowIndex, kind, raw);
  const decision =
    ctx.resolutionByKey.get(rowKey) ?? ctx.resolutionByKey.get(batchKey);
  const catalog = kind === "player" ? ctx.maps.players : ctx.maps.managers;
  const idByNorm = kind === "player" ? ctx.maps.playerIdByNorm : ctx.maps.managerIdByNorm;

  const remember = (id: number) => {
    ctx.sessionResolved.set(batchKey, id);
    idByNorm.set(normName(raw), id);
    return id;
  };

  if (decision?.action === "use" && decision.entityId != null) {
    return remember(decision.entityId);
  }
  if (decision?.action === "create") {
    if (kind === "player") {
      const [created] = await db.insert(playersTable).values({ name: raw }).returning();
      ctx.maps.players.push({ id: created.id, name: created.name });
      return remember(created.id);
    }
    const [created] = await db.insert(managersTable).values({ name: raw }).returning();
    ctx.maps.managers.push({ id: created.id, name: created.name });
    return remember(created.id);
  }

  const match = findNameMatches(raw, catalog);
  if (match.type === "none") {
    if (kind === "player") {
      const [created] = await db.insert(playersTable).values({ name: raw }).returning();
      ctx.maps.players.push({ id: created.id, name: created.name });
      return remember(created.id);
    }
    const [created] = await db.insert(managersTable).values({ name: raw }).returning();
    ctx.maps.managers.push({ id: created.id, name: created.name });
    return remember(created.id);
  }

  // exact or similar → conflict unless already decided
  const yearsMap =
    kind === "player"
      ? await yearsForPlayers(match.hits.map((h) => h.id))
      : await yearsForManagers(match.hits.map((h) => h.id));

  const candidates = match.hits.map((h) => ({
    id: h.id,
    name: h.name,
    yearFrom: yearsMap.get(h.id)?.yearFrom ?? null,
    yearTo: yearsMap.get(h.id)?.yearTo ?? null,
  }));
  const importYear = importYearFromRow(ctx.row);
  ctx.pendingConflicts.push({
    rowIndex: ctx.rowIndex,
    date: ctx.row.date ?? "",
    opponent: ctx.row.opponent ?? "",
    kind,
    rawName: raw,
    matchType: match.type,
    candidates,
    importYear,
    message: buildConflictMessage({
      rawName: raw,
      kind,
      matchType: match.type,
      candidates,
      importYear,
    }),
  });
  return null;
}

function collectPlayerNamesFromRow(row: Record<string, string>): string[] {
  const names = new Set<string>();
  for (const n of parseLineup(row.lineup)) names.add(n);
  for (const s of parseSubstitutions(row.substitutions)) {
    names.add(s.outName);
    names.add(s.inName);
  }
  for (const g of pairScorersWithMinutes(row.scorers, row.scorer_minutes)) {
    names.add(g.name);
  }
  for (const c of parseCards(row.cards)) names.add(c.playerName);
  return [...names];
}

function rowNeedsSheet(row: Record<string, string>): boolean {
  return Boolean(
    row.lineup?.trim() ||
      row.substitutions?.trim() ||
      row.cards?.trim() ||
      (row.scorer_minutes?.trim() && row.scorers?.trim()),
  );
}

export async function resolveNamesForRow(
  rowIndex: number,
  row: Record<string, string>,
  maps: EntityMaps,
  resolutions: NameResolution[],
  sessionResolved?: Map<string, number>,
): Promise<{ managerId: number | null; playerIds: Map<string, number>; conflicts: NameConflict[] }> {
  const resolutionByKey = new Map<string, NameResolution>();
  for (const r of resolutions) {
    resolutionByKey.set(resolutionKey(r.rowIndex, r.kind, r.rawName), r);
    // Batch-wide fallback so one decision covers the same name on other rows
    resolutionByKey.set(batchNameKey(r.kind, r.rawName), r);
  }
  const pendingConflicts: NameConflict[] = [];
  const ctx: ResolveCtx = {
    rowIndex,
    row,
    maps,
    resolutionByKey,
    sessionResolved: sessionResolved ?? new Map(),
    pendingConflicts,
  };

  let managerId: number | null = null;
  if (row.manager?.trim()) {
    managerId = await resolveEntity(ctx, "manager", row.manager.trim());
  }

  const playerIds = new Map<string, number>();
  if (
    rowNeedsSheet(row) ||
    row.lineup?.trim() ||
    row.substitutions?.trim() ||
    row.cards?.trim()
  ) {
    for (const name of collectPlayerNamesFromRow(row)) {
      const id = await resolveEntity(ctx, "player", name);
      if (id != null) playerIds.set(normName(name), id);
    }
  }

  const seen = new Set<string>();
  const conflicts = pendingConflicts.filter((c) => {
    const k = resolutionKey(c.rowIndex, c.kind, c.rawName);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { managerId, playerIds, conflicts };
}

export async function buildAndWriteCsaSheet(
  matchId: number,
  row: Record<string, string>,
  playerIds: Map<string, number>,
  maps: EntityMaps,
): Promise<void> {
  if (!rowNeedsSheet(row)) return;

  const lineupNames = parseLineup(row.lineup);
  const subs = parseSubstitutions(row.substitutions);
  const cards = parseCards(row.cards);
  const goals = pairScorersWithMinutes(row.scorers, row.scorer_minutes);

  const idOf = (name: string): number | null => {
    const n = normName(name);
    return playerIds.get(n) ?? maps.playerIdByNorm.get(n) ?? null;
  };

  const lineups: Array<{
    playerId: number;
    playerName: string;
    role: "starter" | "bench";
    sortOrder: number;
  }> = [];
  const seenPlayers = new Set<number>();

  lineupNames.forEach((name, i) => {
    const playerId = idOf(name);
    if (playerId == null || seenPlayers.has(playerId)) return;
    seenPlayers.add(playerId);
    lineups.push({
      playerId,
      playerName: maps.players.find((p) => p.id === playerId)?.name ?? name,
      role: "starter",
      sortOrder: i,
    });
  });

  for (const s of subs) {
    for (const name of [s.outName, s.inName]) {
      const playerId = idOf(name);
      if (playerId == null || seenPlayers.has(playerId)) continue;
      seenPlayers.add(playerId);
      lineups.push({
        playerId,
        playerName: maps.players.find((p) => p.id === playerId)?.name ?? name,
        role: "bench",
        sortOrder: lineups.length,
      });
    }
  }

  // Ensure scorers/cards on sheet
  for (const g of goals) {
    const playerId = idOf(g.name);
    if (playerId == null || seenPlayers.has(playerId)) continue;
    seenPlayers.add(playerId);
    lineups.push({
      playerId,
      playerName: maps.players.find((p) => p.id === playerId)?.name ?? g.name,
      role: "bench",
      sortOrder: lineups.length,
    });
  }
  for (const c of cards) {
    const playerId = idOf(c.playerName);
    if (playerId == null || seenPlayers.has(playerId)) continue;
    seenPlayers.add(playerId);
    lineups.push({
      playerId,
      playerName: maps.players.find((p) => p.id === playerId)?.name ?? c.playerName,
      role: "bench",
      sortOrder: lineups.length,
    });
  }

  if (!lineups.length) return;

  const goalInputs = goals
    .map((g) => {
      const scorerPlayerId = idOf(g.name);
      if (scorerPlayerId == null || g.minute == null) return null;
      return {
        scorerPlayerId,
        scorerName: g.name,
        minute: g.minute,
        injuryTimeMinute: g.injuryTimeMinute,
      };
    })
    .filter(Boolean) as Array<{
    scorerPlayerId: number;
    scorerName: string;
    minute: number;
    injuryTimeMinute: number | null;
  }>;

  const cardInputs = cards
    .map((c) => {
      const playerId = idOf(c.playerName);
      if (playerId == null) return null;
      return {
        cardType: c.cardType,
        playerId,
        playerName: c.playerName,
        minute: c.minute,
        injuryTimeMinute: c.injuryTimeMinute,
      };
    })
    .filter(Boolean) as Array<{
    cardType: "yellow" | "red";
    playerId: number;
    playerName: string;
    minute: number;
    injuryTimeMinute: number | null;
  }>;

  const subInputs = subs
    .map((s) => {
      const playerOutId = idOf(s.outName);
      const playerInId = idOf(s.inName);
      if (playerOutId == null || playerInId == null) return null;
      return {
        playerOutId,
        playerOutName: s.outName,
        playerInId,
        playerInName: s.inName,
        minute: s.minute ?? 0,
        injuryTimeMinute: s.injuryTimeMinute,
      };
    })
    .filter(Boolean) as Array<{
    playerOutId: number;
    playerOutName: string;
    playerInId: number;
    playerInName: string;
    minute: number;
    injuryTimeMinute: number | null;
  }>;

  await replaceCsaMatchSheet(matchId, {
    lineups,
    goals: goalInputs,
    cards: cardInputs,
    substitutions: subInputs,
  });
}

export function computeOwnGoalsForCount(row: Record<string, string>): number {
  if (row.own_goals_for_count !== undefined && row.own_goals_for_count !== "") {
    const n = parseInt(row.own_goals_for_count, 10);
    if (!isNaN(n) && n >= 0) return n;
  }
  if (row.own_goal?.trim()) return 1;
  return 0;
}

export type ImportMatchesResult = {
  created: number;
  skipped: number;
  needsConfirmation: NameConflict[];
};
