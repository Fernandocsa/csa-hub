import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  matchCardsTable,
  matchGoalsTable,
  matchLineupsTable,
  matchSubstitutionsTable,
  matchesTable,
  playersTable,
} from "@workspace/db";
import {
  eventMinuteSortKey,
  isUnknownEventMinute,
} from "./event-minute";
import { officialPlayedMatchConditions } from "./match-filters";
import { csaLineupActuallyPlayedCondition } from "./player-appeared";

/** After extra time / unknown clocks — end of the match for interval math. */
const MATCH_END_KEY = 999_000;

export const gkLineupSql = sql`(
  lower(coalesce(${matchLineupsTable.position}, '')) like '%goleiro%'
  or (
    (${matchLineupsTable.position} is null or trim(${matchLineupsTable.position}) = '')
    and lower(coalesce(${playersTable.position}, '')) like '%goleiro%'
  )
)`;

type Clock = { minute: number; injuryTimeMinute: number | null };

type GkInterval = {
  playerId: number;
  started: boolean;
  /** Sort key when they entered; 0 if starter. Null = unknown sub-in minute. */
  onKey: number | null;
  /** Sort key when they left (sub/red), inclusive. MATCH_END if they finished. Null = unknown leave. */
  offKey: number | null;
};

function clockKey(clock: Clock | null | undefined): number | null {
  if (!clock || isUnknownEventMinute(clock.minute)) return null;
  return eventMinuteSortKey(clock.minute, clock.injuryTimeMinute);
}

/**
 * Starter owns goals up to and including the leave minute (sub/red).
 * Replacement owns goals strictly after the enter minute ("após a substituição").
 */
function gkWasOnAt(iv: GkInterval, goalKey: number): boolean {
  if (iv.onKey == null || iv.offKey == null) return false;
  if (iv.started) return goalKey >= 0 && goalKey <= iv.offKey;
  return goalKey > iv.onKey && goalKey <= iv.offKey;
}

function earliestKey(keys: Array<number | null>): number | null {
  const known = keys.filter((k): k is number => k != null);
  if (!known.length) return null;
  return Math.min(...known);
}

/**
 * Goals conceded by a player while they were the CSA goalkeeper.
 * A goal after a GK substitution or red card is attributed to whoever
 * was on the pitch at that minute — not to the player who had already left.
 */
