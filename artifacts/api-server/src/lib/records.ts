import { db } from "@workspace/db";
import {
  matchesTable,
  matchGoalsTable,
  matchCardsTable,
  matchLineupsTable,
  matchPenaltyEventsTable,
  playersTable,
  managersTable,
  opponentsTable,
  competitionsTable,
} from "@workspace/db";
import { and, asc, desc, eq, or, sql, isNotNull, inArray } from "drizzle-orm";
import { recordsMatchConditions, scoredFieldMatchConditions } from "./match-filters";
import {
  csaLineupActuallyPlayedCondition,
  csaLineupCameOnAsSubCondition,
  csaLineupUnusedBenchCondition,
} from "./player-appeared";
import {
  topManagersByTitles,
  topPlayersByTitles,
} from "./titles";
import {
  eventMinuteSortKey,
  formatEventMinuteLabel,
  isExtraTimeEventMinute,
  isSecondHalfStoppageMinute,
  isUnknownEventMinute,
} from "./event-minute";

/** Starting CSA goalkeeper: lineup position or player profile marked as Goleiro. */
function csaStartingGoalkeeperCondition() {
  return and(
    eq(matchLineupsTable.side, "csa"),
    eq(matchLineupsTable.role, "starter"),
    isNotNull(matchLineupsTable.playerId),
    or(
      eq(matchLineupsTable.position, "Goleiro"),
      eq(playersTable.position, "Goleiro"),
    ),
  );
}

export type PlayerRecordHolder = {
  playerId: number;
  playerName: string;
  value: number;
  /** Optional context (e.g. starts as GK alongside clean sheets). */
  appearances?: number;
};

/** Ranking of players by number of matches with exactly `goalsInMatch` CSA goals. */
export type MultiGoalHaulBucket = {
  goalsInMatch: number;
  players: PlayerRecordHolder[];
};

export type ManagerRecordHolder = {
  managerId: number;
  managerName: string;
  value: number;
};

export type MatchRecordHolder = {
  matchId: number;
  matchDate: string;
  season: string;
  opponentName: string;
  competitionName: string;
  goalsFor: number;
  goalsAgainst: number;
  margin: number;
  result: string;
};

export type StreakRecord = {
  length: number;
  startDate: string | null;
  endDate: string | null;
  startMatchId: number | null;
  endMatchId: number | null;
};

export type PlayerStreakRecord = StreakRecord & {
  playerId: number;
  playerName: string;
};

export type ManagerStreakRecord = StreakRecord & {
  managerId: number;
  managerName: string;
};

/** Single CSA goal timed for fastest / latest (90+) rankings. */
export type TimedGoalRecord = {
  goalId: number;
  playerId: number | null;
  playerName: string;
  minute: number;
  injuryTimeMinute: number | null;
  minuteLabel: string;
  matchId: number;
  matchDate: string;
  season: string;
  opponentName: string;
  competitionName: string;
};

type MatchRow = {
  id: number;
  matchDate: string;
  season: string;
  result: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  opponentName: string;
  competitionName: string;
  managerId: number | null;
};

