/**
 * Quem é o Jogador? — seleção diária determinística + comparação de atributos.
 */
import { createHash } from "node:crypto";
import {
  db,
  pool,
  dailyPlayerTable,
  dailyPlayerBlocksTable,
  playersTable,
  playerSeasonStatsTable,
} from "@workspace/db";
import { and, asc, desc, eq, lt, sql, inArray } from "drizzle-orm";
import { formatYmd, parseYmd, saoPauloYmd, type Ymd } from "./birthdays";

/** Data de lançamento do jogo (contagem Wordle #N). */
export const GAME_LAUNCH_DATE = "2026-08-02";

export const MAX_ATTEMPTS = 5;

/**
 * Janela máxima de não-repetição. O valor efetivo cai com o pool
 * (hoje ~86 com foto → ~81 dias) e sobe até 365 conforme fotos forem adicionadas.
 */
export const NO_REPEAT_DAYS_CAP = 365;

export function noRepeatDaysForPool(poolSize: number): number {
  return Math.min(NO_REPEAT_DAYS_CAP, Math.max(21, poolSize - 5));
}

/** @deprecated use noRepeatDaysForPool — kept for callers that need a static hint */
export const NO_REPEAT_DAYS = 60;

export type EligiblePlayer = {
  id: number;
  name: string;
  fullName: string;
  position: string;
  birthState: string | null;
  nationality: string | null;
  photoUrl: string | null;
  debutYear: number;
  debutDecade: number;
  appearances: number;
  goals: number;
};

export type AttributeResult = "match" | "miss" | "higher" | "lower";

export type GuessComparison = {
  position: { value: string; result: AttributeResult };
  birthState: { value: string | null; result: AttributeResult };
  nationality: { value: string | null; result: AttributeResult };
  debutDecade: { value: number; result: AttributeResult };
  appearances: { value: number; result: AttributeResult };
  goals: { value: number; result: AttributeResult };
};

function normText(s: string | null | undefined): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function normUf(s: string | null | undefined): string {
  return String(s ?? "").trim().toUpperCase();
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function addDaysYmd(ymd: Ymd, delta: number): Ymd {
  const d = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + delta));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function gameNumberForDate(dateStr: string): number {
  const launch = parseYmd(GAME_LAUNCH_DATE);
  const cur = parseYmd(dateStr);
  if (!launch || !cur) return 1;
  const a = Date.UTC(launch.year, launch.month - 1, launch.day);
  const b = Date.UTC(cur.year, cur.month - 1, cur.day);
  return Math.floor((b - a) / 86_400_000) + 1;
}

function pickIndex(dateStr: string, poolSize: number, salt = ""): number {
  if (poolSize <= 0) return 0;
  const digest = createHash("sha256")
    .update(`quem-e-o-jogador:${dateStr}:${salt}`)
    .digest();
  return digest.readUInt32BE(0) % poolSize;
}

let eligibleCache: { at: number; list: EligiblePlayer[] } | null = null;

