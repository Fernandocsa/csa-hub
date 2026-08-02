import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const { rows } = await pool.query(`
  SELECT season, c.name, s.games, s.wins, s.draws, s.losses,
         s.goals_for, s.goals_against, s.stats_source, s.classification
  FROM season_competition_stats s
  JOIN competitions c ON c.id = s.competition_id
  WHERE season IN ('2024', '2025')
  ORDER BY season DESC, c.name
`);
console.log(JSON.stringify(rows, null, 2));
const { rows: counts } = await pool.query(
  `SELECT season, count(*)::int AS n FROM season_competition_stats GROUP BY season ORDER BY season DESC LIMIT 10`,
);
console.log("COUNTS", counts);
await pool.end();
