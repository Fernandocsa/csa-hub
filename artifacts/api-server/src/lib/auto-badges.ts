import { db } from "@workspace/db";
import {
  entityBadgesTable,
  playerSeasonStatsTable,
  seasonsTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

export type AutoBadgeKind = "top_scorer" | "top_assister";

export type RecalcAutoBadgesResult = {
  year: number;
  removed: number;
  topScorerIds: number[];
  topAssisterIds: number[];
  topScorerGoals: number;
  topAssisterAssists: number;
  created: number;
};

function labelFor(kind: AutoBadgeKind, year: number): string {
  return kind === "top_scorer" ? `Artilheiro ${year}` : `Garçom ${year}`;
}

/**
 * Replace auto Artilheiro/Garçom badges for a season.
 * All players tied at the top of goals/assists receive the badge.
 * Skips awarding when the season max for that stat is 0.
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

  const toInsert = [
    ...topScorerIds.map((playerId) => ({
      entityType: "player" as const,
      entityId: playerId,
      label: labelFor("top_scorer", year),
      source: "auto" as const,
      autoKind: "top_scorer" as const,
      seasonYear: year,
    })),
    ...topAssisterIds.map((playerId) => ({
      entityType: "player" as const,
      entityId: playerId,
      label: labelFor("top_assister", year),
      source: "auto" as const,
      autoKind: "top_assister" as const,
      seasonYear: year,
    })),
  ];

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