export async function listEligiblePlayers(): Promise<EligiblePlayer[]> {
  if (eligibleCache && Date.now() - eligibleCache.at < 60_000) {
    return eligibleCache.list;
  }
  const { rows } = await pool.query<{
    id: number;
    name: string;
    fullName: string;
    position: string;
    birthState: string | null;
    nationality: string | null;
    photoUrl: string | null;
    debutYear: number;
    appearances: number;
    goals: number;
  }>(`
    WITH career AS (
      SELECT
        p.id,
        p.name,
        p.full_name,
        p.position,
        p.birth_state,
        p.nationality,
        p.photo_url,
        MIN(pss.season) AS first_season,
        COALESCE(SUM(pss.appearances), 0)::int AS apps,
        COALESCE(SUM(pss.goals), 0)::int AS goals,
        COUNT(pss.id)::int AS season_rows
      FROM players p
      LEFT JOIN player_season_stats pss ON pss.player_id = p.id
      GROUP BY p.id
    )
    SELECT
      id,
      name,
      full_name AS "fullName",
      position,
      birth_state AS "birthState",
      nationality,
      photo_url AS "photoUrl",
      LEFT(first_season, 4)::int AS "debutYear",
      apps AS appearances,
      goals
    FROM career
    WHERE full_name IS NOT NULL AND btrim(full_name) <> ''
      AND position IS NOT NULL AND btrim(position) <> ''
      AND (
        (birth_state IS NOT NULL AND btrim(birth_state) <> '')
        OR (nationality IS NOT NULL AND btrim(nationality) <> '')
      )
      AND first_season ~ '^[0-9]{4}'
      AND LEFT(first_season, 4)::int >= 1960
      AND apps > 0
      AND season_rows > 0
      AND photo_url IS NOT NULL
      AND btrim(photo_url) <> ''
      AND lower(btrim(photo_url)) NOT IN ('null', 'undefined', 'none')
    ORDER BY id ASC
  `);

  const blocked = await loadBlockedIds();
  const list = rows
    .filter((r) => !blocked.has(r.id))
    .map((r) => ({
      ...r,
      debutDecade: decadeOf(Number(r.debutYear)),
    }));
  eligibleCache = { at: Date.now(), list };
  return list;
}

async function loadBlockedIds(): Promise<Set<number>> {
  const rows = await db
    .select({ playerId: dailyPlayerBlocksTable.playerId })
    .from(dailyPlayerBlocksTable);
  return new Set(rows.map((r) => r.playerId));
}

export function clearEligibleCache() {
  eligibleCache = null;
}

async function loadPlayerAttrs(playerId: number): Promise<EligiblePlayer | null> {
  const [p] = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      fullName: playersTable.fullName,
      position: playersTable.position,
      birthState: playersTable.birthState,
      nationality: playersTable.nationality,
      photoUrl: playersTable.photoUrl,
    })
    .from(playersTable)
    .where(eq(playersTable.id, playerId))
    .limit(1);
  if (!p) return null;

  const stats = await db
    .select({
      firstSeason: sql<string | null>`min(${playerSeasonStatsTable.season})`,
      apps: sql<number>`coalesce(sum(${playerSeasonStatsTable.appearances}), 0)::int`,
      goals: sql<number>`coalesce(sum(${playerSeasonStatsTable.goals}), 0)::int`,
    })
    .from(playerSeasonStatsTable)
    .where(eq(playerSeasonStatsTable.playerId, playerId));

  const first = stats[0]?.firstSeason ?? null;
  const debutYear =
    first && /^\d{4}/.test(first) ? parseInt(first.slice(0, 4), 10) : 0;

  return {
    id: p.id,
    name: p.name,
    fullName: p.fullName?.trim() || p.name,
    position: p.position?.trim() || "—",
    birthState: p.birthState?.trim() || null,
    nationality: p.nationality?.trim() || null,
    photoUrl: p.photoUrl ?? null,
    debutYear,
    debutDecade: debutYear > 0 ? decadeOf(debutYear) : 0,
    appearances: Number(stats[0]?.apps ?? 0),
    goals: Number(stats[0]?.goals ?? 0),
  };
}

async function recentPlayerIds(
  beforeDate: string,
  days: number,
): Promise<Set<number>> {
  const cur = parseYmd(beforeDate);
  if (!cur) return new Set();
  const from = formatYmd(addDaysYmd(cur, -days));
  const rows = await db
    .select({ playerId: dailyPlayerTable.playerId })
    .from(dailyPlayerTable)
    .where(
      and(
        sql`${dailyPlayerTable.playDate} >= ${from}::date`,
        lt(dailyPlayerTable.playDate, beforeDate),
      ),
    );
  return new Set(rows.map((r) => r.playerId));
}

function choosePlayerId(
  dateStr: string,
  eligible: EligiblePlayer[],
  excluded: Set<number>,
  salt = "",
): number {
  const pool = eligible.filter((p) => !excluded.has(p.id));
  const use = pool.length > 0 ? pool : eligible;
  if (use.length === 0) {
    throw new Error("Nenhum jogador elegível para Quem é o Jogador?");
  }
  return use[pickIndex(dateStr, use.length, salt)]!.id;
}

