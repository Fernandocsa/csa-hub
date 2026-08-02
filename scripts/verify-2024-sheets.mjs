import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const summary = await pool.query(`
  SELECT
    count(*)::int AS matches,
    count(*) FILTER (WHERE (SELECT count(*) FROM match_lineups ml WHERE ml.match_id=m.id)>0)::int AS with_lineups,
    count(*) FILTER (WHERE manager_id IS NOT NULL)::int AS with_mgr,
    count(*) FILTER (WHERE referee_id IS NOT NULL)::int AS with_ref,
    count(*) FILTER (WHERE own_goals_for_count>0)::int AS with_og
  FROM matches m WHERE season='2024'
`);

const mgrs = await pool.query(`
  SELECT mgr.name, count(*)::int AS n
  FROM matches m JOIN managers mgr ON mgr.id=m.manager_id
  WHERE m.season='2024'
  GROUP BY mgr.name ORDER BY n DESC
`);

const seletiva = await pool.query(`
  SELECT m.id, m.match_date::text, o.name, c.name AS comp, mgr.name AS mgr
  FROM matches m
  JOIN opponents o ON o.id=m.opponent_id
  JOIN competitions c ON c.id=m.competition_id
  LEFT JOIN managers mgr ON mgr.id=m.manager_id
  WHERE c.name='Seletiva da Copa do Brasil'
  ORDER BY m.match_date
`);

const nautico = await pool.query(`
  SELECT m.id, m.goals_for, m.own_goals_for_count,
    (SELECT count(*)::int FROM match_goals g WHERE g.match_id=m.id) AS sheet_goals,
    (SELECT count(*)::int FROM match_lineups l WHERE l.match_id=m.id) AS lineups,
    (SELECT count(*)::int FROM match_substitutions s WHERE s.match_id=m.id) AS subs,
    mgr.name AS manager
  FROM matches m
  JOIN opponents o ON o.id=m.opponent_id
  LEFT JOIN managers mgr ON mgr.id=m.manager_id
  WHERE m.season='2024' AND o.name ILIKE 'Náutico%'
`);

const sampleGoal = await pool.query(`
  SELECT g.scorer_name, g.minute, g.injury_time_minute, m.match_date::text
  FROM match_goals g JOIN matches m ON m.id=g.match_id
  WHERE m.id=1230 AND g.scorer_name ILIKE '%Xuxa%'
`);

const cristian = await pool.query(`SELECT id, name FROM managers WHERE id=43`);
const players = await pool.query(`SELECT id, name FROM players WHERE id IN (509,510,511,512,493,407,23,376)`);

console.log(JSON.stringify({
  summary: summary.rows[0],
  managers: mgrs.rows,
  seletiva: seletiva.rows,
  nautico: nautico.rows[0],
  xuxaInjury: sampleGoal.rows,
  cristian: cristian.rows[0],
  keyPlayers: players.rows,
}, null, 2));
await pool.end();
