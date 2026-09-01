import { db } from "@workspace/db";
import {
  matchLineupsTable,
  matchGoalsTable,
  matchCardsTable,
  matchSubstitutionsTable,
  matchManagerCardsTable,
  matchPenaltyEventsTable,
  matchesTable,
  playersTable,
} from "@workspace/db";
import { eq, asc, and, sql, inArray } from "drizzle-orm";
import {
  isUnknownEventMinute,
  normalizeEventMinute,
} from "./event-minute";
import { syncPlayersSeasonStatsFromSheets } from "./player-stats-floor";

type CardClock = {
  minute: number | null;
  injuryTimeMinute: number | null;
};

function sameCardClock(a: CardClock, b: CardClock): boolean {
  return (
    (a.minute ?? 200) === (b.minute ?? 200) &&
    (a.injuryTimeMinute ?? 0) === (b.injuryTimeMinute ?? 0)
  );
}

function compareCardClock(a: CardClock, b: CardClock): number {
  const am = a.minute ?? 200;
  const bm = b.minute ?? 200;
  if (am !== bm) return am - bm;
  return (a.injuryTimeMinute ?? 0) - (b.injuryTimeMinute ?? 0);
}

/** Collect CSA player ids referenced on a match sheet (lineups / goals / cards / subs). */
export async function collectCsaSheetPlayerIds(matchId: number): Promise<number[]> {
  const ids = new Set<number>();
  const add = (id: number | null | undefined) => {
    if (id != null && Number.isInteger(id) && id > 0) ids.add(id);
  };

  const lineups = await db
    .select({ playerId: matchLineupsTable.playerId })
    .from(matchLineupsTable)
    .where(
      and(eq(matchLineupsTable.matchId, matchId), eq(matchLineupsTable.side, "csa")),
    );
  for (const r of lineups) add(r.playerId);

  const goals = await db
    .select({
      scorerPlayerId: matchGoalsTable.scorerPlayerId,
      assistPlayerId: matchGoalsTable.assistPlayerId,
    })
    .from(matchGoalsTable)
    .where(and(eq(matchGoalsTable.matchId, matchId), eq(matchGoalsTable.side, "csa")));
  for (const r of goals) {
    add(r.scorerPlayerId);
    add(r.assistPlayerId);
  }

  const cards = await db
    .select({ playerId: matchCardsTable.playerId })
    .from(matchCardsTable)
    .where(and(eq(matchCardsTable.matchId, matchId), eq(matchCardsTable.side, "csa")));
  for (const r of cards) add(r.playerId);

  const subs = await db
    .select({
      playerOutId: matchSubstitutionsTable.playerOutId,
      playerInId: matchSubstitutionsTable.playerInId,
    })
    .from(matchSubstitutionsTable)
    .where(
      and(
        eq(matchSubstitutionsTable.matchId, matchId),
        eq(matchSubstitutionsTable.side, "csa"),
      ),
    );
  for (const r of subs) {
    add(r.playerOutId);
    add(r.playerInId);
  }

  const pens = await db
    .select({ playerId: matchPenaltyEventsTable.playerId })
    .from(matchPenaltyEventsTable)
    .where(
      and(
        eq(matchPenaltyEventsTable.matchId, matchId),
        eq(matchPenaltyEventsTable.side, "csa"),
      ),
    );
  for (const r of pens) add(r.playerId);

  return [...ids];
}

async function syncSheetPlayerSeasonStats(
  matchId: number,
  extraPlayerIds: number[] = [],
) {
  const ids = await collectCsaSheetPlayerIds(matchId);
  await syncPlayersSeasonStatsFromSheets([...ids, ...extraPlayerIds]);
}

/**
 * Two yellows for the same CSA player ⇒ ensure a red at the second yellow's clock.
 * Idempotent: skips when a red already exists at that minute (+ stoppage).
 */
export async function ensureSecondYellowReds(
  matchId: number,
  lineupIdByPlayer?: Map<number, number>,
) {
  const rows = await db
    .select()
    .from(matchCardsTable)
    .where(
      and(eq(matchCardsTable.matchId, matchId), eq(matchCardsTable.side, "csa")),
    );

  const byPlayer = new Map<
    number,
    {
      yellows: (typeof rows)[number][];
      reds: (typeof rows)[number][];
    }
  >();

  for (const row of rows) {
    if (row.playerId == null) continue;
    let bucket = byPlayer.get(row.playerId);
    if (!bucket) {
      bucket = { yellows: [], reds: [] };
      byPlayer.set(row.playerId, bucket);
    }
    if (row.cardType === "yellow") bucket.yellows.push(row);
    else if (row.cardType === "red") bucket.reds.push(row);
  }

  let added = 0;
  for (const [playerId, { yellows, reds }] of byPlayer) {
    if (yellows.length < 2) continue;
    const sorted = [...yellows].sort(compareCardClock);
    const second = sorted[1];
    if (reds.some((r) => sameCardClock(r, second))) continue;

    const playerName = second.playerName?.trim() || `Jogador #${playerId}`;
    await db.insert(matchCardsTable).values({
      matchId,
      side: "csa",
      cardType: "red",
      lineupId:
        lineupIdByPlayer?.get(playerId) ?? second.lineupId ?? null,
      playerId,
      playerName,
      minute: second.minute,
      injuryTimeMinute: second.injuryTimeMinute,
    });
    added += 1;
  }
  return added;
}

export type MatchSheetSide = "csa" | "opponent";

export type LineupInput = {
  playerId?: number | null;
  playerName: string;
  role: "starter" | "bench" | string;
  shirtNumber?: number | null;
  position?: string | null;
  sortOrder?: number;
  side?: MatchSheetSide;
};

export type GoalInput = {
  scorerPlayerId?: number | null;
  scorerName?: string | null;
  /** Exact minute, or empty/200 for unavailable. */
  minute?: number | null | string;
  injuryTimeMinute?: number | null;
  assistPlayerId?: number | null;
  assistName?: string | null;
  isPenalty?: boolean;
  isFreeKick?: boolean;
  isOwnGoal?: boolean;
  /** 'for' = GPF / g.c. a favor do CSA; 'against' = GPD */
  ownGoalDirection?: "for" | "against" | null;
  side?: MatchSheetSide;
};

