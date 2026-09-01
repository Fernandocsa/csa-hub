/**
 * Add matches.opponent_manager_id (FK managers, nullable).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-matches-opponent-manager ===");
  const sql = readFileSync("lib/db/sql/alter-matches-opponent-manager.sql", "utf8");
  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'opponent_manager_id'
  `);
  if (rows.length !== 1) throw new Error("matches.opponent_manager_id missing");

  console.log("OK matches.opponent_manager_id ready");
} finally {
  await pool.end();
}
