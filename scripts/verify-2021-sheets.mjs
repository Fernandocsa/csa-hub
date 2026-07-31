import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const summary = await pool.query(`
  SELECT
    count(*) FILTER (WHERE m.match_date >= '2021-01-30')::int AS matches_from_paste,
    count(*) FILTER (
      WHERE m.match_date >= '2021-01-30' AND EXISTS (
        SELECT 1 FROM match_lineups ml WHERE ml.match_id=m.id AND ml.side='csa'
      )
    )::int AS with_lineups,
    count(*) FILTER (WHERE m.match_date >= '2021-01-30' AND manager_id IS NOT NULL)::int AS with_mgr,
    count(*) FILTER (WHERE m.match_date >= '2021-01-30' AND penalties_for IS NOT NULL)::int AS with_pens,
    count(*) FILTER (WHERE m.match_date >= '2021-01-30' AND related_match_id IS NOT NULL)::int AS with_related
  FROM matches m
  WHERE m.season='2021' AND m.is_friendly=false
`);
console.log("summary", summary.rows[0]);

const gf = await pool.query(`
  SELECT m.id, m.match_date::text AS d, o.name AS opp, m.goals_for,
    (SELECT count(*) FROM match_goals mg WHERE mg.match_id=m.id AND mg.side='csa' AND NOT mg.is_own_goal)::int AS sheet_goals
  FROM matches m
  JOIN opponents o ON o.id=m.opponent_id
  WHERE m.season='2021' AND m.is_friendly=false AND m.match_date >= '2021-01-30'
    AND m.goals_for <> (
      SELECT count(*) FROM match_goals mg WHERE mg.match_id=m.id AND mg.side='csa' AND NOT mg.is_own_goal
    )
`);
console.log("gf mismatches", gf.rows.length);
for (const r of gf.rows) console.log(r);

const champ = await pool.query(`
  SELECT scs.season, c.name, scs.is_champion, scs.final_match_id
  FROM season_competition_stats scs
  JOIN competitions c ON c.id=scs.competition_id
  WHERE scs.season='2021' AND scs.is_champion=true
`);
console.log("champions", champ.rows);

const top = await pool.query(`
  SELECT p.name, pss.appearances, pss.goals
  FROM player_season_stats pss
  JOIN players p ON p.id=pss.player_id
  WHERE pss.season='2021'
  ORDER BY pss.goals DESC, pss.appearances DESC
  LIMIT 10
`);
console.log("top:");
for (const r of top.rows) console.log(`${r.goals}g ${r.appearances}j ${r.name}`);

const mq = await pool.query(`
  SELECT p.id, p.name, pss.appearances, pss.goals,
    (SELECT count(DISTINCT ml.match_id) FROM match_lineups ml
     JOIN matches m ON m.id=ml.match_id
     WHERE ml.player_id=p.id AND m.season='2021' AND ml.side='csa'
       AND (ml.role='starter' OR EXISTS (
         SELECT 1 FROM match_substitutions s WHERE s.match_id=ml.match_id AND s.player_in_id=p.id
       ))
    )::int AS sheet_apps
  FROM players p
  JOIN player_season_stats pss ON pss.player_id=p.id AND pss.season='2021'
  WHERE p.id IN (229,600)
`);
console.log("marquinhos", mq.rows);

const pens = await pool.query(`
  SELECT m.id, o.name, m.penalties_for, m.penalties_against
  FROM matches m JOIN opponents o ON o.id=m.opponent_id
  WHERE m.id IN (1052,1063)
`);
console.log("pens", pens.rows);

await pool.end();
