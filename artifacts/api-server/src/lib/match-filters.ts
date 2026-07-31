import { and, eq, ne, isNotNull, type SQL } from "drizzle-orm";
import { matchesTable } from "@workspace/db";

/**
 * Official matches that already count toward historical stats / rankings.
 * Excludes friendlies, scheduled fixtures, and unknown-result placeholders.
 *
 * Walkovers (is_walkover) ARE included: they are official results, conventionally
 * recorded as 1–0 (win) or 0–1 (loss) at match level — no player goals credited.
 */
export function officialPlayedMatchConditions(): SQL | undefined {
  return and(
    eq(matchesTable.isFriendly, false),
    ne(matchesTable.status, "scheduled"),
    ne(matchesTable.result, "unknown"),
  );
}

/**
 * Official field matches with a known score — for margin rankings
 * (maiores vitórias/derrotas). Excludes W.O. (even when scored 1–0) and null placares.
 */
export function scoredFieldMatchConditions(): SQL | undefined {
  return and(
    officialPlayedMatchConditions(),
    eq(matchesTable.isWalkover, false),
    isNotNull(matchesTable.goalsFor),
    isNotNull(matchesTable.goalsAgainst),
  );
}

/**
 * Matches that count toward club/player records (artilheiros, sequências, etc.).
 * Excludes friendlies and walkovers.
 */
export function recordsMatchConditions(): SQL | undefined {
  return and(
    officialPlayedMatchConditions(),
    eq(matchesTable.isWalkover, false),
  );
}

/** Future fixtures (Home "próximo jogo", admin calendário). */
export function scheduledMatchConditions(): SQL | undefined {
  return eq(matchesTable.status, "scheduled");
}

/** Historical unknown scores — not future fixtures. */
export function unknownResultMatchConditions(): SQL | undefined {
  return and(
    eq(matchesTable.result, "unknown"),
    ne(matchesTable.status, "scheduled"),
    eq(matchesTable.isFriendly, false),
    eq(matchesTable.isWalkover, false),
  );
}
