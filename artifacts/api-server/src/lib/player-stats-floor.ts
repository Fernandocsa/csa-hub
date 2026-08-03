import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  matchGoalsTable,
  matchLineupsTable,
  matchPenaltyEventsTable,
  matchesTable,
} from "@workspace/db";
import { officialPlayedMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";

export type PlayerSeasonFloor = {
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  /** Missed penalties as taker — never counted as goals. */
  penaltiesMissed: number;
  /** Saved penalties as goalkeeper — never counted as goals. */
  penaltiesSaved: number;
  /** @deprecated Always 0 — manual floors removed; kept for API shape. */
  manualAppearances: number;
  /** @deprecated Always 0 */
  manualGoals: number;
  /** @deprecated Always 0 */
  manualAssists: number;
  linkedAppearances: number;
  linkedGoals: number;
  linkedAssists: number;
};

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

  const penaltiesMissed = await db
    .select({
      season: matchesTable.season,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(matchPenaltyEventsTable)
    .innerJoin(matchesTable, eq(matchPenaltyEventsTable.matchId, matchesTable.id))
    .where(
      and(
        eq(matchPenaltyEventsTable.playerId, playerId),
        eq(matchPenaltyEventsTable.side, "csa"),
        eq(matchPenaltyEventsTable.eventType, "missed"),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchesTable.season);

  const penaltiesSaved = await db
    .select({
      season: matchesTable.season,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(matchPenaltyEventsTable)
    .innerJoin(matchesTable, eq(matchPenaltyEventsTable.matchId, matchesTable.id))
    .where(
      and(
        eq(matchPenaltyEventsTable.playerId, playerId),
        eq(matchPenaltyEventsTable.side, "csa"),
        eq(matchPenaltyEventsTable.eventType, "saved"),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(matchesTable.season);

  type SeasonAgg = {
    appearances: number;
    goals: number;
    assists: number;
    penaltiesMissed: number;
    penaltiesSaved: number;
  };
  const empty = (): SeasonAgg => ({
    appearances: 0,
    goals: 0,
    assists: 0,
    penaltiesMissed: 0,
    penaltiesSaved: 0,
  });
  const map = new Map<string, SeasonAgg>();
  for (const r of apps) {
    map.set(r.season, { ...empty(), appearances: r.appearances ?? 0 });
  }
  for (const r of goals) {
    const cur = map.get(r.season) ?? empty();
    cur.goals = r.goals ?? 0;
    map.set(r.season, cur);
  }
  for (const r of assists) {
    const cur = map.get(r.season) ?? empty();
    cur.assists = r.assists ?? 0;
    map.set(r.season, cur);
  }
  for (const r of penaltiesMissed) {
    const cur = map.get(r.season) ?? empty();
    cur.penaltiesMissed = r.count ?? 0;
    map.set(r.season, cur);
  }
  for (const r of penaltiesSaved) {
    const cur = map.get(r.season) ?? empty();
    cur.penaltiesSaved = r.count ?? 0;
    map.set(r.season, cur);
  }
  return map;
}

/**
 * Season stats from linked match sheets only (lineups / goals / assists).
 * Manual `player_season_stats` floors are no longer applied.
 */
export async function flooredPlayerSeasonStats(
  playerId: number,
): Promise<PlayerSeasonFloor[]> {
  const linked = await linkedPlayerSeasonStats(playerId);

  return [...linked.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([season, link]) => ({
      season,
      manualAppearances: 0,
      manualGoals: 0,
      manualAssists: 0,
      linkedAppearances: link.appearances,
      linkedGoals: link.goals,
      linkedAssists: link.assists,
      appearances: link.appearances,
      goals: link.goals,
      assists: link.assists,
      penaltiesMissed: link.penaltiesMissed,
      penaltiesSaved: link.penaltiesSaved,
    }));
}

export function sumFlooredSeasons(rows: PlayerSeasonFloor[]) {
  return rows.reduce(
    (acc, r) => ({
      appearances: acc.appearances + r.appearances,
      goals: acc.goals + r.goals,
      assists: acc.assists + r.assists,
      penaltiesMissed: acc.penaltiesMissed + r.penaltiesMissed,
      penaltiesSaved: acc.penaltiesSaved + r.penaltiesSaved,
    }),
    { appearances: 0, goals: 0, assists: 0, penaltiesMissed: 0, penaltiesSaved: 0 },
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
 * Career rankings from linked sheets only (no manual player_season_stats floor).
 */
export async function flooredCareerRankings(opts: {
  sort: "appearances" | "goals" | "assists";
  limit?: number;
  season?: string;
}): Promise<FlooredCareerRankRow[]> {
  const lim = Math.min(Math.max(opts.limit ?? 20, 1), 200);
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
    seasons AS (
      SELECT player_id, season FROM linked_apps
      UNION
      SELECT player_id, season FROM linked_goals
      UNION
      SELECT player_id, season FROM linked_assists
    ),
    linked AS (
      SELECT
        s.player_id,
        s.season,
        coalesce(la.appearances, 0) AS appearances,
        coalesce(lg.goals, 0) AS goals,
        coalesce(las.assists, 0) AS assists
      FROM seasons s
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
      FROM linked
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
