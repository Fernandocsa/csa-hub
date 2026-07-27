import { db } from "@workspace/db";
import {
  matchLineupsTable,
  matchGoalsTable,
  matchCardsTable,
  playersTable,
} from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";

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
  minute: number;
  injuryTimeMinute?: number | null;
  assistPlayerId?: number | null;
  assistName?: string | null;
  side?: MatchSheetSide;
};

export type CardInput = {
  cardType: "yellow" | "red" | string;
  playerId?: number | null;
  playerName?: string | null;
  minute: number;
  injuryTimeMinute?: number | null;
  side?: MatchSheetSide;
};

export function serializeLineup(row: typeof matchLineupsTable.$inferSelect) {
  return {
    id: row.id,
    matchId: row.matchId,
    side: row.side,
    playerId: row.playerId,
    playerName: row.playerName,
    role: row.role,
    shirtNumber: row.shirtNumber,
    position: row.position,
    sortOrder: row.sortOrder,
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

export async function loadMatchSheet(matchId: number) {
  const [lineups, goals, cards] = await Promise.all([
    db
      .select()
      .from(matchLineupsTable)
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
  ]);

  return {
    lineups: lineups.map(serializeLineup),
    goals: goals.map(serializeGoal),
    cards: cards.map(serializeCard),
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

/**
 * Replace the full CSA match sheet for a match (delete + insert).
 * Phase 1: only persists side = 'csa'.
 */
export async function replaceCsaMatchSheet(
  matchId: number,
  input: {
    lineups?: LineupInput[];
    goals?: GoalInput[];
    cards?: CardInput[];
  },
) {
  const lineupsIn = (input.lineups ?? []).filter(
    (l) => !l.side || l.side === "csa",
  );
  const goalsIn = (input.goals ?? []).filter((g) => !g.side || g.side === "csa");
  const cardsIn = (input.cards ?? []).filter((c) => !c.side || c.side === "csa");

  // Validate CSA lineups require playerId
  for (const l of lineupsIn) {
    if (!l.playerId) {
      throw Object.assign(new Error("Cada jogador da escalação CSA precisa de playerId"), {
        status: 400,
      });
    }
    if (l.role !== "starter" && l.role !== "bench") {
      throw Object.assign(new Error("role deve ser starter ou bench"), { status: 400 });
    }
  }

  // Delete dependents first (goals/cards reference lineups)
  await db.delete(matchGoalsTable).where(eq(matchGoalsTable.matchId, matchId));
  await db.delete(matchCardsTable).where(eq(matchCardsTable.matchId, matchId));
  await db
    .delete(matchLineupsTable)
    .where(
      and(eq(matchLineupsTable.matchId, matchId), eq(matchLineupsTable.side, "csa")),
    );

  const lineupIdByPlayer = new Map<number, number>();

  for (let i = 0; i < lineupsIn.length; i++) {
    const l = lineupsIn[i];
    const playerId = l.playerId as number;
    const playerName =
      (await resolvePlayerName(playerId, l.playerName)) ?? `Jogador #${playerId}`;

    const [row] = await db
      .insert(matchLineupsTable)
      .values({
        matchId,
        side: "csa",
        playerId,
        playerName,
        role: l.role,
        shirtNumber: l.shirtNumber ?? null,
        position: l.position?.trim() || null,
        sortOrder: l.sortOrder ?? i,
      })
      .returning();

    lineupIdByPlayer.set(playerId, row.id);
  }

  for (const g of goalsIn) {
    if (g.minute == null || Number.isNaN(Number(g.minute))) {
      throw Object.assign(new Error("Gol precisa de minuto"), { status: 400 });
    }
    const scorerPlayerId = g.scorerPlayerId ?? null;
    if (!scorerPlayerId || !lineupIdByPlayer.has(scorerPlayerId)) {
      throw Object.assign(
        new Error("Autor do gol precisa estar na escalação CSA"),
        { status: 400 },
      );
    }
    const scorerName =
      (await resolvePlayerName(scorerPlayerId, g.scorerName)) ??
      `Jogador #${scorerPlayerId}`;

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

    await db.insert(matchGoalsTable).values({
      matchId,
      side: "csa",
      scorerLineupId: lineupIdByPlayer.get(scorerPlayerId) ?? null,
      scorerPlayerId,
      scorerName,
      minute: Number(g.minute),
      injuryTimeMinute:
        g.injuryTimeMinute == null ? null : Number(g.injuryTimeMinute),
      assistLineupId,
      assistPlayerId,
      assistName,
    });
  }

  for (const c of cardsIn) {
    if (c.cardType !== "yellow" && c.cardType !== "red") {
      throw Object.assign(new Error("cardType deve ser yellow ou red"), {
        status: 400,
      });
    }
    if (c.minute == null || Number.isNaN(Number(c.minute))) {
      throw Object.assign(new Error("Cartão precisa de minuto"), { status: 400 });
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
      minute: Number(c.minute),
      injuryTimeMinute:
        c.injuryTimeMinute == null ? null : Number(c.injuryTimeMinute),
    });
  }

  return loadMatchSheet(matchId);
}
