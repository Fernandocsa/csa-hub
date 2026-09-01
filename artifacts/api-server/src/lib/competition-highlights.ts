import { db } from "@workspace/db";
import {
  matchesTable,
  matchLineupsTable,
  matchGoalsTable,
  managersTable,
  playersTable,
} from "@workspace/db";
import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { officialPlayedMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";
import { competitionIdIn } from "./competition-families";

export type CompetitionHighlightEntry = {
  id: number;
  name: string;
  value: number;
};

export type CompetitionHighlights = {
  mostAppearances: CompetitionHighlightEntry | null;
  topScorer: CompetitionHighlightEntry | null;
  managerMostMatches: CompetitionHighlightEntry | null;
  managerMostWins: CompetitionHighlightEntry | null;
};

function mapHighlight(
  row: { id: number; name: string; value: number | null } | undefined,
): CompetitionHighlightEntry | null {
  if (!row?.id || row.value == null || row.value <= 0) return null;
  return { id: row.id, name: row.name, value: row.value };
}

/** Career highlights for CSA in one competition or a family of equivalent formats. */
export async function getCompetitionHighlights(
  competitionIds: number | number[],
): Promise<CompetitionHighlights> {
  const ids = Array.isArray(competitionIds) ? competitionIds : [competitionIds];
  const competitionMatch = and(
    competitionIdIn(ids),
    officialPlayedMatchConditions(),
  );

  const [
    mostAppearancesRows,
    topScorerRows,
    managerMostMatchesRows,
    managerMostWinsRows,
  ] = await Promise.all([
    db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        value: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
      })
      .from(matchLineupsTable)
      .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
      .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
      .where(
        and(
          competitionMatch,
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
      .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
      .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
      .where(
        and(
          competitionMatch,
          eq(matchGoalsTable.side, "csa"),
          isNotNull(matchGoalsTable.scorerPlayerId),
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
      .where(and(competitionMatch, isNotNull(matchesTable.managerId)))
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
          competitionMatch,
          eq(matchesTable.result, "win"),
          isNotNull(matchesTable.managerId),
        ),
      )
      .groupBy(managersTable.id, managersTable.name)
      .orderBy(desc(sql`count(*)`), asc(managersTable.name))
      .limit(1),
  ]);

  return {
    mostAppearances: mapHighlight(mostAppearancesRows[0]),
    topScorer: mapHighlight(topScorerRows[0]),
    managerMostMatches: mapHighlight(managerMostMatchesRows[0]),
    managerMostWins: mapHighlight(managerMostWinsRows[0]),
  };
}
