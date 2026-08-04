/**
 * Create player_season_name_aliases for season-scoped Ogol paste nicknames.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-player-season-name-aliases ===");
  const sql = readFileSync(
    "lib/db/sql/create-player-season-name-aliases.sql",
    "utf8",
  );
  await pool.query(sql);

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_season_name_aliases'
    ORDER BY ordinal_position
  `);
  const cols = rows.map((r) => r.column_name);
  for (const c of ["id", "player_id", "season", "alias", "alias_norm", "created_at"]) {
    if (!cols.includes(c)) throw new Error(`missing column ${c}`);
  }

  console.log("OK player_season_name_aliases ready:", cols.join(", "));
} finally {
  await pool.end();
}
