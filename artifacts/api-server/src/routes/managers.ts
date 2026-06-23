import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, managersTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";

const router = Router();

router.get("/managers", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        nationality: managersTable.nationality,
        startYear: managersTable.startYear,
        endYear: managersTable.endYear,
        matches: sql<number>`cast(count(${matchesTable.id}) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(managersTable)
      .leftJoin(matchesTable, eq(matchesTable.managerId, managersTable.id))
      .groupBy(managersTable.id, managersTable.name, managersTable.nationality, managersTable.startYear, managersTable.endYear)
      .orderBy(sql`count(${matchesTable.id}) desc`);

    res.json(rows.map((r) => ({
      ...r,
      winPercentage: r.matches > 0 ? Math.round((r.wins / r.matches) * 100 * 10) / 10 : 0,
    })));
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

    const stats = overall[0];
    res.json({
      id: manager.id,
      name: manager.name,
      nationality: manager.nationality,
      startYear: manager.startYear,
      endYear: manager.endYear,
      matches: stats?.matches || 0,
      wins: stats?.wins || 0,
      draws: stats?.draws || 0,
      losses: stats?.losses || 0,
      goalsScored: stats?.goalsScored || 0,
      goalsConceded: stats?.goalsConceded || 0,
      winPercentage: (stats?.matches || 0) > 0 ? Math.round(((stats?.wins || 0) / (stats?.matches || 1)) * 100 * 10) / 10 : 0,
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
