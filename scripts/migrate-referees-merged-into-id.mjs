/**
 * Add referees.merged_into_id for soft-merge of duplicate referee rows.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

try {
  console.log("=== migrate-referees-merged-into-id ===");
  const sql = readFileSync("lib/db/sql/alter-referees-merged-into-id.sql", "utf8");
  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referees'
      AND column_name = 'merged_into_id'
  `);
  if (!rows.length) throw new Error("missing column merged_into_id");
  console.log("OK referees.merged_into_id ready");
} finally {
  await pool.end();
}
