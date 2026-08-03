import { db } from "@workspace/db";
import {
  matchesTable,
  managersTable,
  managerSeasonStatsTable,
} from "@workspace/db";
import { and, eq, sql, inArray } from "drizzle-orm";
import { officialPlayedMatchConditions } from "./match-filters";

export type ManagerStoredStats = {
  storedGames: number;
  storedWins: number;
  storedDraws: number;
  storedLosses: number;
  storedGoalsFor: number;
  storedGoalsAgainst: number;
  matchCount: number;
};

export type ManagerSeasonComputed = {
  season: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export async function computeManagerStatsFromMatches(
  managerId: number,
): Promise<ManagerStoredStats> {
  const [row] = await db
    .select({
      matchCount: sql<number>`cast(count(*) as int)`,
      storedWins: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end), 0) as int)`,
      storedDraws: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end), 0) as int)`,
      storedLosses: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end), 0) as int)`,
      storedGoalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
      storedGoalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
    })
    .from(matchesTable)
    .where(and(eq(matchesTable.managerId, managerId), officialPlayedMatchConditions()));

  const matchCount = row?.matchCount ?? 0;
  return {
    matchCount,
    storedGames: matchCount,
    storedWins: row?.storedWins ?? 0,
    storedDraws: row?.storedDraws ?? 0,
    storedLosses: row?.storedLosses ?? 0,
    storedGoalsFor: row?.storedGoalsFor ?? 0,
    storedGoalsAgainst: row?.storedGoalsAgainst ?? 0,
  };
}

export async function computeManagerSeasonStatsFromMatches(
  managerId: number,
): Promise<ManagerSeasonComputed[]> {
  const rows = await db
    .select({
      season: matchesTable.season,
      games: sql<number>`cast(count(*) as int)`,
      wins: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end), 0) as int)`,
      draws: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end), 0) as int)`,
      losses: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end), 0) as int)`,
      goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
      goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
    })
    .from(matchesTable)
    .where(and(eq(matchesTable.managerId, managerId), officialPlayedMatchConditions()))
    .groupBy(matchesTable.season)
    .orderBy(sql`${matchesTable.season} desc`);

  return rows.map((r) => ({
    season: r.season,
    games: r.games,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
  }));
}

