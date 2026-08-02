import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-player-season-shirt-number ===");
  const { rows: before } = await pool.query(`
    SELECT count(*)::int AS n FROM (
      SELECT player_id, season FROM player_season_stats
      GROUP BY player_id, season HAVING count(*) > 1
    ) d
  `);
  console.log("duplicate_pairs_before", before[0].n);

  const sql = readFileSync(
    "lib/db/sql/alter-player-season-shirt-number.sql",
    "utf8",
  );
  await pool.query(sql);

  const { rows: cols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'player_season_stats' AND column_name = 'shirt_number'
  `);
  if (!cols[0]) throw new Error("shirt_number missing");

  const { rows: uq } = await pool.query(`
    SELECT 1 FROM pg_constraint WHERE conname = 'player_season_stats_player_season_uidx'
  `);
  if (!uq[0]) throw new Error("unique constraint missing");

  const { rows: after } = await pool.query(`
    SELECT count(*)::int AS n FROM (
      SELECT player_id, season FROM player_season_stats
      GROUP BY player_id, season HAVING count(*) > 1
    ) d
  `);
  console.log("OK shirt_number + unique; duplicate_pairs_after", after[0].n);
} finally {
  await pool.end();
}
