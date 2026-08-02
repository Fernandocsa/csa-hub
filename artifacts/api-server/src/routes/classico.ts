import { Router } from "express";
import { db } from "@workspace/db";
import {
  opponentsTable,
  matchesTable,
  competitionsTable,
  stadiumsTable,
} from "@workspace/db";
import { and, desc, eq, ilike, isNotNull, sql } from "drizzle-orm";
import {
  getOpponentCompetitionStats,
  getOpponentHighlights,
  getOpponentBiggestVictory,
  getOpponentBiggestDefeat,
  getOpponentMostRepeatedScorelines,
} from "../lib/opponent-detail";
import { officialPlayedMatchConditions } from "../lib/match-filters";

const router = Router();

const CLASSICO_OPPONENT_NAME = "CRB-AL";

/**
 * Dedicated derby page data for CSA × CRB.
 * Resolves the opponent by name (not a hardcoded id in the client).
 */
router.get("/classico", async (req, res) => {
  try {
    let opponent = await db.query.opponentsTable.findFirst({
      where: eq(opponentsTable.name, CLASSICO_OPPONENT_NAME),
    });
    if (!opponent) {
      opponent = await db.query.opponentsTable.findFirst({
        where: ilike(opponentsTable.name, "CRB%"),
      });
    }
    if (!opponent) {
      return res.status(404).json({ error: "Adversário CRB não encontrado" });
    }

    const id = opponent.id;

    const overall = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), officialPlayedMatchConditions()));

    const homeRecord = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.opponentId, id),
          eq(matchesTable.homeAway, "home"),
          officialPlayedMatchConditions(),
        ),
      );

    const awayRecord = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.opponentId, id),
          eq(matchesTable.homeAway, "away"),
          officialPlayedMatchConditions(),
        ),
      );

    const allMatchRows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        opponentName: opponentsTable.name,
        competitionName: competitionsTable.name,
        stadiumName: stadiumsTable.name,
        phase: matchesTable.phase,
        round: matchesTable.round,
        attendance: matchesTable.attendance,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(and(eq(matchesTable.opponentId, id), officialPlayedMatchConditions()))
      .orderBy(desc(matchesTable.matchDate));

    const biggestAttendances = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        competitionName: competitionsTable.name,
        stadiumName: stadiumsTable.name,
        attendance: matchesTable.attendance,
      })
      .from(matchesTable)
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(
        and(
          eq(matchesTable.opponentId, id),
          officialPlayedMatchConditions(),
          isNotNull(matchesTable.attendance),
        ),
      )
      .orderBy(desc(matchesTable.attendance), desc(matchesTable.matchDate))
      .limit(10);

    const [competitionStats, highlights, biggestVictory, biggestDefeat, mostRepeatedScorelines] =
      await Promise.all([
        getOpponentCompetitionStats(id),
        getOpponentHighlights(id),
        getOpponentBiggestVictory(id),
        getOpponentBiggestDefeat(id),
        getOpponentMostRepeatedScorelines(id),
      ]);

    const stats = overall[0];
    res.json({
      title: "Clássico das Multidões",
      subtitle: "CSA × CRB",
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentLogoUrl: opponent.logoUrl ?? null,
      matches: stats?.matches || 0,
      wins: stats?.wins || 0,
      draws: stats?.draws || 0,
      losses: stats?.losses || 0,
      goalsFor: stats?.goalsFor || 0,
      goalsAgainst: stats?.goalsAgainst || 0,
      competitionStats,
      highlights,
      homeRecord:
        homeRecord[0] || {
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        },
      awayRecord:
        awayRecord[0] || {
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        },
      allMatches: allMatchRows.map((r) => ({
        id: r.id,
        date: r.matchDate,
        opponent: r.opponentName,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        result: r.result,
        homeAway: r.homeAway,
        competition: r.competitionName,
        season: r.season,
        stadium: r.stadiumName ?? null,
        phase: r.phase ?? null,
        round: r.round ?? null,
        attendance: r.attendance ?? null,
      })),
      biggestVictory,
      biggestDefeat,
      mostRepeatedScorelines,
      biggestAttendances: biggestAttendances.map((r) => ({
        id: r.id,
        date: r.matchDate,
        season: r.season,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        result: r.result,
        homeAway: r.homeAway,
        competition: r.competitionName,
        stadium: r.stadiumName ?? null,
        attendance: r.attendance ?? 0,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
