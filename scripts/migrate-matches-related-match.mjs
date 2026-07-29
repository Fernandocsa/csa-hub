/**
 * Add matches.related_match_id for ida/volta knockout pairing.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-matches-related-match ===");
  const sql = readFileSync("lib/db/sql/alter-matches-related-match.sql", "utf8");
  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'related_match_id'
  `);
  if (rows.length !== 1) throw new Error("matches.related_match_id missing");

  console.log("OK matches.related_match_id ready");
} finally {
  await pool.end();
}
