/**
 * Inspect existing match 1337 / 2026-07-19 sheet completeness.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

try {
  const { rows: m } = await pool.query(
    `SELECT m.*, o.name AS opponent, c.name AS competition, s.name AS stadium,
            mgr.name AS manager, r.name AS referee
     FROM matches m
     JOIN opponents o ON o.id = m.opponent_id
     JOIN competitions c ON c.id = m.competition_id
     LEFT JOIN stadiums s ON s.id = m.stadium_id
     LEFT JOIN managers mgr ON mgr.id = m.manager_id
     LEFT JOIN referees r ON r.id = m.referee_id
     WHERE m.id = 1337`,
  );
  console.log("MATCH", JSON.stringify(m[0], null, 2));

  const { rows: lineups } = await pool.query(
    `SELECT role, shirt_number, position, player_name, player_id, sort_order
     FROM match_lineups WHERE match_id = 1337 AND side = 'csa'
     ORDER BY role, sort_order, id`,
  );
  console.log("LINEUPS", lineups.length, JSON.stringify(lineups, null, 2));

  const { rows: cards } = await pool.query(
    `SELECT card_type, player_name, minute, injury_time_minute FROM match_cards WHERE match_id = 1337`,
  );
  console.log("CARDS", cards);

  const { rows: subs } = await pool.query(
    `SELECT player_out_name, player_in_name, minute, injury_time_minute
     FROM match_substitutions WHERE match_id = 1337`,
  );
  console.log("SUBS", subs);

  const { rows: goals } = await pool.query(
    `SELECT * FROM match_goals WHERE match_id = 1337`,
  );
  console.log("GOALS", goals.length);

  const { rows: wesley } = await pool.query(
    `SELECT id, name FROM players WHERE name ILIKE '%wesley%' ORDER BY name LIMIT 20`,
  );
  console.log("WESLEY_CANDIDATES", wesley);

  const { rows: fabricio } = await pool.query(
    `SELECT id, name FROM players WHERE name ILIKE '%fabricio%bigode%' OR name ILIKE '%fabrício%bigode%'`,
  );
  console.log("FABRICIO", fabricio);

  // uniqueness: how many total dup date groups
  const { rows: dupTotal } = await pool.query(`
    SELECT count(*)::int AS groups, sum(n)::int AS matches_in_dups FROM (
      SELECT match_date, count(*)::int AS n FROM matches
      GROUP BY match_date HAVING count(*) > 1
    ) t
  `);
  console.log("DUP_SUMMARY", dupTotal[0]);
} finally {
  await pool.end();
}