export type AssistInput = {
  assistPlayerId: number;
  /** Must be a known minute to pair with a goal (not empty/200). */
  minute?: number | null | string;
  injuryTimeMinute?: number | null;
};

export type CardInput = {
  cardType: "yellow" | "red" | string;
  playerId?: number | null;
  playerName?: string | null;
  minute?: number | null | string;
  injuryTimeMinute?: number | null;
  side?: MatchSheetSide;
};

export type ManagerCardInput = {
  cardType: "yellow" | "red" | string;
  minute?: number | null | string;
  injuryTimeMinute?: number | null;
};

export type PenaltyEventInput = {
  eventType: "missed" | "saved" | string;
  playerId?: number | null;
  playerName?: string | null;
  minute?: number | null | string;
  injuryTimeMinute?: number | null;
  side?: MatchSheetSide;
};

export type SubstitutionInput = {
  playerOutId?: number | null;
  playerOutName?: string | null;
  playerInId?: number | null;
  playerInName?: string | null;
  minute?: number | null | string;
  injuryTimeMinute?: number | null;
  side?: MatchSheetSide;
};

export function serializeLineup(
  row: typeof matchLineupsTable.$inferSelect,
  player?: {
    photoUrl?: string | null;
    nationality?: string | null;
    nationalityFlag?: string | null;
    /** Catalog position — used when the lineup row has no match-specific position. */
    position?: string | null;
  } | null,
) {
  const lineupPosition = row.position?.trim() || null;
  const catalogPosition = player?.position?.trim() || null;
  return {
    id: row.id,
    matchId: row.matchId,
    side: row.side,
    playerId: row.playerId,
    playerName: row.playerName,
    role: row.role,
    shirtNumber: row.shirtNumber,
    position: lineupPosition ?? catalogPosition,
    sortOrder: row.sortOrder,
    photoUrl: player?.photoUrl ?? null,
    nationality: player?.nationality ?? null,
    nationalityFlag: player?.nationalityFlag ?? null,
  };
}

export function serializeGoal(row: typeof matchGoalsTable.$inferSelect) {
  return {
    id: row.id,
    matchId: row.matchId,
    side: row.side,
    scorerLineupId: row.scorerLineupId,
    scorerPlayerId: row.scorerPlayerId,
    scorerName: row.scorerName,
    minute: row.minute,
    injuryTimeMinute: row.injuryTimeMinute,
    assistLineupId: row.assistLineupId,
    assistPlayerId: row.assistPlayerId,
    assistName: row.assistName,
    isPenalty: row.isPenalty ?? false,
    isFreeKick: row.isFreeKick ?? false,
    isOwnGoal: row.isOwnGoal ?? false,
    ownGoalDirection: (row.ownGoalDirection as "for" | "against" | null) ?? null,
  };
}

export function serializeCard(row: typeof matchCardsTable.$inferSelect) {
  return {
    id: row.id,
    matchId: row.matchId,
    side: row.side,
    cardType: row.cardType,
    lineupId: row.lineupId,
    playerId: row.playerId,
    playerName: row.playerName,
    minute: row.minute,
    injuryTimeMinute: row.injuryTimeMinute,
  };
}

export function serializeManagerCard(
  row: typeof matchManagerCardsTable.$inferSelect,
) {
  return {
    id: row.id,
    matchId: row.matchId,
    cardType: row.cardType,
    minute: row.minute,
    injuryTimeMinute: row.injuryTimeMinute,
  };
}

export function serializePenaltyEvent(
  row: typeof matchPenaltyEventsTable.$inferSelect,
) {
  return {
    id: row.id,
    matchId: row.matchId,
    side: row.side,
    eventType: row.eventType as "missed" | "saved",
    playerId: row.playerId,
    playerName: row.playerName,
    minute: row.minute,
    injuryTimeMinute: row.injuryTimeMinute,
  };
}

export function serializeSubstitution(
  row: typeof matchSubstitutionsTable.$inferSelect,
) {
  return {
    id: row.id,
    matchId: row.matchId,
    side: row.side,
    playerOutLineupId: row.playerOutLineupId,
    playerOutId: row.playerOutId,
    playerOutName: row.playerOutName,
    playerInLineupId: row.playerInLineupId,
    playerInId: row.playerInId,
    playerInName: row.playerInName,
    minute: row.minute,
    injuryTimeMinute: row.injuryTimeMinute,
  };
}

async function resolvePlayerName(
  playerId: number | null | undefined,
  fallbackName: string | null | undefined,
): Promise<string | null> {
  if (fallbackName?.trim()) return fallbackName.trim();
  if (!playerId) return null;
  const [p] = await db
    .select({ name: playersTable.name })
    .from(playersTable)
    .where(eq(playersTable.id, playerId))
    .limit(1);
  return p?.name ?? null;
}

async function loadCsaLineupMap(matchId: number) {
  const rows = await db
    .select()
    .from(matchLineupsTable)
    .where(
      and(eq(matchLineupsTable.matchId, matchId), eq(matchLineupsTable.side, "csa")),
    );
  const map = new Map<number, number>();
  for (const r of rows) {
    if (r.playerId != null) map.set(r.playerId, r.id);
  }
  return map;
}

function lineupNameKey(name: string) {
  return name.trim().toLowerCase();
}

type OpponentLineupRow = typeof matchLineupsTable.$inferSelect;

type OpponentLineupIndex = {
  byId: Map<number, OpponentLineupRow>;
  byName: Map<string, OpponentLineupRow>;
};

async function loadOpponentLineupIndex(
  matchId: number,
): Promise<OpponentLineupIndex> {
  const rows = await db
    .select()
    .from(matchLineupsTable)
    .where(
      and(
        eq(matchLineupsTable.matchId, matchId),
        eq(matchLineupsTable.side, "opponent"),
      ),
    );
  const byId = new Map<number, OpponentLineupRow>();
  const byName = new Map<string, OpponentLineupRow>();
  for (const r of rows) {
    if (r.playerId != null) byId.set(r.playerId, r);
    const key = lineupNameKey(r.playerName);
    if (key && !byName.has(key)) byName.set(key, r);
  }
  return { byId, byName };
}

