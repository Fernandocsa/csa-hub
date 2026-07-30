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
import { officialPlayedMatchConditions, scoredFieldMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";

export interface OpponentHighlightEntry {
  id: number;
  name: string;
  value: number;
}

/** Biggest win/defeat vs an opponent (field matches only). */
export interface OpponentMarginMatch {
  matchId: number;
  date: string;
  goalsFor: number;
  goalsAgainst: number;
  competition: string;
  season: string;
  /** How many matches tie on primary+secondary criteria (includes the one shown). */
  tiedCount: number;
}

export interface OpponentRepeatedScoreline {
  goalsFor: number;
  goalsAgainst: number;
  count: number;
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
      and(eq(matchesTable.opponentId, opponentId), officialPlayedMatchConditions()),
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
    .where(and(eq(matchesTable.opponentId, opponentId), officialPlayedMatchConditions()))
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
          csaLineupActuallyPlayedCondition(),
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

async function getOpponentMarginMatch(
  opponentId: number,
  kind: "victory" | "defeat",
): Promise<OpponentMarginMatch | null> {
  const isVictory = kind === "victory";
  const result = isVictory ? "win" : "loss";
  const orderBy = isVictory
    ? sql`${matchesTable.goalsFor} desc, (${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) desc, ${matchesTable.matchDate} desc`
    : sql`${matchesTable.goalsAgainst} desc, (${matchesTable.goalsAgainst} - ${matchesTable.goalsFor}) desc, ${matchesTable.matchDate} desc`;

  const rows = await db
    .select({
      matchId: matchesTable.id,
      date: matchesTable.matchDate,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      competition: competitionsTable.name,
      season: matchesTable.season,
    })
    .from(matchesTable)
    .innerJoin(competitionsTable, eq(matchesTable.competitionId, competitionsTable.id))
    .where(
      and(
        eq(matchesTable.opponentId, opponentId),
        eq(matchesTable.result, result),
        scoredFieldMatchConditions(),
      ),
    )
    .orderBy(orderBy)
    .limit(1);

  const top = rows[0];
  if (!top || top.goalsFor == null || top.goalsAgainst == null) return null;

  const tieKey = isVictory
    ? and(
        eq(matchesTable.goalsFor, top.goalsFor),
        sql`(${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) = ${top.goalsFor - top.goalsAgainst}`,
      )
    : and(
        eq(matchesTable.goalsAgainst, top.goalsAgainst),
        sql`(${matchesTable.goalsAgainst} - ${matchesTable.goalsFor}) = ${top.goalsAgainst - top.goalsFor}`,
      );

  const tiedRows = await db
    .select({ n: sql<number>`cast(count(*) as int)` })
    .from(matchesTable)
    .where(
      and(
        eq(matchesTable.opponentId, opponentId),
        eq(matchesTable.result, result),
        scoredFieldMatchConditions(),
        tieKey,
      ),
    );

  return {
    matchId: top.matchId,
    date: top.date,
    goalsFor: top.goalsFor,
    goalsAgainst: top.goalsAgainst,
    competition: top.competition,
    season: top.season,
    tiedCount: tiedRows[0]?.n ?? 1,
  };
}

export function getOpponentBiggestVictory(
  opponentId: number,
): Promise<OpponentMarginMatch | null> {
  return getOpponentMarginMatch(opponentId, "victory");
}

export function getOpponentBiggestDefeat(
  opponentId: number,
): Promise<OpponentMarginMatch | null> {
  return getOpponentMarginMatch(opponentId, "defeat");
}

export async function getOpponentMostRepeatedScorelines(
  opponentId: number,
): Promise<OpponentRepeatedScoreline[]> {
  const rows = await db
    .select({
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .where(and(eq(matchesTable.opponentId, opponentId), scoredFieldMatchConditions()))
    .groupBy(matchesTable.goalsFor, matchesTable.goalsAgainst)
    .orderBy(
      desc(sql`count(*)`),
      desc(matchesTable.goalsFor),
      asc(matchesTable.goalsAgainst),
    );

  if (rows.length === 0 || rows[0].count == null) return [];
  const max = rows[0].count;
  return rows
    .filter((r) => r.count === max && r.goalsFor != null && r.goalsAgainst != null)
    .map((r) => ({
      goalsFor: r.goalsFor!,
      goalsAgainst: r.goalsAgainst!,
      count: r.count!,
    }));
}
