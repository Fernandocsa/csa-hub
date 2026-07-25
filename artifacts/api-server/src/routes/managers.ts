import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, managersTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";

const router = Router();

// Merge computed (from match data) with stored (manual input) stats.
// Stored stats are used when computed match count is less than stored_games,
// meaning match data for some seasons hasn't been imported yet.
function resolveStats(
  computed: { matches: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number },
  stored: { storedGames: number | null; storedWins: number | null; storedDraws: number | null; storedLosses: number | null; storedGoalsFor: number | null; storedGoalsAgainst: number | null }
) {
  const hasStored = stored.storedGames != null && stored.storedGames > computed.matches;
  if (hasStored) {
    return {
      matches: stored.storedGames!,
      wins: stored.storedWins ?? 0,
      draws: stored.storedDraws ?? 0,
      losses: stored.storedLosses ?? 0,
      goalsScored: stored.storedGoalsFor ?? 0,
      goalsConceded: stored.storedGoalsAgainst ?? 0,
    };
  }
  return computed;
}

router.get("/managers", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        nationality: managersTable.nationality,
        startYear: managersTable.startYear,
        endYear: managersTable.endYear,
        seasons: managersTable.seasons,
        storedGames: managersTable.storedGames,
        storedWins: managersTable.storedWins,
        storedDraws: managersTable.storedDraws,
        storedLosses: managersTable.storedLosses,
        storedGoalsFor: managersTable.storedGoalsFor,
        storedGoalsAgainst: managersTable.storedGoalsAgainst,
        computedMatches: sql<number>`cast(count(${matchesTable.id}) as int)`,
        computedWins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        computedDraws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        computedLosses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        computedGoalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        computedGoalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(managersTable)
      .leftJoin(matchesTable, eq(matchesTable.managerId, managersTable.id))
      .groupBy(
        managersTable.id, managersTable.name, managersTable.nationality,
        managersTable.startYear, managersTable.endYear, managersTable.seasons,
        managersTable.storedGames, managersTable.storedWins, managersTable.storedDraws,
        managersTable.storedLosses, managersTable.storedGoalsFor, managersTable.storedGoalsAgainst
      )
      .orderBy(sql`GREATEST(COALESCE(${managersTable.storedGames}, 0), cast(count(${matchesTable.id}) as int)) desc`);

    res.json(rows.map((r) => {
      const computed = {
        matches: r.computedMatches, wins: r.computedWins, draws: r.computedDraws,
        losses: r.computedLosses, goalsScored: r.computedGoalsScored, goalsConceded: r.computedGoalsConceded,
      };
      const stats = resolveStats(computed, r);
      return {
        id: r.id,
        name: r.name,
        nationality: r.nationality,
        startYear: r.startYear,
        endYear: r.endYear,
        seasons: r.seasons,
        ...stats,
        winPercentage: stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100 * 10) / 10 : 0,
      };
    }));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/managers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const manager = await db.query.managersTable.findFirst({
      where: eq(managersTable.id, id),
    });
    if (!manager) return res.status(404).json({ error: "Técnico não encontrado" });

    const overall = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(eq(matchesTable.managerId, id));

    const seasonRows = await db
      .select({
        season: matchesTable.season,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(eq(matchesTable.managerId, id))
      .groupBy(matchesTable.season)
      .orderBy(desc(matchesTable.season));

    const computed = overall[0] ?? { matches: 0, wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0 };
    const stats = resolveStats(computed, manager);

    res.json({
      id: manager.id,
      name: manager.name,
      nationality: manager.nationality,
      startYear: manager.startYear,
      endYear: manager.endYear,
      seasons: manager.seasons,
      ...stats,
      winPercentage: stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100 * 10) / 10 : 0,
      seasonStats: seasonRows.map((r) => ({
        year: r.season,
        matches: r.matches,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        goalsScored: r.goalsScored,
        goalsConceded: r.goalsConceded,
        topScorer: null,
        topScorerGoals: null,
        topAppearances: null,
        topAppearancesCount: null,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
