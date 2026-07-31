import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const summary = await pool.query(`
  SELECT m.is_friendly, count(*)::int n,
    count(*) FILTER (
      WHERE EXISTS (SELECT 1 FROM match_lineups ml WHERE ml.match_id=m.id AND ml.side='csa')
    )::int with_sheet
  FROM matches m
  WHERE m.season='2019'
  GROUP BY 1
`);
console.log("summary", summary.rows);

const lineupCounts = await pool.query(`
  SELECT m.id, m.match_date::text d, o.name opp, c.name comp,
    count(*) FILTER (WHERE ml.role='starter')::int starters,
    count(*) FILTER (WHERE ml.role='bench')::int bench,
    (SELECT count(*)::int FROM match_goals mg WHERE mg.match_id=m.id) goals,
    (SELECT count(*)::int FROM match_substitutions s WHERE s.match_id=m.id) subs
  FROM matches m
  JOIN opponents o ON o.id=m.opponent_id
  LEFT JOIN competitions c ON c.id=m.competition_id
  JOIN match_lineups ml ON ml.match_id=m.id AND ml.side='csa'
  WHERE m.season='2019'
  GROUP BY m.id, m.match_date, o.name, c.name
  ORDER BY m.match_date
`);
console.log(`\n${lineupCounts.rows.length} matches with sheets`);
let badStarters = 0;
for (const r of lineupCounts.rows) {
  if (r.starters !== 11) {
    badStarters++;
    console.log(`  WARN starters=${r.starters} #${r.id} ${r.d} ${r.opp} [${r.comp}]`);
  }
}
console.log(`starters!=11 count: ${badStarters}`);

const pens = await pool.query(`
  SELECT id, match_date::text d, penalties_for, penalties_against
  FROM matches WHERE season='2019' AND penalties_for IS NOT NULL
`);
console.log("\npenalty matches", pens.rows);

const friendlies = await pool.query(`
  SELECT m.id, m.match_date::text d, o.name opp, c.name comp, m.is_friendly,
    m.goals_for, m.goals_against, m.home_away
  FROM matches m
  JOIN opponents o ON o.id=m.opponent_id
  LEFT JOIN competitions c ON c.id=m.competition_id
  WHERE m.is_friendly=true
  ORDER BY m.match_date
`);
console.log("\nfriendlies", friendlies.rows);

const roster = await pool.query(`
  SELECT count(*)::int n FROM player_season_stats WHERE season='2019'
`);
console.log("\nplayer_season_stats 2019 rows", roster.rows[0].n);

const topScorers = await pool.query(`
  SELECT p.name, pss.appearances, pss.goals, pss.assists
  FROM player_season_stats pss JOIN players p ON p.id=pss.player_id
  WHERE pss.season='2019' ORDER BY pss.goals DESC LIMIT 10
`);
console.log("\ntop scorers 2019", topScorers.rows);

await pool.end();
