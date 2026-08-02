/**
 * Merge Marcelo (#548) → Marcelo Silva (#561).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const FROM = 548; // Marcelo
const TO = 561; // Marcelo Silva
const TO_NAME = "Marcelo Silva";

try {
  await client.query("BEGIN");

  const fromP = await client.query(`SELECT id, name, position, birth_year FROM players WHERE id=$1`, [
    FROM,
  ]);
  const toP = await client.query(`SELECT id, name, position, birth_year FROM players WHERE id=$1`, [
    TO,
  ]);
  if (!fromP.rows[0] || fromP.rows[0].name !== "Marcelo") {
    throw new Error(`Expected Marcelo #548, got ${JSON.stringify(fromP.rows[0])}`);
  }
  if (!toP.rows[0] || toP.rows[0].name !== "Marcelo Silva") {
    throw new Error(`Expected Marcelo Silva #561, got ${JSON.stringify(toP.rows[0])}`);
  }

  const counts = {};

  await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [
    FROM,
    TO,
  ]);

  const tables = [
    ["match_lineups", "player_id", "player_name"],
    ["match_goals", "scorer_player_id", "scorer_name"],
    ["match_goals", "assist_player_id", "assist_name"],
    ["match_cards", "player_id", "player_name"],
    ["match_substitutions", "player_out_id", "player_out_name"],
    ["match_substitutions", "player_in_id", "player_in_name"],
  ];

  for (const [table, idCol, nameCol] of tables) {
    if (table === "match_lineups") {
      const conflicts = await client.query(
        `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
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
    }

    const r = await client.query(
      `UPDATE ${table} SET ${idCol}=$2, ${nameCol}=$3 WHERE ${idCol}=$1`,
      [FROM, TO, TO_NAME],
    );
    counts[`${table}.${idCol}`] = r.rowCount;
  }

  // Carry over profile fields if TO is missing them
  await client.query(
    `UPDATE players dest SET
       position = coalesce(dest.position, src.position),
       birth_year = coalesce(dest.birth_year, src.birth_year),
       birth_date = coalesce(dest.birth_date, src.birth_date),
       birth_city = coalesce(dest.birth_city, src.birth_city),
       birth_state = coalesce(dest.birth_state, src.birth_state),
       birth_country = coalesce(dest.birth_country, src.birth_country),
       nationality = coalesce(dest.nationality, src.nationality, 'Brasil'),
       nationality_flag = coalesce(dest.nationality_flag, src.nationality_flag, '🇧🇷')
     FROM players src
     WHERE dest.id=$1 AND src.id=$2`,
    [TO, FROM],
  );

  await client.query(`DELETE FROM player_season_stats WHERE player_id=$1`, [FROM]);
  const del = await client.query(`DELETE FROM players WHERE id=$1 RETURNING id, name`, [FROM]);
  counts.deleted = del.rows[0];

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      { ok: true, from: fromP.rows[0], to: toP.rows[0], counts },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
