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
  transfersTable,
} from "@workspace/db";
import { sql, eq, ilike, and, desc, asc, ne, or, isNull, inArray } from "drizzle-orm";
import { loadEntityBadges } from "../lib/entity-badges";
import {
  flooredPlayerSeasonStats,
  flooredCareerRankings,
  listFlooredCareerPlayers,
  sumFlooredSeasons,
} from "../lib/player-stats-floor";
import { officialPlayedMatchConditions, playerHasCsaLineupSql } from "../lib/match-filters";
import { listPlayerTitles } from "../lib/titles";
import {
  playerMostFacedOpponents,
  playerMostGoalsVsOpponents,
} from "../lib/entity-opponent-stats";
import {
  enrichTransferOpponentFields,
  loadOpponentCrestCatalog,
} from "../lib/transfer-opponent";

const router = Router();

async function loadPlayerSheetMatches(
  playerId: number,
  limit?: number,
  catalogPositionHint?: string | null,
) {
  const catalogPosition =
    catalogPositionHint?.trim() ||
    (
      await db
        .select({ position: playersTable.position })
        .from(playersTable)
        .where(eq(playersTable.id, playerId))
        .limit(1)
    )[0]?.position?.trim() ||
    null;

  let q = db
    .select({
      matchId: matchesTable.id,
      date: matchesTable.matchDate,
      season: matchesTable.season,
      opponentId: matchesTable.opponentId,
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
    const unusedBench = r.role === "bench" && subIn == null;
    return {
      matchId: r.matchId,
      date: r.date,
      season: r.season,
      opponentId: r.opponentId,
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
      position: r.position?.trim() || catalogPosition,
      playerGoals: goalsByMatch.get(r.matchId) ?? 0,
      playerAssists: assistsByMatch.get(r.matchId) ?? 0,
      yellowCards: yellowByMatch.get(r.matchId) ?? 0,
      redCards: redByMatch.get(r.matchId) ?? 0,
      minuteIn: subIn?.minute ?? null,
      minuteInInjury: subIn?.injury ?? null,
      minuteOut: subOut?.minute ?? null,
      minuteOutInjury: subOut?.injury ?? null,
      unusedBench,
    };
  });
}


