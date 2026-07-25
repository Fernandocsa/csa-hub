import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable, competitionsTable, playerSeasonStatsTable, playersTable, leaguePositionsTable, seasonTopScorersTable, seasonsTable } from "@workspace/db";
import { sql, eq, and, desc } from "drizzle-orm";

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
    .where(and(eq(matchesTable.season, season), eq(matchesTable.isFriendly, false)));
  return rows[0];
}

router.get("/seasons", async (req, res) => {
  try {
    const seasonRows = await db
      .select({ season: seasonsTable.year })
      .from(seasonsTable)
      .orderBy(desc(seasonsTable.year));

    const seasons = await Promise.all(
      seasonRows.map(async ({ season }) => {
        const stats = await getSeasonStats(String(season));

        const topScorerRows = await db
          .select({
            name: seasonTopScorersTable.playerName,
            goals: seasonTopScorersTable.goals,
          })
          .from(seasonTopScorersTable)
          .where(eq(seasonTopScorersTable.season, String(season)))
          .orderBy(desc(seasonTopScorersTable.goals));

        // Build joined display name for ties (e.g. "Rodrigo Pimpão / Paulo Sérgio")
        const topGoals = topScorerRows[0]?.goals ?? null;
        const topNames = topScorerRows
          .filter((r) => r.goals === topGoals)
          .map((r) => r.name);

        return {
          year: String(season),
          matches: stats?.totalMatches || 0,
          wins: stats?.wins || 0,
          draws: stats?.draws || 0,
          losses: stats?.losses || 0,
          goalsScored: stats?.goalsScored || 0,
          goalsConceded: stats?.goalsConceded || 0,
          topScorer: topNames.length > 0 ? topNames.join(" / ") : null,
          topScorerGoals: topGoals,
          topAppearances: null,
          topAppearancesCount: null,
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

    // Verify season exists in the seasons table
    const seasonExists = await db
      .select({ year: seasonsTable.year })
      .from(seasonsTable)
      .where(eq(seasonsTable.year, parseInt(year)))
      .limit(1);
    if (seasonExists.length === 0) {
      return res.status(404).json({ error: "Temporada não encontrada" });
    }

    const stats = await getSeasonStats(year);

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
      .where(and(eq(matchesTable.season, year), eq(matchesTable.isFriendly, false)))
      .groupBy(competitionsTable.name);

    const leaguePos = await db
      .select()
      .from(leaguePositionsTable)
      .where(eq(leaguePositionsTable.year, year))
      .limit(1);

    const topScorers = await db
      .select({
        name: seasonTopScorersTable.playerName,
        goals: seasonTopScorersTable.goals,
        verified: seasonTopScorersTable.verified,
      })
      .from(seasonTopScorersTable)
      .where(eq(seasonTopScorersTable.season, year))
      .orderBy(desc(seasonTopScorersTable.goals));

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
      topScorers,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
