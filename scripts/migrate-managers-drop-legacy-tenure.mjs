/**
 * Drop managers.start_year / end_year / seasons after season-stats cutover.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-managers-drop-legacy-tenure ===");
  const sql = readFileSync("lib/db/sql/alter-managers-drop-legacy-tenure.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'managers'
      AND column_name IN ('start_year', 'end_year', 'seasons')
  `);
  if (rows.length > 0) {
    throw new Error(`columns still present: ${rows.map((r) => r.column_name).join(", ")}`);
  }
  console.log("OK dropped start_year, end_year, seasons from managers");
} finally {
  await pool.end();
}