export async function ensureDailyPlayer(dateStr: string): Promise<{
  date: string;
  playerId: number;
  gameNumber: number;
}> {
  const parsed = parseYmd(dateStr);
  if (!parsed) throw new Error(`Data inválida: ${dateStr}`);

  const [existing] = await db
    .select({
      playDate: dailyPlayerTable.playDate,
      playerId: dailyPlayerTable.playerId,
    })
    .from(dailyPlayerTable)
    .where(eq(dailyPlayerTable.playDate, dateStr))
    .limit(1);

  if (existing) {
    const blocked = await loadBlockedIds();
    if (!blocked.has(existing.playerId)) {
      return {
        date: dateStr,
        playerId: existing.playerId,
        gameNumber: gameNumberForDate(dateStr),
      };
    }
    await db
      .delete(dailyPlayerTable)
      .where(eq(dailyPlayerTable.playDate, dateStr));
  }

  const eligible = await listEligiblePlayers();
  const excluded = await recentPlayerIds(
    dateStr,
    noRepeatDaysForPool(eligible.length),
  );
  const playerId = choosePlayerId(dateStr, eligible, excluded);

  await db
    .insert(dailyPlayerTable)
    .values({ playDate: dateStr, playerId })
    .onConflictDoNothing();

  const [row] = await db
    .select({ playerId: dailyPlayerTable.playerId })
    .from(dailyPlayerTable)
    .where(eq(dailyPlayerTable.playDate, dateStr))
    .limit(1);

  return {
    date: dateStr,
    playerId: row?.playerId ?? playerId,
    gameNumber: gameNumberForDate(dateStr),
  };
}

export function todaySaoPauloDate(): string {
  return formatYmd(saoPauloYmd());
}

export function compareGuess(
  guess: EligiblePlayer,
  secret: EligiblePlayer,
): GuessComparison {
  const posMatch = normText(guess.position) === normText(secret.position);
  const stateMatch =
    !!guess.birthState &&
    !!secret.birthState &&
    normUf(guess.birthState) === normUf(secret.birthState);
  const natMatch =
    !!guess.nationality &&
    !!secret.nationality &&
    normText(guess.nationality) === normText(secret.nationality);

  const decadeResult: AttributeResult =
    guess.debutDecade === secret.debutDecade
      ? "match"
      : guess.debutDecade > secret.debutDecade
        ? "higher"
        : "lower";

  const appsResult: AttributeResult =
    guess.appearances === secret.appearances
      ? "match"
      : guess.appearances > secret.appearances
        ? "higher"
        : "lower";

  const goalsResult: AttributeResult =
    guess.goals === secret.goals
      ? "match"
      : guess.goals > secret.goals
        ? "higher"
        : "lower";

  return {
    position: { value: guess.position, result: posMatch ? "match" : "miss" },
    birthState: {
      value: guess.birthState,
      result: stateMatch ? "match" : "miss",
    },
    nationality: {
      value: guess.nationality,
      result: natMatch ? "match" : "miss",
    },
    debutDecade: { value: guess.debutDecade, result: decadeResult },
    appearances: { value: guess.appearances, result: appsResult },
    goals: { value: guess.goals, result: goalsResult },
  };
}

export function serializeAnswer(p: EligiblePlayer) {
  return {
    id: p.id,
    name: p.name,
    fullName: p.fullName,
    position: p.position,
    birthState: p.birthState,
    nationality: p.nationality,
    photoUrl: p.photoUrl,
    debutYear: p.debutYear,
    debutDecade: p.debutDecade,
    appearances: p.appearances,
    goals: p.goals,
  };
}