export async function concededGoalsBySeasonForPlayer(
  playerId: number,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();

  const gkMatches = await db
    .select({
      matchId: matchesTable.id,
      season: matchesTable.season,
      goalsAgainst: matchesTable.goalsAgainst,
    })
    .from(matchLineupsTable)
    .innerJoin(matchesTable, eq(matchLineupsTable.matchId, matchesTable.id))
    .innerJoin(playersTable, eq(playersTable.id, matchLineupsTable.playerId))
    .where(
      and(
        eq(matchLineupsTable.playerId, playerId),
        eq(matchLineupsTable.side, "csa"),
        csaLineupActuallyPlayedCondition(),
        officialPlayedMatchConditions(),
        eq(matchesTable.isWalkover, false),
        gkLineupSql,
      ),
    );

  if (!gkMatches.length) return out;

  const matchIds = [...new Set(gkMatches.map((m) => m.matchId))];
  const seasonByMatch = new Map(gkMatches.map((m) => [m.matchId, m.season]));
  const gaByMatch = new Map(
    gkMatches.map((m) => [m.matchId, Math.max(0, m.goalsAgainst ?? 0)]),
  );

  const [lineups, subs, reds, gaEvents] = await Promise.all([
    db
      .select({
        matchId: matchLineupsTable.matchId,
        playerId: matchLineupsTable.playerId,
        role: matchLineupsTable.role,
        position: matchLineupsTable.position,
        catalogPosition: playersTable.position,
      })
      .from(matchLineupsTable)
      .innerJoin(playersTable, eq(playersTable.id, matchLineupsTable.playerId))
      .where(
        and(
          inArray(matchLineupsTable.matchId, matchIds),
          eq(matchLineupsTable.side, "csa"),
          csaLineupActuallyPlayedCondition(),
          gkLineupSql,
        ),
      ),
    db
      .select({
        matchId: matchSubstitutionsTable.matchId,
        playerOutId: matchSubstitutionsTable.playerOutId,
        playerInId: matchSubstitutionsTable.playerInId,
        minute: matchSubstitutionsTable.minute,
        injuryTimeMinute: matchSubstitutionsTable.injuryTimeMinute,
      })
      .from(matchSubstitutionsTable)
      .where(
        and(
          inArray(matchSubstitutionsTable.matchId, matchIds),
          eq(matchSubstitutionsTable.side, "csa"),
        ),
      ),
    db
      .select({
        matchId: matchCardsTable.matchId,
        playerId: matchCardsTable.playerId,
        minute: matchCardsTable.minute,
        injuryTimeMinute: matchCardsTable.injuryTimeMinute,
      })
      .from(matchCardsTable)
      .where(
        and(
          inArray(matchCardsTable.matchId, matchIds),
          eq(matchCardsTable.side, "csa"),
          eq(matchCardsTable.cardType, "red"),
        ),
      ),
    db
      .select({
        matchId: matchGoalsTable.matchId,
        minute: matchGoalsTable.minute,
        injuryTimeMinute: matchGoalsTable.injuryTimeMinute,
      })
      .from(matchGoalsTable)
      .where(
        and(
          inArray(matchGoalsTable.matchId, matchIds),
          sql`(
            (
              ${matchGoalsTable.side} = 'opponent'
              and coalesce(${matchGoalsTable.isOwnGoal}, false) = false
            )
            or (
              coalesce(${matchGoalsTable.isOwnGoal}, false) = true
              and ${matchGoalsTable.ownGoalDirection} = 'against'
            )
          )`,
        ),
      ),
  ]);

  const lineupsByMatch = new Map<number, typeof lineups>();
  for (const row of lineups) {
    const list = lineupsByMatch.get(row.matchId) ?? [];
    list.push(row);
    lineupsByMatch.set(row.matchId, list);
  }
  const subsByMatch = new Map<number, typeof subs>();
  for (const row of subs) {
    const list = subsByMatch.get(row.matchId) ?? [];
    list.push(row);
    subsByMatch.set(row.matchId, list);
  }
  const redsByMatch = new Map<number, typeof reds>();
  for (const row of reds) {
    const list = redsByMatch.get(row.matchId) ?? [];
    list.push(row);
    redsByMatch.set(row.matchId, list);
  }
  const eventsByMatch = new Map<number, typeof gaEvents>();
  for (const row of gaEvents) {
    const list = eventsByMatch.get(row.matchId) ?? [];
    list.push(row);
    eventsByMatch.set(row.matchId, list);
  }

  for (const matchId of matchIds) {
    const matchLineups = lineupsByMatch.get(matchId) ?? [];
    const matchSubs = subsByMatch.get(matchId) ?? [];
    const matchReds = redsByMatch.get(matchId) ?? [];
    const matchEvents = eventsByMatch.get(matchId) ?? [];

    const intervals: GkInterval[] = matchLineups
      .filter((l) => l.playerId != null)
      .map((l) => {
        const pid = l.playerId!;
        const started = l.role === "starter";
        const subIn = matchSubs.find((s) => s.playerInId === pid);
        const subOut = matchSubs.find((s) => s.playerOutId === pid);
        const red = matchReds.find((c) => c.playerId === pid);
        const onKey = started ? 0 : clockKey(subIn ?? null);
        const leaveKey = earliestKey([clockKey(subOut ?? null), clockKey(red ?? null)]);
        const leftUnknown =
          (!!subOut && clockKey(subOut) == null) || (!!red && clockKey(red) == null);
        const offKey = leftUnknown ? null : (leaveKey ?? MATCH_END_KEY);
        return { playerId: pid, started, onKey, offKey };
      });

    const timedKeys = matchEvents
      .map((e) => clockKey(e))
      .filter((k): k is number => k != null)
      .sort((a, b) => a - b);

    const totalGa = gaByMatch.get(matchId) ?? 0;
    const timed = timedKeys.slice(0, totalGa);
    const leftover = Math.max(0, totalGa - timed.length);

    const fullMatchGks = intervals.filter(
      (iv) => iv.started && iv.onKey === 0 && iv.offKey === MATCH_END_KEY,
    );
    const soleFullGk =
      fullMatchGks.length === 1 && intervals.length === 1 ? fullMatchGks[0] : null;

    let conceded = 0;
    const me = intervals.find((iv) => iv.playerId === playerId);
    if (me) {
      for (const gKey of timed) {
        if (gkWasOnAt(me, gKey)) conceded += 1;
      }
      if (leftover > 0 && soleFullGk && soleFullGk.playerId === playerId) {
        conceded += leftover;
      }
    }

    if (conceded <= 0) continue;
    const season = seasonByMatch.get(matchId);
    if (!season) continue;
    out.set(season, (out.get(season) ?? 0) + conceded);
  }

  return out;
}