function requireOpponentLineup(
  index: OpponentLineupIndex,
  playerId: number | null | undefined,
  name: string | null | undefined,
  label: string,
) {
  const id =
    playerId != null && Number.isInteger(playerId) && playerId > 0
      ? playerId
      : null;
  if (id != null) {
    const byId = index.byId.get(id);
    if (byId) return byId;
  }
  const key = name?.trim() ? lineupNameKey(name) : "";
  if (key) {
    const byName = index.byName.get(key);
    if (byName) return byName;
  }
  if (!id && !key) {
    throw Object.assign(
      new Error(`${label} precisa do nome do jogador adversário`),
      { status: 400 },
    );
  }
  throw Object.assign(
    new Error(`${label} precisa estar na escalação do adversário`),
    { status: 400 },
  );
}

async function nullLineupFksForSide(matchId: number, side: MatchSheetSide) {
  await db
    .update(matchGoalsTable)
    .set({ scorerLineupId: null, assistLineupId: null })
    .where(
      and(eq(matchGoalsTable.matchId, matchId), eq(matchGoalsTable.side, side)),
    );
  await db
    .update(matchCardsTable)
    .set({ lineupId: null })
    .where(
      and(eq(matchCardsTable.matchId, matchId), eq(matchCardsTable.side, side)),
    );
  await db
    .update(matchSubstitutionsTable)
    .set({ playerOutLineupId: null, playerInLineupId: null })
    .where(
      and(
        eq(matchSubstitutionsTable.matchId, matchId),
        eq(matchSubstitutionsTable.side, side),
      ),
    );
}

function parseOptionalShirt(value: number | null | undefined) {
  if (value == null || value === ("" as unknown)) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && !Number.isNaN(n) ? Math.trunc(n) : null;
}

async function replaceOpponentLineupRows(matchId: number, lineups: LineupInput[]) {
  for (const l of lineups) {
    const playerId =
      l.playerId != null && Number.isInteger(l.playerId) && l.playerId > 0
        ? l.playerId
        : null;
    if (!playerId && !l.playerName?.trim()) {
      throw Object.assign(
        new Error("Cada jogador da escalação adversária precisa de playerId ou nome"),
        { status: 400 },
      );
    }
    if (l.role !== "starter" && l.role !== "bench") {
      throw Object.assign(new Error("role deve ser starter ou bench"), {
        status: 400,
      });
    }
  }
  const starters = lineups.filter((l) => l.role === "starter");
  if (starters.length > 11) {
    throw Object.assign(
      new Error("Máximo de 11 titulares na escalação do adversário"),
      { status: 400 },
    );
  }

  const seenIds = new Set<number>();
  for (const l of lineups) {
    const playerId =
      l.playerId != null && Number.isInteger(l.playerId) && l.playerId > 0
        ? l.playerId
        : null;
    if (playerId == null) continue;
    if (seenIds.has(playerId)) {
      throw Object.assign(
        new Error("O mesmo jogador não pode aparecer duas vezes na escalação adversária"),
        { status: 400 },
      );
    }
    seenIds.add(playerId);
  }

  await nullLineupFksForSide(matchId, "opponent");
  await db
    .delete(matchLineupsTable)
    .where(
      and(
        eq(matchLineupsTable.matchId, matchId),
        eq(matchLineupsTable.side, "opponent"),
      ),
    );

  const playerIds = [
    ...new Set(
      lineups
        .map((l) => l.playerId)
        .filter((id): id is number => id != null && Number.isInteger(id) && id > 0),
    ),
  ];
  const catalogById = new Map<number, { name: string; position: string | null }>();
  if (playerIds.length > 0) {
    const catalogRows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
      })
      .from(playersTable)
      .where(inArray(playersTable.id, playerIds));
    for (const p of catalogRows) {
      catalogById.set(p.id, {
        name: p.name,
        position: p.position?.trim() || null,
      });
    }
  }

  for (let i = 0; i < lineups.length; i++) {
    const l = lineups[i];
    const playerId =
      l.playerId != null && Number.isInteger(l.playerId) && l.playerId > 0
        ? l.playerId
        : null;
    const catalog = playerId != null ? catalogById.get(playerId) : undefined;
    const playerName =
      catalog?.name ?? (l.playerName?.trim() || (playerId != null ? `Jogador #${playerId}` : ""));
    await db.insert(matchLineupsTable).values({
      matchId,
      side: "opponent",
      playerId,
      playerName,
      role: l.role,
      shirtNumber: parseOptionalShirt(l.shirtNumber),
      position: l.position?.trim() || catalog?.position || null,
      sortOrder: l.sortOrder ?? i,
    });
  }
}

/** Sync matches.own_goals_for_count from GPF / g.c. rows. */
export async function syncOwnGoalsForCount(matchId: number) {
  const [{ n }] = await db
    .select({
      n: sql<number>`cast(count(*) as int)`,
    })
    .from(matchGoalsTable)
    .where(
      and(
        eq(matchGoalsTable.matchId, matchId),
        eq(matchGoalsTable.side, "csa"),
        eq(matchGoalsTable.isOwnGoal, true),
        eq(matchGoalsTable.ownGoalDirection, "for"),
      ),
    );
  await db
    .update(matchesTable)
    .set({ ownGoalsForCount: n ?? 0 })
    .where(eq(matchesTable.id, matchId));
  return n ?? 0;
}

