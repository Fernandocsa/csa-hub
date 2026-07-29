import { and, eq, ne } from "drizzle-orm";
import { db, matchesTable } from "@workspace/db";

/**
 * Set A.relatedMatchId = B and keep the reverse link B → A in sync.
 * Clears previous reverse links when the pair changes.
 * Does not touch result / goals / stats.
 */
export async function syncRelatedMatchLink(
  matchId: number,
  relatedMatchId: number | null,
): Promise<void> {
  if (relatedMatchId != null && relatedMatchId === matchId) {
    throw Object.assign(new Error("Partida relacionada não pode ser ela mesma"), {
      status: 400,
    });
  }

  const [current] = await db
    .select({ relatedMatchId: matchesTable.relatedMatchId })
    .from(matchesTable)
    .where(eq(matchesTable.id, matchId))
    .limit(1);
  if (!current) {
    throw Object.assign(new Error("Partida não encontrada"), { status: 404 });
  }

  const oldRelated = current.relatedMatchId ?? null;

  if (oldRelated != null && oldRelated !== relatedMatchId) {
    await db
      .update(matchesTable)
      .set({ relatedMatchId: null })
      .where(
        and(
          eq(matchesTable.id, oldRelated),
          eq(matchesTable.relatedMatchId, matchId),
        ),
      );
  }

  await db
    .update(matchesTable)
    .set({ relatedMatchId })
    .where(eq(matchesTable.id, matchId));

  if (relatedMatchId == null) return;

  const [other] = await db
    .select({ relatedMatchId: matchesTable.relatedMatchId })
    .from(matchesTable)
    .where(eq(matchesTable.id, relatedMatchId))
    .limit(1);
  if (!other) {
    throw Object.assign(new Error("Partida relacionada não encontrada"), {
      status: 400,
    });
  }

  const otherOld = other.relatedMatchId ?? null;
  if (otherOld != null && otherOld !== matchId) {
    await db
      .update(matchesTable)
      .set({ relatedMatchId: null })
      .where(
        and(
          eq(matchesTable.id, otherOld),
          eq(matchesTable.relatedMatchId, relatedMatchId),
        ),
      );
  }

  await db
    .update(matchesTable)
    .set({ relatedMatchId: matchId })
    .where(eq(matchesTable.id, relatedMatchId));

  // Ensure no third match still points at this one as related (except the pair).
  await db
    .update(matchesTable)
    .set({ relatedMatchId: null })
    .where(
      and(
        eq(matchesTable.relatedMatchId, matchId),
        ne(matchesTable.id, relatedMatchId),
      ),
    );
}

function parseOptionalNonNegInt(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/** Parse shootout pair. Both null = no shootout. One-sided values rejected. */
export function parsePenaltyShootoutFields(body: {
  penaltiesFor?: unknown;
  penaltiesAgainst?: unknown;
}): { penaltiesFor: number | null; penaltiesAgainst: number | null } | undefined {
  if (body.penaltiesFor === undefined && body.penaltiesAgainst === undefined) {
    return undefined;
  }
  const pf = parseOptionalNonNegInt(body.penaltiesFor ?? null);
  const pa = parseOptionalNonNegInt(body.penaltiesAgainst ?? null);
  if (pf == null && pa == null) {
    return { penaltiesFor: null, penaltiesAgainst: null };
  }
  if (pf == null || pa == null) {
    throw Object.assign(
      new Error("Informe os dois placares de pênaltis (CSA e adversário), ou deixe ambos vazios"),
      { status: 400 },
    );
  }
  return { penaltiesFor: pf, penaltiesAgainst: pa };
}