async function loadRecordsMatches(): Promise<MatchRow[]> {
  return db
    .select({
      id: matchesTable.id,
      matchDate: matchesTable.matchDate,
      season: matchesTable.season,
      result: matchesTable.result,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      opponentName: opponentsTable.name,
      competitionName: competitionsTable.name,
      managerId: matchesTable.managerId,
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .innerJoin(
      competitionsTable,
      eq(matchesTable.competitionId, competitionsTable.id),
    )
    .where(recordsMatchConditions())
    .orderBy(asc(matchesTable.matchDate), asc(matchesTable.id));
}

function bestTeamStreak(
  matches: MatchRow[],
  continues: (m: MatchRow) => boolean,
): { historical: StreakRecord; active: StreakRecord } {
  let best: StreakRecord = {
    length: 0,
    startDate: null,
    endDate: null,
    startMatchId: null,
    endMatchId: null,
  };
  let curLen = 0;
  let curStart: MatchRow | null = null;
  let curEnd: MatchRow | null = null;

  const commit = () => {
    if (curLen > best.length && curStart && curEnd) {
      best = {
        length: curLen,
        startDate: curStart.matchDate,
        endDate: curEnd.matchDate,
        startMatchId: curStart.id,
        endMatchId: curEnd.id,
      };
    }
  };

  for (const m of matches) {
    if (continues(m)) {
      if (curLen === 0) curStart = m;
      curLen += 1;
      curEnd = m;
    } else {
      commit();
      curLen = 0;
      curStart = null;
      curEnd = null;
    }
  }
  commit();

  const active: StreakRecord =
    curLen > 0 && curStart && curEnd
      ? {
          length: curLen,
          startDate: curStart.matchDate,
          endDate: curEnd.matchDate,
          startMatchId: curStart.id,
          endMatchId: curEnd.id,
        }
      : {
          length: 0,
          startDate: null,
          endDate: null,
          startMatchId: null,
          endMatchId: null,
        };

  return { historical: best, active };
}

async function topScorers(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchGoalsTable.scorerPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        isNotNull(matchGoalsTable.scorerPlayerId),
      ),
    )
    .groupBy(matchGoalsTable.scorerPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

async function topAssists(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchGoalsTable.assistPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchGoalsTable.assistPlayerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        isNotNull(matchGoalsTable.assistPlayerId),
      ),
    )
    .groupBy(matchGoalsTable.assistPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

async function topAppearances(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchLineupsTable.playerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
        csaLineupActuallyPlayedCondition(),
      ),
    )
    .groupBy(matchLineupsTable.playerId, playersTable.name)
    .orderBy(desc(sql`count(distinct ${matchLineupsTable.matchId})`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

async function topPenaltyGoals(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchGoalsTable.scorerPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        eq(matchGoalsTable.isPenalty, true),
        isNotNull(matchGoalsTable.scorerPlayerId),
      ),
    )
    .groupBy(matchGoalsTable.scorerPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/** CSA players who scored into their own net (GPD). */
async function topOwnGoals(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchGoalsTable.scorerPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.isOwnGoal, true),
        eq(matchGoalsTable.ownGoalDirection, "against"),
        isNotNull(matchGoalsTable.scorerPlayerId),
      ),
    )
    .groupBy(matchGoalsTable.scorerPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/** Matches as CSA captain (matches.captain_player_id). */
async function topCaptainAppearances(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchesTable.captainPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .innerJoin(playersTable, eq(matchesTable.captainPlayerId, playersTable.id))
    .where(
      and(recordsMatchConditions(), isNotNull(matchesTable.captainPlayerId)),
    )
    .groupBy(matchesTable.captainPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/** Missed / saved penalties from match_penalty_events — never goals. */
async function topPenaltyEvents(
  eventType: "missed" | "saved",
  limit = 10,
): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchPenaltyEventsTable.playerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchPenaltyEventsTable)
    .innerJoin(matchesTable, eq(matchPenaltyEventsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchPenaltyEventsTable.playerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchPenaltyEventsTable.side, "csa"),
        eq(matchPenaltyEventsTable.eventType, eventType),
        isNotNull(matchPenaltyEventsTable.playerId),
      ),
    )
    .groupBy(matchPenaltyEventsTable.playerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

async function topFreeKickGoals(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchGoalsTable.scorerPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        eq(matchGoalsTable.isFreeKick, true),
        isNotNull(matchGoalsTable.scorerPlayerId),
      ),
    )
    .groupBy(matchGoalsTable.scorerPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/**
 * Rankings of players by how many matches they scored exactly N goals in
 * (N = 3 hat-trick, 4 poker, 5+, …). Only buckets with at least one haul are returned.
 */
async function multiGoalHaulsByCount(limit = 10): Promise<MultiGoalHaulBucket[]> {
  const perMatch = await db
    .select({
      playerId: matchGoalsTable.scorerPlayerId,
      matchId: matchGoalsTable.matchId,
      goals: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        isNotNull(matchGoalsTable.scorerPlayerId),
      ),
    )
    .groupBy(matchGoalsTable.scorerPlayerId, matchGoalsTable.matchId)
    .having(sql`count(*) >= 3`);

  /** goalsInMatch → playerId → haul count */
  const byGoals = new Map<number, Map<number, number>>();
  for (const row of perMatch) {
    if (row.playerId == null) continue;
    const g = Number(row.goals);
    let playerCounts = byGoals.get(g);
    if (!playerCounts) {
      playerCounts = new Map();
      byGoals.set(g, playerCounts);
    }
    playerCounts.set(row.playerId, (playerCounts.get(row.playerId) ?? 0) + 1);
  }

  const goalLevels = [...byGoals.keys()].sort((a, b) => a - b);
  if (goalLevels.length === 0) return [];

  const allPlayerIds = [
    ...new Set(
      [...byGoals.values()].flatMap((m) => [...m.keys()]),
    ),
  ];
  const players = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable)
    .where(inArray(playersTable.id, allPlayerIds));
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  return goalLevels.map((goalsInMatch) => {
    const counts = byGoals.get(goalsInMatch)!;
    const ranked = [...counts.entries()]
      .map(([playerId, value]) => ({
        playerId,
        playerName: nameById.get(playerId) ?? `#${playerId}`,
        value,
      }))
      .sort(
        (a, b) =>
          b.value - a.value || a.playerName.localeCompare(b.playerName),
      )
      .slice(0, limit);
    return { goalsInMatch, players: ranked };
  });
}

async function topCards(
  cardType: "yellow" | "red",
  limit = 10,
): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchCardsTable.playerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchCardsTable)
    .innerJoin(matchesTable, eq(matchCardsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchCardsTable.playerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchCardsTable.side, "csa"),
        eq(matchCardsTable.cardType, cardType),
        isNotNull(matchCardsTable.playerId),
      ),
    )
    .groupBy(matchCardsTable.playerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

async function topPlayerWins(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchLineupsTable.playerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchesTable.result, "win"),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
        csaLineupActuallyPlayedCondition(),
      ),
    )
    .groupBy(matchLineupsTable.playerId, playersTable.name)
    .orderBy(desc(sql`count(distinct ${matchLineupsTable.matchId})`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/** Goals scored in matches where the player entered from the bench (not starter). */
async function topGoalsAsSubstitute(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchGoalsTable.scorerPlayerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
    .innerJoin(
      matchLineupsTable,
      and(
        eq(matchLineupsTable.matchId, matchGoalsTable.matchId),
        eq(matchLineupsTable.playerId, matchGoalsTable.scorerPlayerId),
        eq(matchLineupsTable.side, "csa"),
      ),
    )
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        isNotNull(matchGoalsTable.scorerPlayerId),
        csaLineupCameOnAsSubCondition(),
      ),
    )
    .groupBy(matchGoalsTable.scorerPlayerId, playersTable.name)
    .orderBy(desc(sql`count(*)`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/** Matches where the player came on as substitute (bench + entered, never started). */
async function topAppearancesAsSubstitute(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchLineupsTable.playerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
        csaLineupCameOnAsSubCondition(),
      ),
    )
    .groupBy(matchLineupsTable.playerId, playersTable.name)
    .orderBy(desc(sql`count(distinct ${matchLineupsTable.matchId})`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

/** Matches where the player was named on the bench and never entered. */
async function topUnusedBenchAppearances(
  limit = 10,
  season?: string,
): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchLineupsTable.playerId,
      playerName: playersTable.name,
      value: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
        csaLineupUnusedBenchCondition(),
        ...(season ? [eq(matchesTable.season, season)] : []),
      ),
    )
    .groupBy(matchLineupsTable.playerId, playersTable.name)
    .orderBy(desc(sql`count(distinct ${matchLineupsTable.matchId})`), asc(playersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
  }));
}

