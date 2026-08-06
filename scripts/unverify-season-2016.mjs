/**
 * Roll back 2016 season verification (still in progress):
 * - stats_fully_verified = false
 * - clear auto badges for 2016
 * Then sync player seals against remaining verified seasons.
 *
 * Usage: node scripts/unverify-season-2016.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const YEAR = 2016;
const pool = createPgPool();
const c = await pool.connect();

try {
  console.log(DRY ? "DRY" : "APPLY");

  const before = (
    await c.query(
      `SELECT year, stats_fully_verified, stats_verified_at FROM seasons WHERE year=$1`,
      [YEAR],
    )
  ).rows[0];
  console.log("season before", before);

  const badgesBefore = (
    await c.query(
      `SELECT b.entity_id, p.name, b.label, b.auto_kind
       FROM entity_badges b
       LEFT JOIN players p ON p.id=b.entity_id AND b.entity_type='player'
       WHERE b.season_year=$1 AND b.source='auto'
       ORDER BY b.auto_kind, p.name`,
      [YEAR],
    )
  ).rows;
  console.log(`auto badges before: ${badgesBefore.length}`);
  for (const r of badgesBefore) console.log(" ", r);

  // Players currently verified who have 2016 in lineup seasons
  const affected = (
    await c.query(
      `
      WITH seasons_by_player AS (
        SELECT l.player_id,
               array_agg(DISTINCT m.season ORDER BY m.season) AS seasons
        FROM match_lineups l
        JOIN matches m ON m.id = l.match_id
        WHERE l.side='csa' AND l.player_id IS NOT NULL
        GROUP BY l.player_id
      )
      SELECT p.id, p.name, p.verification_status, s.seasons
      FROM seasons_by_player s
      JOIN players p ON p.id = s.player_id
      WHERE p.verification_status = 'verified'
        AND $1::text = ANY(s.seasons)
      ORDER BY p.name
      `,
      [String(YEAR)],
    )
  ).rows;
  console.log(`currently verified players with ${YEAR} in career: ${affected.length}`);
  for (const r of affected.slice(0, 30)) {
    console.log(`  #${r.id} ${r.name} | ${(r.seasons || []).join(",")}`);
  }
  if (affected.length > 30) console.log(`  ... +${affected.length - 30} more`);

  if (DRY) {
    console.log("DRY — no writes");
  } else {
    await c.query("BEGIN");
    await c.query(
      `UPDATE seasons
       SET stats_fully_verified = false, stats_verified_at = NULL
       WHERE year = $1`,
      [YEAR],
    );
    const del = await c.query(
      `DELETE FROM entity_badges
       WHERE source='auto' AND season_year=$1
       RETURNING id`,
      [YEAR],
    );
    console.log(`removed auto badges: ${del.rowCount}`);
    await c.query("COMMIT");
    console.log("season unverified + badges cleared");
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
