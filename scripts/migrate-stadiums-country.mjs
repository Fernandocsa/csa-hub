/**
 * Add stadiums.country column (schema only — no data backfill).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-stadiums-country ===");
  const sql = readFileSync("lib/db/sql/alter-stadiums-country.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'stadiums' AND column_name = 'country'
  `);
  if (rows.length !== 1) throw new Error("stadiums.country column missing after migration");
  console.log("OK stadiums.country column ready");
} finally {
  await pool.end();
}
