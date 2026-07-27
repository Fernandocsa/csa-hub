/**
 * Create suggestions table for private visitor reports.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-suggestions ===");
  const sql = readFileSync("lib/db/sql/create-suggestions.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'suggestions'
    ORDER BY ordinal_position
  `);
  const cols = rows.map((r) => r.column_name);
  const needed = [
    "id",
    "entity_type",
    "entity_id",
    "author_name",
    "message",
    "contact",
    "status",
    "created_at",
  ];
  for (const c of needed) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }
  console.log("OK suggestions table ready:", cols.join(", "));
} finally {
  await pool.end();
}
