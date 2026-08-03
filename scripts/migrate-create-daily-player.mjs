/**
 * Create daily_player table for Quem é o Jogador?
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-daily-player ===");
  const sql = readFileSync("lib/db/sql/create-daily-player.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_player'
    ORDER BY ordinal_position
  `);
  const cols = rows.map((r) => r.column_name);
  for (const c of ["play_date", "player_id", "created_at"]) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }
  console.log("OK daily_player ready:", cols.join(", "));
} finally {
  await pool.end();
}