router.get("/players", async (req, res) => {
  try {
    const { search, sort, season, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;
    const sortKey =
      sort === "goals" || sort === "seasons" || sort === "appearances"
        ? sort
        : "appearances";

    // Sheet-linked appearances only (starter / sub who entered) — unused bench excluded.
    const { data, total } = await listFlooredCareerPlayers({
      search: search || undefined,
      sort: sortKey,
      season: season || undefined,
      limit: lim,
      offset: off,
    });

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
    const rows = await flooredCareerRankings({
      sort: "goals",
      limit: lim,
      season: season || undefined,
    });
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
    const rows = await flooredCareerRankings({
      sort: "appearances",
      limit: lim,
      season: season || undefined,
    });
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
    const rows = (
      await flooredCareerRankings({
        sort: "assists",
        limit: Math.min(lim * 3, 200),
        season: season || undefined,
      })
    )
      .filter((r) => (r.assists ?? 0) > 0)
      .slice(0, lim);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/** Ranking of CSA players who scored own goals (GPD / against). */
router.get("/players/top-own-goals", async (req, res) => {
  try {
    const { season, limit = "100" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 100, 200);
    const seasonFilter = season
      ? sql`AND m.season::text = ${season}`
      : sql``;

    const result = await db.execute(sql`
      WITH og AS (
        SELECT
          mg.scorer_player_id AS player_id,
          count(*)::int AS own_goals
        FROM match_goals mg
        INNER JOIN matches m ON m.id = mg.match_id
        WHERE coalesce(mg.is_own_goal, false) = true
          AND mg.own_goal_direction = 'against'
          AND mg.side = 'csa'
          AND mg.scorer_player_id IS NOT NULL
          AND coalesce(m.is_friendly, false) = false
          AND coalesce(m.status, 'played') <> 'scheduled'
          AND coalesce(m.result, '') <> 'unknown'
          AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
          ${seasonFilter}
        GROUP BY mg.scorer_player_id
      ),
      apps AS (
        SELECT
          ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        INNER JOIN matches m ON m.id = ml.match_id
        WHERE ml.side = 'csa'
          AND ml.player_id IS NOT NULL
          AND coalesce(m.is_friendly, false) = false
          AND coalesce(m.status, 'played') <> 'scheduled'
          AND coalesce(m.result, '') <> 'unknown'
          AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
          AND (
            ml.role = 'starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions s
              WHERE s.match_id = ml.match_id
                AND s.side = 'csa'
                AND s.player_in_id IS NOT NULL
                AND s.player_in_id = ml.player_id
            )
          )
          ${seasonFilter}
          AND ml.player_id IN (SELECT player_id FROM og)
        GROUP BY ml.player_id
      )
      SELECT
        p.id,
        p.name,
        p.position,
        p.nationality,
        p.nationality_flag AS "nationalityFlag",
        p.verification_status AS "verificationStatus",
        coalesce(a.appearances, 0)::int AS appearances,
        og.own_goals::int AS goals
      FROM og
      INNER JOIN players p ON p.id = og.player_id
      LEFT JOIN apps a ON a.player_id = og.player_id
      ORDER BY og.own_goals DESC, p.name ASC
      LIMIT ${lim}
    `);

    const rows = ((result as unknown as { rows: Record<string, unknown>[] }).rows ?? []).map(
      (r) => ({
        id: Number(r.id),
        name: String(r.name),
        position: (r.position as string | null) ?? null,
        nationality: (r.nationality as string | null) ?? null,
        nationalityFlag: (r.nationalityFlag as string | null) ?? null,
        verificationStatus: (r.verificationStatus as string | null) ?? null,
        appearances: Number(r.appearances) || 0,
        goals: Number(r.goals) || 0,
      }),
    );
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
      .where(and(ne(playersTable.nationality, "Brasil"), playerHasCsaLineupSql()))
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
      .where(and(ne(playersTable.nationality, "Brasil"), playerHasCsaLineupSql()))
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

/** Common bad values stored as birth_state (city nicknames, typos) → real UF */
const BIRTH_STATE_ALIASES: Record<string, string> = {
  BH: "MG", // Belo Horizonte
};

const birthStateNorm = sql<string>`upper(trim(${playersTable.birthState}))`;

function resolveBirthUf(raw: string): string {
  const uf = raw.toUpperCase();
  return BIRTH_STATE_ALIASES[uf] ?? uf;
}

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
          playerHasCsaLineupSql(),
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
        and(
          or(
            isNull(playersTable.birthState),
            sql`trim(${playersTable.birthState}) = ''`,
          ),
          playerHasCsaLineupSql(),
        ),
      );

    // Merge aliases (e.g. BH → MG) and drop non-UF junk from the index
    const byUf = new Map<
      string,
      { state: string; playerCount: number; totalAppearances: number; totalGoals: number }
    >();
    for (const r of rows) {
      if (!r.state) continue;
      const raw = String(r.state).toUpperCase();
      const state = resolveBirthUf(raw);
      if (!BRAZIL_UFS.has(state)) continue;
      const cur = byUf.get(state) ?? {
        state,
        playerCount: 0,
        totalAppearances: 0,
        totalGoals: 0,
      };
      cur.playerCount += r.playerCount ?? 0;
      cur.totalAppearances += r.totalAppearances ?? 0;
      cur.totalGoals += r.totalGoals ?? 0;
      byUf.set(state, cur);
    }

    res.json({
      states: [...byUf.values()].sort((a, b) => b.playerCount - a.playerCount),
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
    const uf = resolveBirthUf(raw.toUpperCase());

    if (!isUnknown && !BRAZIL_UFS.has(uf)) {
      return res.status(400).json({ error: "UF inválida" });
    }

    // Include legacy aliases that map to this UF (e.g. BH when querying MG)
    const aliasValues = Object.entries(BIRTH_STATE_ALIASES)
      .filter(([, target]) => target === uf)
      .map(([alias]) => alias);
    const stateValues = [uf, ...aliasValues];

    const stateCondition = isUnknown
      ? or(
          isNull(playersTable.birthState),
          sql`trim(${playersTable.birthState}) = ''`,
        )
      : sql`${birthStateNorm} in (${sql.join(
          stateValues.map((v) => sql`${v}`),
          sql`, `,
        )})`;

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
      .where(and(stateCondition, playerHasCsaLineupSql()))
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
      .where(and(eq(playersTable.nationality, country), playerHasCsaLineupSql()))
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

    const [
      floored,
      recentMatches,
      badges,
      titles,
      mostFacedOpponents,
      mostGoalsVsOpponents,
      linkedMgrRows,
      transfers,
    ] = await Promise.all([
      flooredPlayerSeasonStats(id),
      loadPlayerSheetMatches(id, 5, player.position),
      loadEntityBadges("player", id),
      listPlayerTitles(id),
      playerMostFacedOpponents(id),
      playerMostGoalsVsOpponents(id),
      db
        .select({ id: managersTable.id, name: managersTable.name })
        .from(managersTable)
        .where(eq(managersTable.playerId, id))
        .limit(1),
      db
        .select({
          id: transfersTable.id,
          direction: transfersTable.direction,
          club: transfersTable.club,
          opponentId: transfersTable.opponentId,
          clubLogoUrl: opponentsTable.logoUrl,
          transferDate: transfersTable.transferDate,
          season: transfersTable.season,
          transferType: transfersTable.transferType,
          notes: transfersTable.notes,
        })
        .from(transfersTable)
        .leftJoin(
          opponentsTable,
          eq(transfersTable.opponentId, opponentsTable.id),
        )
        .where(eq(transfersTable.playerId, id))
        .orderBy(desc(transfersTable.season), desc(transfersTable.transferDate)),
    ]);

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
      penaltiesMissed: r.penaltiesMissed,
      penaltiesSaved: r.penaltiesSaved,
      yellowCards: r.yellowCards,
      redCards: r.redCards,
      ownGoals: r.ownGoals,
      goalsConceded: r.goalsConceded,
    }));
    const titleCount = titles.length;
    const linkedMgr = linkedMgrRows[0];

    const opponentsCatalog = transfers.some((t) => !t.opponentId || !t.clubLogoUrl)
      ? await loadOpponentCrestCatalog()
      : [];
    const transfersEnriched = transfers.map((t) =>
      enrichTransferOpponentFields(
        {
          club: t.club ?? null,
          opponentId: t.opponentId ?? null,
          clubLogoUrl: t.clubLogoUrl ?? null,
        },
        opponentsCatalog,
      ),
    );

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
      totalPenaltiesMissed: totals.penaltiesMissed,
      totalPenaltiesSaved: totals.penaltiesSaved,
      totalYellowCards: totals.yellowCards,
      totalRedCards: totals.redCards,
      totalOwnGoals: totals.ownGoals,
      totalGoalsConceded: totals.goalsConceded,
      titleCount,
      titles,
      seasonStats,
      recentMatches,
      badges,
      mostFacedOpponents,
      mostGoalsVsOpponents,
      linkedManager: linkedMgr ?? null,
      transfers: transfers.map((t, i) => ({
        id: t.id,
        direction: t.direction === "out" ? "out" : "in",
        club: t.club ?? null,
        opponentId: transfersEnriched[i]?.opponentId ?? null,
        clubLogoUrl: transfersEnriched[i]?.clubLogoUrl ?? null,
        transferDate: t.transferDate ?? null,
        season: t.season,
        transferType: t.transferType ?? null,
        notes: t.notes ?? null,
      })),
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
    const floors = await flooredPlayerSeasonStats(id);
    const career = sumFlooredSeasons(floors);
    const unusedBenchTotal = matches.filter((m) => m.unusedBench).length;
    res.json({
      playerId: player.id,
      playerName: player.name,
      total: matches.length,
      playedTotal: matches.length - unusedBenchTotal,
      unusedBenchTotal,
      careerAppearances: career.appearances,
      matches,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
