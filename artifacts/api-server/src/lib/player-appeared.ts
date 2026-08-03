import { sql, type SQL } from "drizzle-orm";
import { matchLineupsTable, matchSubstitutionsTable } from "@workspace/db";

/**
 * True when a CSA lineup row is an actual appearance:
 * starter, or bench player who entered via substitution.
 * Unused reserves (named on the sheet, never came on) do not count.
 */
export function csaLineupActuallyPlayedCondition(): SQL {
  return sql`(
    ${matchLineupsTable.role} = 'starter'
    OR EXISTS (
      SELECT 1
      FROM ${matchSubstitutionsTable}
      WHERE ${matchSubstitutionsTable.matchId} = ${matchLineupsTable.matchId}
        AND ${matchSubstitutionsTable.side} = 'csa'
        AND ${matchSubstitutionsTable.playerInId} IS NOT NULL
        AND ${matchSubstitutionsTable.playerInId} = ${matchLineupsTable.playerId}
    )
  )`;
}

/**
 * True when the player was on the bench and entered as a substitute
 * (never started that match).
 */
export function csaLineupCameOnAsSubCondition(): SQL {
  return sql`(
    ${matchLineupsTable.role} = 'bench'
    AND EXISTS (
      SELECT 1
      FROM ${matchSubstitutionsTable}
      WHERE ${matchSubstitutionsTable.matchId} = ${matchLineupsTable.matchId}
        AND ${matchSubstitutionsTable.side} = 'csa'
        AND ${matchSubstitutionsTable.playerInId} IS NOT NULL
        AND ${matchSubstitutionsTable.playerInId} = ${matchLineupsTable.playerId}
    )
  )`;
}

/**
 * True when the player was named on the bench and never came on
 * (unused reserve — related but did not enter the field).
 */
export function csaLineupUnusedBenchCondition(): SQL {
  return sql`(
    ${matchLineupsTable.role} = 'bench'
    AND NOT EXISTS (
      SELECT 1
      FROM ${matchSubstitutionsTable}
      WHERE ${matchSubstitutionsTable.matchId} = ${matchLineupsTable.matchId}
        AND ${matchSubstitutionsTable.side} = 'csa'
        AND ${matchSubstitutionsTable.playerInId} IS NOT NULL
        AND ${matchSubstitutionsTable.playerInId} = ${matchLineupsTable.playerId}
    )
  )`;
}
