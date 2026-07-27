/**
 * Add matches.phase and matches.round columns.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-matches-phase-round ===");
  const sql = readFileSync("lib/db/sql/alter-matches-phase-round.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name IN ('phase', 'round')
    ORDER BY column_name
  `);
  if (rows.length !== 2) {
    throw new Error(`expected phase+round columns, got ${rows.map((r) => r.column_name).join(",")}`);
  }
  console.log("OK matches.phase and matches.round ready");
} finally {
  await pool.end();
}
