/**
 * Create season_competition_stats table.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-season-competition-stats ===");
  const sql = readFileSync(
    "lib/db/sql/create-season-competition-stats.sql",
    "utf8",
  );
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'season_competition_stats'
    ORDER BY ordinal_position
  `);
  console.log(
    "OK columns:",
    rows.map((r) => r.column_name).join(", "),
  );
  if (rows.length < 10) throw new Error("table incomplete");
} finally {
  await pool.end();
}
