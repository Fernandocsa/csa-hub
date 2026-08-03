/**
 * Add presidents.is_current (ongoing vs unknown end date).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-presidents-is-current ===");
  const sql = readFileSync("lib/db/sql/alter-presidents-is-current.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presidents' AND column_name = 'is_current'
  `);
  if (rows.length === 0) throw new Error("missing is_current column");
  const { rows: currents } = await pool.query(`
    SELECT id, name, term_start::text, term_end::text, is_current
    FROM presidents
    WHERE is_current = true
    ORDER BY id
  `);
  console.log("OK is_current ready:", rows[0]);
  console.log("current mandates:", currents);
} finally {
  await pool.end();
}
