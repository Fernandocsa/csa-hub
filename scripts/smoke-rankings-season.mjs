import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const YEAR = process.argv[2] || "2025";

const { rows: goals } = await pool.query(
  `SELECT p.name, sum(pss.goals)::int AS goals
   FROM player_season_stats pss
   JOIN players p ON p.id = pss.player_id
   WHERE pss.season = $1
   GROUP BY p.id, p.name
   ORDER BY sum(pss.goals) DESC
   LIMIT 5`,
  [YEAR],
);

const { rows: apps } = await pool.query(
  `SELECT p.name, sum(pss.appearances)::int AS appearances
   FROM player_season_stats pss
   JOIN players p ON p.id = pss.player_id
   WHERE pss.season = $1
   GROUP BY p.id, p.name
   ORDER BY sum(pss.appearances) DESC
   LIMIT 5`,
  [YEAR],
);

const { rows: assists } = await pool.query(
  `SELECT p.name, sum(pss.assists)::int AS assists
   FROM player_season_stats pss
   JOIN players p ON p.id = pss.player_id
   WHERE pss.season = $1
   GROUP BY p.id, p.name
   HAVING sum(pss.assists) > 0
   ORDER BY sum(pss.assists) DESC, sum(pss.appearances) DESC
   LIMIT 5`,
  [YEAR],
);

console.log(JSON.stringify({ year: YEAR, goals, apps, assists }, null, 2));
await pool.end();
