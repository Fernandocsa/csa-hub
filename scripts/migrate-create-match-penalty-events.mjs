/**
 * Create match_penalty_events for missed/saved penalties (Ogol A / C).
 * Never counts as goals.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-match-penalty-events ===");
  const sql = readFileSync("lib/db/sql/create-match-penalty-events.sql", "utf8");
  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_penalty_events'
    ORDER BY ordinal_position
  `);
  const cols = rows.map((r) => r.column_name);
  for (const c of [
    "id",
    "match_id",
    "side",
    "event_type",
    "player_id",
    "player_name",
    "minute",
    "injury_time_minute",
  ]) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }

  console.log("OK match_penalty_events ready:", cols.join(", "));
} finally {
  await pool.end();
}
