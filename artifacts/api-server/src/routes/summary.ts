import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable } from "@workspace/db";
import { sql, eq, count } from "drizzle-orm";
import { officialPlayedMatchConditions } from "../lib/match-filters";
import { flooredCareerRankings } from "../lib/player-stats-floor";

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
      .where(officialPlayedMatchConditions());

    const stats = matchStats[0];
    const total = stats.totalMatches || 0;
    const wins = stats.wins || 0;
    const winPercentage = total > 0 ? Math.round((wins / total) * 100 * 10) / 10 : 0;

    const [appearanceLeaderRows, topScorerRows] = await Promise.all([
      flooredCareerRankings({ sort: "appearances", limit: 1 }),
      flooredCareerRankings({ sort: "goals", limit: 1 }),
    ]);

    const mostCommonOpponents = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        logoUrl: opponentsTable.logoUrl,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(officialPlayedMatchConditions())
      .groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    res.json({
      totalMatches: total,
      wins: stats.wins || 0,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      goalsScored: stats.goalsScored || 0,
      goalsConceded: stats.goalsConceded || 0,
      winPercentage,
      appearanceLeader: appearanceLeaderRows[0] || {
        id: 0,
        name: "N/A",
        appearances: 0,
        goals: 0,
      },
      topScorer: topScorerRows[0] || { id: 0, name: "N/A", appearances: 0, goals: 0 },
      mostCommonOpponents: mostCommonOpponents.map((o) => ({
        ...o,
        logoUrl: o.logoUrl ?? null,
      })),
      foundedYear: 1933,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