export async function loadMatchSheet(matchId: number) {
  const [
    lineupRows,
    goals,
    cards,
    substitutions,
    managerCards,
    penaltyEvents,
    matchRow,
  ] = await Promise.all([
      db
        .select({
          lineup: matchLineupsTable,
          photoUrl: playersTable.photoUrl,
          nationality: playersTable.nationality,
          nationalityFlag: playersTable.nationalityFlag,
          playerPosition: playersTable.position,
        })
        .from(matchLineupsTable)
        .leftJoin(playersTable, eq(matchLineupsTable.playerId, playersTable.id))
        .where(eq(matchLineupsTable.matchId, matchId))
        .orderBy(asc(matchLineupsTable.sortOrder), asc(matchLineupsTable.id)),
      db
        .select()
        .from(matchGoalsTable)
        .where(eq(matchGoalsTable.matchId, matchId))
        .orderBy(asc(matchGoalsTable.minute), asc(matchGoalsTable.id)),
      db
        .select()
        .from(matchCardsTable)
        .where(eq(matchCardsTable.matchId, matchId))
        .orderBy(asc(matchCardsTable.minute), asc(matchCardsTable.id)),
      db
        .select()
        .from(matchSubstitutionsTable)
        .where(eq(matchSubstitutionsTable.matchId, matchId))
        .orderBy(
          asc(matchSubstitutionsTable.minute),
          asc(matchSubstitutionsTable.id),
        ),
      db
        .select()
        .from(matchManagerCardsTable)
        .where(eq(matchManagerCardsTable.matchId, matchId))
        .orderBy(
          asc(matchManagerCardsTable.minute),
          asc(matchManagerCardsTable.id),
        ),
      db
        .select()
        .from(matchPenaltyEventsTable)
        .where(eq(matchPenaltyEventsTable.matchId, matchId))
        .orderBy(
          asc(matchPenaltyEventsTable.minute),
          asc(matchPenaltyEventsTable.id),
        ),
      db
        .select({
          captainPlayerId: matchesTable.captainPlayerId,
          managerId: matchesTable.managerId,
          opponentManagerId: matchesTable.opponentManagerId,
          ownGoalsForCount: matchesTable.ownGoalsForCount,
        })
        .from(matchesTable)
        .where(eq(matchesTable.id, matchId))
        .limit(1),
    ]);

  return {
    lineups: lineupRows.map((r) =>
      serializeLineup(r.lineup, {
        photoUrl: r.photoUrl,
        nationality: r.nationality,
        nationalityFlag: r.nationalityFlag,
        position: r.playerPosition,
      }),
    ),
    goals: goals.map(serializeGoal),
    cards: cards.map(serializeCard),
    substitutions: substitutions.map(serializeSubstitution),
    managerCards: managerCards.map(serializeManagerCard),
    penaltyEvents: penaltyEvents.map(serializePenaltyEvent),
    captainPlayerId: matchRow[0]?.captainPlayerId ?? null,
    managerId: matchRow[0]?.managerId ?? null,
    opponentManagerId: matchRow[0]?.opponentManagerId ?? null,
    ownGoalsForCount: matchRow[0]?.ownGoalsForCount ?? 0,
  };
}

/**
 * Replace CSA lineup only (does not wipe events/subs).
 * Optionally updates managerId on the match.
 */
export async function replaceCsaLineup(
  matchId: number,
  input: {
    lineups?: LineupInput[];
    /** When provided (even empty), replaces opponent lineup. Omitted = leave opponent as-is. */
    opponentLineups?: LineupInput[];
    managerId?: number | null;
    opponentManagerId?: number | null;
  },
) {
  const previousPlayerIds = await collectCsaSheetPlayerIds(matchId);
  const lineupsIn = (input.lineups ?? []).filter(
    (l) => !l.side || l.side === "csa",
  );

  for (const l of lineupsIn) {
    if (!l.playerId) {
      throw Object.assign(
        new Error("Cada jogador da escalação CSA precisa de playerId"),
        { status: 400 },
      );
    }
    if (l.role !== "starter" && l.role !== "bench") {
      throw Object.assign(new Error("role deve ser starter ou bench"), {
        status: 400,
      });
    }
  }

  const starters = lineupsIn.filter((l) => l.role === "starter");
  if (starters.length > 11) {
    throw Object.assign(
      new Error("Máximo de 11 titulares na escalação CSA"),
      { status: 400 },
    );
  }

  // Null CSA lineup FKs on dependents before deleting CSA lineups
  await nullLineupFksForSide(matchId, "csa");

  await db
    .delete(matchLineupsTable)
    .where(
      and(eq(matchLineupsTable.matchId, matchId), eq(matchLineupsTable.side, "csa")),
    );

  const playerIds = [
    ...new Set(lineupsIn.map((l) => l.playerId as number).filter(Boolean)),
  ];
  const catalogById = new Map<
    number,
    { name: string; position: string | null }
  >();
  if (playerIds.length > 0) {
    const catalogRows = await db
      .select({
        id: playersTable.id,
        name: playersTable.name,
        position: playersTable.position,
      })
      .from(playersTable)
      .where(inArray(playersTable.id, playerIds));
    for (const p of catalogRows) {
      catalogById.set(p.id, {
        name: p.name,
        position: p.position?.trim() || null,
      });
    }
  }

  for (let i = 0; i < lineupsIn.length; i++) {
    const l = lineupsIn[i];
    const playerId = l.playerId as number;
    const catalog = catalogById.get(playerId);
    const playerName =
      l.playerName?.trim() ||
      catalog?.name ||
      (await resolvePlayerName(playerId, l.playerName)) ||
      `Jogador #${playerId}`;
    const position = l.position?.trim() || catalog?.position || null;

    await db.insert(matchLineupsTable).values({
      matchId,
      side: "csa",
      playerId,
      playerName,
      role: l.role,
      shirtNumber: l.shirtNumber ?? null,
      position,
      sortOrder: l.sortOrder ?? i,
    });
  }

  if (input.managerId !== undefined) {
    await db
      .update(matchesTable)
      .set({ managerId: input.managerId })
      .where(eq(matchesTable.id, matchId));
  }

  if (input.opponentManagerId !== undefined) {
    await db
      .update(matchesTable)
      .set({ opponentManagerId: input.opponentManagerId })
      .where(eq(matchesTable.id, matchId));
  }

  if (input.opponentLineups !== undefined) {
    await replaceOpponentLineupRows(matchId, input.opponentLineups);
  }

  await syncSheetPlayerSeasonStats(matchId, previousPlayerIds);
  return loadMatchSheet(matchId);
}

