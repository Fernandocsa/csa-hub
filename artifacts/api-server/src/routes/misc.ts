import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  stadiumsTable,
  competitionsTable,
  playersTable,
  playerSeasonStatsTable,
  opponentsTable,
} from "@workspace/db";
import { sql, eq, and, desc, asc } from "drizzle-orm";

const router = Router();

// Goalkeepers - players with "Goleiro" position
router.get("/goalkeepers", async (req, res) => {
  try {
    const { season } = req.query as Record<string, string>;

    let query = db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        matches: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        cleanSheets: sql<number>`cast(0 as int)`,
        goalsConceeded: sql<number>`cast(0 as int)`,
        season: playerSeasonStatsTable.season,
      })
      .from(playerSeasonStatsTable)
      .innerJoin(playersTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(eq(playersTable.position, "Goleiro"))
      .$dynamic();

    if (season) {
      query = query.where(and(eq(playersTable.position, "Goleiro"), eq(playerSeasonStatsTable.season, season)));
    }

    const rows = await query
      .groupBy(playersTable.id, playersTable.name, playerSeasonStatsTable.season)
      .orderBy(sql`sum(${playerSeasonStatsTable.appearances}) desc`);

    res.json(rows.map((r) => ({
      ...r,
      cleanSheetPercentage: 0,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Stadiums
router.get("/stadiums", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: stadiumsTable.id,
        name: stadiumsTable.name,
        city: stadiumsTable.city,
        state: stadiumsTable.state,
        country: stadiumsTable.country,
        capacity: stadiumsTable.capacity,
        matches: sql<number>`cast(count(${matchesTable.id}) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
        firstMatch: sql<string>`cast(min(${matchesTable.matchDate}) as text)`,
        lastMatch: sql<string>`cast(max(${matchesTable.matchDate}) as text)`,
      })
      .from(stadiumsTable)
      .leftJoin(matchesTable, and(eq(matchesTable.stadiumId, stadiumsTable.id), eq(matchesTable.isFriendly, false)))
      .groupBy(
        stadiumsTable.id,
        stadiumsTable.name,
        stadiumsTable.city,
        stadiumsTable.state,
        stadiumsTable.country,
        stadiumsTable.capacity,
      )
      .orderBy(sql`count(${matchesTable.id}) desc`);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/stadiums/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const [stadium] = await db
      .select({
        id: stadiumsTable.id,
        name: stadiumsTable.name,
        city: stadiumsTable.city,
        state: stadiumsTable.state,
        country: stadiumsTable.country,
        capacity: stadiumsTable.capacity,
      })
      .from(stadiumsTable)
      .where(eq(stadiumsTable.id, id))
      .limit(1);

    if (!stadium) return res.status(404).json({ error: "Estádio não encontrado" });

    const homeClubs = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
      })
      .from(opponentsTable)
      .where(eq(opponentsTable.homeStadiumId, id))
      .orderBy(asc(opponentsTable.name));

    const [stats] = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
        firstMatch: sql<string>`cast(min(${matchesTable.matchDate}) as text)`,
        lastMatch: sql<string>`cast(max(${matchesTable.matchDate}) as text)`,
      })
      .from(matchesTable)
      .where(
        and(eq(matchesTable.stadiumId, id), eq(matchesTable.isFriendly, false)),
      );

    const matches = stats?.matches ?? 0;
    const wins = stats?.wins ?? 0;

    res.json({
      id: stadium.id,
      name: stadium.name,
      city: stadium.city ?? null,
      state: stadium.state ?? null,
      country: stadium.country ?? null,
      capacity: stadium.capacity ?? null,
      homeClubs,
      matches,
      wins,
      draws: stats?.draws ?? 0,
      losses: stats?.losses ?? 0,
      goalsScored: stats?.goalsScored ?? 0,
      goalsConceded: stats?.goalsConceded ?? 0,
      winPercentage: matches > 0 ? (wins / matches) * 100 : 0,
      firstMatch: stats?.firstMatch ?? null,
      lastMatch: stats?.lastMatch ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Competitions
router.get("/competitions", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: competitionsTable.id,
        name: competitionsTable.name,
        type: competitionsTable.type,
        matches: sql<number>`cast(count(${matchesTable.id}) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
        lastParticipation: sql<string>`cast(max(${matchesTable.season}) as text)`,
      })
      .from(competitionsTable)
      .leftJoin(matchesTable, and(eq(matchesTable.competitionId, competitionsTable.id), eq(matchesTable.isFriendly, false)))
      .groupBy(competitionsTable.id, competitionsTable.name, competitionsTable.type)
      .orderBy(sql`count(${matchesTable.id}) desc`);

    res.json(rows.map((r) => ({ ...r, titles: null })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/competitions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const comp = await db.query.competitionsTable.findFirst({ where: eq(competitionsTable.id, id) });
    if (!comp) return res.status(404).json({ error: "Competição não encontrada" });

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
      .where(and(eq(matchesTable.competitionId, id), eq(matchesTable.isFriendly, false)));

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
      .where(and(eq(matchesTable.competitionId, id), eq(matchesTable.isFriendly, false)))
      .groupBy(matchesTable.season)
      .orderBy(desc(matchesTable.season));

    const stats = overall[0];
    res.json({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      matches: stats?.matches || 0,
      wins: stats?.wins || 0,
      draws: stats?.draws || 0,
      losses: stats?.losses || 0,
      goalsScored: stats?.goalsScored || 0,
      goalsConceded: stats?.goalsConceded || 0,
      titles: null,
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

// Results by decade
router.get("/records/by-decade", async (req, res) => {
  try {
    const rows = await db
      .select({
        decade: sql<string>`cast(floor(extract(year from ${matchesTable.matchDate}) / 10) * 10 as text)`,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(matchesTable)
      .where(eq(matchesTable.isFriendly, false))
      .groupBy(sql`floor(extract(year from ${matchesTable.matchDate}) / 10) * 10`)
      .orderBy(sql`floor(extract(year from ${matchesTable.matchDate}) / 10) * 10`);

    res.json(rows.map((r) => ({
      ...r,
      decadeLabel: `${r.decade}s`,
      winPercentage: r.matches > 0 ? Math.round((r.wins / r.matches) * 100 * 10) / 10 : 0,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Home/Away records
router.get("/records/home-away", async (req, res) => {
  try {
    const { season, competition } = req.query as Record<string, string>;

    const buildRecord = async (homeAway: string) => {
      let q = db
        .select({
          matches: sql<number>`cast(count(*) as int)`,
          wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
          draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
          losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
          goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
          goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
        })
        .from(matchesTable)
        .where(and(eq(matchesTable.homeAway, homeAway), eq(matchesTable.isFriendly, false)))
        .$dynamic();
      const rows = await q;
      return rows[0] || { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    };

    const [home, away, neutral] = await Promise.all([
      buildRecord("home"),
      buildRecord("away"),
      buildRecord("neutral"),
    ]);

    res.json({ home, away, neutral });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Streaks
router.get("/records/streaks", async (req, res) => {
  try {
    const matches = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        result: matchesTable.result,
      })
      .from(matchesTable)
      .where(eq(matchesTable.isFriendly, false))
      .orderBy(matchesTable.matchDate);

    const streaks: any[] = [];

    // Find best winning streak
    let maxWin = 0, curWin = 0, winStart = 0, winEnd = 0, bestWinStart = 0, bestWinEnd = 0;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].result === "win") {
        if (curWin === 0) winStart = i;
        curWin++;
        winEnd = i;
        if (curWin > maxWin) {
          maxWin = curWin;
          bestWinStart = winStart;
          bestWinEnd = winEnd;
        }
      } else {
        curWin = 0;
      }
    }
    if (maxWin > 0) {
      streaks.push({
        type: "winning",
        length: maxWin,
        startDate: matches[bestWinStart].matchDate,
        endDate: matches[bestWinEnd].matchDate,
        description: `Melhor sequência de vitórias consecutivas: ${maxWin} jogos`,
        isCurrent: false,
      });
    }

    // Find best unbeaten streak
    let maxUnbeaten = 0, curUnbeaten = 0, unbeatStart = 0, unbeatEnd = 0, bestUnbeatStart = 0, bestUnbeatEnd = 0;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].result !== "loss") {
        if (curUnbeaten === 0) unbeatStart = i;
        curUnbeaten++;
        unbeatEnd = i;
        if (curUnbeaten > maxUnbeaten) {
          maxUnbeaten = curUnbeaten;
          bestUnbeatStart = unbeatStart;
          bestUnbeatEnd = unbeatEnd;
        }
      } else {
        curUnbeaten = 0;
      }
    }
    if (maxUnbeaten > 0) {
      streaks.push({
        type: "unbeaten",
        length: maxUnbeaten,
        startDate: matches[bestUnbeatStart].matchDate,
        endDate: matches[bestUnbeatEnd].matchDate,
        description: `Melhor invencibilidade: ${maxUnbeaten} jogos sem derrota`,
        isCurrent: false,
      });
    }

    // Find longest losing streak
    let maxLoss = 0, curLoss = 0, lossStart = 0, lossEnd = 0, bestLossStart = 0, bestLossEnd = 0;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].result === "loss") {
        if (curLoss === 0) lossStart = i;
        curLoss++;
        lossEnd = i;
        if (curLoss > maxLoss) {
          maxLoss = curLoss;
          bestLossStart = lossStart;
          bestLossEnd = lossEnd;
        }
      } else {
        curLoss = 0;
      }
    }
    if (maxLoss > 0) {
      streaks.push({
        type: "losing",
        length: maxLoss,
        startDate: matches[bestLossStart].matchDate,
        endDate: matches[bestLossEnd].matchDate,
        description: `Pior sequência de derrotas: ${maxLoss} jogos`,
        isCurrent: false,
      });
    }

    res.json(streaks);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Squad by season
router.get("/records/squad-by-season", async (req, res) => {
  try {
    const { season } = req.query as Record<string, string>;
    if (!season) return res.status(400).json({ error: "Temporada obrigatória" });

    const rows = await db
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
      .where(eq(playerSeasonStatsTable.season, season))
      .orderBy(desc(playerSeasonStatsTable.appearances));

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
