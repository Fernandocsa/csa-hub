import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  opponentsTable,
  playersTable,
  playerSeasonStatsTable,
} from "@workspace/db";
import { sql, desc, eq, and, sum, count } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    const matchStats = await db
      .select({
        totalMatches: count(),
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(eq(matchesTable.isWalkover, false));

    const stats = matchStats[0];
    const total = stats.totalMatches || 0;
    const wins = stats.wins || 0;
    const winPercentage = total > 0 ? Math.round((wins / total) * 100 * 10) / 10 : 0;

    const appearanceLeaderRows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .groupBy(playersTable.id, playersTable.name, playersTable.position, playersTable.nationality)
      .orderBy(sql`sum(${playerSeasonStatsTable.appearances}) desc`)
      .limit(1);

    const topScorerRows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .groupBy(playersTable.id, playersTable.name, playersTable.position, playersTable.nationality)
      .orderBy(sql`sum(${playerSeasonStatsTable.goals}) desc`)
      .limit(1);

    const mostCommonOpponents = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(eq(matchesTable.isWalkover, false))
      .groupBy(opponentsTable.id, opponentsTable.name)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    res.json({
      totalMatches: total,
      wins: stats.wins || 0,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      goalsScored: stats.goalsScored || 0,
      goalsConceded: stats.goalsConceded || 0,
      winPercentage,
      appearanceLeader: appearanceLeaderRows[0] || { id: 0, name: "N/A", appearances: 0, goals: 0 },
      topScorer: topScorerRows[0] || { id: 0, name: "N/A", appearances: 0, goals: 0 },
      mostCommonOpponents,
      foundedYear: 1933,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
