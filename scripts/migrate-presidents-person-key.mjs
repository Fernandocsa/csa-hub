/**
 * Add presidents.person_key and link Rafael Tenório's three mandates.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-presidents-person-key ===");
  const sql = readFileSync("lib/db/sql/alter-presidents-person-key.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT id, name, term_start::text AS start, person_key,
           CASE WHEN photo_url IS NULL THEN null ELSE left(photo_url, 40) END AS photo
    FROM presidents
    WHERE person_key IS NOT NULL OR name ILIKE '%tenório%' OR name ILIKE '%tenorio%'
    ORDER BY term_start NULLS LAST, id
  `);
  console.table(rows);
  console.log("OK");
} finally {
  await pool.end();
}