async function latestRecordsSeason(): Promise<string | null> {
  const rows = await db
    .select({ season: matchesTable.season })
    .from(matchesTable)
    .where(recordsMatchConditions())
    .orderBy(desc(matchesTable.matchDate), desc(matchesTable.id))
    .limit(1);
  return rows[0]?.season ?? null;
}

async function topManagerWins(limit = 10): Promise<ManagerRecordHolder[]> {
  const rows = await db
    .select({
      managerId: matchesTable.managerId,
      managerName: managersTable.name,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(matchesTable)
    .innerJoin(managersTable, eq(matchesTable.managerId, managersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchesTable.result, "win"),
        isNotNull(matchesTable.managerId),
      ),
    )
    .groupBy(matchesTable.managerId, managersTable.name)
    .orderBy(desc(sql`count(*)`), asc(managersTable.name))
    .limit(limit);

  return rows.map((r) => ({
    managerId: r.managerId!,
    managerName: r.managerName,
    value: r.value,
  }));
}

async function biggestWins(limit = 10): Promise<MatchRecordHolder[]> {
  const rows = await db
    .select({
      matchId: matchesTable.id,
      matchDate: matchesTable.matchDate,
      season: matchesTable.season,
      opponentName: opponentsTable.name,
      competitionName: competitionsTable.name,
      goalsFor: matchesTable.goalsFor,
      goalsAgainst: matchesTable.goalsAgainst,
      result: matchesTable.result,
      margin: sql<number>`cast((${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}) as int)`,
    })
    .from(matchesTable)
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .innerJoin(
      competitionsTable,
      eq(matchesTable.competitionId, competitionsTable.id),
    )
    .where(
      and(
        scoredFieldMatchConditions(),
        eq(matchesTable.result, "win"),
      ),
    )
    .orderBy(
      desc(sql`${matchesTable.goalsFor} - ${matchesTable.goalsAgainst}`),
      desc(matchesTable.goalsFor),
      asc(matchesTable.matchDate),
    )
    .limit(limit);

  return rows.map((r) => ({
    matchId: r.matchId,
    matchDate: r.matchDate,
    season: r.season,
    opponentName: r.opponentName,
    competitionName: r.competitionName,
    goalsFor: r.goalsFor ?? 0,
    goalsAgainst: r.goalsAgainst ?? 0,
    margin: r.margin,
    result: r.result,
  }));
}

/**
 * Goalkeepers ranked by total clean sheets as starter.
 * `value` = matches without conceding; `appearances` = starts as GK.
 */
async function topCleanSheets(limit = 10): Promise<PlayerRecordHolder[]> {
  const rows = await db
    .select({
      playerId: matchLineupsTable.playerId,
      playerName: playersTable.name,
      appearances: sql<number>`cast(count(distinct ${matchLineupsTable.matchId}) as int)`,
      value: sql<number>`cast(count(distinct case when ${matchesTable.goalsAgainst} = 0 then ${matchLineupsTable.matchId} end) as int)`,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(and(recordsMatchConditions(), csaStartingGoalkeeperCondition()))
    .groupBy(matchLineupsTable.playerId, playersTable.name)
    .having(
      sql`count(distinct case when ${matchesTable.goalsAgainst} = 0 then ${matchLineupsTable.matchId} end) > 0`,
    )
    .orderBy(
      desc(
        sql`count(distinct case when ${matchesTable.goalsAgainst} = 0 then ${matchLineupsTable.matchId} end)`,
      ),
      desc(sql`count(distinct ${matchLineupsTable.matchId})`),
      asc(playersTable.name),
    )
    .limit(limit);

  return rows.map((r) => ({
    playerId: r.playerId!,
    playerName: r.playerName,
    value: r.value,
    appearances: r.appearances,
  }));
}

/**
 * Consecutive clean sheets for starting goalkeepers across the club calendar.
 * Missing a match, not starting as GK, or conceding breaks the streak.
 */
async function goalkeeperCleanSheetStreaks(matches: MatchRow[]): Promise<{
  historical: PlayerStreakRecord[];
  active: PlayerStreakRecord[];
}> {
  if (matches.length === 0) {
    return { historical: [], active: [] };
  }

  const gkStarters = await db
    .select({
      matchId: matchLineupsTable.matchId,
      playerId: matchLineupsTable.playerId,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
    .where(and(recordsMatchConditions(), csaStartingGoalkeeperCondition()));

  const cleanSheetMatchIds = new Set(
    matches
      .filter((m) => m.goalsAgainst != null && m.goalsAgainst === 0)
      .map((m) => m.id),
  );
  const presence = gkStarters.filter((s) => cleanSheetMatchIds.has(s.matchId));
  return consecutivePlayerCalendarStreaks(matches, presence);
}

/**
 * Consecutive starts across the club's official match calendar.
 * Missing a match or not starting breaks the streak.
 */
async function consecutiveStartsRecords(matches: MatchRow[]): Promise<{
  historical: PlayerStreakRecord[];
  active: PlayerStreakRecord[];
}> {
  if (matches.length === 0) {
    return { historical: [], active: [] };
  }

  const starters = await db
    .select({
      matchId: matchLineupsTable.matchId,
      playerId: matchLineupsTable.playerId,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchLineupsTable.side, "csa"),
        eq(matchLineupsTable.role, "starter"),
        isNotNull(matchLineupsTable.playerId),
      ),
    );

  return consecutivePlayerCalendarStreaks(matches, starters);
}

/**
 * Consecutive official club-calendar matches in which a player is present
 * in `presenceRows`. Missing a match or a match without the event breaks the streak.
 * Historical ranking is by streak (a player may appear more than once).
 */
async function consecutivePlayerCalendarStreaks(
  matches: MatchRow[],
  presenceRows: Array<{ matchId: number; playerId: number | null }>,
): Promise<{ historical: PlayerStreakRecord[]; active: PlayerStreakRecord[] }> {
  if (matches.length === 0) {
    return { historical: [], active: [] };
  }

  const presentByMatch = new Map<number, Set<number>>();
  const allPlayerIds = new Set<number>();
  for (const row of presenceRows) {
    if (row.playerId == null) continue;
    allPlayerIds.add(row.playerId);
    let set = presentByMatch.get(row.matchId);
    if (!set) {
      set = new Set();
      presentByMatch.set(row.matchId, set);
    }
    set.add(row.playerId);
  }

  if (allPlayerIds.size === 0) return { historical: [], active: [] };

  type Closed = { len: number; start: MatchRow; end: MatchRow };
  type Acc = {
    closed: Closed[];
    curLen: number;
    curStart: MatchRow | null;
    curEnd: MatchRow | null;
  };
  const acc = new Map<number, Acc>();
  for (const id of allPlayerIds) {
    acc.set(id, {
      closed: [],
      curLen: 0,
      curStart: null,
      curEnd: null,
    });
  }

  const empty = new Set<number>();
  const currentlyActive = new Set<number>();

  function closeStreak(a: Acc) {
    if (a.curLen > 0 && a.curStart && a.curEnd) {
      a.closed.push({ len: a.curLen, start: a.curStart, end: a.curEnd });
    }
    a.curLen = 0;
    a.curStart = null;
    a.curEnd = null;
  }

  for (const m of matches) {
    const present = presentByMatch.get(m.id) ?? empty;
    if (currentlyActive.size) {
      for (const playerId of [...currentlyActive]) {
        if (!present.has(playerId)) {
          currentlyActive.delete(playerId);
          closeStreak(acc.get(playerId)!);
        }
      }
    }
    for (const playerId of present) {
      const a = acc.get(playerId)!;
      if (a.curLen === 0) a.curStart = m;
      a.curLen += 1;
      a.curEnd = m;
      currentlyActive.add(playerId);
    }
  }

  const toRecord = (
    playerId: number,
    s: Closed,
  ): PlayerStreakRecord => ({
    playerId,
    playerName: `#${playerId}`,
    length: s.len,
    startDate: s.start.matchDate,
    endDate: s.end.matchDate,
    startMatchId: s.start.id,
    endMatchId: s.end.id,
  });

  const historical: PlayerStreakRecord[] = [];
  const active: PlayerStreakRecord[] = [];
  for (const [playerId, a] of acc) {
    for (const s of a.closed) historical.push(toRecord(playerId, s));
    if (a.curLen > 0 && a.curStart && a.curEnd) {
      const current = { len: a.curLen, start: a.curStart, end: a.curEnd };
      historical.push(toRecord(playerId, current));
      active.push(toRecord(playerId, current));
    }
  }

  historical.sort((a, b) => b.length - a.length || a.playerId - b.playerId);
  active.sort((a, b) => b.length - a.length || a.playerId - b.playerId);
  const topHistorical = historical.slice(0, 10);
  const topActive = active.slice(0, 10);

  const nameIds = [
    ...new Set([...topHistorical, ...topActive].map((r) => r.playerId)),
  ];
  if (nameIds.length > 0) {
    const players = await db
      .select({ id: playersTable.id, name: playersTable.name })
      .from(playersTable)
      .where(inArray(playersTable.id, nameIds));
    const nameById = new Map(players.map((p) => [p.id, p.name]));
    for (const row of [...topHistorical, ...topActive]) {
      row.playerName = nameById.get(row.playerId) ?? row.playerName;
    }
    topHistorical.sort(
      (a, b) =>
        b.length - a.length ||
        a.playerName.localeCompare(b.playerName) ||
        String(a.startDate ?? "").localeCompare(String(b.startDate ?? "")),
    );
    topActive.sort(
      (a, b) => b.length - a.length || a.playerName.localeCompare(b.playerName),
    );
  }

  return {
    historical: topHistorical,
    active: topActive,
  };
}

/**
 * Consecutive official matches in which a player scored for CSA.
 * Own goals do not count. Missing a match or playing without scoring breaks the streak.
 */
async function scoringStreakRecords(matches: MatchRow[]): Promise<{
  historical: PlayerStreakRecord[];
  active: PlayerStreakRecord[];
}> {
  const goals = await db
    .select({
      matchId: matchGoalsTable.matchId,
      playerId: matchGoalsTable.scorerPlayerId,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
        isNotNull(matchGoalsTable.scorerPlayerId),
      ),
    );
  return consecutivePlayerCalendarStreaks(matches, goals);
}

/**
 * Consecutive unused-bench appearances across the club calendar.
 * Missing a match, starting, or coming on as a sub breaks the streak.
 * Historical ranking lists distinct streaks (the same player can appear twice).
 */
async function unusedBenchStreakRecords(matches: MatchRow[]): Promise<{
  historical: PlayerStreakRecord[];
  active: PlayerStreakRecord[];
}> {
  if (matches.length === 0) {
    return { historical: [], active: [] };
  }

  const unused = await db
    .select({
      matchId: matchLineupsTable.matchId,
      playerId: matchLineupsTable.playerId,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchLineupsTable.side, "csa"),
        isNotNull(matchLineupsTable.playerId),
        csaLineupUnusedBenchCondition(),
      ),
    );

  return consecutivePlayerCalendarStreaks(matches, unused);
}

/**
 * Consecutive wins / unbeaten run for each manager across the club calendar.
 * A match coached by someone else (or without a manager) breaks the streak.
 */
async function managerStreakRecords(
  matches: MatchRow[],
  continues: (m: MatchRow) => boolean,
  limit = 10,
): Promise<{ historical: ManagerStreakRecord[]; active: ManagerStreakRecord[] }> {
  const managerIds = new Set<number>();
  for (const m of matches) {
    if (m.managerId != null) managerIds.add(m.managerId);
  }
  if (managerIds.size === 0) return { historical: [], active: [] };

  const managers = await db
    .select({ id: managersTable.id, name: managersTable.name })
    .from(managersTable)
    .where(inArray(managersTable.id, [...managerIds]));
  const nameById = new Map(managers.map((m) => [m.id, m.name]));

  type Acc = {
    bestLen: number;
    bestStart: MatchRow | null;
    bestEnd: MatchRow | null;
    curLen: number;
    curStart: MatchRow | null;
    curEnd: MatchRow | null;
  };
  const acc = new Map<number, Acc>();
  for (const id of managerIds) {
    acc.set(id, {
      bestLen: 0,
      bestStart: null,
      bestEnd: null,
      curLen: 0,
      curStart: null,
      curEnd: null,
    });
  }

  for (const m of matches) {
    for (const managerId of managerIds) {
      const a = acc.get(managerId)!;
      if (m.managerId === managerId && continues(m)) {
        if (a.curLen === 0) a.curStart = m;
        a.curLen += 1;
        a.curEnd = m;
        if (a.curLen > a.bestLen) {
          a.bestLen = a.curLen;
          a.bestStart = a.curStart;
          a.bestEnd = a.curEnd;
        }
      } else {
        a.curLen = 0;
        a.curStart = null;
        a.curEnd = null;
      }
    }
  }

  const historical: ManagerStreakRecord[] = [];
  const active: ManagerStreakRecord[] = [];
  for (const [managerId, a] of acc) {
    if (a.bestLen > 0 && a.bestStart && a.bestEnd) {
      historical.push({
        managerId,
        managerName: nameById.get(managerId) ?? `#${managerId}`,
        length: a.bestLen,
        startDate: a.bestStart.matchDate,
        endDate: a.bestEnd.matchDate,
        startMatchId: a.bestStart.id,
        endMatchId: a.bestEnd.id,
      });
    }
    if (a.curLen > 0 && a.curStart && a.curEnd) {
      active.push({
        managerId,
        managerName: nameById.get(managerId) ?? `#${managerId}`,
        length: a.curLen,
        startDate: a.curStart.matchDate,
        endDate: a.curEnd.matchDate,
        startMatchId: a.curStart.id,
        endMatchId: a.curEnd.id,
      });
    }
  }

  historical.sort(
    (a, b) => b.length - a.length || a.managerName.localeCompare(b.managerName),
  );
  active.sort(
    (a, b) => b.length - a.length || a.managerName.localeCompare(b.managerName),
  );

  return {
    historical: historical.slice(0, limit),
    active: active.slice(0, limit),
  };
}

/**
 * CSA goals eligible for minutagem rankings:
 * known minute (not n/d / 200 / 0), not extra time (prorrogação ≥100').
 */
async function loadTimedCsaGoals(): Promise<TimedGoalRecord[]> {
  const rows = await db
    .select({
      goalId: matchGoalsTable.id,
      playerId: matchGoalsTable.scorerPlayerId,
      playerName: playersTable.name,
      scorerName: matchGoalsTable.scorerName,
      minute: matchGoalsTable.minute,
      injuryTimeMinute: matchGoalsTable.injuryTimeMinute,
      matchId: matchesTable.id,
      matchDate: matchesTable.matchDate,
      season: matchesTable.season,
      opponentName: opponentsTable.name,
      competitionName: competitionsTable.name,
    })
    .from(matchGoalsTable)
    .innerJoin(matchesTable, eq(matchGoalsTable.matchId, matchesTable.id))
    .innerJoin(opponentsTable, eq(matchesTable.opponentId, opponentsTable.id))
    .innerJoin(
      competitionsTable,
      eq(matchesTable.competitionId, competitionsTable.id),
    )
    .leftJoin(playersTable, eq(matchGoalsTable.scorerPlayerId, playersTable.id))
    .where(
      and(
        recordsMatchConditions(),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, false),
      ),
    );

  const out: TimedGoalRecord[] = [];
  for (const r of rows) {
    if (isUnknownEventMinute(r.minute)) continue;
    if (isExtraTimeEventMinute(r.minute)) continue;
    out.push({
      goalId: r.goalId,
      playerId: r.playerId,
      playerName: r.playerName ?? r.scorerName,
      minute: r.minute,
      injuryTimeMinute: r.injuryTimeMinute,
      minuteLabel: formatEventMinuteLabel(r.minute, r.injuryTimeMinute),
      matchId: r.matchId,
      matchDate: String(r.matchDate).slice(0, 10),
      season: r.season,
      opponentName: r.opponentName,
      competitionName: r.competitionName,
    });
  }
  return out;
}

function rankFastestGoals(
  goals: TimedGoalRecord[],
  limit = 20,
): TimedGoalRecord[] {
  return [...goals]
    .sort((a, b) => {
      const ka = eventMinuteSortKey(a.minute, a.injuryTimeMinute);
      const kb = eventMinuteSortKey(b.minute, b.injuryTimeMinute);
      if (ka !== kb) return ka - kb;
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return a.goalId - b.goalId;
    })
    .slice(0, limit);
}

/** Latest regulation goals = second-half stoppage only (90+). */
function rankLatestStoppageGoals(
  goals: TimedGoalRecord[],
  limit = 20,
): TimedGoalRecord[] {
  return goals
    .filter((g) => isSecondHalfStoppageMinute(g.minute, g.injuryTimeMinute))
    .sort((a, b) => {
      const ka = eventMinuteSortKey(a.minute, a.injuryTimeMinute);
      const kb = eventMinuteSortKey(b.minute, b.injuryTimeMinute);
      if (ka !== kb) return kb - ka;
      if (a.matchDate !== b.matchDate) return b.matchDate.localeCompare(a.matchDate);
      return b.goalId - a.goalId;
    })
    .slice(0, limit);
}

function timedStep<T>(name: string, fn: () => Promise<T>): () => Promise<T> {
  return async () => {
    const t0 = Date.now();
    console.log(`[records] start ${name}`);
    try {
      const value = await fn();
      console.log(`[records] end ${name} ${Date.now() - t0}ms`);
      return value;
    } catch (err) {
      console.log(`[records] fail ${name} ${Date.now() - t0}ms`);
      throw err;
    }
  };
}

async function allBatched<T extends readonly unknown[]>(
  tasks: { [K in keyof T]: () => Promise<T[K]> },
  batchSize = 1,
): Promise<{ [K in keyof T]: T[K] }> {
  const fns = tasks as Array<() => Promise<unknown>>;
  const out: unknown[] = [];
  for (let i = 0; i < fns.length; i += batchSize) {
    const chunk = fns.slice(i, i + batchSize);
    out.push(...(await Promise.all(chunk.map((fn) => fn()))));
  }
  return out as { [K in keyof T]: T[K] };
}

export async function computeClubRecords() {
  const t0 = Date.now();
  console.log("[records] computeClubRecords start");
  const matches = await timedStep("loadRecordsMatches", loadRecordsMatches)();
  const unbeaten = bestTeamStreak(matches, (m) => m.result === "win" || m.result === "draw");
  const winStreak = bestTeamStreak(matches, (m) => m.result === "win");
  const cleanSheet = bestTeamStreak(
    matches,
    (m) => m.goalsAgainst != null && m.goalsAgainst === 0,
  );
  const scoring = bestTeamStreak(
    matches,
    (m) => m.goalsFor != null && m.goalsFor > 0,
  );

  const [
    goals,
    assists,
    penalties,
    ownGoals,
    freeKicks,
    yellowCards,
    redCards,
    managerWins,
    thrashings,
    managerWinStreaks,
    managerUnbeatenStreaks,
    captainApps,
    penaltiesMissed,
    penaltiesSaved,
  ] = await allBatched([
    timedStep("topScorers", () => topScorers()),
    timedStep("topAssists", () => topAssists()),
    timedStep("topPenaltyGoals", () => topPenaltyGoals()),
    timedStep("topOwnGoals", () => topOwnGoals()),
    timedStep("topFreeKickGoals", () => topFreeKickGoals()),
    timedStep("topCards.yellow", () => topCards("yellow")),
    timedStep("topCards.red", () => topCards("red")),
    timedStep("topManagerWins", () => topManagerWins()),
    timedStep("biggestWins", () => biggestWins()),
    timedStep("managerWinStreaks", () =>
      managerStreakRecords(matches, (m) => m.result === "win"),
    ),
    timedStep("managerUnbeatenStreaks", () =>
      managerStreakRecords(
        matches,
        (m) => m.result === "win" || m.result === "draw",
      ),
    ),
    timedStep("topCaptainAppearances", () => topCaptainAppearances()),
    timedStep("topPenaltyEvents.missed", () => topPenaltyEvents("missed")),
    timedStep("topPenaltyEvents.saved", () => topPenaltyEvents("saved")),
  ]);

  const emptyList: PlayerRecordHolder[] = [];
  const emptyPlayerStreaks = {
    historical: [] as PlayerStreakRecord[],
    active: [] as PlayerStreakRecord[],
  };

  const payload = {
    rules: {
      matches: "Somente partidas oficiais (sem amistosos nem W.O.)",
      appearances: "Titular ou reserva que entrou",
      titles:
        "Jogador: relacionado em qualquer ficha da campanha campeã (banco incluso). Técnico: apenas o último jogo oficial da campanha",
      cleanSheets:
        "Clean sheet: goleiro titular em partida oficial sem gol sofrido (posição Goleiro na ficha ou no cadastro)",
      unusedBench:
        "Banco sem entrar: relacionado como reserva e não entrou (não conta quem começou ou foi substituído para dentro)",
      scoringStreak:
        "Jogos seguidos marcando: gol(s) pelo CSA em partidas oficiais consecutivas (gol contra não conta; ficar de fora ou não marcar quebra)",
      captain: "Capitão: partidas oficiais com o jogador marcado como capitão na ficha",
      penaltyEvents:
        "Pênaltis perdidos/defendidos: eventos próprios da ficha (A/C) — não entram na artilharia nem em gols",
      ownGoals:
        "Gols contra (GPD): jogador do CSA que marcou na própria meta — não entram na artilharia",
      goalTiming:
        "Minutagem: exclui n/d (200), minuto desconhecido e gols na prorrogação (≥100'). Mais tardios = só acréscimos do 2º tempo (90+)",
    },
    players: {
      topScorers: goals,
      topAssists: assists,
      topAppearances: emptyList,
      topPenaltyGoals: penalties,
      topOwnGoals: ownGoals,
      topFreeKickGoals: freeKicks,
      topHatTricks: emptyList,
      multiGoalHauls: [],
      topYellowCards: yellowCards,
      topRedCards: redCards,
      topWins: emptyList,
      topGoalsAsSubstitute: emptyList,
      topAppearancesAsSubstitute: emptyList,
      topUnusedBenchAppearances: emptyList,
      topUnusedBenchAppearancesCurrent: emptyList,
      unusedBenchCurrentSeason: null,
      unusedBenchStreak: emptyPlayerStreaks,
      topCleanSheets: emptyList,
      topTitles: emptyList,
      consecutiveStarts: emptyPlayerStreaks,
      cleanSheetStreak: emptyPlayerStreaks,
      scoringStreak: emptyPlayerStreaks,
      topCaptainAppearances: captainApps,
      topPenaltiesMissed: penaltiesMissed,
      topPenaltiesSaved: penaltiesSaved,
      fastestGoals: [],
      latestStoppageGoals: [],
    },
    managers: {
      topWins: managerWins,
      topTitles: [] as Array<{ managerId: number; managerName: string; value: number }>,
      winStreak: managerWinStreaks,
      unbeatenStreak: managerUnbeatenStreaks,
    },
    team: {
      biggestWins: thrashings,
      unbeatenStreak: unbeaten,
      winStreak,
      cleanSheetStreak: cleanSheet,
      scoringStreak: scoring,
    },
  };
  console.log(`[records] computeClubRecords done ${Date.now() - t0}ms`);
  return payload;
}

type ClubRecordsPayload = Awaited<ReturnType<typeof computeClubRecords>>;

const RECORDS_CACHE_TTL_MS = 120_000;
let recordsCache: { at: number; data: ClubRecordsPayload } | null = null;
let recordsInflight: Promise<ClubRecordsPayload> | null = null;

/** Cached club records — avoids repeating the heavy compute on Vercel warm instances. */
export async function getClubRecords(): Promise<ClubRecordsPayload> {
  if (recordsCache && Date.now() - recordsCache.at < RECORDS_CACHE_TTL_MS) {
    console.log("[records] getClubRecords cache-hit");
    return recordsCache.data;
  }
  if (recordsInflight) {
    console.log("[records] getClubRecords inflight");
    return recordsInflight;
  }
  const t0 = Date.now();
  console.log("[records] getClubRecords miss");
  recordsInflight = computeClubRecords()
    .then((data) => {
      recordsCache = { at: Date.now(), data };
      console.log(`[records] getClubRecords stored ${Date.now() - t0}ms`);
      return data;
    })
    .finally(() => {
      recordsInflight = null;
    });
  return recordsInflight;
}

export type ClubPlayerStreaksPayload = {
  unusedBenchStreak: { historical: PlayerStreakRecord[]; active: PlayerStreakRecord[] };
  consecutiveStarts: { historical: PlayerStreakRecord[]; active: PlayerStreakRecord[] };
  cleanSheetStreak: { historical: PlayerStreakRecord[]; active: PlayerStreakRecord[] };
  scoringStreak: { historical: PlayerStreakRecord[]; active: PlayerStreakRecord[] };
  topAppearances: PlayerRecordHolder[];
  topWins: PlayerRecordHolder[];
  topGoalsAsSubstitute: PlayerRecordHolder[];
  topAppearancesAsSubstitute: PlayerRecordHolder[];
  topUnusedBenchAppearances: PlayerRecordHolder[];
  topUnusedBenchAppearancesCurrent: PlayerRecordHolder[];
  unusedBenchCurrentSeason: string | null;
  topCleanSheets: PlayerRecordHolder[];
  topTitles: PlayerRecordHolder[];
  managerTitles: Array<{ managerId: number; managerName: string; value: number }>;
  multiGoalHauls: MultiGoalHaulBucket[];
  topHatTricks: PlayerRecordHolder[];
  fastestGoals: TimedGoalRecord[];
  latestStoppageGoals: TimedGoalRecord[];
};

let streakCache: { at: number; data: ClubPlayerStreaksPayload } | null = null;
let streakInflight: Promise<ClubPlayerStreaksPayload> | null = null;

async function computeClubRecordStreaks(): Promise<ClubPlayerStreaksPayload> {
  const t0 = Date.now();
  console.log("[records] computeClubRecordStreaks start");
  const matches = await timedStep("streaks.loadRecordsMatches", loadRecordsMatches)();
  const [
    unusedBenchStreak,
    consecutiveStarts,
    cleanSheetStreak,
    scoringStreak,
    appearances,
    playerWins,
    goalsAsSub,
    appsAsSub,
    unusedBench,
    unusedBenchSeason,
    cleanSheets,
    playerTitles,
    managerTitles,
    multiGoalHauls,
    timedGoals,
  ] = await allBatched([
    timedStep("unusedBenchStreak", () => unusedBenchStreakRecords(matches)),
    timedStep("consecutiveStarts", () => consecutiveStartsRecords(matches)),
    timedStep("gkCleanSheetStreaks", () => goalkeeperCleanSheetStreaks(matches)),
    timedStep("scoringStreak", () => scoringStreakRecords(matches)),
    timedStep("topAppearances", () => topAppearances()),
    timedStep("topPlayerWins", () => topPlayerWins()),
    timedStep("topGoalsAsSubstitute", () => topGoalsAsSubstitute()),
    timedStep("topAppearancesAsSubstitute", () => topAppearancesAsSubstitute()),
    timedStep("topUnusedBenchAppearances", () => topUnusedBenchAppearances()),
    timedStep("topUnusedBenchCurrent", async () => {
      const season = await latestRecordsSeason();
      return season
        ? { season, rows: await topUnusedBenchAppearances(10, season) }
        : { season: null as string | null, rows: [] as PlayerRecordHolder[] };
    }),
    timedStep("topCleanSheets", () => topCleanSheets()),
    timedStep("topPlayersByTitles", () => topPlayersByTitles(10)),
    timedStep("topManagersByTitles", () => topManagersByTitles(10)),
    timedStep("multiGoalHaulsByCount", () => multiGoalHaulsByCount()),
    timedStep("loadTimedCsaGoals", () => loadTimedCsaGoals()),
  ]);
  const topHatTricks =
    multiGoalHauls.find((b) => b.goalsInMatch === 3)?.players ?? [];
  const out = {
    unusedBenchStreak,
    consecutiveStarts,
    cleanSheetStreak,
    scoringStreak,
    topAppearances: appearances,
    topWins: playerWins,
    topGoalsAsSubstitute: goalsAsSub,
    topAppearancesAsSubstitute: appsAsSub,
    topUnusedBenchAppearances: unusedBench,
    topUnusedBenchAppearancesCurrent: unusedBenchSeason.rows,
    unusedBenchCurrentSeason: unusedBenchSeason.season,
    topCleanSheets: cleanSheets,
    topTitles: playerTitles.map((r) => ({
      playerId: r.id,
      playerName: r.name,
      value: r.titleCount,
    })),
    managerTitles: managerTitles.map((r) => ({
      managerId: r.id,
      managerName: r.name,
      value: r.titleCount,
    })),
    multiGoalHauls,
    topHatTricks,
    fastestGoals: rankFastestGoals(timedGoals),
    latestStoppageGoals: rankLatestStoppageGoals(timedGoals),
  };
  console.log(`[records] computeClubRecordStreaks done ${Date.now() - t0}ms`);
  return out;
}

export async function getClubRecordStreaks(): Promise<ClubPlayerStreaksPayload> {
  if (streakCache && Date.now() - streakCache.at < RECORDS_CACHE_TTL_MS) {
    console.log("[records] getClubRecordStreaks cache-hit");
    return streakCache.data;
  }
  if (streakInflight) {
    console.log("[records] getClubRecordStreaks inflight");
    return streakInflight;
  }
  console.log("[records] getClubRecordStreaks miss");
  streakInflight = computeClubRecordStreaks()
    .then((data) => {
      streakCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      streakInflight = null;
    });
  return streakInflight;
}
