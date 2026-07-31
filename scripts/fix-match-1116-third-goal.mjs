/**
 * Fix match 1116 third goal: Lucas Marques → Rodrigo Rodrigues (90+3').
 * Adjust 2022 season goal totals accordingly.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1116;
const GOAL_ID = 480;
const FROM_ID = 282; // Lucas Marques
const TO_ID = 256; // Rodrigo Rodrigues

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, scorer_player_id, scorer_name, minute, injury_time_minute
     FROM match_goals WHERE id=$1 AND match_id=$2`,
    [GOAL_ID, MATCH_ID],
  );
  if (!before[0] || before[0].scorer_player_id !== FROM_ID) {
    throw new Error(`Unexpected goal before: ${JSON.stringify(before[0])}`);
  }

  const { rows: goal } = await client.query(
    `UPDATE match_goals SET
       scorer_player_id = $1,
       scorer_name = 'Rodrigo Rodrigues'
     WHERE id = $2 AND match_id = $3
     RETURNING id, scorer_player_id, scorer_name, minute, injury_time_minute`,
    [TO_ID, GOAL_ID, MATCH_ID],
  );

  const { rows: match } = await client.query(
    `UPDATE matches SET
       scorers = 'Rodrigo Rodrigues, Lucas Marques, Rodrigo Rodrigues'
     WHERE id = $1
     RETURNING id, scorers`,
    [MATCH_ID],
  );

  const { rows: lm } = await client.query(
    `UPDATE player_season_stats SET goals = goals - 1
     WHERE player_id = $1 AND season = '2022' AND goals > 0
     RETURNING player_id, season, goals`,
    [FROM_ID],
  );
  const { rows: rr } = await client.query(
    `UPDATE player_season_stats SET goals = goals + 1
     WHERE player_id = $1 AND season = '2022'
     RETURNING player_id, season, goals`,
    [TO_ID],
  );

  await client.query("COMMIT");
  console.log(
    JSON.stringify({ ok: true, before: before[0], goal: goal[0], match: match[0], lm: lm[0], rr: rr[0] }, null, 2),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
