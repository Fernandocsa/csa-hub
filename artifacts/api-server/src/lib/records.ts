import { db } from "@workspace/db";
import {
  matchesTable,
  matchGoalsTable,
  matchCardsTable,
  matchLineupsTable,
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
} from "./player-appeared";
import {
  topManagersByTitles,
  topPlayersByTitles,
} from "./titles";

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
 * Goalkeepers with the most clean sheets (started as GK, team conceded 0).
 */
async function topCleanSheets(limit = 10): Promise<PlayerRecordHolder[]> {
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
        csaStartingGoalkeeperCondition(),
        eq(matchesTable.goalsAgainst, 0),
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

/**
 * Consecutive clean sheets for starting goalkeepers across the club calendar.
 * Missing a match, not starting as GK, or conceding breaks the streak.
 */
async function goalkeeperCleanSheetStreaks(): Promise<{
  historical: PlayerStreakRecord[];
  active: PlayerStreakRecord[];
}> {
  const matches = await loadRecordsMatches();
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

  const gkByMatch = new Map<number, Set<number>>();
  const allPlayerIds = new Set<number>();
  for (const s of gkStarters) {
    if (s.playerId == null) continue;
    allPlayerIds.add(s.playerId);
    let set = gkByMatch.get(s.matchId);
    if (!set) {
      set = new Set();
      gkByMatch.set(s.matchId, set);
    }
    set.add(s.playerId);
  }

  if (allPlayerIds.size === 0) return { historical: [], active: [] };

  const players = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable)
    .where(inArray(playersTable.id, [...allPlayerIds]));
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  type Acc = {
    bestLen: number;
    bestStart: MatchRow | null;
    bestEnd: MatchRow | null;
    curLen: number;
    curStart: MatchRow | null;
    curEnd: MatchRow | null;
  };
  const acc = new Map<number, Acc>();
  for (const id of allPlayerIds) {
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
    const startedAsGk = gkByMatch.get(m.id) ?? new Set<number>();
    const isCleanSheet = m.goalsAgainst != null && m.goalsAgainst === 0;
    for (const playerId of allPlayerIds) {
      const a = acc.get(playerId)!;
      if (startedAsGk.has(playerId) && isCleanSheet) {
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

  const historical: PlayerStreakRecord[] = [];
  const active: PlayerStreakRecord[] = [];
  for (const [playerId, a] of acc) {
    if (a.bestLen > 0 && a.bestStart && a.bestEnd) {
      historical.push({
        playerId,
        playerName: nameById.get(playerId) ?? `#${playerId}`,
        length: a.bestLen,
        startDate: a.bestStart.matchDate,
        endDate: a.bestEnd.matchDate,
        startMatchId: a.bestStart.id,
        endMatchId: a.bestEnd.id,
      });
    }
    if (a.curLen > 0 && a.curStart && a.curEnd) {
      active.push({
        playerId,
        playerName: nameById.get(playerId) ?? `#${playerId}`,
        length: a.curLen,
        startDate: a.curStart.matchDate,
        endDate: a.curEnd.matchDate,
        startMatchId: a.curStart.id,
        endMatchId: a.curEnd.id,
      });
    }
  }

  historical.sort((a, b) => b.length - a.length || a.playerName.localeCompare(b.playerName));
  active.sort((a, b) => b.length - a.length || a.playerName.localeCompare(b.playerName));

  return {
    historical: historical.slice(0, 10),
    active: active.slice(0, 10),
  };
}

/**
 * Consecutive starts across the club's official match calendar.
 * Missing a match or not starting breaks the streak.
 */
async function consecutiveStartsRecords(): Promise<{
  historical: PlayerStreakRecord[];
  active: PlayerStreakRecord[];
}> {
  const matches = await loadRecordsMatches();
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

  const startersByMatch = new Map<number, Set<number>>();
  const allPlayerIds = new Set<number>();
  for (const s of starters) {
    if (s.playerId == null) continue;
    allPlayerIds.add(s.playerId);
    let set = startersByMatch.get(s.matchId);
    if (!set) {
      set = new Set();
      startersByMatch.set(s.matchId, set);
    }
    set.add(s.playerId);
  }

  if (allPlayerIds.size === 0) return { historical: [], active: [] };

  const players = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable)
    .where(inArray(playersTable.id, [...allPlayerIds]));
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  type Acc = {
    bestLen: number;
    bestStart: MatchRow | null;
    bestEnd: MatchRow | null;
    curLen: number;
    curStart: MatchRow | null;
    curEnd: MatchRow | null;
  };
  const acc = new Map<number, Acc>();
  for (const id of allPlayerIds) {
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
    const started = startersByMatch.get(m.id) ?? new Set<number>();
    for (const playerId of allPlayerIds) {
      const a = acc.get(playerId)!;
      if (started.has(playerId)) {
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

  const historical: PlayerStreakRecord[] = [];
  const active: PlayerStreakRecord[] = [];
  for (const [playerId, a] of acc) {
    if (a.bestLen > 0 && a.bestStart && a.bestEnd) {
      historical.push({
        playerId,
        playerName: nameById.get(playerId) ?? `#${playerId}`,
        length: a.bestLen,
        startDate: a.bestStart.matchDate,
        endDate: a.bestEnd.matchDate,
        startMatchId: a.bestStart.id,
        endMatchId: a.bestEnd.id,
      });
    }
    if (a.curLen > 0 && a.curStart && a.curEnd) {
      active.push({
        playerId,
        playerName: nameById.get(playerId) ?? `#${playerId}`,
        length: a.curLen,
        startDate: a.curStart.matchDate,
        endDate: a.curEnd.matchDate,
        startMatchId: a.curStart.id,
        endMatchId: a.curEnd.id,
      });
    }
  }

  historical.sort((a, b) => b.length - a.length || a.playerName.localeCompare(b.playerName));
  active.sort((a, b) => b.length - a.length || a.playerName.localeCompare(b.playerName));

  return {
    historical: historical.slice(0, 10),
    active: active.slice(0, 10),
  };
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

export async function computeClubRecords() {
  const matches = await loadRecordsMatches();
  const unbeaten = bestTeamStreak(matches, (m) => m.result === "win" || m.result === "draw");
  const winStreak = bestTeamStreak(matches, (m) => m.result === "win");
  const cleanSheet = bestTeamStreak(
    matches,
    (m) => m.goalsAgainst != null && m.goalsAgainst === 0,
  );

  const [
    goals,
    assists,
    appearances,
    penalties,
    freeKicks,
    multiGoalHauls,
    yellowCards,
    redCards,
    playerWins,
    goalsAsSub,
    appsAsSub,
    cleanSheets,
    managerWins,
    thrashings,
    starts,
    gkCleanSheetStreaks,
    playerTitles,
    managerTitles,
    managerWinStreaks,
    managerUnbeatenStreaks,
  ] = await Promise.all([
    topScorers(),
    topAssists(),
    topAppearances(),
    topPenaltyGoals(),
    topFreeKickGoals(),
    multiGoalHaulsByCount(),
    topCards("yellow"),
    topCards("red"),
    topPlayerWins(),
    topGoalsAsSubstitute(),
    topAppearancesAsSubstitute(),
    topCleanSheets(),
    topManagerWins(),
    biggestWins(),
    consecutiveStartsRecords(),
    goalkeeperCleanSheetStreaks(),
    topPlayersByTitles(10),
    topManagersByTitles(10),
    managerStreakRecords(matches, (m) => m.result === "win"),
    managerStreakRecords(
      matches,
      (m) => m.result === "win" || m.result === "draw",
    ),
  ]);

  const topHatTricks =
    multiGoalHauls.find((b) => b.goalsInMatch === 3)?.players ?? [];

  return {
    rules: {
      matches: "Somente partidas oficiais (sem amistosos nem W.O.)",
      appearances: "Titular ou reserva que entrou",
      titles:
        "Jogador: relacionado em qualquer ficha da campanha campeã (banco incluso). Técnico: apenas o último jogo oficial da campanha",
      cleanSheets:
        "Clean sheet: goleiro titular em partida oficial sem gol sofrido (posição Goleiro na ficha ou no cadastro)",
    },
    players: {
      topScorers: goals,
      topAssists: assists,
      topAppearances: appearances,
      topPenaltyGoals: penalties,
      topFreeKickGoals: freeKicks,
      /** Exact 3-goal hauls only (kept for compatibility). */
      topHatTricks,
      /** Buckets for exact N goals in a match (3, 4, 5, …). */
      multiGoalHauls,
      topYellowCards: yellowCards,
      topRedCards: redCards,
      topWins: playerWins,
      topGoalsAsSubstitute: goalsAsSub,
      topAppearancesAsSubstitute: appsAsSub,
      topCleanSheets: cleanSheets,
      topTitles: playerTitles.map((r) => ({
        playerId: r.id,
        playerName: r.name,
        value: r.titleCount,
      })),
      consecutiveStarts: starts,
      cleanSheetStreak: gkCleanSheetStreaks,
    },
    managers: {
      topWins: managerWins,
      topTitles: managerTitles.map((r) => ({
        managerId: r.id,
        managerName: r.name,
        value: r.titleCount,
      })),
      winStreak: managerWinStreaks,
      unbeatenStreak: managerUnbeatenStreaks,
    },
    team: {
      biggestWins: thrashings,
      unbeatenStreak: unbeaten,
      winStreak,
      cleanSheetStreak: cleanSheet,
    },
  };
}
