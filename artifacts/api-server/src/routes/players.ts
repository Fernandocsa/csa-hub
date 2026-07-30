import { Router } from "express";
import { db } from "@workspace/db";
import {
  playersTable,
  playerSeasonStatsTable,
  matchLineupsTable,
  matchGoalsTable,
  matchCardsTable,
  matchSubstitutionsTable,
  matchesTable,
  opponentsTable,
  competitionsTable,
  managersTable,
} from "@workspace/db";
import { sql, eq, ilike, and, desc, asc, ne, or, isNull, inArray } from "drizzle-orm";
import { loadEntityBadges } from "../lib/entity-badges";
import {
  flooredPlayerSeasonStats,
  sumFlooredSeasons,
} from "../lib/player-stats-floor";
import { csaLineupActuallyPlayedCondition } from "../lib/player-appeared";
import { officialPlayedMatchConditions } from "../lib/match-filters";

const router = Router();

async function loadPlayerSheetMatches(playerId: number, limit?: number) {
  let q = db
    .select({
      matchId: matchesTable.id,
      date: matchesTable.matchDate,
      season: matchesTable.season,
      opponent: opponentsTable.name,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      result: matchesTable.result,
      homeAway: matchesTable.homeAway,
      phase: matchesTable.phase,
      round: matchesTable.round,
      competition: competitionsTable.name,
      competitionType: competitionsTable.type,
      role: matchLineupsTable.role,
      shirtNumber: matchLineupsTable.shirtNumber,
      position: matchLineupsTable.position,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .innerJoin(
      competitionsTable,
      eq(matchesTable.competitionId, competitionsTable.id),
    )
    .where(
      and(
        eq(matchLineupsTable.playerId, playerId),
        eq(matchLineupsTable.side, "csa"),
        csaLineupActuallyPlayedCondition(),
        officialPlayedMatchConditions(),
      ),
    )
    .orderBy(desc(matchesTable.matchDate), desc(matchesTable.id))
    .$dynamic();

  if (limit != null) q = q.limit(limit);

  const rows = await q;
  if (rows.length === 0) return [];

  const matchIds = rows.map((r) => r.matchId);

  const [goalRows, assistRows, cardRows, subInRows, subOutRows] = await Promise.all([
    db
      .select({
        matchId: matchGoalsTable.matchId,
        goals: sql<number>`cast(count(*) as int)`,
      })
      .from(matchGoalsTable)
      .where(
        and(
          inArray(matchGoalsTable.matchId, matchIds),
          eq(matchGoalsTable.scorerPlayerId, playerId),
          eq(matchGoalsTable.side, "csa"),
          eq(matchGoalsTable.isOwnGoal, false),
        ),
      )
      .groupBy(matchGoalsTable.matchId),
    db
      .select({
        matchId: matchGoalsTable.matchId,
        assists: sql<number>`cast(count(*) as int)`,
      })
      .from(matchGoalsTable)
      .where(
        and(
          inArray(matchGoalsTable.matchId, matchIds),
          eq(matchGoalsTable.assistPlayerId, playerId),
          eq(matchGoalsTable.side, "csa"),
          eq(matchGoalsTable.isOwnGoal, false),
        ),
      )
      .groupBy(matchGoalsTable.matchId),
    db
      .select({
        matchId: matchCardsTable.matchId,
        cardType: matchCardsTable.cardType,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(matchCardsTable)
      .where(
        and(
          inArray(matchCardsTable.matchId, matchIds),
          eq(matchCardsTable.playerId, playerId),
          eq(matchCardsTable.side, "csa"),
        ),
      )
      .groupBy(matchCardsTable.matchId, matchCardsTable.cardType),
    db
      .select({
        matchId: matchSubstitutionsTable.matchId,
        minute: matchSubstitutionsTable.minute,
        injuryTimeMinute: matchSubstitutionsTable.injuryTimeMinute,
      })
      .from(matchSubstitutionsTable)
      .where(
        and(
          inArray(matchSubstitutionsTable.matchId, matchIds),
          eq(matchSubstitutionsTable.playerInId, playerId),
          eq(matchSubstitutionsTable.side, "csa"),
        ),
      ),
    db
      .select({
        matchId: matchSubstitutionsTable.matchId,
        minute: matchSubstitutionsTable.minute,
        injuryTimeMinute: matchSubstitutionsTable.injuryTimeMinute,
      })
      .from(matchSubstitutionsTable)
      .where(
        and(
          inArray(matchSubstitutionsTable.matchId, matchIds),
          eq(matchSubstitutionsTable.playerOutId, playerId),
          eq(matchSubstitutionsTable.side, "csa"),
        ),
      ),
  ]);

  const goalsByMatch = new Map(goalRows.map((r) => [r.matchId, r.goals ?? 0]));
  const assistsByMatch = new Map(assistRows.map((r) => [r.matchId, r.assists ?? 0]));
  const yellowByMatch = new Map<number, number>();
  const redByMatch = new Map<number, number>();
  for (const r of cardRows) {
    if (r.cardType === "yellow") yellowByMatch.set(r.matchId, r.count ?? 0);
    else if (r.cardType === "red") redByMatch.set(r.matchId, r.count ?? 0);
  }
  // First sub-in / sub-out per match (rare to have multiple)
  const minuteInByMatch = new Map<number, { minute: number; injury: number | null }>();
  for (const r of subInRows) {
    if (!minuteInByMatch.has(r.matchId)) {
      minuteInByMatch.set(r.matchId, {
        minute: r.minute,
        injury: r.injuryTimeMinute ?? null,
      });
    }
  }
  const minuteOutByMatch = new Map<number, { minute: number; injury: number | null }>();
  for (const r of subOutRows) {
    if (!minuteOutByMatch.has(r.matchId)) {
      minuteOutByMatch.set(r.matchId, {
        minute: r.minute,
        injury: r.injuryTimeMinute ?? null,
      });
    }
  }

  return rows.map((r) => {
    const subIn = minuteInByMatch.get(r.matchId) ?? null;
    const subOut = minuteOutByMatch.get(r.matchId) ?? null;
    return {
      matchId: r.matchId,
      date: r.date,
      season: r.season,
      opponent: r.opponent,
      goalsFor: r.goalsFor ?? null,
      goalsAgainst: r.goalsAgainst ?? null,
      result: r.result,
      homeAway: r.homeAway,
      competition: r.competition,
      competitionType: r.competitionType ?? null,
      phase: r.phase ?? null,
      round: r.round ?? null,
      role: r.role,
      shirtNumber: r.shirtNumber ?? null,
      position: r.position ?? null,
      playerGoals: goalsByMatch.get(r.matchId) ?? 0,
      playerAssists: assistsByMatch.get(r.matchId) ?? 0,
      yellowCards: yellowByMatch.get(r.matchId) ?? 0,
      redCards: redByMatch.get(r.matchId) ?? 0,
      minuteIn: subIn?.minute ?? null,
      minuteInInjury: subIn?.injury ?? null,
      minuteOut: subOut?.minute ?? null,
      minuteOutInjury: subOut?.injury ?? null,
    };
  });
}


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
        verificationStatus: playersTable.verificationStatus,
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
      playersTable.verificationStatus,
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
        verificationStatus: playersTable.verificationStatus,
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
        playersTable.verificationStatus,
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
        verificationStatus: playersTable.verificationStatus,
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
        playersTable.verificationStatus,
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
    const { season, limit = "50" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);

    let query = db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        verificationStatus: playersTable.verificationStatus,
        appearances: sql<number>`cast(sum(${playerSeasonStatsTable.appearances}) as int)`,
        goals: sql<number>`cast(sum(${playerSeasonStatsTable.goals}) as int)`,
        assists: sql<number>`cast(sum(${playerSeasonStatsTable.assists}) as int)`,
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
        playersTable.verificationStatus,
      )
      .having(sql`sum(${playerSeasonStatsTable.assists}) > 0`)
      .orderBy(
        sql`sum(${playerSeasonStatsTable.assists}) desc`,
        sql`sum(${playerSeasonStatsTable.appearances}) desc`,
      )
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

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

const birthStateNorm = sql<string>`upper(trim(${playersTable.birthState}))`;

// Brazilian birth-state summaries
router.get("/players/by-birth-state", async (req, res) => {
  try {
    const rows = await db
      .select({
        state: birthStateNorm,
        playerCount: sql<number>`cast(count(distinct ${playersTable.id}) as int)`,
        totalAppearances: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.appearances}), 0) as int)`,
        totalGoals: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.goals}), 0) as int)`,
      })
      .from(playersTable)
      .leftJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(
        and(
          sql`${playersTable.birthState} is not null`,
          sql`trim(${playersTable.birthState}) <> ''`,
        ),
      )
      .groupBy(birthStateNorm)
      .orderBy(sql`count(distinct ${playersTable.id}) desc`);

    const [unknown] = await db
      .select({
        playerCount: sql<number>`cast(count(distinct ${playersTable.id}) as int)`,
        totalAppearances: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.appearances}), 0) as int)`,
        totalGoals: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.goals}), 0) as int)`,
      })
      .from(playersTable)
      .leftJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(
        or(
          isNull(playersTable.birthState),
          sql`trim(${playersTable.birthState}) = ''`,
        ),
      );

    res.json({
      states: rows
        .filter((r) => r.state)
        .map((r) => ({
          state: String(r.state).toUpperCase(),
          playerCount: r.playerCount ?? 0,
          totalAppearances: r.totalAppearances ?? 0,
          totalGoals: r.totalGoals ?? 0,
        })),
      unknown:
        unknown && (unknown.playerCount ?? 0) > 0
          ? {
              state: null,
              playerCount: unknown.playerCount ?? 0,
              totalAppearances: unknown.totalAppearances ?? 0,
              totalGoals: unknown.totalGoals ?? 0,
            }
          : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/players/by-birth-state/:uf", async (req, res) => {
  try {
    const raw = decodeURIComponent(req.params.uf ?? "").trim();
    const isUnknown = raw.toLowerCase() === "sem-estado" || raw.toLowerCase() === "unknown";
    const uf = raw.toUpperCase();

    if (!isUnknown && uf.length === 2 && !BRAZIL_UFS.has(uf)) {
      return res.status(400).json({ error: "UF inválida" });
    }

    const stateCondition = isUnknown
      ? or(
          isNull(playersTable.birthState),
          sql`trim(${playersTable.birthState}) = ''`,
        )
      : eq(birthStateNorm, uf);

    const rows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
        birthCity: playersTable.birthCity,
        birthState: playersTable.birthState,
        nationality: playersTable.nationality,
        nationalityFlag: playersTable.nationalityFlag,
        appearances: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.appearances}), 0) as int)`,
        goals: sql<number>`cast(coalesce(sum(${playerSeasonStatsTable.goals}), 0) as int)`,
        firstSeason: sql<string | null>`cast(min(${playerSeasonStatsTable.season}) as text)`,
        lastSeason: sql<string | null>`cast(max(${playerSeasonStatsTable.season}) as text)`,
      })
      .from(playersTable)
      .leftJoin(playerSeasonStatsTable, eq(playerSeasonStatsTable.playerId, playersTable.id))
      .where(stateCondition)
      .groupBy(
        playersTable.id,
        playersTable.name,
        playersTable.position,
        playersTable.birthCity,
        playersTable.birthState,
        playersTable.nationality,
        playersTable.nationalityFlag,
      )
      .orderBy(
        sql`coalesce(sum(${playerSeasonStatsTable.appearances}), 0) desc`,
        asc(playersTable.name),
      );

    res.json({
      state: isUnknown ? null : uf,
      playerCount: rows.length,
      totalAppearances: rows.reduce((s, p) => s + (p.appearances ?? 0), 0),
      totalGoals: rows.reduce((s, p) => s + (p.goals ?? 0), 0),
      players: rows,
    });
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

    const floored = await flooredPlayerSeasonStats(id);
    const totals = sumFlooredSeasons(floored);
    const seasonStats = floored.map((r) => ({
      id: 0,
      name: player.name,
      position: player.position,
      nationality: player.nationality,
      nationalityFlag: player.nationalityFlag,
      season: r.season,
      appearances: r.appearances,
      goals: r.goals,
      assists: r.assists,
    }));
    const recentMatches = await loadPlayerSheetMatches(id, 5);
    const badges = await loadEntityBadges("player", id);

    const [linkedMgr] = await db
      .select({ id: managersTable.id, name: managersTable.name })
      .from(managersTable)
      .where(eq(managersTable.playerId, id))
      .limit(1);

    res.json({
      id: player.id,
      name: player.name,
      fullName: player.fullName ?? null,
      position: player.position,
      secondaryPositions: player.secondaryPositions ?? [],
      nationality: player.nationality,
      nationalityFlag: player.nationalityFlag,
      photoUrl: player.photoUrl ?? null,
      birthYear: player.birthYear,
      birthDate: player.birthDate ?? null,
      birthCity: player.birthCity ?? null,
      birthState: player.birthState ?? null,
      birthCountry: player.birthCountry ?? null,
      preferredFoot: player.preferredFoot ?? null,
      heightCm: player.heightCm ?? null,
      weightKg: player.weightKg ?? null,
      isDeceased: player.isDeceased,
      verificationStatus: player.verificationStatus,
      verifiedAt: player.verifiedAt,
      verifiedBy: player.verifiedBy,
      totalAppearances: totals.appearances,
      totalGoals: totals.goals,
      totalAssists: totals.assists,
      seasonStats,
      recentMatches,
      badges,
      linkedManager: linkedMgr ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/players/:id/matches", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const player = await db.query.playersTable.findFirst({
      where: eq(playersTable.id, id),
    });
    if (!player) return res.status(404).json({ error: "Jogador não encontrado" });

    const matches = await loadPlayerSheetMatches(id);
    res.json({
      playerId: player.id,
      playerName: player.name,
      total: matches.length,
      matches,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
