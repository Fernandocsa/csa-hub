/**
 * 2016 only: delete CSA substitutions without minute (0 / 200 / null)
 * on matches that already have timed substitutions.
 *
 * Usage: node scripts/fix-2016-duplicate-untimed-subs.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows } = await c.query(`
    SELECT s.id, s.match_id, m.match_date::date AS d, o.name AS opp,
           s.player_in_name, s.player_out_name, s.minute
    FROM match_substitutions s
    JOIN matches m ON m.id = s.match_id
    JOIN opponents o ON o.id = m.opponent_id
    WHERE m.season = '2016'
      AND s.side = 'csa'
      AND (s.minute IS NULL OR s.minute IN (0, 200))
      AND EXISTS (
        SELECT 1
        FROM match_substitutions t
        WHERE t.match_id = s.match_id
          AND t.side = 'csa'
          AND t.minute IS NOT NULL
          AND t.minute NOT IN (0, 200)
      )
    ORDER BY m.match_date, s.match_id, s.id
  `);

  console.log(`rows to delete: ${rows.length}`);
  const byMatch = new Map();
  for (const r of rows) {
    if (!byMatch.has(r.match_id)) byMatch.set(r.match_id, []);
    byMatch.get(r.match_id).push(r);
  }
  console.log(`matches affected: ${byMatch.size}`);
  for (const [mid, list] of byMatch) {
    console.log(
      `  #${mid} ${String(list[0].d).slice(0, 10)} vs ${list[0].opp}: ${list.length} untimed`,
    );
  }

  await c.query("BEGIN");
  if (!DRY && rows.length) {
    const ids = rows.map((r) => r.id);
    const del = await c.query(
      `DELETE FROM match_substitutions WHERE id = ANY($1::int[]) RETURNING id`,
      [ids],
    );
    console.log(`deleted: ${del.rowCount}`);
  }

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
    console.log(
      "remaining 2016 CSA untimed",
      (
        await c.query(`
          SELECT s.match_id, count(*)::int n, array_agg(s.minute) minutes
          FROM match_substitutions s
          JOIN matches m ON m.id = s.match_id
          WHERE m.season='2016' AND s.side='csa'
            AND (s.minute IS NULL OR s.minute IN (0,200))
          GROUP BY s.match_id
          ORDER BY 1
        `)
      ).rows,
    );
    console.log(
      "2016 CSA sub total",
      (
        await c.query(`
          SELECT count(*)::int n FROM match_substitutions s
          JOIN matches m ON m.id=s.match_id
          WHERE m.season='2016' AND s.side='csa'
        `)
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
