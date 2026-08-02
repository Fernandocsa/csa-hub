import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  matchGoalsTable,
  matchLineupsTable,
  matchesTable,
  playerSeasonStatsTable,
} from "@workspace/db";
import { officialPlayedMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";

export type PlayerSeasonFloor = {
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  manualAppearances: number;
  manualGoals: number;
  manualAssists: number;
  linkedAppearances: number;
  linkedGoals: number;
  linkedAssists: number;
};

function maxNum(a: number, b: number) {
  return a >= b ? a : b;
}

/** Count CSA sheet stats for a player, grouped by match season. */
export async function linkedPlayerSeasonStats(playerId: number) {
  const apps = await db
    .select({
      season: matchesTable.season,
      appearances: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .where(
      and(
        eq(matchLineupsTable.playerId, playerId),
        eq(matchLineupsTable.side, "csa"),
        csaLineupActuallyPlayedCondition(),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchesTable.season);

  const goals = await db
    .select({
      season: matchesTable.season,
      goals: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .where(
      and(
        eq(matchGoalsTable.scorerPlayerId, playerId),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchesTable.season);

  const assists = await db
    .select({
      season: matchesTable.season,
      assists: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .where(
      and(
        eq(matchGoalsTable.assistPlayerId, playerId),
        eq(matchGoalsTable.side, "csa"),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchesTable.season);

  const map = new Map<
    string,
    { appearances: number; goals: number; assists: number }
  >();
  for (const r of apps) {
    map.set(r.season, {
      appearances: r.appearances ?? 0,
      goals: 0,
      assists: 0,
    });
  }
  for (const r of goals) {
    const cur = map.get(r.season) ?? { appearances: 0, goals: 0, assists: 0 };
    cur.goals = r.goals ?? 0;
    map.set(r.season, cur);
  }
  for (const r of assists) {
    const cur = map.get(r.season) ?? { appearances: 0, goals: 0, assists: 0 };
    cur.assists = r.assists ?? 0;
    map.set(r.season, cur);
  }
  return map;
}

/**
 * Displayed season stats = GREATEST(manual season row, linked sheet counts).
 * Manual values act as a floor until linked matches exceed them.
 */
export async function flooredPlayerSeasonStats(
  playerId: number,
): Promise<PlayerSeasonFloor[]> {
  const manualRows = await db
    .select({
      season: playerSeasonStatsTable.season,
      appearances: playerSeasonStatsTable.appearances,
      goals: playerSeasonStatsTable.goals,
      assists: playerSeasonStatsTable.assists,
    })
    .from(playerSeasonStatsTable)
    .where(eq(playerSeasonStatsTable.playerId, playerId));

  const linked = await linkedPlayerSeasonStats(playerId);
  const seasons = new Set<string>([
    ...manualRows.map((r) => r.season),
    ...linked.keys(),
  ]);

  const manualBySeason = new Map(
    manualRows.map((r) => [
      r.season,
      {
        appearances: r.appearances ?? 0,
        goals: r.goals ?? 0,
        assists: r.assists ?? 0,
      },
    ]),
  );

  return [...seasons]
    .sort((a, b) => b.localeCompare(a))
    .map((season) => {
      const manual = manualBySeason.get(season) ?? {
        appearances: 0,
        goals: 0,
        assists: 0,
      };
      const link = linked.get(season) ?? {
        appearances: 0,
        goals: 0,
        assists: 0,
      };
      return {
        season,
        manualAppearances: manual.appearances,
        manualGoals: manual.goals,
        manualAssists: manual.assists,
        linkedAppearances: link.appearances,
        linkedGoals: link.goals,
        linkedAssists: link.assists,
        appearances: maxNum(manual.appearances, link.appearances),
        goals: maxNum(manual.goals, link.goals),
        assists: maxNum(manual.assists, link.assists),
      };
    });
}

export function sumFlooredSeasons(rows: PlayerSeasonFloor[]) {
  return rows.reduce(
    (acc, r) => ({
      appearances: acc.appearances + r.appearances,
      goals: acc.goals + r.goals,
      assists: acc.assists + r.assists,
    }),
    { appearances: 0, goals: 0, assists: 0 },
  );
}

export type FlooredCareerRankRow = {
  id: number;
  name: string;
  position: string | null;
  nationality: string | null;
  nationalityFlag: string | null;
  verificationStatus: string | null;
  appearances: number;
  goals: number;
  assists: number;
  seasons: number;
};

/**
 * Career rankings using the same floor as player pages:
 * per season, GREATEST(manual player_season_stats, live sheet counts), then sum.
 * Updates as soon as lineups/goals are linked — no sync required.
 */
export async function flooredCareerRankings(opts: {
  sort: "appearances" | "goals" | "assists";
  limit?: number;
  season?: string;
}): Promise<FlooredCareerRankRow[]> {
  const lim = Math.min(Math.max(opts.limit ?? 20, 1), 200);
  const seasonFilter = opts.season
    ? sql`AND season::text = ${opts.season}`
    : sql``;
  const orderExpr =
    opts.sort === "goals"
      ? sql`goals DESC, appearances DESC, name ASC`
      : opts.sort === "assists"
        ? sql`assists DESC, appearances DESC, name ASC`
        : sql`appearances DESC, goals DESC, name ASC`;

  const result = await db.execute(sql`
    WITH linked_apps AS (
      SELECT
        ml.player_id,
        m.season::text AS season,
        count(DISTINCT ml.match_id)::int AS appearances
      FROM match_lineups ml
      INNER JOIN matches m ON m.id = ml.match_id
      WHERE ml.side = 'csa'
        AND ml.player_id IS NOT NULL
        AND coalesce(m.is_friendly, false) = false
        AND coalesce(m.status, 'played') <> 'scheduled'
        AND coalesce(m.result, '') <> 'unknown'
        AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
        AND (
          ml.role = 'starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions s
            WHERE s.match_id = ml.match_id
              AND s.side = 'csa'
              AND s.player_in_id IS NOT NULL
              AND s.player_in_id = ml.player_id
          )
        )
        ${opts.season ? sql`AND m.season::text = ${opts.season}` : sql``}
      GROUP BY ml.player_id, m.season::text
    ),
    linked_goals AS (
      SELECT
        mg.scorer_player_id AS player_id,
        m.season::text AS season,
        count(*)::int AS goals
      FROM match_goals mg
      INNER JOIN matches m ON m.id = mg.match_id
      WHERE mg.side = 'csa'
        AND coalesce(mg.is_own_goal, false) = false
        AND mg.scorer_player_id IS NOT NULL
        AND coalesce(m.is_friendly, false) = false
        AND coalesce(m.status, 'played') <> 'scheduled'
        AND coalesce(m.result, '') <> 'unknown'
        AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
        ${opts.season ? sql`AND m.season::text = ${opts.season}` : sql``}
      GROUP BY mg.scorer_player_id, m.season::text
    ),
    linked_assists AS (
      SELECT
        mg.assist_player_id AS player_id,
        m.season::text AS season,
        count(*)::int AS assists
      FROM match_goals mg
      INNER JOIN matches m ON m.id = mg.match_id
      WHERE mg.side = 'csa'
        AND mg.assist_player_id IS NOT NULL
        AND coalesce(m.is_friendly, false) = false
        AND coalesce(m.status, 'played') <> 'scheduled'
        AND coalesce(m.result, '') <> 'unknown'
        AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
        ${opts.season ? sql`AND m.season::text = ${opts.season}` : sql``}
      GROUP BY mg.assist_player_id, m.season::text
    ),
    manual AS (
      SELECT
        player_id,
        season::text AS season,
        coalesce(appearances, 0)::int AS appearances,
        coalesce(goals, 0)::int AS goals,
        coalesce(assists, 0)::int AS assists
      FROM player_season_stats
      WHERE TRUE
        ${seasonFilter}
    ),
    seasons AS (
      SELECT player_id, season FROM manual
      UNION
      SELECT player_id, season FROM linked_apps
      UNION
      SELECT player_id, season FROM linked_goals
      UNION
      SELECT player_id, season FROM linked_assists
    ),
    floored AS (
      SELECT
        s.player_id,
        s.season,
        greatest(coalesce(m.appearances, 0), coalesce(la.appearances, 0)) AS appearances,
        greatest(coalesce(m.goals, 0), coalesce(lg.goals, 0)) AS goals,
        greatest(coalesce(m.assists, 0), coalesce(las.assists, 0)) AS assists
      FROM seasons s
      LEFT JOIN manual m
        ON m.player_id = s.player_id AND m.season = s.season
      LEFT JOIN linked_apps la
        ON la.player_id = s.player_id AND la.season = s.season
      LEFT JOIN linked_goals lg
        ON lg.player_id = s.player_id AND lg.season = s.season
      LEFT JOIN linked_assists las
        ON las.player_id = s.player_id AND las.season = s.season
    ),
    career AS (
      SELECT
        player_id,
        cast(sum(appearances) as int) AS appearances,
        cast(sum(goals) as int) AS goals,
        cast(sum(assists) as int) AS assists,
        cast(count(DISTINCT season) as int) AS seasons
      FROM floored
      GROUP BY player_id
    )
    SELECT
      p.id,
      p.name,
      p.position,
      p.nationality,
      p.nationality_flag AS "nationalityFlag",
      p.verification_status AS "verificationStatus",
      c.appearances,
      c.goals,
      c.assists,
      c.seasons
    FROM career c
    INNER JOIN players p ON p.id = c.player_id
    ORDER BY ${orderExpr}
    LIMIT ${lim}
  `);

  const rows = ((result as unknown as { rows: FlooredCareerRankRow[] }).rows ??
    []) as FlooredCareerRankRow[];
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    position: (r.position as string | null) ?? null,
    nationality: (r.nationality as string | null) ?? null,
    nationalityFlag: (r.nationalityFlag as string | null) ?? null,
    verificationStatus: (r.verificationStatus as string | null) ?? null,
    appearances: Number(r.appearances) || 0,
    goals: Number(r.goals) || 0,
    assists: Number(r.assists) || 0,
    seasons: Number(r.seasons) || 0,
  }));
}

