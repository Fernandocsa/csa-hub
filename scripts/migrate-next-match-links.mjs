import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
await pool.query(`
  ALTER TABLE next_match
    ADD COLUMN IF NOT EXISTS opponent_id integer REFERENCES opponents(id)
`);
await pool.query(`
  ALTER TABLE next_match
    ADD COLUMN IF NOT EXISTS match_id integer REFERENCES matches(id)
`);
const { rows } = await pool.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'next_match' ORDER BY ordinal_position
`);
console.log(rows.map((r) => r.column_name).join(","));
await pool.end();
