/**
 * Add manager verification columns (parity with players).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-managers-verification ===");
  const sql = readFileSync("lib/db/sql/alter-managers-verification.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'managers'
      AND column_name IN ('verification_status', 'verified_at', 'verified_by')
    ORDER BY column_name
  `);
  const cols = rows.map((r) => r.column_name);
  for (const c of ["verification_status", "verified_at", "verified_by"]) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }
  console.log("OK managers verification columns:", cols.join(", "));
} finally {
  await pool.end();
}
