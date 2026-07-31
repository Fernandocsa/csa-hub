import { db } from "@workspace/db";
import {
  matchesTable,
  matchGoalsTable,
  matchLineupsTable,
  playersTable,
  managersTable,
  opponentsTable,
  competitionsTable,
} from "@workspace/db";
import { and, asc, desc, eq, sql, isNotNull, inArray } from "drizzle-orm";
import { recordsMatchConditions, scoredFieldMatchConditions } from "./match-filters";
import {
  csaLineupActuallyPlayedCondition,
  csaLineupCameOnAsSubCondition,
} from "./player-appeared";
import {
  topManagersByTitles,
  topPlayersByTitles,
} from "./titles";

export type PlayerRecordHolder = {
  playerId: number;
  playerName: string;
  value: number;
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

type MatchRow = {
  id: number;
  matchDate: string;
  season: string;
  result: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  opponentName: string;
  competitionName: string;
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

async function topHatTricks(limit = 10): Promise<PlayerRecordHolder[]> {
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

  const counts = new Map<number, number>();
  for (const row of perMatch) {
    if (row.playerId == null) continue;
    counts.set(row.playerId, (counts.get(row.playerId) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .map(([playerId, value]) => ({ playerId, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const players = await db
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable)
    .where(inArray(playersTable.id, ranked.map((r) => r.playerId)));
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  return ranked.map((r) => ({
    playerId: r.playerId,
    playerName: nameById.get(r.playerId) ?? `#${r.playerId}`,
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
    hatTricks,
    playerWins,
    goalsAsSub,
    appsAsSub,
    managerWins,
    thrashings,
    starts,
    playerTitles,
    managerTitles,
  ] = await Promise.all([
    topScorers(),
    topAssists(),
    topAppearances(),
    topPenaltyGoals(),
    topHatTricks(),
    topPlayerWins(),
    topGoalsAsSubstitute(),
    topAppearancesAsSubstitute(),
    topManagerWins(),
    biggestWins(),
    consecutiveStartsRecords(),
    topPlayersByTitles(10),
    topManagersByTitles(10),
  ]);

  return {
    rules: {
      matches: "Somente partidas oficiais (sem amistosos nem W.O.)",
      appearances: "Titular ou reserva que entrou",
      titles:
        "Jogador: relacionado em qualquer ficha da campanha campeã (banco incluso). Técnico: apenas o último jogo oficial da campanha",
    },
    players: {
      topScorers: goals,
      topAssists: assists,
      topAppearances: appearances,
      topPenaltyGoals: penalties,
      topHatTricks: hatTricks,
      topWins: playerWins,
      topGoalsAsSubstitute: goalsAsSub,
      topAppearancesAsSubstitute: appsAsSub,
      topTitles: playerTitles.map((r) => ({
        playerId: r.id,
        playerName: r.name,
        value: r.titleCount,
      })),
      consecutiveStarts: starts,
    },
    managers: {
      topWins: managerWins,
      topTitles: managerTitles.map((r) => ({
        managerId: r.id,
        managerName: r.name,
        value: r.titleCount,
      })),
    },
    team: {
      biggestWins: thrashings,
      unbeatenStreak: unbeaten,
      winStreak,
      cleanSheetStreak: cleanSheet,
    },
  };
}
