/**
 * Add managers.player_id (ex-jogador → treinador link).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-managers-player-id ===");
  const sql = readFileSync("lib/db/sql/alter-managers-player-id.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'managers'
      AND column_name = 'player_id'
  `);
  if (!rows.length) throw new Error("missing column player_id");
  console.log("OK managers.player_id");
} finally {
  await pool.end();
}
