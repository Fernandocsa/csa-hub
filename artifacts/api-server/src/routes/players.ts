import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable, playerSeasonStatsTable } from "@workspace/db";
import { sql, eq, ilike, and, desc, asc, ne } from "drizzle-orm";

const router = Router();

router.get("/players", async (req, res) => {
  try {
    const { search, sort, season, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;

    let baseQuery = db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
        assists: sql<number>`cast(sum(${playerSeasonStatsTable.assists}) as int)`,
        seasons: sql<number>`cast(count(distinct ${playerSeasonStatsTable.season}) as int)`,
      })
      .from(playersTable)
      .innerJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .$dynamic();

    const conditions = [];
    if (search) {
      conditions.push(ilike(playersTable.name, `%${search}%`));
    }
    if (season) {
      conditions.push(eq(playerSeasonStatsTable.season, season));
    }
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    baseQuery = baseQuery.groupBy(
      playersTable.id,
      playersTable.name,
      playersTable.position,
      playersTable.nationality,
      playersTable.nationalityFlag,
    );

    if (sort === "goals") {
      baseQuery = baseQuery.orderBy(sql`sum(${playerSeasonStatsTable.goals}) desc`);
    } else if (sort === "seasons") {
      baseQuery = baseQuery.orderBy(sql`count(distinct ${playerSeasonStatsTable.season}) desc`);
    } else {
      baseQuery = baseQuery.orderBy(sql`sum(${playerSeasonStatsTable.appearances}) desc`);
    }

    const allRows = await baseQuery;
    const total = allRows.length;
    const data = allRows.slice(off, off + lim);

    res.json({ data, total, limit: lim, offset: off });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/players/top-scorers", async (req, res) => {
  try {
    const { season, limit = "20" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 20, 100);

    let query = db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
        assists: sql<number>`cast(sum(${playerSeasonStatsTable.assists}) as int)`,
        seasons: sql<number>`cast(count(distinct ${playerSeasonStatsTable.season}) as int)`,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .$dynamic();

    if (season) {
      query = query.where(eq(playerSeasonStatsTable.season, season));
    }

    const rows = await query
      .groupBy(
        playersTable.id,
        playersTable.name,
        playersTable.position,
        playersTable.nationality,
        playersTable.nationalityFlag,
      )
      .orderBy(sql`sum(${playerSeasonStatsTable.goals}) desc`)
      .limit(lim);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/players/top-appearances", async (req, res) => {
  try {
    const { season, limit = "20" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 20, 100);

    let query = db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
        assists: sql<number>`cast(sum(${playerSeasonStatsTable.assists}) as int)`,
        seasons: sql<number>`cast(count(distinct ${playerSeasonStatsTable.season}) as int)`,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .$dynamic();

    if (season) {
      query = query.where(eq(playerSeasonStatsTable.season, season));
    }

    const rows = await query
      .groupBy(
        playersTable.id,
        playersTable.name,
        playersTable.position,
        playersTable.nationality,
        playersTable.nationalityFlag,
      )
      .orderBy(sql`sum(${playerSeasonStatsTable.appearances}) desc`)
      .limit(lim);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/players/top-assists", async (req, res) => {
  try {
    const { limit = "50" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);

    const rows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
        assists: sql<number>`cast(sum(${playerSeasonStatsTable.assists}) as int)`,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .groupBy(
        playersTable.id,
        playersTable.name,
        playersTable.position,
        playersTable.nationality,
        playersTable.nationalityFlag,
      )
      .having(sql`sum(${playerSeasonStatsTable.assists}) > 0`)
      .orderBy(sql`sum(${playerSeasonStatsTable.assists}) desc`, sql`sum(${playerSeasonStatsTable.appearances}) desc`)
      .limit(lim);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Foreign players (non-Brazilian)
router.get("/players/foreign", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.appearances}), 0) as int)`,
        goals: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.goals}), 0) as int)`,
        firstSeason: sql<string | null>`cast(min(${playerSeasonStatsTable.season}) as text)`,
        lastSeason: sql<string | null>`cast(max(${playerSeasonStatsTable.season}) as text)`,
      })
      .from(playersTable)
      .leftJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(ne(playersTable.nationality, "Brasil"))
      .groupBy(
        playersTable.id,
        playersTable.name,
        playersTable.position,
        playersTable.nationality,
        playersTable.nationalityFlag,
      )
      .orderBy(
        sql`coalesce(sum(${playerSeasonStatsTable.appearances}), 0) desc`,
        asc(playersTable.name),
      );

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Nationality summaries (non-Brazilian)
router.get("/players/nationalities", async (req, res) => {
  try {
    const rows = await db
      .select({
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        playerCount: sql<number>`cast(count(distinct ${playersTable.id}) as int)`,
        totalAppearances: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.appearances}), 0) as int)`,
        totalGoals: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.goals}), 0) as int)`,
      })
      .from(playersTable)
      .leftJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(ne(playersTable.nationality, "Brasil"))
      .groupBy(playersTable.nationality, playersTable.nationalityFlag)
      .orderBy(sql`count(distinct ${playersTable.id}) desc`);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Players by nationality
router.get("/players/by-nationality/:country", async (req, res) => {
  try {
    const country = decodeURIComponent(req.params.country);

    const rows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.appearances}), 0) as int)`,
        goals: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.goals}), 0) as int)`,
        firstSeason: sql<string | null>`cast(min(${playerSeasonStatsTable.season}) as text)`,
        lastSeason: sql<string | null>`cast(max(${playerSeasonStatsTable.season}) as text)`,
      })
      .from(playersTable)
      .leftJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(eq(playersTable.nationality, country))
      .groupBy(
        playersTable.id,
        playersTable.name,
        playersTable.position,
        playersTable.nationality,
        playersTable.nationalityFlag,
      )
      .orderBy(
        sql`coalesce(sum(${playerSeasonStatsTable.appearances}), 0) desc`,
        asc(playersTable.name),
      );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Nenhum jogador encontrado para essa nacionalidade" });
    }

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/players/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const player = await db.query.playersTable.findFirst({
      where: eq(playersTable.id, id),
    });
    if (!player) return res.status(404).json({ error: "Jogador não encontrado" });

    const seasonStats = await db
      .select({
        id: playerSeasonStatsTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        season: playerSeasonStatsTable.season,
        appearances: playerSeasonStatsTable.appearances,
        goals: playerSeasonStatsTable.goals,
        assists: playerSeasonStatsTable.assists,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(eq(playerSeasonStatsTable.playerId, id))
      .orderBy(desc(playerSeasonStatsTable.season));

    const totalAppearances = seasonStats.reduce((s, r) => s + r.appearances, 0);
    const totalGoals = seasonStats.reduce((s, r) => s + r.goals, 0);
    const totalAssists = seasonStats.reduce((s, r) => s + (r.assists || 0), 0);

    res.json({
      id: player.id,
      name: player.name,
      position: player.position,
      nationality: player.nationality,
      nationalityFlag: player.nationalityFlag,
      birthYear: player.birthYear,
      totalAppearances,
      totalGoals,
      totalAssists,
      seasonStats,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
