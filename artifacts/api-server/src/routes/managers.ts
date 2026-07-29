import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  managersTable,
  managerSeasonStatsTable,
} from "@workspace/db";
import { sql, eq, desc, asc, and } from "drizzle-orm";
import { loadEntityBadges } from "../lib/entity-badges";
import {
  computeManagerSeasonStatsFromMatches,
  floorManagerSeasonRow,
  periodFromSeasons,
  resolveManagerCareerStats,
} from "../lib/manager-stats";
import { officialPlayedMatchConditions } from "../lib/match-filters";

const router = Router();

router.get("/managers", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        nationality: managersTable.nationality,
        fullName: managersTable.fullName,
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
      .leftJoin(
        matchesTable,
        and(eq(matchesTable.managerId, managersTable.id), officialPlayedMatchConditions()),
      )
      .groupBy(
        managersTable.id,
        managersTable.name,
        managersTable.nationality,
        managersTable.fullName,
        managersTable.storedGames,
        managersTable.storedWins,
        managersTable.storedDraws,
        managersTable.storedLosses,
        managersTable.storedGoalsFor,
        managersTable.storedGoalsAgainst,
      )
      .orderBy(
        sql`GREATEST(COALESCE(${managersTable.storedGames}, 0), cast(count(${matchesTable.id}) as int)) desc`,
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

    res.json(
      rows.map((r) => {
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
      }),
    );
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

    const seasonRows = await db
      .select({
        season: managerSeasonStatsTable.season,
        matches: managerSeasonStatsTable.games,
        wins: managerSeasonStatsTable.wins,
        draws: managerSeasonStatsTable.draws,
        losses: managerSeasonStatsTable.losses,
        goalsScored: managerSeasonStatsTable.goalsFor,
        goalsConceded: managerSeasonStatsTable.goalsAgainst,
      })
      .from(managerSeasonStatsTable)
      .where(eq(managerSeasonStatsTable.managerId, id))
      .orderBy(desc(managerSeasonStatsTable.season));

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
    const linkedSeasons = await computeManagerSeasonStatsFromMatches(id);
    const linkedBySeason = new Map(linkedSeasons.map((r) => [r.season, r]));
    const seasonKeys = new Set([
      ...seasonRows.map((r) => r.season),
      ...linkedSeasons.map((r) => r.season),
    ]);
    const flooredSeasons = [...seasonKeys]
      .sort((a, b) => b.localeCompare(a))
      .map((season) => {
        const manualRow = seasonRows.find((r) => r.season === season);
        const linked = linkedBySeason.get(season);
        const floored = floorManagerSeasonRow(
          manualRow
            ? {
                matches: manualRow.matches,
                wins: manualRow.wins,
                draws: manualRow.draws,
                losses: manualRow.losses,
                goalsScored: manualRow.goalsScored,
                goalsConceded: manualRow.goalsConceded,
              }
            : null,
          linked
            ? {
                matches: linked.games,
                wins: linked.wins,
                draws: linked.draws,
                losses: linked.losses,
                goalsScored: linked.goalsFor,
                goalsConceded: linked.goalsAgainst,
              }
            : null,
        );
        return {
          year: season,
          matches: floored.matches,
          wins: floored.wins,
          draws: floored.draws,
          losses: floored.losses,
          goalsScored: floored.goalsScored,
          goalsConceded: floored.goalsConceded,
          topScorer: null,
          topScorerGoals: null,
          topAppearances: null,
          topAppearancesCount: null,
        };
      });
    const period = periodFromSeasons(flooredSeasons.map((r) => r.year));

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
      seasonStats: flooredSeasons,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