async function replaceOpponentSubstitutionRows(
  matchId: number,
  substitutions: SubstitutionInput[],
) {
  const opp = await loadOpponentLineupIndex(matchId);
  await db
    .delete(matchSubstitutionsTable)
    .where(
      and(
        eq(matchSubstitutionsTable.matchId, matchId),
        eq(matchSubstitutionsTable.side, "opponent"),
      ),
    );

  for (const s of substitutions) {
    const outRow = requireOpponentLineup(
      opp,
      s.playerOutId,
      s.playerOutName,
      "Jogador que saiu",
    );
    const inRow = requireOpponentLineup(
      opp,
      s.playerInId,
      s.playerInName,
      "Jogador que entrou",
    );
    if (outRow.id === inRow.id) {
      throw Object.assign(
        new Error("Jogador que saiu e que entrou devem ser diferentes"),
        { status: 400 },
      );
    }
    await db.insert(matchSubstitutionsTable).values({
      matchId,
      side: "opponent",
      playerOutLineupId: outRow.id,
      playerOutId: outRow.playerId,
      playerOutName: outRow.playerName,
      playerInLineupId: inRow.id,
      playerInId: inRow.playerId,
      playerInName: inRow.playerName,
      minute: normalizeEventMinute(s.minute),
      injuryTimeMinute:
        s.injuryTimeMinute == null || String(s.injuryTimeMinute).trim() === ""
          ? null
          : Number(s.injuryTimeMinute),
    });
  }
}

export async function replaceCsaSubstitutions(
  matchId: number,
  substitutions: SubstitutionInput[],
  opponentSubstitutions?: SubstitutionInput[],
) {
  const lineupIdByPlayer = await loadCsaLineupMap(matchId);
  const subsIn = (substitutions ?? []).filter((s) => !s.side || s.side === "csa");

  await db
    .delete(matchSubstitutionsTable)
    .where(
      and(
        eq(matchSubstitutionsTable.matchId, matchId),
        eq(matchSubstitutionsTable.side, "csa"),
      ),
    );

  for (const s of subsIn) {
    const outId = s.playerOutId ?? null;
    const inId = s.playerInId ?? null;
    if (!outId || !lineupIdByPlayer.has(outId)) {
      throw Object.assign(
        new Error("Jogador que saiu precisa estar na escalação CSA"),
        { status: 400 },
      );
    }
    if (!inId || !lineupIdByPlayer.has(inId)) {
      throw Object.assign(
        new Error("Jogador que entrou precisa estar na escalação CSA"),
        { status: 400 },
      );
    }
    if (outId === inId) {
      throw Object.assign(
        new Error("Jogador que saiu e que entrou devem ser diferentes"),
        { status: 400 },
      );
    }

    const playerOutName =
      (await resolvePlayerName(outId, s.playerOutName)) ?? `Jogador #${outId}`;
    const playerInName =
      (await resolvePlayerName(inId, s.playerInName)) ?? `Jogador #${inId}`;

    await db.insert(matchSubstitutionsTable).values({
      matchId,
      side: "csa",
      playerOutLineupId: lineupIdByPlayer.get(outId) ?? null,
      playerOutId: outId,
      playerOutName,
      playerInLineupId: lineupIdByPlayer.get(inId) ?? null,
      playerInId: inId,
      playerInName,
      minute: normalizeEventMinute(s.minute),
      injuryTimeMinute:
        s.injuryTimeMinute == null || String(s.injuryTimeMinute).trim() === ""
          ? null
          : Number(s.injuryTimeMinute),
    });
  }

  if (opponentSubstitutions !== undefined) {
    await replaceOpponentSubstitutionRows(matchId, opponentSubstitutions);
  }

  await syncSheetPlayerSeasonStats(matchId);
  return loadMatchSheet(matchId);
}

async function insertGoalRow(
  matchId: number,
  g: GoalInput,
  lineupIdByPlayer: Map<number, number>,
) {
  const minute = normalizeEventMinute(g.minute);

  const isOwnGoal = Boolean(g.isOwnGoal);
  const ownGoalDirection = isOwnGoal
    ? g.ownGoalDirection === "against"
      ? "against"
      : "for"
    : null;

  const scorerPlayerId = g.scorerPlayerId ?? null;
  // Regular goals and GPD require a lined-up scorer; GPF may omit player.
  if (!isOwnGoal || ownGoalDirection === "against") {
    if (!scorerPlayerId || !lineupIdByPlayer.has(scorerPlayerId)) {
      throw Object.assign(
        new Error("Autor do gol precisa estar na escalação CSA"),
        { status: 400 },
      );
    }
  } else if (scorerPlayerId && !lineupIdByPlayer.has(scorerPlayerId)) {
    throw Object.assign(
      new Error("Jogador do gol contra precisa estar na escalação CSA"),
      { status: 400 },
    );
  }

  const scorerName =
    (await resolvePlayerName(scorerPlayerId, g.scorerName)) ??
    (isOwnGoal ? "Gol contra" : `Jogador #${scorerPlayerId}`);

  let assistPlayerId = g.assistPlayerId ?? null;
  let assistLineupId: number | null = null;
  let assistName: string | null = null;
  if (assistPlayerId) {
    if (!lineupIdByPlayer.has(assistPlayerId)) {
      throw Object.assign(
        new Error("Assistência precisa ser de jogador escalado"),
        { status: 400 },
      );
    }
    if (assistPlayerId === scorerPlayerId) {
      throw Object.assign(
        new Error("Assistência não pode ser do mesmo jogador do gol"),
        { status: 400 },
      );
    }
    assistLineupId = lineupIdByPlayer.get(assistPlayerId) ?? null;
    assistName =
      (await resolvePlayerName(assistPlayerId, g.assistName)) ??
      `Jogador #${assistPlayerId}`;
  }

  const [row] = await db
    .insert(matchGoalsTable)
    .values({
      matchId,
      side: "csa",
      scorerLineupId: scorerPlayerId
        ? (lineupIdByPlayer.get(scorerPlayerId) ?? null)
        : null,
      scorerPlayerId,
      scorerName,
      minute,
      injuryTimeMinute:
        g.injuryTimeMinute == null || String(g.injuryTimeMinute).trim() === ""
          ? null
          : Number(g.injuryTimeMinute),
      assistLineupId,
      assistPlayerId,
      assistName,
      isPenalty: Boolean(g.isPenalty) && !isOwnGoal,
      isFreeKick: Boolean(g.isFreeKick) && !isOwnGoal && !Boolean(g.isPenalty),
      isOwnGoal,
      ownGoalDirection,
    })
    .returning();

  return row;
}

