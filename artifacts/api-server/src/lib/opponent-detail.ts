import { db } from "@workspace/db";
import {
  matchesTable,
  competitionsTable,
  matchLineupsTable,
  matchGoalsTable,
  managersTable,
  playersTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

export interface OpponentHighlightEntry {
  id: number;
  name: string;
  value: number;
}

export interface OpponentHighlights {
  topScorer: OpponentHighlightEntry | null;
  mostAppearances: OpponentHighlightEntry | null;
  topAssists: OpponentHighlightEntry | null;
  managerMostMatches: OpponentHighlightEntry | null;
  managerMostWins: OpponentHighlightEntry | null;
}

export interface OpponentCompetitionStat {
  competitionId: number;
  competitionName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

function mapHighlight(
  row: { id: number; name: string; value: number | null } | undefined,
): OpponentHighlightEntry | null {
  if (!row?.id || row.value == null || row.value <= 0) return null;
  return { id: row.id, name: row.name, value: row.value };
}

async function getFichaMatchIds(opponentId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ id: matchesTable.id })
    .from(matchesTable)
    .innerJoin(
      matchLineupsTable,
      and(
        eq(matchLineupsTable.matchId, matchesTable.id),
        eq(matchLineupsTable.side, "csa"),
      ),
    )
    .where(
      and(eq(matchesTable.opponentId, opponentId), eq(matchesTable.isFriendly, false)),
    );
  return rows.map((r) => r.id);
}

export async function getOpponentCompetitionStats(
  opponentId: number,
): Promise<OpponentCompetitionStat[]> {
  const rows = await db
    .select({
      competitionId: competitionsTable.id,
      competitionName: competitionsTable.name,
      matches: sql<number>`cast(count(*) as int)`,
      wins: sql<number>`cast(sum(case when ${matchesTable.result} = 'win' then 1 else 0 end) as int)`,
      draws: sql<number>`cast(sum(case when ${matchesTable.result} = 'draw' then 1 else 0 end) as int)`,
      losses: sql<number>`cast(sum(case when ${matchesTable.result} = 'loss' then 1 else 0 end) as int)`,
      goalsFor: sql<number>`cast(sum(${matchesTable.goalsFor}) as int)`,
      goalsAgainst: sql<number>`cast(sum(${matchesTable.goalsAgainst}) as int)`,
    })
    .from(matchesTable)
    .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
    .where(and(eq(matchesTable.opponentId, opponentId), eq(matchesTable.isFriendly, false)))
    .groupBy(competitionsTable.id, competitionsTable.name)
    .orderBy(desc(sql`count(*)`), asc(competitionsTable.name));

  return rows.map((r) => ({
    competitionId: r.competitionId,
    competitionName: r.competitionName,
    matches: r.matches ?? 0,
    wins: r.wins ?? 0,
    draws: r.draws ?? 0,
    losses: r.losses ?? 0,
    goalsFor: r.goalsFor ?? 0,
    goalsAgainst: r.goalsAgainst ?? 0,
  }));
}

export async function getOpponentHighlights(
  opponentId: number,
): Promise<OpponentHighlights | null> {
  const fichaMatchIds = await getFichaMatchIds(opponentId);
  if (fichaMatchIds.length === 0) return null;

  const [
    topScorerRows,
    mostAppearancesRows,
    topAssistsRows,
    managerMostMatchesRows,
    managerMostWinsRows,
  ] = await Promise.all([
    db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        value: sql<number>`cast(count(*) as int)`,
      })
      .from(matchGoalsTable)
      .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
      .where(
        and(
          inArray(matchGoalsTable.matchId, fichaMatchIds),
          eq(matchGoalsTable.side, "csa"),
          isNotNull(matchGoalsTable.scorerPlayerId),
        ),
      )
      .groupBy(playersTable.id, playersTable.name)
      .orderBy(desc(sql`count(*)`), asc(playersTable.name))
      .limit(1),

    db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        value: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
      })
      .from(matchLineupsTable)
      .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
      .where(
        and(
          inArray(matchLineupsTable.matchId, fichaMatchIds),
          eq(matchLineupsTable.side, "csa"),
          isNotNull(matchLineupsTable.playerId),
        ),
      )
      .groupBy(playersTable.id, playersTable.name)
      .orderBy(desc(sql`count(distinct ${matchLineupsTable.matchId})`), asc(playersTable.name))
      .limit(1),

    db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        value: sql<number>`cast(count(*) as int)`,
      })
      .from(matchGoalsTable)
      .innerJoin(playersTable, eq(matchGoalsTable.assistPlayerId, playersTable.id))
      .where(
        and(
          inArray(matchGoalsTable.matchId, fichaMatchIds),
          eq(matchGoalsTable.side, "csa"),
          isNotNull(matchGoalsTable.assistPlayerId),
        ),
      )
      .groupBy(playersTable.id, playersTable.name)
      .orderBy(desc(sql`count(*)`), asc(playersTable.name))
      .limit(1),

    db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        value: sql<number>`cast(count(*) as int)`,
      })
      .from(matchesTable)
      .innerJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .where(
        and(inArray(matchesTable.id, fichaMatchIds), isNotNull(matchesTable.managerId)),
      )
      .groupBy(managersTable.id, managersTable.name)
      .orderBy(desc(sql`count(*)`), asc(managersTable.name))
      .limit(1),

    db
      .select({
        id: managersTable.id,
        name: managersTable.name,
        value: sql<number>`cast(count(*) as int)`,
      })
      .from(matchesTable)
      .innerJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
      .where(
        and(
          inArray(matchesTable.id, fichaMatchIds),
          eq(matchesTable.result, "win"),
          isNotNull(matchesTable.managerId),
        ),
      )
      .groupBy(managersTable.id, managersTable.name)
      .orderBy(desc(sql`count(*)`), asc(managersTable.name))
      .limit(1),
  ]);

  return {
    topScorer: mapHighlight(topScorerRows[0]),
    mostAppearances: mapHighlight(mostAppearancesRows[0]),
    topAssists: mapHighlight(topAssistsRows[0]),
    managerMostMatches: mapHighlight(managerMostMatchesRows[0]),
    managerMostWins: mapHighlight(managerMostWinsRows[0]),
  };
}
