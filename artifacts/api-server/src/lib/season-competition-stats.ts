import { db } from "@workspace/db";
import {
  matchesTable,
  competitionsTable,
  seasonCompetitionStatsTable,
} from "@workspace/db";
import { and, eq, sql, inArray, asc } from "drizzle-orm";

export type SeasonCompetitionComputed = {
  competitionId: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

/** Aggregate official (non-friendly) matches for a season, by competition. */
export async function computeSeasonCompetitionStatsFromMatches(
  season: string,
): Promise<SeasonCompetitionComputed[]> {
  const rows = await db
    .select({
      competitionId: matchesTable.competitionId,
      games: sql<number>`cast(count(*) as int)`,
      wins: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end), 0) as int)`,
      draws: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end), 0) as int)`,
      losses: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end), 0) as int)`,
      goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
      goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
    })
    .from(matchesTable)
    .where(
      and(eq(matchesTable.season, season), eq(matchesTable.isFriendly, false)),
    )
    .groupBy(matchesTable.competitionId);

  return rows.map((r) => ({
    competitionId: r.competitionId,
    games: r.games,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
  }));
}

/**
 * Recalculate per-competition rows from matches for one season.
 * Preserves rows with stats_source = 'manual'.
 * Never overwrites classification.
 * Removes calculated rows whose competition no longer appears in matches.
 */
export async function recalculateSeasonCompetitionStats(season: string) {
  const computed = await computeSeasonCompetitionStatsFromMatches(season);
  const computedIds = computed.map((c) => c.competitionId);
  const now = new Date();

  const existingRows = await db
    .select()
    .from(seasonCompetitionStatsTable)
    .where(eq(seasonCompetitionStatsTable.season, season));

  const byCompetition = new Map(
    existingRows.map((r) => [r.competitionId, r]),
  );

  let upserted = 0;
  let preservedManual = 0;

  for (const c of computed) {
    const current = byCompetition.get(c.competitionId);
    if (current?.statsSource === "manual") {
      preservedManual += 1;
      continue;
    }
    if (current) {
      await db
        .update(seasonCompetitionStatsTable)
        .set({
          games: c.games,
          wins: c.wins,
          draws: c.draws,
          losses: c.losses,
          goalsFor: c.goalsFor,
          goalsAgainst: c.goalsAgainst,
          statsSource: "calculated",
          statsRecalculatedAt: now,
          // classification intentionally untouched
        })
        .where(eq(seasonCompetitionStatsTable.id, current.id));
    } else {
      await db.insert(seasonCompetitionStatsTable).values({
        season,
        competitionId: c.competitionId,
        games: c.games,
        wins: c.wins,
        draws: c.draws,
        losses: c.losses,
        goalsFor: c.goalsFor,
        goalsAgainst: c.goalsAgainst,
        classification: null,
        statsSource: "calculated",
        statsRecalculatedAt: now,
      });
    }
    upserted += 1;
  }

  let removedCalculated = 0;
  if (computedIds.length === 0) {
    const deleted = await db
      .delete(seasonCompetitionStatsTable)
      .where(
        and(
          eq(seasonCompetitionStatsTable.season, season),
          eq(seasonCompetitionStatsTable.statsSource, "calculated"),
        ),
      )
      .returning({ id: seasonCompetitionStatsTable.id });
    removedCalculated = deleted.length;
  } else {
    const orphans = existingRows.filter(
      (r) =>
        r.statsSource === "calculated" &&
        !computedIds.includes(r.competitionId),
    );
    if (orphans.length > 0) {
      const deleted = await db
        .delete(seasonCompetitionStatsTable)
        .where(
          inArray(
            seasonCompetitionStatsTable.id,
            orphans.map((o) => o.id),
          ),
        )
        .returning({ id: seasonCompetitionStatsTable.id });
      removedCalculated = deleted.length;
    }
  }

  const rows = await listSeasonCompetitionStats(season);
  return {
    season,
    upserted,
    preservedManual,
    removedCalculated,
    rows,
  };
}

export async function listSeasonCompetitionStats(season: string) {
  return db
    .select({
      id: seasonCompetitionStatsTable.id,
      season: seasonCompetitionStatsTable.season,
      competitionId: seasonCompetitionStatsTable.competitionId,
      competitionName: competitionsTable.name,
      games: seasonCompetitionStatsTable.games,
      wins: seasonCompetitionStatsTable.wins,
      draws: seasonCompetitionStatsTable.draws,
      losses: seasonCompetitionStatsTable.losses,
      goalsFor: seasonCompetitionStatsTable.goalsFor,
      goalsAgainst: seasonCompetitionStatsTable.goalsAgainst,
      classification: seasonCompetitionStatsTable.classification,
      statsSource: seasonCompetitionStatsTable.statsSource,
      statsRecalculatedAt: seasonCompetitionStatsTable.statsRecalculatedAt,
    })
    .from(seasonCompetitionStatsTable)
    .innerJoin(
      competitionsTable,
      eq(seasonCompetitionStatsTable.competitionId, competitionsTable.id),
    )
    .where(eq(seasonCompetitionStatsTable.season, season))
    .orderBy(asc(competitionsTable.name));
}
