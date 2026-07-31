import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const summary = await pool.query(`
  SELECT
    count(*)::int AS matches,
    count(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM match_lineups ml WHERE ml.match_id=m.id AND ml.side='csa'
    ))::int AS with_lineups,
    count(*) FILTER (WHERE manager_id IS NOT NULL)::int AS with_mgr,
    count(*) FILTER (WHERE attendance IS NOT NULL)::int AS with_att,
    count(*) FILTER (WHERE own_goals_for_count>0)::int AS with_og,
    count(*) FILTER (WHERE penalties_for IS NOT NULL)::int AS with_pens,
    count(*) FILTER (WHERE related_match_id IS NOT NULL)::int AS with_related,
    coalesce(sum((
      SELECT count(*) FROM match_goals mg WHERE mg.match_id=m.id AND mg.side='csa'
    )),0)::int AS goals_rows
  FROM matches m
  WHERE m.season='2022' AND m.is_friendly=false
`);
console.log("summary", summary.rows[0]);

const seletiva = await pool.query(`
  SELECT m.id, c.name AS comp, m.phase, m.round, m.own_goals_for_count AS og,
         m.penalties_for AS pf, m.penalties_against AS pa, mgr.name AS mgr
  FROM matches m
  JOIN competitions c ON c.id=m.competition_id
  LEFT JOIN managers mgr ON mgr.id=m.manager_id
  WHERE m.id IN (1102,1110,1113,1114,1123)
  ORDER BY m.id
`);
console.log("spot checks:");
for (const r of seletiva.rows) console.log(r);

const lineup = await pool.query(`
  SELECT count(*)::int AS n FROM match_lineups ml
  JOIN matches m ON m.id=ml.match_id
  WHERE m.season='2022' AND ml.side='csa'
`);
console.log("lineup rows", lineup.rows[0].n);

const top = await pool.query(`
  SELECT p.name, pss.appearances, pss.goals
  FROM player_season_stats pss
  JOIN players p ON p.id=pss.player_id
  WHERE pss.season='2022'
  ORDER BY pss.goals DESC, pss.appearances DESC
  LIMIT 12
`);
console.log("top scorers/apps:");
for (const r of top.rows) console.log(`${r.goals}g ${r.appearances}j ${r.name}`);

const gfCheck = await pool.query(`
  SELECT m.id, m.goals_for, m.own_goals_for_count,
    (SELECT count(*) FROM match_goals mg WHERE mg.match_id=m.id AND mg.side='csa' AND NOT mg.is_own_goal)::int AS sheet_goals
  FROM matches m
  WHERE m.season='2022' AND m.is_friendly=false
    AND m.goals_for <> (
      (SELECT count(*) FROM match_goals mg WHERE mg.match_id=m.id AND mg.side='csa' AND NOT mg.is_own_goal)
      + m.own_goals_for_count
    )
`);
console.log("gf mismatches", gfCheck.rows.length);
for (const r of gfCheck.rows) console.log(r);

await pool.end();
