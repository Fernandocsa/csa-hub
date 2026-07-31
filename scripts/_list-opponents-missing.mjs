import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const c = await pool.connect();
try {
  const cols = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name='opponents' ORDER BY ordinal_position`,
  );
  console.log("cols", cols.rows.map((r) => r.column_name));

  const missing = await c.query(
    `SELECT id, name, city, state, country, home_stadium_id,
            (SELECT s.name FROM stadiums s WHERE s.id=opponents.home_stadium_id) AS stadium
     FROM opponents
     WHERE city IS NULL OR btrim(city)='' OR home_stadium_id IS NULL
     ORDER BY name`,
  );
  console.log("missing count", missing.rows.length);
  console.log(JSON.stringify(missing.rows, null, 2));
} finally {
  c.release();
  await pool.end();
}