export async function syncManagerCareerFromSeasonRows(managerId: number) {
  const [agg] = await db
    .select({
      games: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.games}), 0) as int)`,
      wins: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.wins}), 0) as int)`,
      draws: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.draws}), 0) as int)`,
      losses: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.losses}), 0) as int)`,
      goalsFor: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.goalsFor}), 0) as int)`,
      goalsAgainst: sql<number>`cast(coalesce(sum(${managerSeasonStatsTable.goalsAgainst}), 0) as int)`,
      rowCount: sql<number>`cast(count(*) as int)`,
    })
    .from(managerSeasonStatsTable)
    .where(eq(managerSeasonStatsTable.managerId, managerId));

  const rowCount = agg?.rowCount ?? 0;
  const now = new Date();

  const [updated] = await db
    .update(managersTable)
    .set({
      storedGames: rowCount > 0 ? (agg?.games ?? 0) : null,
      storedWins: rowCount > 0 ? (agg?.wins ?? 0) : null,
      storedDraws: rowCount > 0 ? (agg?.draws ?? 0) : null,
      storedLosses: rowCount > 0 ? (agg?.losses ?? 0) : null,
      storedGoalsFor: rowCount > 0 ? (agg?.goalsFor ?? 0) : null,
      storedGoalsAgainst: rowCount > 0 ? (agg?.goalsAgainst ?? 0) : null,
      statsSource: rowCount > 0 ? "calculated" : null,
      statsRecalculatedAt: rowCount > 0 ? now : null,
    })
    .where(eq(managersTable.id, managerId))
    .returning();

  return updated;
}

/**
 * Recalculate per-season rows from linked matches only.
 * Overwrites any previous manual season rows.
 * Removes seasons that no longer appear in official matches.
 * Syncs managers.stored_* from the sum of season rows.
 */
export async function recalculateManagerSeasonStats(managerId: number) {
  const [existing] = await db
    .select()
    .from(managersTable)
    .where(eq(managersTable.id, managerId));
  if (!existing) return null;

  const computedSeasons = await computeManagerSeasonStatsFromMatches(managerId);
  const computedSeasonKeys = computedSeasons.map((s) => s.season);
  const now = new Date();

  const existingRows = await db
    .select()
    .from(managerSeasonStatsTable)
    .where(eq(managerSeasonStatsTable.managerId, managerId));

  const bySeason = new Map(existingRows.map((r) => [r.season, r]));

  let upserted = 0;

  for (const c of computedSeasons) {
    const current = bySeason.get(c.season);
    if (current) {
      await db
        .update(managerSeasonStatsTable)
        .set({
          games: c.games,
          wins: c.wins,
          draws: c.draws,
          losses: c.losses,
          goalsFor: c.goalsFor,
          goalsAgainst: c.goalsAgainst,
          statsSource: "calculated",
          statsRecalculatedAt: now,
        })
        .where(eq(managerSeasonStatsTable.id, current.id));
    } else {
      await db.insert(managerSeasonStatsTable).values({
        managerId,
        season: c.season,
        games: c.games,
        wins: c.wins,
        draws: c.draws,
        losses: c.losses,
        goalsFor: c.goalsFor,
        goalsAgainst: c.goalsAgainst,
        statsSource: "calculated",
        statsRecalculatedAt: now,
      });
    }
    upserted += 1;
  }

  let removed = 0;
  const orphans = existingRows.filter(
    (r) => !computedSeasonKeys.includes(r.season),
  );
  if (orphans.length > 0) {
    const deleted = await db
      .delete(managerSeasonStatsTable)
      .where(
        inArray(
          managerSeasonStatsTable.id,
          orphans.map((r) => r.id),
        ),
      )
      .returning({ id: managerSeasonStatsTable.id });
    removed = deleted.length;
  }

  const manager = await syncManagerCareerFromSeasonRows(managerId);
  const seasonRows = await db
    .select()
    .from(managerSeasonStatsTable)
    .where(eq(managerSeasonStatsTable.managerId, managerId));

  return {
    manager,
    matchCount: computedSeasons.reduce((n, s) => n + s.games, 0),
    seasonsFromMatches: computedSeasons.length,
    upserted,
    preservedManual: 0,
    removedCalculated: removed,
    seasonRows,
  };
}

/** Legacy career-only recalc — delegates to season recalc from linked matches. */
export async function recalculateManagerStoredStats(managerId: number) {
  const result = await recalculateManagerSeasonStats(managerId);
  if (!result) return null;
  return { manager: result.manager, matchCount: result.matchCount };
}

const STORED_STAT_KEYS = [
  "storedGames",
  "storedWins",
  "storedDraws",
  "storedLosses",
  "storedGoalsFor",
  "storedGoalsAgainst",
] as const;

type StoredStatKey = (typeof STORED_STAT_KEYS)[number];

export function managerStoredStatsChanged(
  current: Pick<typeof managersTable.$inferSelect, StoredStatKey>,
  body: Partial<Record<StoredStatKey, number | null | undefined>>,
): boolean {
  return STORED_STAT_KEYS.some((key) => {
    if (body[key] === undefined) return false;
    return body[key] !== current[key];
  });
}

export function hasAnyStoredStat(
  body: Partial<Record<StoredStatKey, number | null | undefined>>,
): boolean {
  return STORED_STAT_KEYS.some((key) => body[key] != null);
}

/**
 * Public career totals = linked official matches only.
 * Manual stored floors are ignored.
 */
export function resolveManagerCareerStats(
  computed: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  },
  _stored?: {
    storedGames: number | null;
    storedWins: number | null;
    storedDraws: number | null;
    storedLosses: number | null;
    storedGoalsFor: number | null;
    storedGoalsAgainst: number | null;
    statsSource?: string | null;
  },
) {
  return computed;
}

/** @deprecated Prefer linked seasons only — kept for callers; always returns linked. */
export function floorManagerSeasonRow(
  _manual: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  } | null,
  linked: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  } | null,
) {
  return (
    linked ?? {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
    }
  );
}

function mapManagerSeasonPublicRow(row: {
  season: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
}) {
  return {
    year: row.season,
    matches: row.matches,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsScored: row.goalsScored,
    goalsConceded: row.goalsConceded,
    topScorer: null as string | null,
    topScorerGoals: null as number | null,
    topAppearances: null as string | null,
    topAppearancesCount: null as number | null,
  };
}

/** Public season table from linked matches only. */
export function resolveManagerSeasonStatsPublic(args: {
  statsSource?: string | null | undefined;
  seasonRows?: Array<{
    season: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  }>;
  linkedSeasons: ManagerSeasonComputed[];
}) {
  const { linkedSeasons } = args;
  return linkedSeasons
    .slice()
    .sort((a, b) => b.season.localeCompare(a.season))
    .map((linked) =>
      mapManagerSeasonPublicRow({
        season: linked.season,
        matches: linked.games,
        wins: linked.wins,
        draws: linked.draws,
        losses: linked.losses,
        goalsScored: linked.goalsFor,
        goalsConceded: linked.goalsAgainst,
      }),
    );
}

/** Derive tenure from season labels (YYYY-friendly text min/max). */
export function periodFromSeasons(seasons: string[]): {
  startYear: number | null;
  endYear: number | null;
} {
  if (seasons.length === 0) return { startYear: null, endYear: null };
  const numeric = seasons
    .map((s) => {
      const m = String(s).trim().match(/^(\d{4})/);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n): n is number => n != null);
  if (numeric.length > 0) {
    return {
      startYear: Math.min(...numeric),
      endYear: Math.max(...numeric),
    };
  }
  const sorted = [...seasons].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const asYear = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  return { startYear: asYear(first), endYear: asYear(last) };
}
