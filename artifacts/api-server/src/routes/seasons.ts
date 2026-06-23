import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable, competitionsTable, playerSeasonStatsTable, playersTable, leaguePositionsTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";

const router = Router();

async function getSeasonStats(season: string) {
  const rows = await db
    .select({
      wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
      draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
      losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
      goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
      goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      totalMatches: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .where(eq(matchesTable.season, season));
  return rows[0];
}

router.get("/seasons", async (req, res) => {
  try {
    const seasonRows = await db
      .select({ season: matchesTable.season })
      .from(matchesTable)
      .groupBy(matchesTable.season)
      .orderBy(desc(matchesTable.season));

    const seasons = await Promise.all(
      seasonRows.map(async ({ season }) => {
        const stats = await getSeasonStats(season);

        const topScorerRows = await db
          .select({
            name: playersTable.name,
            goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
          })
          .from(playerSeasonStatsTable)
          .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
          .where(eq(playerSeasonStatsTable.season, season))
          .groupBy(playersTable.name)
          .orderBy(sql`sum(${playerSeasonStatsTable.goals}) desc`)
          .limit(1);

        const topAppRows = await db
          .select({
            name: playersTable.name,
            appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
          })
          .from(playerSeasonStatsTable)
          .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
          .where(eq(playerSeasonStatsTable.season, season))
          .groupBy(playersTable.name)
          .orderBy(sql`sum(${playerSeasonStatsTable.appearances}) desc`)
          .limit(1);

        return {
          year: season,
          matches: stats?.totalMatches || 0,
          wins: stats?.wins || 0,
          draws: stats?.draws || 0,
          losses: stats?.losses || 0,
          goalsScored: stats?.goalsScored || 0,
          goalsConceded: stats?.goalsConceded || 0,
          topScorer: topScorerRows[0]?.name ?? null,
          topScorerGoals: topScorerRows[0]?.goals ?? null,
          topAppearances: topAppRows[0]?.name ?? null,
          topAppearancesCount: topAppRows[0]?.appearances ?? null,
        };
      }),
    );

    res.json(seasons);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/seasons/league-positions", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(leaguePositionsTable)
      .orderBy(desc(leaguePositionsTable.year));
    res.json(rows.map((r) => ({
      year: r.year,
      position: r.position,
      league: r.league,
      matches: r.matches,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      points: r.points,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/seasons/:year", async (req, res) => {
  try {
    const { year } = req.params;

    const stats = await getSeasonStats(year);
    if (!stats || stats.totalMatches === 0) {
      return res.status(404).json({ error: "Temporada não encontrada" });
    }

    const players = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        season: playerSeasonStatsTable.season,
        appearances: playerSeasonStatsTable.appearances,
        goals: playerSeasonStatsTable.goals,
        assists: playerSeasonStatsTable.assists,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(eq(playerSeasonStatsTable.season, year))
      .orderBy(desc(playerSeasonStatsTable.appearances));

    const compRows = await db
      .select({ name: competitionsTable.name })
      .from(matchesTable)
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(eq(matchesTable.season, year))
      .groupBy(competitionsTable.name);

    const leaguePos = await db
      .select()
      .from(leaguePositionsTable)
      .where(eq(leaguePositionsTable.year, year))
      .limit(1);

    res.json({
      year,
      matches: stats.totalMatches || 0,
      wins: stats.wins || 0,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      goalsScored: stats.goalsScored || 0,
      goalsConceded: stats.goalsConceded || 0,
      players,
      competitions: compRows.map((c) => c.name),
      leaguePosition: leaguePos[0]?.position ?? null,
      leagueName: leaguePos[0]?.league ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
