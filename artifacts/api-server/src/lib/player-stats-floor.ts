import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  matchGoalsTable,
  matchLineupsTable,
  matchesTable,
  playerSeasonStatsTable,
} from "@workspace/db";
import { officialPlayedMatchConditions } from "./match-filters";

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
