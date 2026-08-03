/**
 * Create daily_player_blocks for Quem é o Jogador? admin exclusions.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-daily-player-blocks ===");
  const sql = readFileSync("lib/db/sql/create-daily-player-blocks.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_player_blocks'
    ORDER BY ordinal_position
  `);
  const cols = rows.map((r) => r.column_name);
  for (const c of ["player_id", "note", "created_at"]) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }
  console.log("OK daily_player_blocks ready:", cols.join(", "));
} finally {
  await pool.end();
}
