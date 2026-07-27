import { db } from "@workspace/db";
import { matchesTable, managersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type ManagerStoredStats = {
  storedGames: number;
  storedWins: number;
  storedDraws: number;
  storedLosses: number;
  storedGoalsFor: number;
  storedGoalsAgainst: number;
  matchCount: number;
};

export async function computeManagerStatsFromMatches(
  managerId: number,
): Promise<ManagerStoredStats> {
  const [row] = await db
    .select({
      matchCount: sql<number>`cast(count(*) as int)`,
      storedWins: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end), 0) as int)`,
      storedDraws: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end), 0) as int)`,
      storedLosses: sql<number>`cast(coalesce(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end), 0) as int)`,
      storedGoalsFor: sql<number>`cast(coalesce(sum(${matchesTable.goalsFor}), 0) as int)`,
      storedGoalsAgainst: sql<number>`cast(coalesce(sum(${matchesTable.goalsAgainst}), 0) as int)`,
    })
    .from(matchesTable)
    .where(eq(matchesTable.managerId, managerId));

  const matchCount = row?.matchCount ?? 0;
  return {
    matchCount,
    storedGames: matchCount,
    storedWins: row?.storedWins ?? 0,
    storedDraws: row?.storedDraws ?? 0,
    storedLosses: row?.storedLosses ?? 0,
    storedGoalsFor: row?.storedGoalsFor ?? 0,
    storedGoalsAgainst: row?.storedGoalsAgainst ?? 0,
  };
}

export async function recalculateManagerStoredStats(managerId: number) {
  const [existing] = await db
    .select()
    .from(managersTable)
    .where(eq(managersTable.id, managerId));
  if (!existing) return null;

  const computed = await computeManagerStatsFromMatches(managerId);
  const now = new Date();

  const [updated] = await db
    .update(managersTable)
    .set({
      storedGames: computed.storedGames,
      storedWins: computed.storedWins,
      storedDraws: computed.storedDraws,
      storedLosses: computed.storedLosses,
      storedGoalsFor: computed.storedGoalsFor,
      storedGoalsAgainst: computed.storedGoalsAgainst,
      statsSource: "calculated",
      statsRecalculatedAt: now,
    })
    .where(eq(managersTable.id, managerId))
    .returning();

  return { manager: updated, matchCount: computed.matchCount };
}

const STORED_STAT_KEYS = [
  "storedGames",
  "storedWins",
  "storedDraws",
  "storedLosses",
  "storedGoalsFor",
  "storedGoalsAgainst",
] as const;

type StoredStatKey = (typeof STORED_STAT_KEYS)[number];

export function managerStoredStatsChanged(
  current: Pick<typeof managersTable.$inferSelect, StoredStatKey>,
  body: Partial<Record<StoredStatKey, number | null | undefined>>,
): boolean {
  return STORED_STAT_KEYS.some((key) => {
    if (body[key] === undefined) return false;
    return body[key] !== current[key];
  });
}

export function hasAnyStoredStat(body: Partial<Record<StoredStatKey, number | null | undefined>>): boolean {
  return STORED_STAT_KEYS.some((key) => body[key] != null);
}
