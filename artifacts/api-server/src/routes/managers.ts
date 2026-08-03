import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  managersTable,
  managerSeasonStatsTable,
  opponentsTable,
  playersTable,
} from "@workspace/db";
import { sql, eq, desc, asc, and } from "drizzle-orm";
import { loadEntityBadges } from "../lib/entity-badges";
import {
  computeManagerSeasonStatsFromMatches,
  periodFromSeasons,
  resolveManagerCareerStats,
  resolveManagerSeasonStatsPublic,
} from "../lib/manager-stats";
import { officialPlayedMatchConditions } from "../lib/match-filters";
import { countManagerTitles, listManagerTitles } from "../lib/titles";

const router = Router();

async function loadManagerMatches(managerId: number, limit?: number) {
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
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .where(and(eq(matchesTable.managerId, managerId), officialPlayedMatchConditions()))
    .orderBy(desc(matchesTable.matchDate), desc(matchesTable.id))
    .$dynamic();

  if (limit != null) q = q.limit(limit);

  const rows = await q;
  return rows.map((r) => ({
    matchId: r.matchId,
    date: r.date,
    season: r.season,
    opponentId: r.opponentId,
    opponent: r.opponent,
    goalsFor: r.goalsFor ?? null,
    goalsAgainst: r.goalsAgainst ?? null,
    result: r.result,
    homeAway: r.homeAway,
  }));
}

router.get("/managers", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        nationality: managersTable.nationality,
        fullName: managersTable.fullName,
        verificationStatus: managersTable.verificationStatus,
        storedGames: managersTable.storedGames,
        storedWins: managersTable.storedWins,
        storedDraws: managersTable.storedDraws,
        storedLosses: managersTable.storedLosses,
        storedGoalsFor: managersTable.storedGoalsFor,
        storedGoalsAgainst: managersTable.storedGoalsAgainst,
        statsSource: managersTable.statsSource,
        computedMatches: sql<number>`cast(count(${matchesTable.id}) as int)`,
        computedWins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
        computedDraws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
        computedLosses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
        computedGoalsScored: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
        computedGoalsConceded: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
      })
      .from(managersTable)
      .leftJoin(
        matchesTable,
        and(eq(matchesTable.managerId, managersTable.id), officialPlayedMatchConditions()),
      )
      .groupBy(
        managersTable.id,
        managersTable.name,
        managersTable.nationality,
        managersTable.fullName,
        managersTable.verificationStatus,
        managersTable.storedGames,
        managersTable.storedWins,
        managersTable.storedDraws,
        managersTable.storedLosses,
        managersTable.storedGoalsFor,
        managersTable.storedGoalsAgainst,
        managersTable.statsSource,
      );

    const periodRows = await db
      .select({
        managerId: managerSeasonStatsTable.managerId,
        season: managerSeasonStatsTable.season,
      })
      .from(managerSeasonStatsTable)
      .orderBy(asc(managerSeasonStatsTable.season));

    const seasonsByManager = new Map<number, string[]>();
    for (const p of periodRows) {
      const list = seasonsByManager.get(p.managerId) ?? [];
      list.push(p.season);
      seasonsByManager.set(p.managerId, list);
    }

    const mapped = rows.map((r) => {
      const computed = {
        matches: r.computedMatches,
        wins: r.computedWins,
        draws: r.computedDraws,
        losses: r.computedLosses,
        goalsScored: r.computedGoalsScored,
        goalsConceded: r.computedGoalsConceded,
      };
      const stats = resolveManagerCareerStats(computed, r);
      const period = periodFromSeasons(seasonsByManager.get(r.id) ?? []);
      return {
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        nationality: r.nationality,
        verificationStatus: r.verificationStatus,
        // Derived tenure (replaces legacy start_year/end_year for public display)
        startYear: period.startYear,
        endYear: period.endYear,
        ...stats,
        goalsFor: stats.goalsScored,
        goalsAgainst: stats.goalsConceded,
        winPercentage:
          stats.matches > 0
            ? Math.round((stats.wins / stats.matches) * 100 * 10) / 10
            : 0,
      };
    });
    mapped.sort(
      (a, b) =>
        b.matches - a.matches || a.name.localeCompare(b.name, "pt-BR"),
    );
    res.json(mapped);
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
      .where(and(eq(matchesTable.managerId, id), officialPlayedMatchConditions()));

    const computed = overall[0] ?? {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
    };
    const stats = resolveManagerCareerStats(computed, manager);
    const badges = await loadEntityBadges("manager", id);
    const [titleCount, titles] = await Promise.all([
      countManagerTitles(id),
      listManagerTitles(id),
    ]);
    const linkedSeasons = await computeManagerSeasonStatsFromMatches(id);
    const flooredSeasons = resolveManagerSeasonStatsPublic({
      linkedSeasons,
    });
    const period = periodFromSeasons(flooredSeasons.map((r) => r.year));
    const recentMatches = await loadManagerMatches(id, 5);

    let linkedPlayer: { id: number; name: string } | null = null;
    if (manager.playerId != null) {
      const [p] = await db
        .select({ id: playersTable.id, name: playersTable.name })
        .from(playersTable)
        .where(eq(playersTable.id, manager.playerId))
        .limit(1);
      if (p) linkedPlayer = p;
    }

    res.json({
      id: manager.id,
      name: manager.name,
      fullName: manager.fullName,
      nationality: manager.nationality,
      birthDate: manager.birthDate,
      birthCity: manager.birthCity,
      birthState: manager.birthState,
      birthCountry: manager.birthCountry,
      isDeceased: manager.isDeceased,
      photoUrl: manager.photoUrl ?? null,
      verificationStatus: manager.verificationStatus,
      verifiedAt:
        manager.verifiedAt instanceof Date
          ? manager.verifiedAt.toISOString()
          : manager.verifiedAt,
      verifiedBy: manager.verifiedBy,
      startYear: period.startYear,
      endYear: period.endYear,
      ...stats,
      goalsFor: stats.goalsScored,
      goalsAgainst: stats.goalsConceded,
      winPercentage:
        stats.matches > 0
          ? Math.round((stats.wins / stats.matches) * 100 * 10) / 10
          : 0,
      badges,
      titleCount,
      titles,
      seasonStats: flooredSeasons,
      recentMatches,
      linkedPlayer,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/managers/:id/matches", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const manager = await db.query.managersTable.findFirst({
      where: eq(managersTable.id, id),
    });
    if (!manager) return res.status(404).json({ error: "Técnico não encontrado" });

    const [linked] = await db
      .select({
        matches: sql<number>`cast(count(*) as int)`,
      })
      .from(matchesTable)
      .where(and(eq(matchesTable.managerId, id), officialPlayedMatchConditions()));

    const linkedCount = linked?.matches ?? 0;
    const matches = await loadManagerMatches(id);
    res.json({
      managerId: manager.id,
      managerName: manager.name,
      total: matches.length,
      careerMatches: linkedCount,
      matches,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
