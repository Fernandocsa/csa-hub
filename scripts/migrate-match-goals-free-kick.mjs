/**
 * Add is_free_kick flag on match_goals (gol de falta).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-match-goals-free-kick ===");
  const sql = readFileSync("lib/db/sql/alter-match-goals-free-kick.sql", "utf8");
  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'match_goals' AND column_name = 'is_free_kick'
  `);
  if (rows.length !== 1) {
    throw new Error("match_goals.is_free_kick missing");
  }

  console.log("OK match_goals.is_free_kick ready");
} finally {
  await pool.end();
}