export async function evaluateGuess(
  dateStr: string,
  guessPlayerId: number,
  attempt: number,
) {
  const daily = await ensureDailyPlayer(dateStr);
  const [guess, secret] = await Promise.all([
    loadPlayerAttrs(guessPlayerId),
    loadPlayerAttrs(daily.playerId),
  ]);
  if (!guess) {
    throw Object.assign(new Error("Jogador do palpite não encontrado"), {
      status: 404,
    });
  }
  if (!secret) {
    throw Object.assign(new Error("Jogador secreto indisponível"), {
      status: 500,
    });
  }

  const correct = guess.id === secret.id;
  const comparison = compareGuess(guess, secret);
  const reveal = correct || attempt >= MAX_ATTEMPTS;

  return {
    correct,
    attempt,
    maxAttempts: MAX_ATTEMPTS,
    comparison,
    ...(reveal ? { answer: serializeAnswer(secret) } : {}),
  };
}

function dateToIso(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return formatYmd({
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  });
}

/** Foto pública do jogador (para proxy same-origin no canvas de compartilhamento). */
export async function getPlayerPhotoUrl(
  playerId: number,
): Promise<string | null> {
  const [p] = await db
    .select({ photoUrl: playersTable.photoUrl })
    .from(playersTable)
    .where(eq(playersTable.id, playerId))
    .limit(1);
  const url = p?.photoUrl?.trim() || null;
  if (!url) return null;
  if (["null", "undefined", "none"].includes(url.toLowerCase())) return null;
  return url;
}

/**
 * Remove datas de hoje em diante cujo jogador não está mais no pool elegível
 * (ex.: sem foto) e regenera a fila.
 */
export async function rebuildUpcomingQueue(days = 30) {
  eligibleCache = null;
  const eligible = await listEligiblePlayers();
  const eligibleIds = new Set(eligible.map((p) => p.id));
  const today = formatYmd(saoPauloYmd());

  const upcoming = await db
    .select({
      playDate: dailyPlayerTable.playDate,
      playerId: dailyPlayerTable.playerId,
    })
    .from(dailyPlayerTable)
    .where(sql`${dailyPlayerTable.playDate} >= ${today}::date`);

  for (const row of upcoming) {
    if (!eligibleIds.has(row.playerId)) {
      const d = dateToIso(row.playDate as string | Date);
      await db
        .delete(dailyPlayerTable)
        .where(eq(dailyPlayerTable.playDate, d));
    }
  }

  return getAdminQueue(days, false);
}

export async function getAdminQueue(days = 30, rebuildInvalid = true) {
  if (rebuildInvalid) {
    return rebuildUpcomingQueue(days);
  }

  const today = saoPauloYmd();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(formatYmd(addDaysYmd(today, i)));
  }

  const ensured = [];
  for (const d of dates) {
    ensured.push(await ensureDailyPlayer(d));
  }

  const playerIds = [...new Set(ensured.map((e) => e.playerId))];
  const players =
    playerIds.length === 0
      ? []
      : await db
          .select({
            id: playersTable.id,
            name: playersTable.name,
            photoUrl: playersTable.photoUrl,
            position: playersTable.position,
          })
          .from(playersTable)
          .where(inArray(playersTable.id, playerIds));
  const byId = new Map(players.map((p) => [p.id, p]));

  const history =
    playerIds.length === 0
      ? []
      : await db
          .select({
            playerId: dailyPlayerTable.playerId,
            playDate: dailyPlayerTable.playDate,
          })
          .from(dailyPlayerTable)
          .where(inArray(dailyPlayerTable.playerId, playerIds))
          .orderBy(asc(dailyPlayerTable.playDate));

  const histByPlayer = new Map<number, string[]>();
  for (const h of history) {
    const list = histByPlayer.get(h.playerId) ?? [];
    list.push(dateToIso(h.playDate as string | Date));
    histByPlayer.set(h.playerId, list);
  }

  const eligible = await listEligiblePlayers();
  const blocked = await listBlockedPlayers();

  return {
    poolSize: eligible.length,
    noRepeatDays: noRepeatDaysForPool(eligible.length),
    blocked,
    days: ensured.map((e) => {
      const p = byId.get(e.playerId);
      const allDates = histByPlayer.get(e.playerId) ?? [];
      return {
        date: e.date,
        gameNumber: e.gameNumber,
        player: {
          id: e.playerId,
          name: p?.name ?? `#${e.playerId}`,
          photoUrl: p?.photoUrl ?? null,
          position: p?.position?.trim() || "—",
        },
        previousAppearances: allDates.filter((d) => d < e.date),
      };
    }),
  };
}

