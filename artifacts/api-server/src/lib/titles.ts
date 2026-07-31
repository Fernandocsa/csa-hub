import { db } from "@workspace/db";
import {
  seasonCompetitionStatsTable,
  competitionsTable,
  matchesTable,
  matchLineupsTable,
  managersTable,
  playersTable,
  opponentsTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { officialPlayedMatchConditions } from "./match-filters";

export type ChampionCampaign = {
  id: number;
  season: string;
  competitionId: number;
  competitionName: string;
  classification: string | null;
  finalMatchId: number | null;
  finalMatchDate: string | null;
  finalOpponentName: string | null;
};

export type TitleAward = {
  season: string;
  competitionId: number;
  competitionName: string;
};

/** Campaign matches that grant title credit (any official result, including W.O.). */
function campaignMatchConditions(season: string, competitionId: number) {
  return and(
    eq(matchesTable.season, season),
    eq(matchesTable.competitionId, competitionId),
    officialPlayedMatchConditions(),
  );
}

export async function listChampionCampaigns(): Promise<ChampionCampaign[]> {
  const rows = await db
    .select({
      id: seasonCompetitionStatsTable.id,
      season: seasonCompetitionStatsTable.season,
      competitionId: seasonCompetitionStatsTable.competitionId,
      competitionName: competitionsTable.name,
      classification: seasonCompetitionStatsTable.classification,
      finalMatchId: seasonCompetitionStatsTable.finalMatchId,
      finalMatchDate: matchesTable.matchDate,
      finalOpponentName: opponentsTable.name,
    })
    .from(seasonCompetitionStatsTable)
    .innerJoin(
      competitionsTable,
      eq(seasonCompetitionStatsTable.competitionId, competitionsTable.id),
    )
    .leftJoin(
      matchesTable,
      eq(seasonCompetitionStatsTable.finalMatchId, matchesTable.id),
    )
    .leftJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .where(eq(seasonCompetitionStatsTable.isChampion, true))
    .orderBy(
      desc(seasonCompetitionStatsTable.season),
      asc(competitionsTable.name),
    );

  return rows.map((r) => ({
    id: r.id,
    season: r.season,
    competitionId: r.competitionId,
    competitionName: r.competitionName,
    classification: r.classification,
    finalMatchId: r.finalMatchId,
    finalMatchDate: r.finalMatchDate ?? null,
    finalOpponentName: r.finalOpponentName ?? null,
  }));
}

/** Players related on any CSA sheet in the winning campaign (starter or unused bench). */
export async function playerIdsForChampionCampaign(
  season: string,
  competitionId: number,
): Promise<number[]> {
  const rows = await db
    .selectDistinct({ playerId: matchLineupsTable.playerId })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .where(
      and(
        campaignMatchConditions(season, competitionId),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
      ),
    );

  return rows
    .map((r) => r.playerId)
    .filter((id): id is number => id != null);
}

/**
 * Managers credited for a championship title: only the coach of the campaign's
 * last official match (by date). Interims earlier in the season do not get credit.
 */
export async function managerIdsForChampionCampaign(
  season: string,
  competitionId: number,
): Promise<number[]> {
  const [last] = await db
    .select({ managerId: matchesTable.managerId })
    .from(matchesTable)
    .where(
      and(
        campaignMatchConditions(season, competitionId),
        isNotNull(matchesTable.managerId),
      ),
    )
    .orderBy(desc(matchesTable.matchDate), desc(matchesTable.id))
    .limit(1);

  return last?.managerId != null ? [last.managerId] : [];
}

export async function countPlayerTitles(playerId: number): Promise<number> {
  const champions = await db
    .select({
      season: seasonCompetitionStatsTable.season,
      competitionId: seasonCompetitionStatsTable.competitionId,
    })
    .from(seasonCompetitionStatsTable)
    .where(eq(seasonCompetitionStatsTable.isChampion, true));

  if (champions.length === 0) return 0;

  let count = 0;
  for (const c of champions) {
    const [hit] = await db
      .select({ one: sql<number>`1` })
      .from(matchLineupsTable)
      .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
      .where(
        and(
          campaignMatchConditions(c.season, c.competitionId),
          eq(matchLineupsTable.side, "csa"),
          eq(matchLineupsTable.playerId, playerId),
        ),
      )
      .limit(1);
    if (hit) count += 1;
  }
  return count;
}

export async function countManagerTitles(managerId: number): Promise<number> {
  const champions = await listChampionCampaigns();
  if (champions.length === 0) return 0;

  let count = 0;
  for (const c of champions) {
    const ids = await managerIdsForChampionCampaign(c.season, c.competitionId);
    if (ids.includes(managerId)) count += 1;
  }
  return count;
}

export async function listPlayerTitles(
  playerId: number,
): Promise<TitleAward[]> {
  const champions = await listChampionCampaigns();
  const out: TitleAward[] = [];
  for (const c of champions) {
    const [hit] = await db
      .select({ one: sql<number>`1` })
      .from(matchLineupsTable)
      .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
      .where(
        and(
          campaignMatchConditions(c.season, c.competitionId),
          eq(matchLineupsTable.side, "csa"),
          eq(matchLineupsTable.playerId, playerId),
        ),
      )
      .limit(1);
    if (hit) {
      out.push({
        season: c.season,
        competitionId: c.competitionId,
        competitionName: c.competitionName,
      });
    }
  }
  return out;
}

export async function listManagerTitles(
  managerId: number,
): Promise<TitleAward[]> {
  const champions = await listChampionCampaigns();
  const out: TitleAward[] = [];
  for (const c of champions) {
    const ids = await managerIdsForChampionCampaign(c.season, c.competitionId);
    if (ids.includes(managerId)) {
      out.push({
        season: c.season,
        competitionId: c.competitionId,
        competitionName: c.competitionName,
      });
    }
  }
  return out;
}

export type TitleHolderRow = {
  id: number;
  name: string;
  titleCount: number;
};

/** Top players by title count (related on any sheet of champion campaigns). */
export async function topPlayersByTitles(
  limit = 20,
): Promise<TitleHolderRow[]> {
  const champions = await listChampionCampaigns();
  if (champions.length === 0) return [];

  const counts = new Map<number, number>();
  for (const c of champions) {
    const ids = await playerIdsForChampionCampaign(c.season, c.competitionId);
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const top = sorted.slice(0, limit);
  if (top.length === 0) return [];

  const players = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable)
    .where(
      inArray(
        playersTable.id,
        top.map(([id]) => id),
      ),
    );
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  return top.map(([id, titleCount]) => ({
    id,
    name: nameById.get(id) ?? `#${id}`,
    titleCount,
  }));
}

export async function topManagersByTitles(
  limit = 20,
): Promise<TitleHolderRow[]> {
  const champions = await listChampionCampaigns();
  if (champions.length === 0) return [];

  const counts = new Map<number, number>();
  for (const c of champions) {
    const ids = await managerIdsForChampionCampaign(c.season, c.competitionId);
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const top = sorted.slice(0, limit);
  if (top.length === 0) return [];

  const managers = await db
    .select({ id: managersTable.id, name: managersTable.name })
    .from(managersTable)
    .where(
      inArray(
        managersTable.id,
        top.map(([id]) => id),
      ),
    );
  const nameById = new Map(managers.map((m) => [m.id, m.name]));

  return top.map(([id, titleCount]) => ({
    id,
    name: nameById.get(id) ?? `#${id}`,
    titleCount,
  }));
}
