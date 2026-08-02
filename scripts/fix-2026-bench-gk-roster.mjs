/**
 * Link Lucas Matheus (445) and Pedro Ariel (1667) to the 2026 season roster.
 *
 * They appear on CSA benches in 2026 lineups but never got player_season_stats
 * rows, so /temporadas/2026 omitted them (season page reads only PSS).
 *
 * Appearances stay 0 — neither entered via substitution.
 *
 * Usage: node scripts/fix-2026-bench-gk-roster.mjs [--dry-run]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const dryRun = process.argv.includes("--dry-run");
loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const LINKS = [
  { id: 445, name: "Lucas Matheus", season: "2026", shirt: 12 },
  { id: 1667, name: "Pedro Ariel", season: "2026", shirt: 23 },
];

try {
  if (!dryRun) await client.query("BEGIN");

  const results = [];
  for (const p of LINKS) {
    const { rows: existing } = await client.query(
      `SELECT id, appearances, goals, assists, shirt_number
       FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [p.id, p.season],
    );

    if (existing[0]) {
      if (!dryRun && existing[0].shirt_number == null && p.shirt != null) {
        await client.query(
          `UPDATE player_season_stats SET shirt_number=$2 WHERE id=$1`,
          [existing[0].id, p.shirt],
        );
      }
      results.push({ ...p, action: "exists", row: existing[0] });
      continue;
    }

    if (!dryRun) {
      const { rows } = await client.query(
        `INSERT INTO player_season_stats
           (player_id, season, appearances, goals, assists, shirt_number)
         VALUES ($1, $2, 0, 0, 0, $3)
         RETURNING id, appearances, goals, assists, shirt_number`,
        [p.id, p.season, p.shirt],
      );
      results.push({ ...p, action: "inserted", row: rows[0] });
    } else {
      results.push({ ...p, action: "would-insert" });
    }
  }

  if (!dryRun) await client.query("COMMIT");

  const { rows: gks } = await pool.query(`
    SELECT p.id, p.name, pss.appearances, pss.shirt_number
    FROM player_season_stats pss
    JOIN players p ON p.id = pss.player_id
    WHERE pss.season = '2026'
      AND (p.position ILIKE '%goleiro%' OR p.position = 'GK')
    ORDER BY pss.appearances DESC, p.name
  `);

  console.log(JSON.stringify({ dryRun, results, gkRoster2026: gks }, null, 2));
} catch (e) {
  if (!dryRun) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