/** Attach ASS rows to goals with the same minute that still lack an assist (1A). */
async function attachAssistsByMinute(
  matchId: number,
  assists: AssistInput[],
  lineupIdByPlayer: Map<number, number>,
) {
  for (const a of assists) {
    if (!a.assistPlayerId || !lineupIdByPlayer.has(a.assistPlayerId)) {
      throw Object.assign(
        new Error("Assistência precisa ser de jogador escalado"),
        { status: 400 },
      );
    }
    const minute = normalizeEventMinute(a.minute);
    if (isUnknownEventMinute(minute)) {
      throw Object.assign(
        new Error(
          "Assistência precisa do minuto conhecido do gol para vincular (não use vazio/200)",
        ),
        { status: 400 },
      );
    }

    const candidates = await db
      .select()
      .from(matchGoalsTable)
      .where(
        and(
          eq(matchGoalsTable.matchId, matchId),
          eq(matchGoalsTable.side, "csa"),
          eq(matchGoalsTable.minute, minute),
          eq(matchGoalsTable.isOwnGoal, false),
          sql`${matchGoalsTable.assistPlayerId} is null`,
        ),
      )
      .orderBy(asc(matchGoalsTable.id))
      .limit(1);

    const goal = candidates[0];
    if (!goal) {
      throw Object.assign(
        new Error(
          `Nenhum gol no minuto ${minute} disponível para receber a assistência`,
        ),
        { status: 400 },
      );
    }
    if (goal.scorerPlayerId === a.assistPlayerId) {
      throw Object.assign(
        new Error("Assistência não pode ser do mesmo jogador do gol"),
        { status: 400 },
      );
    }

    const assistName =
      (await resolvePlayerName(a.assistPlayerId, null)) ??
      `Jogador #${a.assistPlayerId}`;

    await db
      .update(matchGoalsTable)
      .set({
        assistPlayerId: a.assistPlayerId,
        assistLineupId: lineupIdByPlayer.get(a.assistPlayerId) ?? null,
        assistName,
      })
      .where(eq(matchGoalsTable.id, goal.id));
  }
}

async function insertOpponentGoalRow(
  matchId: number,
  g: GoalInput,
  opp: OpponentLineupIndex,
) {
  const minute = normalizeEventMinute(g.minute);
  const scorer = requireOpponentLineup(
    opp,
    g.scorerPlayerId,
    g.scorerName,
    "Autor do gol",
  );
  let assistLineupId: number | null = null;
  let assistPlayerId: number | null = null;
  let assistName: string | null = null;
  if (g.assistPlayerId || g.assistName?.trim()) {
    const assist = requireOpponentLineup(
      opp,
      g.assistPlayerId,
      g.assistName,
      "Assistência",
    );
    if (assist.id === scorer.id) {
      throw Object.assign(
        new Error("Assistência não pode ser do mesmo jogador do gol"),
        { status: 400 },
      );
    }
    assistLineupId = assist.id;
    assistPlayerId = assist.playerId;
    assistName = assist.playerName;
  }

  const [row] = await db
    .insert(matchGoalsTable)
    .values({
      matchId,
      side: "opponent",
      scorerLineupId: scorer.id,
      scorerPlayerId: scorer.playerId,
      scorerName: scorer.playerName,
      minute,
      injuryTimeMinute:
        g.injuryTimeMinute == null || String(g.injuryTimeMinute).trim() === ""
          ? null
          : Number(g.injuryTimeMinute),
      assistLineupId,
      assistPlayerId,
      assistName,
      isPenalty: Boolean(g.isPenalty) && !g.isOwnGoal,
      isFreeKick: Boolean(g.isFreeKick) && !g.isOwnGoal && !Boolean(g.isPenalty),
      isOwnGoal: false,
      ownGoalDirection: null,
    })
    .returning();
  return row;
}

/**
 * Append events without wiping existing ones. Clears nothing on the client —
 * caller resets the form after success.
 */
