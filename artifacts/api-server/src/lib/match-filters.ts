import { and, eq, ne, type SQL } from "drizzle-orm";
import { matchesTable } from "@workspace/db";

/**
 * Official matches that already count toward historical stats / rankings.
 * Excludes friendlies, scheduled fixtures, and unknown-result placeholders.
 */
export function officialPlayedMatchConditions(): SQL | undefined {
  return and(
    eq(matchesTable.isFriendly, false),
    ne(matchesTable.status, "scheduled"),
    ne(matchesTable.result, "unknown"),
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
