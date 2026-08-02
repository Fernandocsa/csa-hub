import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
try {
  const { rows } = await pool.query(`
    SELECT ml.match_id, ml.player_id, ml.player_name, ml.shirt_number, ml.role, m.match_date
    FROM match_lineups ml
    JOIN matches m ON m.id = ml.match_id
    WHERE ml.player_name ILIKE '%wesley%' OR ml.shirt_number = 18 AND m.season = '2026'
    ORDER BY m.match_date DESC
    LIMIT 40
  `);
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await pool.end();
}
