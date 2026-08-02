/**
 * Merge Yuri Sena (#511) → Yuri Reis (#393): re-point sheet FKs, then delete duplicate.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const FROM = 511; // Yuri Sena (created by mistake)
const TO = 393; // Yuri Reis

try {
  await client.query("BEGIN");

  const fromP = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FROM]);
  const toP = await client.query(`SELECT id, name FROM players WHERE id=$1`, [TO]);
  if (!fromP.rows[0]) throw new Error(`from player ${FROM} missing`);
  if (!toP.rows[0]) throw new Error(`to player ${TO} missing`);
  if (toP.rows[0].name !== "Yuri Reis") throw new Error(`expected Yuri Reis, got ${toP.rows[0].name}`);

  const tables = [
    ["match_lineups", "player_id", "player_name"],
    ["match_goals", "scorer_player_id", "scorer_name"],
    ["match_goals", "assist_player_id", "assist_name"],
    ["match_cards", "player_id", "player_name"],
    ["match_substitutions", "player_out_id", "player_out_name"],
    ["match_substitutions", "player_in_id", "player_in_name"],
  ];

  const counts = {};
  for (const [table, idCol, nameCol] of tables) {
    // Avoid unique conflicts on match_lineups (match_id, side, player_id):
    // if both FROM and TO already on same match, delete FROM row(s) after merging events.
    if (table === "match_lineups") {
      // Find conflicts
      const conflicts = await client.query(
        `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id, a.match_id
         FROM match_lineups a
         JOIN match_lineups b
           ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
         WHERE a.player_id=$1`,
        [FROM, TO],
      );
      for (const c of conflicts.rows) {
        // Repoint FKs that pointed at from_lineup to to_lineup
        await client.query(
          `UPDATE match_goals SET scorer_lineup_id=$2 WHERE scorer_lineup_id=$1`,
          [c.from_lineup_id, c.to_lineup_id],
        );
        await client.query(
          `UPDATE match_goals SET assist_lineup_id=$2 WHERE assist_lineup_id=$1`,
          [c.from_lineup_id, c.to_lineup_id],
        );
        await client.query(
          `UPDATE match_cards SET lineup_id=$2 WHERE lineup_id=$1`,
          [c.from_lineup_id, c.to_lineup_id],
        );
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
    }

    const r = await client.query(
      `UPDATE ${table} SET ${idCol}=$2, ${nameCol}=$3 WHERE ${idCol}=$1`,
      [FROM, TO, "Yuri Reis"],
    );
    counts[`${table}.${idCol}`] = r.rowCount;
  }

  // player_season_stats if any
  const pss = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats WHERE player_id=$1`,
    [FROM],
  );
  for (const row of pss.rows) {
    const exist = await client.query(
      `SELECT id, appearances, goals FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [TO, row.season],
    );
    if (exist.rows[0]) {
      await client.query(
        `UPDATE player_season_stats SET
           appearances = appearances + $2,
           goals = goals + $3
         WHERE id=$1`,
        [exist.rows[0].id, row.appearances ?? 0, row.goals ?? 0],
      );
      await client.query(`DELETE FROM player_season_stats WHERE player_id=$1 AND season=$2`, [
        FROM,
        row.season,
      ]);
    } else {
      await client.query(
        `UPDATE player_season_stats SET player_id=$2 WHERE player_id=$1 AND season=$3`,
        [FROM, TO, row.season],
      );
    }
  }
  counts.season_stats_rows = pss.rows.length;

  const del = await client.query(`DELETE FROM players WHERE id=$1 RETURNING id, name`, [FROM]);
  counts.deleted = del.rows[0];

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, from: fromP.rows[0], to: toP.rows[0], counts }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
