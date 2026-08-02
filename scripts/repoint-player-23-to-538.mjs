/**
 * Re-point match-sheet FKs from player #23 → #538.
 * Does NOT touch player_season_stats, badges, or delete either player.
 *
 * Usage: node scripts/repoint-player-23-to-538.mjs
 * Dry-run: DRY_RUN=1 node scripts/repoint-player-23-to-538.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const FROM = 23;
const TO = 538;
const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

try {
  await client.query("BEGIN");

  const fromP = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FROM]);
  const toP = await client.query(`SELECT id, name FROM players WHERE id=$1`, [TO]);
  if (!fromP.rows[0]) throw new Error(`from player ${FROM} missing`);
  if (!toP.rows[0]) throw new Error(`to player ${TO} missing`);

  const keepName = toP.rows[0].name;
  const counts = {
    from: fromP.rows[0],
    to: toP.rows[0],
    dryRun,
  };

  // Before counts
  const before = await client.query(
    `SELECT
       (SELECT count(*)::int FROM match_lineups WHERE player_id=$1) AS lineups_from,
       (SELECT count(*)::int FROM match_lineups WHERE player_id=$2) AS lineups_to,
       (SELECT count(*)::int FROM match_goals WHERE scorer_player_id=$1 OR assist_player_id=$1) AS goals_from,
       (SELECT count(*)::int FROM match_cards WHERE player_id=$1) AS cards_from,
       (SELECT count(*)::int FROM match_substitutions WHERE player_out_id=$1 OR player_in_id=$1) AS subs_from,
       (SELECT count(*)::int FROM matches WHERE captain_player_id=$1) AS captain_from`,
    [FROM, TO],
  );
  counts.before = before.rows[0];

  // Resolve match_lineups unique conflicts (match_id, side, player_id)
  const conflicts = await client.query(
    `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id, a.match_id
     FROM match_lineups a
     JOIN match_lineups b
       ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
     WHERE a.player_id=$1`,
    [FROM, TO],
  );
  for (const c of conflicts.rows) {
    await client.query(
      `UPDATE match_goals SET scorer_lineup_id=$2 WHERE scorer_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(
      `UPDATE match_goals SET assist_lineup_id=$2 WHERE assist_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(`UPDATE match_cards SET lineup_id=$2 WHERE lineup_id=$1`, [
      c.from_lineup_id,
      c.to_lineup_id,
    ]);
    await client.query(
      `UPDATE match_substitutions SET player_out_lineup_id=$2 WHERE player_out_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(
      `UPDATE match_substitutions SET player_in_lineup_id=$2 WHERE player_in_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(`DELETE FROM match_lineups WHERE id=$1`, [c.from_lineup_id]);
  }
  counts.lineup_conflicts_removed = conflicts.rows.length;

  const tables = [
    ["match_lineups", "player_id", "player_name"],
    ["match_goals", "scorer_player_id", "scorer_name"],
    ["match_goals", "assist_player_id", "assist_name"],
    ["match_cards", "player_id", "player_name"],
    ["match_substitutions", "player_out_id", "player_out_name"],
    ["match_substitutions", "player_in_id", "player_in_name"],
  ];

  for (const [table, idCol, nameCol] of tables) {
    const r = await client.query(
      `UPDATE ${table} SET ${idCol}=$2, ${nameCol}=$3 WHERE ${idCol}=$1`,
      [FROM, TO, keepName],
    );
    counts[`${table}.${idCol}`] = r.rowCount;
  }

  const cap = await client.query(
    `UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`,
    [FROM, TO],
  );
  counts["matches.captain_player_id"] = cap.rowCount;

  const after = await client.query(
    `SELECT
       (SELECT count(*)::int FROM match_lineups WHERE player_id=$1) AS lineups_from,
       (SELECT count(*)::int FROM match_lineups WHERE player_id=$2) AS lineups_to,
       (SELECT count(*)::int FROM player_season_stats WHERE player_id=$1) AS pss_from,
       (SELECT count(*)::int FROM player_season_stats WHERE player_id=$2) AS pss_to`,
    [FROM, TO],
  );
  counts.after = after.rows[0];
  counts.note = "player_season_stats untouched";

  if (dryRun) {
    await client.query("ROLLBACK");
    console.log(JSON.stringify({ ok: true, rolledBack: true, ...counts }, null, 2));
  } else {
    await client.query("COMMIT");
    console.log(JSON.stringify({ ok: true, committed: true, ...counts }, null, 2));
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