export async function appendCsaEvents(
  matchId: number,
  input: {
    goals?: GoalInput[];
    assists?: AssistInput[];
    cards?: CardInput[];
    managerCards?: ManagerCardInput[];
    penaltyEvents?: PenaltyEventInput[];
    captainPlayerId?: number | null;
  },
) {
  const lineupIdByPlayer = await loadCsaLineupMap(matchId);
  const opp = await loadOpponentLineupIndex(matchId);
  const csaGoals = (input.goals ?? []).filter((g) => !g.side || g.side === "csa");
  const oppGoals = (input.goals ?? []).filter((g) => g.side === "opponent");
  const csaCards = (input.cards ?? []).filter((c) => !c.side || c.side === "csa");
  const oppCards = (input.cards ?? []).filter((c) => c.side === "opponent");
  const csaPens = (input.penaltyEvents ?? []).filter((p) => !p.side || p.side === "csa");
  const oppPens = (input.penaltyEvents ?? []).filter((p) => p.side === "opponent");

  for (const g of csaGoals) {
    await insertGoalRow(matchId, g, lineupIdByPlayer);
  }
  for (const g of oppGoals) {
    await insertOpponentGoalRow(matchId, g, opp);
  }

  if (input.assists?.length) {
    await attachAssistsByMinute(matchId, input.assists, lineupIdByPlayer);
  }

  for (const c of csaCards) {
    if (c.cardType !== "yellow" && c.cardType !== "red") {
      throw Object.assign(new Error("cardType deve ser yellow ou red"), {
        status: 400,
      });
    }
    const playerId = c.playerId ?? null;
    if (!playerId || !lineupIdByPlayer.has(playerId)) {
      throw Object.assign(
        new Error("Cartão precisa ser de jogador escalado na CSA"),
        { status: 400 },
      );
    }
    const playerName =
      (await resolvePlayerName(playerId, c.playerName)) ?? `Jogador #${playerId}`;

    await db.insert(matchCardsTable).values({
      matchId,
      side: "csa",
      cardType: c.cardType,
      lineupId: lineupIdByPlayer.get(playerId) ?? null,
      playerId,
      playerName,
      minute: normalizeEventMinute(c.minute),
      injuryTimeMinute:
        c.injuryTimeMinute == null || String(c.injuryTimeMinute).trim() === ""
          ? null
          : Number(c.injuryTimeMinute),
    });
  }

  for (const c of oppCards) {
    if (c.cardType !== "yellow" && c.cardType !== "red") {
      throw Object.assign(new Error("cardType deve ser yellow ou red"), {
        status: 400,
      });
    }
    const row = requireOpponentLineup(opp, c.playerId, c.playerName, "Cartão");
    await db.insert(matchCardsTable).values({
      matchId,
      side: "opponent",
      cardType: c.cardType,
      lineupId: row.id,
      playerId: row.playerId,
      playerName: row.playerName,
      minute: normalizeEventMinute(c.minute),
      injuryTimeMinute:
        c.injuryTimeMinute == null || String(c.injuryTimeMinute).trim() === ""
          ? null
          : Number(c.injuryTimeMinute),
    });
  }

  for (const mc of input.managerCards ?? []) {
    if (mc.cardType !== "yellow" && mc.cardType !== "red") {
      throw Object.assign(new Error("cardType do técnico deve ser yellow ou red"), {
        status: 400,
      });
    }
    await db.insert(matchManagerCardsTable).values({
      matchId,
      cardType: mc.cardType,
      minute: normalizeEventMinute(mc.minute),
      injuryTimeMinute:
        mc.injuryTimeMinute == null || String(mc.injuryTimeMinute).trim() === ""
          ? null
          : Number(mc.injuryTimeMinute),
    });
  }

  for (const pe of csaPens) {
    if (pe.eventType !== "missed" && pe.eventType !== "saved") {
      throw Object.assign(
        new Error("eventType de pênalti deve ser missed ou saved"),
        { status: 400 },
      );
    }
    const playerId = pe.playerId ?? null;
    if (!playerId || !lineupIdByPlayer.has(playerId)) {
      throw Object.assign(
        new Error("Evento de pênalti precisa ser de jogador escalado na CSA"),
        { status: 400 },
      );
    }
    const playerName =
      (await resolvePlayerName(playerId, pe.playerName)) ??
      `Jogador #${playerId}`;
    await db.insert(matchPenaltyEventsTable).values({
      matchId,
      side: "csa",
      eventType: pe.eventType,
      playerId,
      playerName,
      minute: normalizeEventMinute(pe.minute),
      injuryTimeMinute:
        pe.injuryTimeMinute == null || String(pe.injuryTimeMinute).trim() === ""
          ? null
          : Number(pe.injuryTimeMinute),
    });
  }

  for (const pe of oppPens) {
    if (pe.eventType !== "missed" && pe.eventType !== "saved") {
      throw Object.assign(
        new Error("eventType de pênalti deve ser missed ou saved"),
        { status: 400 },
      );
    }
    const row = requireOpponentLineup(
      opp,
      pe.playerId,
      pe.playerName,
      "Evento de pênalti",
    );
    await db.insert(matchPenaltyEventsTable).values({
      matchId,
      side: "opponent",
      eventType: pe.eventType,
      playerId: row.playerId,
      playerName: row.playerName,
      minute: normalizeEventMinute(pe.minute),
      injuryTimeMinute:
        pe.injuryTimeMinute == null || String(pe.injuryTimeMinute).trim() === ""
          ? null
          : Number(pe.injuryTimeMinute),
    });
  }

  if (input.captainPlayerId !== undefined) {
    if (input.captainPlayerId != null && !lineupIdByPlayer.has(input.captainPlayerId)) {
      throw Object.assign(
        new Error("Capitão precisa estar na escalação CSA"),
        { status: 400 },
      );
    }
    await db
      .update(matchesTable)
      .set({ captainPlayerId: input.captainPlayerId })
      .where(eq(matchesTable.id, matchId));
  }

  await ensureSecondYellowReds(matchId, lineupIdByPlayer);
  await syncOwnGoalsForCount(matchId);
  await syncSheetPlayerSeasonStats(matchId);
  return loadMatchSheet(matchId);
}

export async function deleteMatchGoal(matchId: number, goalId: number) {
  const [existing] = await db
    .select({
      scorerPlayerId: matchGoalsTable.scorerPlayerId,
      assistPlayerId: matchGoalsTable.assistPlayerId,
    })
    .from(matchGoalsTable)
    .where(
      and(eq(matchGoalsTable.id, goalId), eq(matchGoalsTable.matchId, matchId)),
    )
    .limit(1);
  const deleted = await db
    .delete(matchGoalsTable)
    .where(
      and(eq(matchGoalsTable.id, goalId), eq(matchGoalsTable.matchId, matchId)),
    )
    .returning({ id: matchGoalsTable.id });
  if (!deleted[0]) {
    throw Object.assign(new Error("Gol não encontrado"), { status: 404 });
  }
  await syncOwnGoalsForCount(matchId);
  await syncSheetPlayerSeasonStats(matchId, [
    existing?.scorerPlayerId ?? 0,
    existing?.assistPlayerId ?? 0,
  ]);
  return loadMatchSheet(matchId);
}

