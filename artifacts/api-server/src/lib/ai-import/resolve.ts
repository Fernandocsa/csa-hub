import { db } from "@workspace/db";
import {
  playersTable,
  opponentsTable,
  competitionsTable,
  managersTable,
  refereesTable,
  matchesTable,
  matchLineupsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { normName } from "./norm";
import type { NameCandidate, ResolvedName, ResolveStatus } from "./types";

function buildNormMap<T extends { id: number; name: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = normName(row.name);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function finalize(
  raw: string,
  status: ResolveStatus,
  hit?: { id: number; name: string } | null,
  candidates: NameCandidate[] = [],
): ResolvedName {
  return {
    raw,
    status,
    id: hit?.id ?? null,
    name: hit?.name ?? null,
    candidates,
  };
}

function resolveFromMap(
  raw: string | null | undefined,
  byNorm: Map<string, { id: number; name: string }[]>,
  all: { id: number; name: string }[],
): ResolvedName | null {
  if (!raw?.trim()) return null;
  const original = raw.trim();
  const key = normName(original);
  const exact = byNorm.get(key) ?? [];
  if (exact.length === 1) return finalize(original, "exact", exact[0]);
  if (exact.length > 1) {
    return finalize(
      original,
      "ambiguous",
      null,
      exact.slice(0, 8).map((x) => ({ id: x.id, name: x.name })),
    );
  }

  const soft: { id: number; name: string }[] = [];
  for (const [k, list] of byNorm) {
    if (k.includes(key) || key.includes(k)) soft.push(...list);
  }
  const uniq = [...new Map(soft.map((x) => [x.id, x])).values()];
  if (uniq.length === 1) return finalize(original, "fuzzy", uniq[0]);
  if (uniq.length > 1) {
    return finalize(
      original,
      "ambiguous",
      null,
      uniq.slice(0, 8).map((x) => ({ id: x.id, name: x.name })),
    );
  }

  // token overlap ≥ 2
  const tokens = key.split(" ").filter((t) => t.length > 2);
  if (tokens.length >= 2) {
    const scored = all
      .map((row) => {
        const nt = new Set(normName(row.name).split(" ").filter((t) => t.length > 2));
        const shared = tokens.filter((t) => nt.has(t));
        return { row, shared: shared.length };
      })
      .filter((x) => x.shared >= 2)
      .sort((a, b) => b.shared - a.shared);
    if (scored.length === 1) return finalize(original, "fuzzy", scored[0].row);
    if (scored.length > 1 && scored[0].shared > scored[1].shared) {
      return finalize(original, "fuzzy", scored[0].row);
    }
    if (scored.length > 1) {
      return finalize(
        original,
        "ambiguous",
        null,
        scored.slice(0, 8).map((x) => ({ id: x.row.id, name: x.row.name })),
      );
    }
  }

  return finalize(original, "missing");
}

export type EntityCatalog = {
  players: { id: number; name: string }[];
  opponents: { id: number; name: string }[];
  competitions: { id: number; name: string }[];
  managers: { id: number; name: string }[];
  referees: { id: number; name: string }[];
  playersByNorm: Map<string, { id: number; name: string }[]>;
  opponentsByNorm: Map<string, { id: number; name: string }[]>;
  competitionsByNorm: Map<string, { id: number; name: string }[]>;
  managersByNorm: Map<string, { id: number; name: string }[]>;
  refereesByNorm: Map<string, { id: number; name: string }[]>;
};

export async function loadEntityCatalog(): Promise<EntityCatalog> {
  const [players, opponents, competitions, managers, referees] = await Promise.all([
    db.select({ id: playersTable.id, name: playersTable.name }).from(playersTable),
    db.select({ id: opponentsTable.id, name: opponentsTable.name }).from(opponentsTable),
    db.select({ id: competitionsTable.id, name: competitionsTable.name }).from(competitionsTable),
    db.select({ id: managersTable.id, name: managersTable.name }).from(managersTable),
    db.select({ id: refereesTable.id, name: refereesTable.name }).from(refereesTable),
  ]);
  return {
    players,
    opponents,
    competitions,
    managers,
    referees,
    playersByNorm: buildNormMap(players),
    opponentsByNorm: buildNormMap(opponents),
    competitionsByNorm: buildNormMap(competitions),
    managersByNorm: buildNormMap(managers),
    refereesByNorm: buildNormMap(referees),
  };
}

export function resolvePlayer(raw: string | null | undefined, cat: EntityCatalog) {
  return resolveFromMap(raw, cat.playersByNorm, cat.players);
}
export function resolveOpponent(raw: string | null | undefined, cat: EntityCatalog) {
  return resolveFromMap(raw, cat.opponentsByNorm, cat.opponents);
}
export function resolveCompetition(raw: string | null | undefined, cat: EntityCatalog) {
  return resolveFromMap(raw, cat.competitionsByNorm, cat.competitions);
}
export function resolveManager(raw: string | null | undefined, cat: EntityCatalog) {
  return resolveFromMap(raw, cat.managersByNorm, cat.managers);
}
export function resolveReferee(raw: string | null | undefined, cat: EntityCatalog) {
  if (!raw?.trim()) return null;
  const stripped = raw.trim().replace(/\s*-\s*[A-Za-z]{2}\s*$/, "");
  return (
    resolveFromMap(stripped, cat.refereesByNorm, cat.referees) ??
    resolveFromMap(raw, cat.refereesByNorm, cat.referees)
  );
}

export async function findExistingMatch(opts: {
  date: string;
  opponentId: number | null;
  opponentRaw: string;
  homeAway: string;
}) {
  const dateMatches = await db
    .select({
      id: matchesTable.id,
      matchDate: matchesTable.matchDate,
      season: matchesTable.season,
      opponentId: matchesTable.opponentId,
      opponentName: opponentsTable.name,
      competitionId: matchesTable.competitionId,
      competitionName: competitionsTable.name,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      result: matchesTable.result,
      homeAway: matchesTable.homeAway,
      managerId: matchesTable.managerId,
      managerName: managersTable.name,
      refereeId: matchesTable.refereeId,
      refereeName: refereesTable.name,
      phase: matchesTable.phase,
      round: matchesTable.round,
      attendance: matchesTable.attendance,
      ownGoalsForCount: matchesTable.ownGoalsForCount,
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
    .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
    .leftJoin(refereesTable, eq(matchesTable.refereeId, refereesTable.id))
    .where(eq(matchesTable.matchDate, opts.date));

  if (dateMatches.length === 0) return null;
  if (dateMatches.length === 1) return dateMatches[0];

  let filtered = dateMatches;
  if (opts.opponentId != null) {
    const byId = filtered.filter((m) => m.opponentId === opts.opponentId);
    if (byId.length === 1) return byId[0];
    if (byId.length > 1) filtered = byId;
  } else {
    const key = normName(opts.opponentRaw);
    const byName = filtered.filter(
      (m) =>
        normName(m.opponentName).includes(key) || key.includes(normName(m.opponentName).split(" ")[0] ?? ""),
    );
    if (byName.length === 1) return byName[0];
    if (byName.length > 1) filtered = byName;
  }

  const byHa = filtered.filter((m) => m.homeAway === opts.homeAway);
  if (byHa.length === 1) return byHa[0];
  return filtered[0] ?? null;
}

export async function countCsaLineups(matchId: number): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`cast(count(*) as int)` })
    .from(matchLineupsTable)
    .where(and(eq(matchLineupsTable.matchId, matchId), eq(matchLineupsTable.side, "csa")));
  return row?.c ?? 0;
}

export function catalogNamesForPrompt(cat: EntityCatalog) {
  return {
    players: cat.players.map((p) => p.name).slice(0, 400),
    opponents: cat.opponents.map((o) => o.name),
    competitions: cat.competitions.map((c) => c.name),
    managers: cat.managers.map((m) => m.name),
    referees: cat.referees.map((r) => r.name),
  };
}
