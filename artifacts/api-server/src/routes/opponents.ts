import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable, competitionsTable, stadiumsTable } from "@workspace/db";
import { sql, eq, and, ilike, desc } from "drizzle-orm";

const router = Router();

router.get("/opponents", async (req, res) => {
  try {
    const { search, sort, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;

    let query = db
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
      .$dynamic();

    if (search) {
      query = query.where(ilike(opponentsTable.name, `%${search}%`));
    }

    query = query.groupBy(opponentsTable.id, opponentsTable.name);

    if (sort === "wins") {
      query = query.orderBy(sql`sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) desc`);
    } else if (sort === "goals") {
      query = query.orderBy(sql`sum(${matchesTable.goalsFor}) desc`);
    } else {
      query = query.orderBy(sql`count(*) desc`);
    }

    const allRows = await query;
    const total = allRows.length;
    const data = allRows.slice(off, off + lim);

    res.json({ data, total, limit: lim, offset: off });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/opponents/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const opponent = await db.query.opponentsTable.findFirst({
      where: eq(opponentsTable.id, id),
    });
    if (!opponent) return res.status(404).json({ error: "Adversário não encontrado" });

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
      .where(eq(matchesTable.opponentId, id));

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
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.homeAway, "home")));

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
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.homeAway, "away")));

    const recentMatches = await db
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
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(eq(matchesTable.opponentId, id))
      .orderBy(desc(matchesTable.matchDate))
      .limit(10);

    const victoryRows = await db
      .select({
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        matchDate: matchesTable.matchDate,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.result, "win")))
      .orderBy(sql`(${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) desc`)
      .limit(1);

    const defeatRows = await db
      .select({
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        matchDate: matchesTable.matchDate,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.opponentId, id), eq(matchesTable.result, "loss")))
      .orderBy(sql`(${matchesTable.goalsAgainst} - ${matchesTable.goalsFor}) desc`)
      .limit(1);

    const stats = overall[0];
    res.json({
      id: opponent.id,
      name: opponent.name,
      matches: stats?.matches || 0,
      wins: stats?.wins || 0,
      draws: stats?.draws || 0,
      losses: stats?.losses || 0,
      goalsFor: stats?.goalsFor || 0,
      goalsAgainst: stats?.goalsAgainst || 0,
      homeRecord: homeRecord[0] || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      awayRecord: awayRecord[0] || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      recentMatches: recentMatches.map((r) => ({
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
      })),
      biggestVictory: victoryRows[0] ? `${victoryRows[0].goalsFor}-${victoryRows[0].goalsAgainst}` : null,
      biggestDefeat: defeatRows[0] ? `${defeatRows[0].goalsFor}-${defeatRows[0].goalsAgainst}` : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
