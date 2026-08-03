import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  stadiumsTable,
  competitionsTable,
  playersTable,
  playerSeasonStatsTable,
  opponentsTable,
  seasonCompetitionStatsTable,
} from "@workspace/db";
import { sql, eq, and, desc, asc } from "drizzle-orm";
import { officialPlayedMatchConditions } from "../lib/match-filters";
import { getCompetitionHighlights } from "../lib/competition-highlights";

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
      .leftJoin(matchesTable, and(eq(matchesTable.stadiumId, stadiumsTable.id), officialPlayedMatchConditions()))
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
        photoUrl: stadiumsTable.photoUrl,
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

    const baseWhere = and(
      eq(matchesTable.stadiumId, id),
      officialPlayedMatchConditions(),
    );

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
      .where(baseWhere);

    const allMatchRows = await db
      .select({
        id: matchesTable.id,
        matchDate: matchesTable.matchDate,
        season: matchesTable.season,
        goalsFor: matchesTable.goalsFor,
        goalsAgainst: matchesTable.goalsAgainst,
        result: matchesTable.result,
        homeAway: matchesTable.homeAway,
        opponentId: matchesTable.opponentId,
        opponentName: opponentsTable.name,
        opponentLogoUrl: opponentsTable.logoUrl,
        competitionName: competitionsTable.name,
        phase: matchesTable.phase,
        round: matchesTable.round,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
      .where(baseWhere)
      .orderBy(desc(matchesTable.matchDate));

    const opponentRows = await db
      .select({
        id: opponentsTable.id,
        name: opponentsTable.name,
        logoUrl: opponentsTable.logoUrl,
        matches: sql<number>`cast(count(*) as int)`,
        wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        goalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
        goalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
      })
      .from(matchesTable)
      .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
      .where(baseWhere)
      .groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl)
      .orderBy(sql`count(*) desc`, asc(opponentsTable.name));

    const matches = stats?.matches ?? 0;
    const wins = stats?.wins ?? 0;

    res.json({
      id: stadium.id,
      name: stadium.name,
      city: stadium.city ?? null,
      state: stadium.state ?? null,
      country: stadium.country ?? null,
      capacity: stadium.capacity ?? null,
      photoUrl: stadium.photoUrl ?? null,
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
      opponentsFaced: opponentRows.map((o) => ({
        id: o.id,
        name: o.name,
        logoUrl: o.logoUrl ?? null,
        matches: o.matches ?? 0,
        wins: o.wins ?? 0,
        draws: o.draws ?? 0,
        losses: o.losses ?? 0,
        goalsFor: o.goalsFor ?? 0,
        goalsAgainst: o.goalsAgainst ?? 0,
      })),
      allMatches: allMatchRows.map((m) => ({
        id: m.id,
        date: m.matchDate,
        opponentId: m.opponentId,
        opponent: m.opponentName,
        opponentLogoUrl: m.opponentLogoUrl ?? null,
        goalsFor: m.goalsFor,
        goalsAgainst: m.goalsAgainst,
        result: m.result,
        homeAway: m.homeAway,
        competition: m.competitionName,
        season: m.season,
        phase: m.phase,
        round: m.round,
      })),
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
      .leftJoin(matchesTable, and(eq(matchesTable.competitionId, competitionsTable.id), officialPlayedMatchConditions()))
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
      .where(and(eq(matchesTable.competitionId, id), officialPlayedMatchConditions()));

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
      .where(and(eq(matchesTable.competitionId, id), officialPlayedMatchConditions()))
      .groupBy(matchesTable.season)
      .orderBy(desc(matchesTable.season));

    const stats = overall[0];
    const highlights = await getCompetitionHighlights(id);

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
      highlights,
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
      .where(officialPlayedMatchConditions())
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
        .where(and(eq(matchesTable.homeAway, homeAway), officialPlayedMatchConditions()))
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
type StreakType = "winning" | "unbeaten" | "losing";

type StreakMatchRow = {
  id: number;
  matchDate: string;
  result: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  homeAway: string;
  opponentId: number;
  opponentName: string;
  opponentLogoUrl: string | null;
  competitionName: string;
};

function findBestStreakRange(
  matches: { result: string }[],
  type: StreakType,
): { length: number; start: number; end: number } | null {
  let max = 0;
  let cur = 0;
  let start = 0;
  let end = 0;
  let bestStart = 0;
  let bestEnd = 0;

  const continues = (result: string) => {
    if (type === "winning") return result === "win";
    if (type === "losing") return result === "loss";
    // unbeaten: only known non-losses (win/draw). Unknown breaks the streak.
    return result === "win" || result === "draw";
  };

  for (let i = 0; i < matches.length; i++) {
    if (continues(matches[i].result)) {
      if (cur === 0) start = i;
      cur++;
      end = i;
      if (cur > max) {
        max = cur;
        bestStart = start;
        bestEnd = end;
      }
    } else {
      cur = 0;
    }
  }
  if (max <= 0) return null;
  return { length: max, start: bestStart, end: bestEnd };
}

function streakSummary(
  type: StreakType,
  matches: StreakMatchRow[],
  range: { length: number; start: number; end: number },
) {
  const descriptions: Record<StreakType, string> = {
    winning: `Melhor sequência de vitórias consecutivas: ${range.length} jogos`,
    unbeaten: `Melhor invencibilidade: ${range.length} jogos sem derrota`,
    losing: `Pior sequência de derrotas: ${range.length} jogos`,
  };
  return {
    type,
    length: range.length,
    startDate: matches[range.start].matchDate,
    endDate: matches[range.end].matchDate,
    description: descriptions[type],
    isCurrent: false,
  };
}

async function loadOfficialMatchesForStreaks(): Promise<StreakMatchRow[]> {
  return db
    .select({
      id: matchesTable.id,
      matchDate: matchesTable.matchDate,
      result: matchesTable.result,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      homeAway: matchesTable.homeAway,
      opponentId: matchesTable.opponentId,
      opponentName: opponentsTable.name,
      opponentLogoUrl: opponentsTable.logoUrl,
      competitionName: competitionsTable.name,
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
    .where(officialPlayedMatchConditions())
    .orderBy(matchesTable.matchDate);
}

router.get("/records/streaks", async (req, res) => {
  try {
    const matches = await loadOfficialMatchesForStreaks();
    const streaks = [];
    for (const type of ["winning", "unbeaten", "losing"] as StreakType[]) {
      const range = findBestStreakRange(matches, type);
      if (range) streaks.push(streakSummary(type, matches, range));
    }
    res.json(streaks);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/records/streaks/:type", async (req, res) => {
  try {
    const type = req.params.type as string;
    if (type !== "winning" && type !== "unbeaten" && type !== "losing") {
      return res.status(400).json({ error: "Tipo de sequência inválido" });
    }
    const matches = await loadOfficialMatchesForStreaks();
    const range = findBestStreakRange(matches, type);
    if (!range) {
      return res.status(404).json({ error: "Sequência não encontrada" });
    }
    const summary = streakSummary(type, matches, range);
    const slice = matches.slice(range.start, range.end + 1).map((m) => ({
      id: m.id,
      date: m.matchDate,
      opponentId: m.opponentId,
      opponent: m.opponentName,
      opponentLogoUrl: m.opponentLogoUrl ?? null,
      goalsFor: m.goalsFor,
      goalsAgainst: m.goalsAgainst,
      result: m.result,
      homeAway: m.homeAway,
      competition: m.competitionName,
    }));
    const goalsFor = slice.reduce((sum, m) => sum + (m.goalsFor ?? 0), 0);
    const goalsAgainst = slice.reduce((sum, m) => sum + (m.goalsAgainst ?? 0), 0);
    res.json({ ...summary, goalsFor, goalsAgainst, matches: slice });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/** Titles: season_competition_stats rows marked is_champion. */
router.get("/titles", async (req, res) => {
  try {
    const rows = await db
      .select({
        competitionId: seasonCompetitionStatsTable.competitionId,
        competitionName: competitionsTable.name,
        season: seasonCompetitionStatsTable.season,
      })
      .from(seasonCompetitionStatsTable)
      .innerJoin(
        competitionsTable,
        eq(seasonCompetitionStatsTable.competitionId, competitionsTable.id),
      )
      .where(eq(seasonCompetitionStatsTable.isChampion, true))
      .orderBy(asc(competitionsTable.name), asc(seasonCompetitionStatsTable.season));

    const byComp = new Map<
      number,
      { competitionId: number; competitionName: string; seasons: string[] }
    >();
    for (const r of rows) {
      let entry = byComp.get(r.competitionId);
      if (!entry) {
        entry = {
          competitionId: r.competitionId,
          competitionName: r.competitionName,
          seasons: [],
        };
        byComp.set(r.competitionId, entry);
      }
      entry.seasons.push(r.season);
    }

    const competitions = [...byComp.values()]
      .map((c) => ({
        competitionId: c.competitionId,
        competitionName: c.competitionName,
        count: c.seasons.length,
        seasons: c.seasons,
      }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.competitionName.localeCompare(b.competitionName, "pt-BR"),
      );

    const total = competitions.reduce((sum, c) => sum + c.count, 0);
    res.json({ total, competitions });
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
