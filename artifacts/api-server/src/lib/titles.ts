import { db } from "@workspace/db";
import {
  seasonCompetitionStatsTable,
  competitionsTable,
  matchesTable,
  matchLineupsTable,
  playersTable,
  opponentsTable,
} from "@workspace/db";
import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
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
  const titleCountExpr = sql<number>`cast(count(distinct (${matchesTable.season} || ':' || ${matchesTable.competitionId}::text)) as int)`;
  const rows = await db
    .select({
      id: matchLineupsTable.playerId,
      name: playersTable.name,
      titleCount: titleCountExpr,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(
      seasonCompetitionStatsTable,
      and(
        eq(seasonCompetitionStatsTable.season, matchesTable.season),
        eq(
          seasonCompetitionStatsTable.competitionId,
          matchesTable.competitionId,
        ),
        eq(seasonCompetitionStatsTable.isChampion, true),
      ),
    )
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(
      and(
        officialPlayedMatchConditions(),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
      ),
    )
    .groupBy(matchLineupsTable.playerId, playersTable.name)
    .orderBy(desc(titleCountExpr), asc(playersTable.name))
    .limit(limit);

  return rows
    .filter((r): r is typeof r & { id: number } => r.id != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      titleCount: Number(r.titleCount),
    }));
}

export async function topManagersByTitles(
  limit = 20,
): Promise<TitleHolderRow[]> {
  const result = await db.execute(sql`
    WITH last_matches AS (
      SELECT DISTINCT ON (m.season, m.competition_id)
        m.manager_id AS manager_id
      FROM matches m
      INNER JOIN season_competition_stats scs
        ON scs.season = m.season
        AND scs.competition_id = m.competition_id
        AND scs.is_champion = true
      WHERE m.is_friendly = false
        AND m.status <> 'scheduled'
        AND m.result <> 'unknown'
        AND m.manager_id IS NOT NULL
      ORDER BY m.season, m.competition_id, m.match_date DESC, m.id DESC
    )
    SELECT mgr.id, mgr.name, count(*)::int AS title_count
    FROM last_matches lm
    INNER JOIN managers mgr ON mgr.id = lm.manager_id
    GROUP BY mgr.id, mgr.name
    ORDER BY title_count DESC, mgr.name ASC
    LIMIT ${limit}
  `);

  return (result.rows as Array<{ id: number; name: string; title_count: number }>).map(
    (r) => ({
      id: Number(r.id),
      name: r.name,
      titleCount: Number(r.title_count),
    }),
  );
}
