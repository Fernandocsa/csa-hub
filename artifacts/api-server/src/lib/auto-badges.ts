import { db } from "@workspace/db";
import {
  entityBadgesTable,
  playerSeasonStatsTable,
  seasonsTable,
  matchesTable,
  matchGoalsTable,
  competitionsTable,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { officialPlayedMatchConditions } from "./match-filters";

export type AutoBadgeKind =
  | "top_scorer"
  | "top_assister"
  | "top_scorer_competition";

export type CompetitionBadgeStatus = {
  competitionId: number;
  competitionName: string;
  seasonYear: number;
  eligible: boolean;
  matchCount: number;
  completeCount: number;
  incompleteMatchIds: number[];
  topScorerIds: number[];
  topGoals: number;
  badgesCreated: number;
};

export type RecalcAutoBadgesResult = {
  year: number;
  removed: number;
  topScorerIds: number[];
  topAssisterIds: number[];
  topScorerGoals: number;
  topAssisterAssists: number;
  created: number;
  competition: {
    eligible: number;
    incomplete: number;
    created: number;
    details: CompetitionBadgeStatus[];
  };
};

function labelFor(kind: "top_scorer" | "top_assister", year: number): string {
  return kind === "top_scorer" ? `Artilheiro ${year}` : `Garçom ${year}`;
}

function competitionLabel(competitionName: string, year: number): string {
  return `Artilheiro ${competitionName} ${year}`;
}

type MatchGateRow = {
  id: number;
  competitionId: number;
  goalsFor: number | null;
  ownGoalsForCount: number;
  isWalkover: boolean;
};

/**
 * Strict sheet gate for one match:
 * COUNT(csa match_goals) + own_goals_for_count = goals_for
 * and every CSA goal row has scorer_player_id.
 */
export function isMatchGoalsSheetComplete(
  match: MatchGateRow,
  csaGoalCount: number,
  goalsMissingPlayerId: number,
): boolean {
  if (match.goalsFor == null) return false;
  const own = match.ownGoalsForCount ?? 0;
  if (own < 0) return false;
  if (csaGoalCount + own !== match.goalsFor) return false;
  if (goalsMissingPlayerId > 0) return false;
  return true;
}

/** Competition×season completeness + leaders (no DB writes). */
export async function getSeasonCompetitionBadgeStatuses(
  year: number,
): Promise<CompetitionBadgeStatus[]> {
  const seasonKey = String(year);

  const matches = await db
    .select({
      id: matchesTable.id,
      competitionId: matchesTable.competitionId,
      goalsFor: matchesTable.goalsFor,
      ownGoalsForCount: matchesTable.ownGoalsForCount,
      isWalkover: matchesTable.isWalkover,
      competitionName: competitionsTable.name,
    })
    .from(matchesTable)
    .innerJoin(
      competitionsTable,
      eq(matchesTable.competitionId, competitionsTable.id),
    )
    .where(
      and(
        eq(matchesTable.season, seasonKey),
        officialPlayedMatchConditions(),
        eq(matchesTable.isWalkover, false),
      ),
    );

  const eligibleMatches = matches;
  if (eligibleMatches.length === 0) return [];

  const matchIds = eligibleMatches.map((m) => m.id);
  const goalAgg = await db
    .select({
      matchId: matchGoalsTable.matchId,
      goalCount: sql<number>`cast(sum(case when coalesce(${matchGoalsTable.isOwnGoal}, false) = false then 1 else 0 end) as int)`,
      missingPlayerId: sql<number>`cast(sum(case when coalesce(${matchGoalsTable.isOwnGoal}, false) = false and ${matchGoalsTable.scorerPlayerId} is null then 1 else 0 end) as int)`,
    })
    .from(matchGoalsTable)
    .where(
      and(
        inArray(matchGoalsTable.matchId, matchIds),
        eq(matchGoalsTable.side, "csa"),
      ),
    )
    .groupBy(matchGoalsTable.matchId);

  const aggByMatch = new Map(
    goalAgg.map((g) => [
      g.matchId,
      {
        goalCount: Number(g.goalCount),
        missingPlayerId: Number(g.missingPlayerId),
      },
    ]),
  );

  const byComp = new Map<
    number,
    {
      name: string;
      matches: typeof eligibleMatches;
    }
  >();
  for (const m of eligibleMatches) {
    const cur = byComp.get(m.competitionId);
    if (cur) cur.matches.push(m);
    else byComp.set(m.competitionId, { name: m.competitionName, matches: [m] });
  }

  const statuses: CompetitionBadgeStatus[] = [];

  for (const [competitionId, { name, matches: compMatches }] of byComp) {
    const incompleteMatchIds: number[] = [];
    let completeCount = 0;
    for (const m of compMatches) {
      const agg = aggByMatch.get(m.id) ?? {
        goalCount: 0,
        missingPlayerId: 0,
      };
      if (
        isMatchGoalsSheetComplete(m, agg.goalCount, agg.missingPlayerId)
      ) {
        completeCount++;
      } else {
        incompleteMatchIds.push(m.id);
      }
    }

    const eligible = incompleteMatchIds.length === 0 && compMatches.length > 0;
    let topScorerIds: number[] = [];
    let topGoals = 0;

    if (eligible) {
      const completeIds = compMatches.map((m) => m.id);
      const scorers = await db
        .select({
          playerId: matchGoalsTable.scorerPlayerId,
          goals: sql<number>`cast(count(*) as int)`,
        })
        .from(matchGoalsTable)
        .where(
          and(
            inArray(matchGoalsTable.matchId, completeIds),
            eq(matchGoalsTable.side, "csa"),
            sql`${matchGoalsTable.scorerPlayerId} is not null`,
            sql`coalesce(${matchGoalsTable.isOwnGoal}, false) = false`,
          ),
        )
        .groupBy(matchGoalsTable.scorerPlayerId);

      topGoals = scorers.reduce((mx, r) => Math.max(mx, Number(r.goals)), 0);
      if (topGoals > 0) {
        topScorerIds = scorers
          .filter((r) => Number(r.goals) === topGoals && r.playerId != null)
          .map((r) => r.playerId as number);
      }
    }

    statuses.push({
      competitionId,
      competitionName: name,
      seasonYear: year,
      eligible,
      matchCount: compMatches.length,
      completeCount,
      incompleteMatchIds,
      topScorerIds,
      topGoals,
      badgesCreated: 0,
    });
  }

  statuses.sort((a, b) =>
    a.competitionName.localeCompare(b.competitionName, "pt-BR"),
  );
  return statuses;
}

/**
 * Replace auto Artilheiro/Garçom (season) + Artilheiro {competição} {ano}.
 * Competition badges only when every non-friendly/non-W.O. match passes the sheet gate.
 */
export async function recalculateSeasonAutoBadges(
  year: number,
): Promise<RecalcAutoBadgesResult> {
  const seasonKey = String(year);

  const deleted = await db
    .delete(entityBadgesTable)
    .where(
      and(
        eq(entityBadgesTable.source, "auto"),
        eq(entityBadgesTable.seasonYear, year),
      ),
    )
    .returning({ id: entityBadgesTable.id });

  const goalRows = await db
    .select({
      playerId: playerSeasonStatsTable.playerId,
      goals: playerSeasonStatsTable.goals,
    })
    .from(playerSeasonStatsTable)
    .where(eq(playerSeasonStatsTable.season, seasonKey));

  const assistRows = await db
    .select({
      playerId: playerSeasonStatsTable.playerId,
      assists: playerSeasonStatsTable.assists,
    })
    .from(playerSeasonStatsTable)
    .where(eq(playerSeasonStatsTable.season, seasonKey));

  const maxGoals = goalRows.reduce((m, r) => Math.max(m, r.goals ?? 0), 0);
  const maxAssists = assistRows.reduce(
    (m, r) => Math.max(m, r.assists ?? 0),
    0,
  );

  const topScorerIds =
    maxGoals > 0
      ? [
          ...new Set(
            goalRows
              .filter((r) => (r.goals ?? 0) === maxGoals)
              .map((r) => r.playerId),
          ),
        ]
      : [];

  const topAssisterIds =
    maxAssists > 0
      ? [
          ...new Set(
            assistRows
              .filter((r) => (r.assists ?? 0) === maxAssists)
              .map((r) => r.playerId),
          ),
        ]
      : [];

  const toInsert: Array<{
    entityType: "player";
    entityId: number;
    label: string;
    source: "auto";
    autoKind: AutoBadgeKind;
    seasonYear: number;
    competitionId?: number | null;
  }> = [
    ...topScorerIds.map((playerId) => ({
      entityType: "player" as const,
      entityId: playerId,
      label: labelFor("top_scorer", year),
      source: "auto" as const,
      autoKind: "top_scorer" as const,
      seasonYear: year,
      competitionId: null,
    })),
    ...topAssisterIds.map((playerId) => ({
      entityType: "player" as const,
      entityId: playerId,
      label: labelFor("top_assister", year),
      source: "auto" as const,
      autoKind: "top_assister" as const,
      seasonYear: year,
      competitionId: null,
    })),
  ];

  const details = await getSeasonCompetitionBadgeStatuses(year);
  let competitionCreated = 0;
  for (const st of details) {
    if (!st.eligible || st.topScorerIds.length === 0) continue;
    for (const playerId of st.topScorerIds) {
      toInsert.push({
        entityType: "player",
        entityId: playerId,
        label: competitionLabel(st.competitionName, year),
        source: "auto",
        autoKind: "top_scorer_competition",
        seasonYear: year,
        competitionId: st.competitionId,
      });
      competitionCreated++;
    }
    st.badgesCreated = st.topScorerIds.length;
  }

  if (toInsert.length > 0) {
    await db.insert(entityBadgesTable).values(toInsert);
  }

  return {
    year,
    removed: deleted.length,
    topScorerIds,
    topAssisterIds,
    topScorerGoals: maxGoals,
    topAssisterAssists: maxAssists,
    created: toInsert.length,
    competition: {
      eligible: details.filter((d) => d.eligible).length,
      incomplete: details.filter((d) => !d.eligible).length,
      created: competitionCreated,
      details,
    },
  };
}

export async function clearSeasonAutoBadges(year: number): Promise<number> {
  const deleted = await db
    .delete(entityBadgesTable)
    .where(
      and(
        eq(entityBadgesTable.source, "auto"),
        eq(entityBadgesTable.seasonYear, year),
      ),
    )
    .returning({ id: entityBadgesTable.id });
  return deleted.length;
}

export async function setSeasonStatsVerification(
  year: number,
  verified: boolean,
): Promise<{
  year: number;
  statsFullyVerified: boolean;
  statsVerifiedAt: Date | null;
  badges: RecalcAutoBadgesResult | { cleared: number };
}> {
  const [season] = await db
    .select({ year: seasonsTable.year })
    .from(seasonsTable)
    .where(eq(seasonsTable.year, year))
    .limit(1);
  if (!season) {
    throw Object.assign(new Error("Temporada não encontrada"), { status: 404 });
  }

  const verifiedAt = verified ? new Date() : null;
  const [updated] = await db
    .update(seasonsTable)
    .set({
      statsFullyVerified: verified,
      statsVerifiedAt: verifiedAt,
    })
    .where(eq(seasonsTable.year, year))
    .returning();

  if (verified) {
    const badges = await recalculateSeasonAutoBadges(year);
    return {
      year,
      statsFullyVerified: updated.statsFullyVerified,
      statsVerifiedAt: updated.statsVerifiedAt,
      badges,
    };
  }

  const cleared = await clearSeasonAutoBadges(year);
  return {
    year,
    statsFullyVerified: updated.statsFullyVerified,
    statsVerifiedAt: updated.statsVerifiedAt,
    badges: { cleared },
  };
}
