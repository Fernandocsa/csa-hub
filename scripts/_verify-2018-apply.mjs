import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const c = await pool.connect();

const { rows: starterCounts } = await c.query(`
  SELECT m.id, count(*) FILTER (WHERE ml.role='starter') AS starters
  FROM matches m
  LEFT JOIN match_lineups ml ON ml.match_id=m.id AND ml.side='csa'
  WHERE m.season='2018' AND m.is_friendly=false
  GROUP BY m.id
  ORDER BY m.id
`);
const bad = starterCounts.filter((r) => Number(r.starters) !== 11);
console.log("matches with starters != 11:", bad);
console.log("total matches", starterCounts.length);

const { rows: ogMatches } = await c.query(`
  SELECT id, match_date, own_goals_for_count FROM matches
  WHERE season='2018' AND own_goals_for_count > 0 ORDER BY match_date
`);
console.log("own-goal matches", ogMatches);

const { rows: topScorers } = await c.query(`
  SELECT p.name, pss.appearances, pss.goals
  FROM player_season_stats pss JOIN players p ON p.id=pss.player_id
  WHERE pss.season='2018' AND pss.goals > 0
  ORDER BY pss.goals DESC, p.name
`);
console.log("scorers", topScorers);

const { rows: totalGoals } = await c.query(`
  SELECT count(*)::int n FROM match_goals mg JOIN matches m ON m.id=mg.match_id
  WHERE m.season='2018' AND mg.side='csa'
`);
const { rows: totalOg } = await c.query(`
  SELECT coalesce(sum(own_goals_for_count),0)::int n FROM matches WHERE season='2018'
`);
console.log("total match_goals rows (non-OG)", totalGoals[0].n, "total OG", totalOg[0].n);

c.release();
await pool.end();