/** Patch CSA goal flags / minute without deleting and recreating. */
export async function updateMatchGoal(
  matchId: number,
  goalId: number,
  patch: {
    minute?: unknown;
    injuryTimeMinute?: unknown;
    isPenalty?: boolean;
    isFreeKick?: boolean;
  },
) {
  const [existing] = await db
    .select()
    .from(matchGoalsTable)
    .where(
      and(eq(matchGoalsTable.id, goalId), eq(matchGoalsTable.matchId, matchId)),
    )
    .limit(1);
  if (!existing) {
    throw Object.assign(new Error("Gol não encontrado"), { status: 404 });
  }

  const values: Partial<typeof matchGoalsTable.$inferInsert> = {};

  if (patch.minute !== undefined) {
    values.minute = normalizeEventMinute(patch.minute);
  }

  if (patch.injuryTimeMinute !== undefined) {
    const raw = patch.injuryTimeMinute;
    if (raw == null || raw === "") {
      values.injuryTimeMinute = null;
    } else {
      const n = typeof raw === "number" ? raw : Number(String(raw).trim());
      values.injuryTimeMinute =
        Number.isFinite(n) && !Number.isNaN(n) ? Math.trunc(n) : null;
    }
  }

  if (patch.isPenalty !== undefined || patch.isFreeKick !== undefined) {
    if (existing.isOwnGoal) {
      values.isPenalty = false;
      values.isFreeKick = false;
    } else {
      const isPenalty =
        patch.isPenalty !== undefined ? Boolean(patch.isPenalty) : existing.isPenalty;
      let isFreeKick =
        patch.isFreeKick !== undefined ? Boolean(patch.isFreeKick) : existing.isFreeKick;
      if (isPenalty) isFreeKick = false;
      values.isPenalty = isPenalty;
      values.isFreeKick = isFreeKick;
    }
  }

  if (Object.keys(values).length === 0) {
    return loadMatchSheet(matchId);
  }

  await db
    .update(matchGoalsTable)
    .set(values)
    .where(
      and(eq(matchGoalsTable.id, goalId), eq(matchGoalsTable.matchId, matchId)),
    );

  return loadMatchSheet(matchId);
}

export async function deleteMatchCard(matchId: number, cardId: number) {
  const deleted = await db
    .delete(matchCardsTable)
    .where(
      and(eq(matchCardsTable.id, cardId), eq(matchCardsTable.matchId, matchId)),
    )
    .returning({ id: matchCardsTable.id });
  if (!deleted[0]) {
    throw Object.assign(new Error("Cartão não encontrado"), { status: 404 });
  }
  return loadMatchSheet(matchId);
}

export async function deleteMatchManagerCard(matchId: number, cardId: number) {
  const deleted = await db
    .delete(matchManagerCardsTable)
    .where(
      and(
        eq(matchManagerCardsTable.id, cardId),
        eq(matchManagerCardsTable.matchId, matchId),
      ),
    )
    .returning({ id: matchManagerCardsTable.id });
  if (!deleted[0]) {
    throw Object.assign(new Error("Cartão do técnico não encontrado"), {
      status: 404,
    });
  }
  return loadMatchSheet(matchId);
}

export async function deleteMatchPenaltyEvent(matchId: number, eventId: number) {
  const deleted = await db
    .delete(matchPenaltyEventsTable)
    .where(
      and(
        eq(matchPenaltyEventsTable.id, eventId),
        eq(matchPenaltyEventsTable.matchId, matchId),
      ),
    )
    .returning({ id: matchPenaltyEventsTable.id });
  if (!deleted[0]) {
    throw Object.assign(new Error("Evento de pênalti não encontrado"), {
      status: 404,
    });
  }
  return loadMatchSheet(matchId);
}

/**
 * Legacy full replace (lineups + goals + cards + subs). Kept for CSV/AI paths.
 * Does not touch manager cards / captain unless provided via separate updates.
 */
export async function replaceCsaMatchSheet(
  matchId: number,
  input: {
    lineups?: LineupInput[];
    goals?: GoalInput[];
    cards?: CardInput[];
    substitutions?: SubstitutionInput[];
  },
) {
  await replaceCsaLineup(matchId, { lineups: input.lineups ?? [] });

  // Wipe CSA events then re-insert (legacy). Leave opponent events intact.
  await db
    .delete(matchGoalsTable)
    .where(
      and(eq(matchGoalsTable.matchId, matchId), eq(matchGoalsTable.side, "csa")),
    );
  await db
    .delete(matchCardsTable)
    .where(
      and(eq(matchCardsTable.matchId, matchId), eq(matchCardsTable.side, "csa")),
    );

  const lineupIdByPlayer = await loadCsaLineupMap(matchId);
  for (const g of (input.goals ?? []).filter((x) => !x.side || x.side === "csa")) {
    await insertGoalRow(matchId, g, lineupIdByPlayer);
  }
  for (const c of (input.cards ?? []).filter((x) => !x.side || x.side === "csa")) {
    if (c.cardType !== "yellow" && c.cardType !== "red") {
      throw Object.assign(new Error("cardType deve ser yellow ou red"), {
        status: 400,
      });
    }
    const playerId = c.playerId ?? null;
    if (!playerId || !lineupIdByPlayer.has(playerId)) {
      throw Object.assign(
        new Error("Cartão precisa ser de jogador escalado na CSA"),
        { status: 400 },
      );
    }
    const playerName =
      (await resolvePlayerName(playerId, c.playerName)) ?? `Jogador #${playerId}`;
    await db.insert(matchCardsTable).values({
      matchId,
      side: "csa",
      cardType: c.cardType,
      lineupId: lineupIdByPlayer.get(playerId) ?? null,
      playerId,
      playerName,
      minute: normalizeEventMinute(c.minute),
      injuryTimeMinute:
        c.injuryTimeMinute == null || String(c.injuryTimeMinute).trim() === ""
          ? null
          : Number(c.injuryTimeMinute),
    });
  }

  await replaceCsaSubstitutions(matchId, input.substitutions ?? []);
  await ensureSecondYellowReds(matchId, lineupIdByPlayer);
  await syncOwnGoalsForCount(matchId);
  await syncSheetPlayerSeasonStats(matchId);
  return loadMatchSheet(matchId);
}
