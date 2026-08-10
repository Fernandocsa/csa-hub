import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const VERIFIED_BY = "Portal Marujo";

export type ExclusiveSeasonVerificationResult = {
  playersVerified: number;
  managersVerified: number;
  playersUnverified: number;
  managersUnverified: number;
};

/**
 * Players whose entire CSA history (lineups + roster seasons) is exactly `year`.
 */
async function updateExclusivePlayers(
  year: number,
  verified: boolean,
): Promise<number> {
  const seasonKey = String(year);
  if (verified) {
    const result = await db.execute(sql`
      UPDATE players p
      SET verification_status = 'verified',
          verified_at = now(),
          verified_by = ${VERIFIED_BY}
      WHERE p.id IN (
        SELECT s.player_id
        FROM (
          SELECT t.player_id,
                 array_agg(DISTINCT t.season ORDER BY t.season) AS seasons
          FROM (
            SELECT l.player_id, m.season
            FROM match_lineups l
            JOIN matches m ON m.id = l.match_id
            WHERE l.side = 'csa' AND l.player_id IS NOT NULL
            UNION
            SELECT pss.player_id, pss.season
            FROM player_season_stats pss
          ) t
          GROUP BY t.player_id
        ) s
        WHERE s.seasons = ARRAY[${seasonKey}]::text[]
      )
      AND p.verification_status IS DISTINCT FROM 'verified'
      RETURNING p.id
    `);
    return (result.rows as unknown[]).length;
  }

  const result = await db.execute(sql`
    UPDATE players p
    SET verification_status = 'unverified',
        verified_at = NULL,
        verified_by = NULL
    WHERE p.id IN (
      SELECT s.player_id
      FROM (
        SELECT t.player_id,
               array_agg(DISTINCT t.season ORDER BY t.season) AS seasons
        FROM (
          SELECT l.player_id, m.season
          FROM match_lineups l
          JOIN matches m ON m.id = l.match_id
          WHERE l.side = 'csa' AND l.player_id IS NOT NULL
          UNION
          SELECT pss.player_id, pss.season
          FROM player_season_stats pss
        ) t
        GROUP BY t.player_id
      ) s
      WHERE s.seasons = ARRAY[${seasonKey}]::text[]
    )
    AND p.verification_status = 'verified'
    RETURNING p.id
  `);
  return (result.rows as unknown[]).length;
}

/**
 * Head coaches whose entire CSA history (matches + season rows) is exactly `year`.
 * Commission roles (assistant/doctor/…) are ignored.
 */
async function updateExclusiveManagers(
  year: number,
  verified: boolean,
): Promise<number> {
  const seasonKey = String(year);
  if (verified) {
    const result = await db.execute(sql`
      UPDATE managers m
      SET verification_status = 'verified',
          verified_at = now(),
          verified_by = ${VERIFIED_BY}
      WHERE m.staff_role = 'manager'
        AND m.id IN (
          SELECT s.manager_id
          FROM (
            SELECT t.manager_id,
                   array_agg(DISTINCT t.season ORDER BY t.season) AS seasons
            FROM (
              SELECT mss.manager_id, mss.season
              FROM manager_season_stats mss
              UNION
              SELECT mt.manager_id, mt.season
              FROM matches mt
              WHERE mt.manager_id IS NOT NULL
            ) t
            GROUP BY t.manager_id
          ) s
          WHERE s.seasons = ARRAY[${seasonKey}]::text[]
        )
        AND m.verification_status IS DISTINCT FROM 'verified'
      RETURNING m.id
    `);
    return (result.rows as unknown[]).length;
  }

  const result = await db.execute(sql`
    UPDATE managers m
    SET verification_status = 'unverified',
        verified_at = NULL,
        verified_by = NULL
    WHERE m.staff_role = 'manager'
      AND m.id IN (
        SELECT s.manager_id
        FROM (
          SELECT t.manager_id,
                 array_agg(DISTINCT t.season ORDER BY t.season) AS seasons
          FROM (
            SELECT mss.manager_id, mss.season
            FROM manager_season_stats mss
            UNION
            SELECT mt.manager_id, mt.season
            FROM matches mt
            WHERE mt.manager_id IS NOT NULL
          ) t
          GROUP BY t.manager_id
        ) s
        WHERE s.seasons = ARRAY[${seasonKey}]::text[]
      )
      AND m.verification_status = 'verified'
    RETURNING m.id
  `);
  return (result.rows as unknown[]).length;
}

/**
 * When a season is marked fully verified, auto-seal players and coaches
 * who only appear in that season. On unverify, remove those seals.
 */
export async function syncExclusiveSeasonVerification(
  year: number,
  verified: boolean,
): Promise<ExclusiveSeasonVerificationResult> {
  const players = await updateExclusivePlayers(year, verified);
  const managers = await updateExclusiveManagers(year, verified);
  if (verified) {
    return {
      playersVerified: players,
      managersVerified: managers,
      playersUnverified: 0,
      managersUnverified: 0,
    };
  }
  return {
    playersVerified: 0,
    managersVerified: 0,
    playersUnverified: players,
    managersUnverified: managers,
  };
}
