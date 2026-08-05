/**
 * Mark 2016 as fully verified + verify players who appear on CSA sheets
 * ONLY in season 2016 (unused bench included; multi-season players skipped).
 *
 * Usage: node scripts/verify-season-2016.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const YEAR = "2016";
const VERIFIED_BY = "Portal Marujo";
const pool = createPgPool();
const c = await pool.connect();

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows: exclusive } = await c.query(
    `
    WITH seasons_by_player AS (
      SELECT l.player_id,
             array_agg(DISTINCT m.season ORDER BY m.season) AS seasons
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.side = 'csa' AND l.player_id IS NOT NULL
      GROUP BY l.player_id
    )
    SELECT p.id, p.name, p.verification_status
    FROM seasons_by_player s
    JOIN players p ON p.id = s.player_id
    WHERE s.seasons = ARRAY[$1]::text[]
    ORDER BY p.name
    `,
    [YEAR],
  );

  const toVerify = exclusive.filter((r) => r.verification_status !== "verified");
  const already = exclusive.filter((r) => r.verification_status === "verified");

  console.log(`exclusive ${YEAR} players: ${exclusive.length}`);
  console.log(`already verified: ${already.length}`);
  console.log(`to verify: ${toVerify.length}`);
  for (const r of toVerify) console.log(`  #${r.id} ${r.name}`);

  await c.query("BEGIN");

  let playerUpdated = 0;
  if (toVerify.length) {
    const ids = toVerify.map((r) => r.id);
    if (!DRY) {
      const upd = await c.query(
        `
        UPDATE players
        SET verification_status = 'verified',
            verified_at = now(),
            verified_by = $2
        WHERE id = ANY($1::int[])
          AND verification_status IS DISTINCT FROM 'verified'
        RETURNING id, name
        `,
        [ids, VERIFIED_BY],
      );
      playerUpdated = upd.rowCount ?? 0;
    } else {
      playerUpdated = toVerify.length;
    }
  }

  const seasonBefore = (
    await c.query(
      `SELECT year, stats_fully_verified, stats_verified_at FROM seasons WHERE year = $1`,
      [Number(YEAR)],
    )
  ).rows[0];
  console.log("season before", seasonBefore);

  if (!seasonBefore) throw new Error(`season ${YEAR} missing from seasons table`);

  if (!DRY) {
    await c.query(
      `
      UPDATE seasons
      SET stats_fully_verified = true,
          stats_verified_at = now()
      WHERE year = $1
      `,
      [Number(YEAR)],
    );
  }

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
    console.log(`players newly verified: ${playerUpdated}`);
    console.log(
      "season after",
      (
        await c.query(
          `SELECT year, stats_fully_verified, stats_verified_at FROM seasons WHERE year = $1`,
          [Number(YEAR)],
        )
      ).rows[0],
    );
    console.log(
      "exclusive now verified",
      (
        await c.query(
          `
          WITH seasons_by_player AS (
            SELECT l.player_id,
                   array_agg(DISTINCT m.season ORDER BY m.season) AS seasons
            FROM match_lineups l
            JOIN matches m ON m.id = l.match_id
            WHERE l.side = 'csa' AND l.player_id IS NOT NULL
            GROUP BY l.player_id
          )
          SELECT count(*)::int n
          FROM seasons_by_player s
          JOIN players p ON p.id = s.player_id
          WHERE s.seasons = ARRAY[$1]::text[]
            AND p.verification_status = 'verified'
          `,
          [YEAR],
        )
      ).rows[0],
    );
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
