import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, opponentsTable, stadiumsTable, competitionsTable, managersTable } from "@workspace/db";
import { sql, eq, and, ilike, desc } from "drizzle-orm";

const router = Router();

function buildMatchRow(row: any) {
  return {
    id: row.id,
    date: row.matchDate,
    opponent: row.opponentName,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    result: row.result,
    homeAway: row.homeAway,
    competition: row.competitionName,
    season: row.season,
    stadium: row.stadiumName ?? null,
  };
}

const matchSelectFields = {
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
};

router.get("/matches", async (req, res) => {
  try {
    const { season, competition, opponent, home_away, result, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;

    let query = db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .$dynamic();

    const conditions = [];
    if (season) conditions.push(eq(matchesTable.season, season));
    if (competition) conditions.push(ilike(competitionsTable.name, `%${competition}%`));
    if (opponent) conditions.push(ilike(opponentsTable.name, `%${opponent}%`));
    if (home_away) conditions.push(eq(matchesTable.homeAway, home_away));
    if (result) conditions.push(eq(matchesTable.result, result));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(matchesTable.matchDate));

    const allRows = await query;
    const total = allRows.length;
    const data = allRows.slice(off, off + lim).map(buildMatchRow);

    res.json({ data, total, limit: lim, offset: off });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/biggest-victories", async (req, res) => {
  try {
    const { limit = "10" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 10, 50);

    const rows = await db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(eq(matchesTable.result, "win"))
      .orderBy(sql`(${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) desc, ${matchesTable.goalsFor} desc`)
      .limit(lim);

    res.json(rows.map(buildMatchRow));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/biggest-defeats", async (req, res) => {
  try {
    const { limit = "10" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 10, 50);

    const rows = await db
      .select(matchSelectFields)
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .where(eq(matchesTable.result, "loss"))
      .orderBy(sql`(${matchesTable.goalsAgainst} - ${matchesTable.goalsFor}) desc, ${matchesTable.goalsAgainst} desc`)
      .limit(lim);

    res.json(rows.map(buildMatchRow));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/milestones", async (req, res) => {
  try {
    const joins = () =>
      db
        .select(matchSelectFields)
        .from(matchesTable)
        .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
        .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
        .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id));

    const [firstRows, lastRows] = await Promise.all([
      joins().orderBy(matchesTable.matchDate).limit(1),
      joins().orderBy(desc(matchesTable.matchDate)).limit(1),
    ]);

    res.json({
      first: firstRows.length ? buildMatchRow(firstRows[0]) : null,
      last:  lastRows.length  ? buildMatchRow(lastRows[0])  : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/matches/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const rows = await db
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
        managerName: managersTable.name,
        scorers: matchesTable.scorers,
        attendance: matchesTable.attendance,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .leftJoin(stadiumsTable, eq(matchesTable.stadiumId, stadiumsTable.id))
      .leftJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .where(eq(matchesTable.id, id));

    if (rows.length === 0) return res.status(404).json({ error: "Partida não encontrada" });

    const row = rows[0];
    res.json({
      id: row.id,
      date: row.matchDate,
      opponent: row.opponentName,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      result: row.result,
      homeAway: row.homeAway,
      competition: row.competitionName,
      season: row.season,
      stadium: row.stadiumName ?? null,
      manager: row.managerName ?? null,
      scorers: row.scorers ? row.scorers.split(",").map((s) => s.trim()).filter(Boolean) : [],
      attendance: row.attendance ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
