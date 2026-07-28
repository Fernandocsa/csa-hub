import { and, eq, ne, isNotNull, type SQL } from "drizzle-orm";
import { matchesTable } from "@workspace/db";

/**
 * Official matches that already count toward historical stats / rankings.
 * Excludes friendlies, scheduled fixtures, and unknown-result placeholders.
 * Walkovers are included here (they count in aggregates) unless a caller
 * adds an extra `is_walkover = false` filter.
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
 * (maiores vitórias/derrotas). Excludes W.O. and null placares.
 */
export function scoredFieldMatchConditions(): SQL | undefined {
  return and(
    officialPlayedMatchConditions(),
    eq(matchesTable.isWalkover, false),
    isNotNull(matchesTable.goalsFor),
    isNotNull(matchesTable.goalsAgainst),
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
