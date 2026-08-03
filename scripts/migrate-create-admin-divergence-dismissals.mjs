/**
 * Create admin_divergence_dismissals for ignored data-divergence items.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-admin-divergence-dismissals ===");
  const sql = readFileSync(
    "lib/db/sql/create-admin-divergence-dismissals.sql",
    "utf8",
  );
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_divergence_dismissals'
    ORDER BY ordinal_position
  `);
  const cols = rows.map((r) => r.column_name);
  for (const c of ["kind", "entity_id", "note", "created_at"]) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }
  console.log("OK admin_divergence_dismissals ready:", cols.join(", "));
} finally {
  await pool.end();
}
