/**
 * Smoke: same queries as /admin/matches/duplicate-dates and unknown-results.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const { rows: dupRows } = await pool.query(`
  SELECT m.id, m.match_date::text AS match_date, m.season,
         m.goals_for, m.goals_against, m.result, m.home_away,
         o.name AS opponent, c.name AS competition
  FROM matches m
  JOIN opponents o ON o.id = m.opponent_id
  JOIN competitions c ON c.id = m.competition_id
  WHERE m.match_date IN (
    SELECT match_date FROM matches GROUP BY match_date HAVING count(*) > 1
  )
  ORDER BY m.match_date DESC, m.id
`);

const byDate = new Map();
for (const r of dupRows) {
  if (!byDate.has(r.match_date)) byDate.set(r.match_date, []);
  byDate.get(r.match_date).push(r);
}
const groups = [...byDate.entries()].map(([d, matches]) => {
  const year = parseInt(d.slice(0, 4), 10);
  return {
    matchDate: d,
    is1920s: year >= 1920 && year < 1930,
    count: matches.length,
    matches: matches.map((m) => `#${m.id} ${m.goals_for}-${m.goals_against} ${m.home_away} vs ${m.opponent} | ${m.competition}`),
  };
});
const visible = groups.filter((g) => !g.is1920s);

const { rows: unk } = await pool.query(`
  SELECT m.id, m.match_date::text AS match_date, m.season, o.name AS opponent, c.name AS competition
  FROM matches m
  JOIN opponents o ON o.id = m.opponent_id
  JOIN competitions c ON c.id = m.competition_id
  WHERE m.result = 'unknown' AND m.is_walkover = false AND m.is_friendly = false
  ORDER BY m.match_date DESC, m.id
`);

console.log(JSON.stringify({
  duplicateGroupsTotal: groups.length,
  duplicateGroupsVisibleWithout1920s: visible.length,
  placeholder1920s: groups.filter((g) => g.is1920s).length,
  sampleVisibleGroups: visible.slice(0, 3),
  unknownTotal: unk.length,
  sampleUnknown: unk.slice(0, 5),
}, null, 2));

await pool.end();
