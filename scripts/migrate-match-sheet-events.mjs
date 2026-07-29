/**
 * Add goal penalty/own-goal flags, match captain, and manager cards table.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-match-sheet-events ===");
  const sql = readFileSync("lib/db/sql/alter-match-sheet-events.sql", "utf8");
  await pool.query(sql);

  const { rows: goalCols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'match_goals'
      AND column_name IN ('is_penalty', 'is_own_goal', 'own_goal_direction')
    ORDER BY column_name
  `);
  if (goalCols.length !== 3) {
    throw new Error(`match_goals columns missing: ${goalCols.map((r) => r.column_name).join(",")}`);
  }

  const { rows: matchCols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'captain_player_id'
  `);
  if (matchCols.length !== 1) throw new Error("matches.captain_player_id missing");

  const { rows: tables } = await pool.query(`
    SELECT to_regclass('public.match_manager_cards') AS t
  `);
  if (!tables[0]?.t) throw new Error("match_manager_cards missing");

  console.log("OK match sheet events schema ready");
} finally {
  await pool.end();
}
