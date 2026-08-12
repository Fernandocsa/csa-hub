import { db } from "@workspace/db";
import { seasonsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const VERIFIED_BY = "Portal Marujo";

export type ExclusiveSeasonVerificationResult = {
  playersVerified: number;
  managersVerified: number;
  playersUnverified: number;
  managersUnverified: number;
};

function verifiedSeasonsSql(years: string[]) {
  if (!years.length) return sql`ARRAY[]::text[]`;
  return sql`ARRAY[${sql.join(
    years.map((y) => sql`${y}`),
    sql`, `,
  )}]::text[]`;
}

async function loadVerifiedSeasonKeys(): Promise<string[]> {
  const rows = await db
    .select({ year: seasonsTable.year })
    .from(seasonsTable)
    .where(eq(seasonsTable.statsFullyVerified, true));
  return rows.map((r) => String(r.year)).sort();
}

async function syncPlayers(
  verifiedArr: ReturnType<typeof verifiedSeasonsSql>,
): Promise<{ verified: number; unverified: number }> {
  const verifyResult = await db.execute(sql`
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
      WHERE s.seasons <@ ${verifiedArr}
    )
    AND p.verification_status IS DISTINCT FROM 'verified'
    RETURNING p.id
  `);

  const unverifyResult = await db.execute(sql`
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
      WHERE NOT (s.seasons <@ ${verifiedArr})
    )
    AND p.verification_status = 'verified'
    RETURNING p.id
  `);

  return {
    verified: (verifyResult.rows as unknown[]).length,
    unverified: (unverifyResult.rows as unknown[]).length,
  };
}

async function syncManagers(
  verifiedArr: ReturnType<typeof verifiedSeasonsSql>,
): Promise<{ verified: number; unverified: number }> {
  const verifyResult = await db.execute(sql`
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
        WHERE s.seasons <@ ${verifiedArr}
      )
      AND m.verification_status IS DISTINCT FROM 'verified'
    RETURNING m.id
  `);

  const unverifyResult = await db.execute(sql`
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
        WHERE NOT (s.seasons <@ ${verifiedArr})
      )
      AND m.verification_status = 'verified'
    RETURNING m.id
  `);

  return {
    verified: (verifyResult.rows as unknown[]).length,
    unverified: (unverifyResult.rows as unknown[]).length,
  };
}

/**
 * Seal players/coaches whose entire CSA history sits inside currently
 * verified seasons. Anyone with an unverified season loses the seal.
 */
export async function syncCareerVerificationFromSeasons(): Promise<ExclusiveSeasonVerificationResult> {
  const years = await loadVerifiedSeasonKeys();
  const verifiedArr = verifiedSeasonsSql(years);
  const players = await syncPlayers(verifiedArr);
  const managers = await syncManagers(verifiedArr);
  return {
    playersVerified: players.verified,
    managersVerified: managers.verified,
    playersUnverified: players.unverified,
    managersUnverified: managers.unverified,
  };
}

/** @deprecated use syncCareerVerificationFromSeasons */
export async function syncExclusiveSeasonVerification(
  _year: number,
  _verified: boolean,
): Promise<ExclusiveSeasonVerificationResult> {
  return syncCareerVerificationFromSeasons();
}
