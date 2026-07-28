import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  competitionsTable,
  playerSeasonStatsTable,
  playersTable,
  leaguePositionsTable,
  seasonTopScorersTable,
  seasonsTable,
  managersTable,
  managerSeasonStatsTable,
  seasonCompetitionStatsTable,
} from "@workspace/db";
import { sql, eq, and, desc, asc } from "drizzle-orm";
import { calcAgeInSeason } from "../lib/season-age";
import { officialPlayedMatchConditions } from "../lib/match-filters";

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
    .where(and(eq(matchesTable.season, season), officialPlayedMatchConditions()));
  return rows[0];
}

function sumCompetitionRows(
  rows: {
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }[],
) {
  return rows.reduce(
    (acc, r) => ({
      matches: acc.matches + r.games,
      wins: acc.wins + r.wins,
      draws: acc.draws + r.draws,
      losses: acc.losses + r.losses,
      goalsScored: acc.goalsScored + r.goalsFor,
      goalsConceded: acc.goalsConceded + r.goalsAgainst,
    }),
    {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
    },
  );
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
    res.json(
      rows.map((r) => ({
        year: r.year,
        position: r.position,
        league: r.league,
        matches: r.matches,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        points: r.points,
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/seasons/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const seasonYear = parseInt(year, 10);

    const seasonExists = await db
      .select({ year: seasonsTable.year })
      .from(seasonsTable)
      .where(eq(seasonsTable.year, seasonYear))
      .limit(1);
    if (seasonExists.length === 0) {
      return res.status(404).json({ error: "Temporada não encontrada" });
    }

    const liveStats = await getSeasonStats(year);

    const playerRows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        birthYear: playersTable.birthYear,
        birthDate: playersTable.birthDate,
        season: playerSeasonStatsTable.season,
        appearances: playerSeasonStatsTable.appearances,
        goals: playerSeasonStatsTable.goals,
        assists: playerSeasonStatsTable.assists,
        shirtNumber: playerSeasonStatsTable.shirtNumber,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(eq(playerSeasonStatsTable.season, year))
      .orderBy(desc(playerSeasonStatsTable.appearances));

    const players = playerRows.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      nationality: p.nationality,
      season: p.season,
      appearances: p.appearances,
      goals: p.goals,
      assists: p.assists,
      shirtNumber: p.shirtNumber ?? null,
      birthYear: p.birthYear,
      birthDate: p.birthDate,
      seasonAge: calcAgeInSeason(p.birthDate, p.birthYear, seasonYear),
    }));

    const competitionStatsRows = await db
      .select({
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
      })
      .from(seasonCompetitionStatsTable)
      .innerJoin(
        competitionsTable,
        eq(seasonCompetitionStatsTable.competitionId, competitionsTable.id),
      )
      .where(eq(seasonCompetitionStatsTable.season, year))
      .orderBy(asc(competitionsTable.name));

    const competitionStats = competitionStatsRows.map((r) => ({
      competitionId: r.competitionId,
      competitionName: r.competitionName,
      games: r.games,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDifference: r.goalsFor - r.goalsAgainst,
      classification: r.classification,
      statsSource: r.statsSource,
    }));

    const dualTotals = sumCompetitionRows(competitionStatsRows);
    const useDualTotals = competitionStatsRows.length > 0;

    // Legacy name list (kept for current UI until stage 4)
    const competitions =
      competitionStats.length > 0
        ? competitionStats.map((c) => c.competitionName)
        : (
            await db
              .select({ name: competitionsTable.name })
              .from(matchesTable)
              .innerJoin(
                competitionsTable,
                eq(matchesTable.competitionId, competitionsTable.id),
              )
              .where(
                and(eq(matchesTable.season, year), officialPlayedMatchConditions()),
              )
              .groupBy(competitionsTable.name)
          ).map((c) => c.name);

    const managerRows = await db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        birthDate: managersTable.birthDate,
        games: managerSeasonStatsTable.games,
        wins: managerSeasonStatsTable.wins,
        draws: managerSeasonStatsTable.draws,
        losses: managerSeasonStatsTable.losses,
        goalsFor: managerSeasonStatsTable.goalsFor,
        goalsAgainst: managerSeasonStatsTable.goalsAgainst,
        statsSource: managerSeasonStatsTable.statsSource,
      })
      .from(managerSeasonStatsTable)
      .innerJoin(managersTable, eq(managerSeasonStatsTable.managerId, managersTable.id))
      .where(eq(managerSeasonStatsTable.season, year))
      .orderBy(desc(managerSeasonStatsTable.games), asc(managersTable.name));

    const managers = managerRows.map((m) => ({
      id: m.id,
      name: m.name,
      birthDate: m.birthDate,
      games: m.games,
      wins: m.wins,
      draws: m.draws,
      losses: m.losses,
      goalsFor: m.goalsFor,
      goalsAgainst: m.goalsAgainst,
      statsSource: m.statsSource,
      seasonAge: calcAgeInSeason(m.birthDate, null, seasonYear),
    }));

    const topAppearances = [...players]
      .sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        value: p.appearances,
        seasonAge: p.seasonAge,
      }));

    const topGoals = [...players]
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        value: p.goals,
        seasonAge: p.seasonAge,
      }));

    const topAssists = [...players]
      .filter((p) => (p.assists ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.assists ?? 0) - (a.assists ?? 0) || a.name.localeCompare(b.name),
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        value: p.assists ?? 0,
        seasonAge: p.seasonAge,
      }));

    const leaguePos = await db
      .select()
      .from(leaguePositionsTable)
      .where(eq(leaguePositionsTable.year, year))
      .limit(1);

    // Legacy curated list — kept until stage 4 UI drops it
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
      matches: useDualTotals ? dualTotals.matches : liveStats.totalMatches || 0,
      wins: useDualTotals ? dualTotals.wins : liveStats.wins || 0,
      draws: useDualTotals ? dualTotals.draws : liveStats.draws || 0,
      losses: useDualTotals ? dualTotals.losses : liveStats.losses || 0,
      goalsScored: useDualTotals
        ? dualTotals.goalsScored
        : liveStats.goalsScored || 0,
      goalsConceded: useDualTotals
        ? dualTotals.goalsConceded
        : liveStats.goalsConceded || 0,
      players,
      competitions,
      competitionStats,
      managers,
      topAppearances,
      topGoals,
      topAssists,
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
