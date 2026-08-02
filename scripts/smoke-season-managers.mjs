import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const YEAR = process.argv[2] || "2024";

const { rows } = await pool.query(
  `SELECT mss.id, m.id AS manager_id, m.name, mss.games, mss.wins, mss.draws, mss.losses,
          mss.goals_for, mss.goals_against, mss.stats_source
   FROM manager_season_stats mss
   JOIN managers m ON m.id = mss.manager_id
   WHERE mss.season = $1
   ORDER BY mss.games DESC, m.name`,
  [YEAR],
);

console.log(JSON.stringify({ year: YEAR, total: rows.length, managers: rows }, null, 2));
await pool.end();
