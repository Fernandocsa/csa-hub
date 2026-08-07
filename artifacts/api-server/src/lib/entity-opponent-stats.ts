import { db } from "@workspace/db";
import {
  matchesTable,
  matchLineupsTable,
  matchGoalsTable,
  opponentsTable,
} from "@workspace/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { officialPlayedMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";

export type OpponentCountRow = {
  opponentId: number;
  opponentName: string;
  logoUrl: string | null;
  value: number;
};

function mapRows(
  rows: {
    opponentId: number;
    opponentName: string;
    logoUrl: string | null;
    value: number;
  }[],
): OpponentCountRow[] {
  return rows.map((r) => ({
    opponentId: r.opponentId,
    opponentName: r.opponentName,
    logoUrl: r.logoUrl ?? null,
    value: Number(r.value) || 0,
  }));
}

/** Opponents a player actually faced most often (starter or sub who entered). */
export async function playerMostFacedOpponents(
  playerId: number,
  limit = 5,
): Promise<OpponentCountRow[]> {
  const rows = await db
    .select({
      opponentId: opponentsTable.id,
      opponentName: opponentsTable.name,
      logoUrl: opponentsTable.logoUrl,
      value: sql<number>`cast(count(distinct ${matchesTable.id}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .where(
      and(
        eq(matchLineupsTable.playerId, playerId),
        eq(matchLineupsTable.side, "csa"),
        officialPlayedMatchConditions(),
        csaLineupActuallyPlayedCondition(),
      ),
    )
    .groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl)
    .orderBy(
      desc(sql`count(distinct ${matchesTable.id})`),
      asc(opponentsTable.name),
    )
    .limit(limit);

  return mapRows(rows);
}

/** Opponents a player scored most CSA goals against (own goals excluded). */
export async function playerMostGoalsVsOpponents(
  playerId: number,
  limit = 5,
): Promise<OpponentCountRow[]> {
  const rows = await db
    .select({
      opponentId: opponentsTable.id,
      opponentName: opponentsTable.name,
      logoUrl: opponentsTable.logoUrl,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .where(
      and(
        eq(matchGoalsTable.scorerPlayerId, playerId),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl)
    .orderBy(desc(sql`count(*)`), asc(opponentsTable.name))
    .limit(limit);

  return mapRows(rows);
}

/** Opponents a manager faced most often. */
export async function managerMostFacedOpponents(
  managerId: number,
  limit = 5,
): Promise<OpponentCountRow[]> {
  const rows = await db
    .select({
      opponentId: opponentsTable.id,
      opponentName: opponentsTable.name,
      logoUrl: opponentsTable.logoUrl,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .where(
      and(
        eq(matchesTable.managerId, managerId),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl)
    .orderBy(desc(sql`count(*)`), asc(opponentsTable.name))
    .limit(limit);

  return mapRows(rows);
}

/** Opponents a manager beat most often. */
export async function managerMostWinsVsOpponents(
  managerId: number,
  limit = 5,
): Promise<OpponentCountRow[]> {
  const rows = await db
    .select({
      opponentId: opponentsTable.id,
      opponentName: opponentsTable.name,
      logoUrl: opponentsTable.logoUrl,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .where(
      and(
        eq(matchesTable.managerId, managerId),
        eq(matchesTable.result, "win"),
        officialPlayedMatchConditions(),
      ),
    )
    .groupBy(opponentsTable.id, opponentsTable.name, opponentsTable.logoUrl)
    .orderBy(desc(sql`count(*)`), asc(opponentsTable.name))
    .limit(limit);

  return mapRows(rows);
}