export type BlockedPlayerRow = {
  playerId: number;
  name: string;
  photoUrl: string | null;
  position: string;
  note: string | null;
  createdAt: string;
};

export async function listBlockedPlayers(): Promise<BlockedPlayerRow[]> {
  const rows = await db
    .select({
      playerId: dailyPlayerBlocksTable.playerId,
      note: dailyPlayerBlocksTable.note,
      createdAt: dailyPlayerBlocksTable.createdAt,
      name: playersTable.name,
      photoUrl: playersTable.photoUrl,
      position: playersTable.position,
    })
    .from(dailyPlayerBlocksTable)
    .innerJoin(
      playersTable,
      eq(playersTable.id, dailyPlayerBlocksTable.playerId),
    )
    .orderBy(desc(dailyPlayerBlocksTable.createdAt));

  return rows.map((r) => ({
    playerId: r.playerId,
    name: r.name,
    photoUrl: r.photoUrl,
    position: r.position?.trim() || "—",
    note: r.note,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
  }));
}

/** Bloqueia o jogador do pool e regenera datas futuras em que ele estava. */
export async function blockDailyPlayer(playerId: number, note?: string | null) {
  const [player] = await db
    .select({ id: playersTable.id })
    .from(playersTable)
    .where(eq(playersTable.id, playerId))
    .limit(1);
  if (!player) {
    throw Object.assign(new Error("Jogador não encontrado"), { status: 404 });
  }

  await db
    .insert(dailyPlayerBlocksTable)
    .values({ playerId, note: note?.trim() || null })
    .onConflictDoNothing();

  eligibleCache = null;
  const today = formatYmd(saoPauloYmd());
  await db
    .delete(dailyPlayerTable)
    .where(
      and(
        eq(dailyPlayerTable.playerId, playerId),
        sql`${dailyPlayerTable.playDate} >= ${today}::date`,
      ),
    );

  return getAdminQueue(30, false);
}

export async function unblockDailyPlayer(playerId: number) {
  await db
    .delete(dailyPlayerBlocksTable)
    .where(eq(dailyPlayerBlocksTable.playerId, playerId));
  eligibleCache = null;
  return getAdminQueue(30, false);
}

/**
 * Troca o jogador de uma data (hoje ou futura), evitando o atual se possível.
 */
export async function replaceDailyPlayer(dateStr: string) {
  const parsed = parseYmd(dateStr);
  if (!parsed) {
    throw Object.assign(new Error(`Data inválida: ${dateStr}`), {
      status: 400,
    });
  }
  const today = formatYmd(saoPauloYmd());
  if (dateStr < today) {
    throw Object.assign(
      new Error("Não é possível trocar datas já passadas"),
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ playerId: dailyPlayerTable.playerId })
    .from(dailyPlayerTable)
    .where(eq(dailyPlayerTable.playDate, dateStr))
    .limit(1);

  const previousId = existing?.playerId;

  await db
    .delete(dailyPlayerTable)
    .where(eq(dailyPlayerTable.playDate, dateStr));

  eligibleCache = null;
  const eligible = await listEligiblePlayers();
  const excluded = await recentPlayerIds(
    dateStr,
    noRepeatDaysForPool(eligible.length),
  );
  if (previousId != null) excluded.add(previousId);

  const salt = `replace:${Date.now()}`;
  const playerId = choosePlayerId(dateStr, eligible, excluded, salt);

  await db.insert(dailyPlayerTable).values({ playDate: dateStr, playerId });

  return getAdminQueue(30, false);
}
