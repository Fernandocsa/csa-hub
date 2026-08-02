/**
 * Update 1992 "Outros" profiles from user-sourced biodata + merge Pau → Rau.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const FROM_PAU = 567;
const TO_RAU = 572;

async function mergePlayer(fromId, toId, toName) {
  const tables = [
    ["match_lineups", "player_id", "player_name"],
    ["match_goals", "scorer_player_id", "scorer_name"],
    ["match_goals", "assist_player_id", "assist_name"],
    ["match_cards", "player_id", "player_name"],
    ["match_substitutions", "player_out_id", "player_out_name"],
    ["match_substitutions", "player_in_id", "player_in_name"],
  ];
  const counts = {};

  // captain / other FKs
  for (const [table, col] of [
    ["matches", "captain_player_id"],
  ]) {
    const r = await client.query(
      `UPDATE ${table} SET ${col}=$2 WHERE ${col}=$1`,
      [fromId, toId],
    );
    counts[`${table}.${col}`] = r.rowCount;
  }

  for (const [table, idCol, nameCol] of tables) {
    if (table === "match_lineups") {
      const conflicts = await client.query(
        `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
         FROM match_lineups a
         JOIN match_lineups b
           ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
         WHERE a.player_id=$1`,
        [fromId, toId],
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
      [fromId, toId, toName],
    );
    counts[`${table}.${idCol}`] = r.rowCount;
  }

  // Drop from season stats; keep TO (will recalc via sync)
  await client.query(`DELETE FROM player_season_stats WHERE player_id=$1`, [fromId]);
  counts.deleted_pss = true;

  const del = await client.query(`DELETE FROM players WHERE id=$1 RETURNING id, name`, [
    fromId,
  ]);
  counts.deleted = del.rows[0];
  return counts;
}

try {
  await client.query("BEGIN");

  const updates = [];

  // Adalberon #569
  {
    const { rows } = await client.query(
      `UPDATE players SET
         full_name = $2,
         position = $3,
         birth_date = $4::date,
         birth_year = $5,
         birth_city = $6,
         birth_state = $7,
         birth_country = $8,
         nationality = coalesce(nationality, 'Brasil'),
         nationality_flag = coalesce(nationality_flag, '🇧🇷')
       WHERE id = $1
       RETURNING id, name, full_name, position, birth_date, birth_year, birth_city, birth_state`,
      [
        569,
        "Adalberon Lopes de Lima",
        "Centroavante",
        "1973-10-23",
        1973,
        "Maceió",
        "AL",
        "Brasil",
      ],
    );
    updates.push({ who: "Adalberon", row: rows[0] });
  }

  // César #557
  {
    const { rows } = await client.query(
      `UPDATE players SET
         full_name = $2,
         position = $3,
         birth_date = $4::date,
         birth_year = $5,
         birth_city = $6,
         birth_state = $7,
         birth_country = $8,
         nationality = coalesce(nationality, 'Brasil'),
         nationality_flag = coalesce(nationality_flag, '🇧🇷')
       WHERE id = $1
       RETURNING id, name, full_name, position, birth_date, birth_year, birth_city, birth_state`,
      [
        557,
        "César Salustiano de Jesus",
        "Zagueiro",
        "1973-02-27",
        1973,
        "São Paulo",
        "SP",
        "Brasil",
      ],
    );
    updates.push({ who: "César", row: rows[0] });
  }

  // Cláudio #570 = Lateral Esquerdo
  {
    const { rows } = await client.query(
      `UPDATE players SET
         position = $2,
         nationality = coalesce(nationality, 'Brasil'),
         nationality_flag = coalesce(nationality_flag, '🇧🇷')
       WHERE id = $1
       RETURNING id, name, position`,
      [570, "Lateral Esquerdo"],
    );
    updates.push({ who: "Cláudio", row: rows[0] });
  }

  // Délio #564
  {
    const { rows } = await client.query(
      `UPDATE players SET
         full_name = $2,
         position = $3,
         birth_date = $4::date,
         birth_year = $5,
         birth_city = $6,
         birth_state = $7,
         birth_country = $8,
         nationality = coalesce(nationality, 'Brasil'),
         nationality_flag = coalesce(nationality_flag, '🇧🇷')
       WHERE id = $1
       RETURNING id, name, full_name, position, birth_date, birth_year, birth_city, birth_state`,
      [
        564,
        "Délio Jorge Gonçalves Pereira",
        "Volante",
        "1969-07-24",
        1969,
        "Maceió",
        "AL",
        "Brasil",
      ],
    );
    updates.push({ who: "Délio", row: rows[0] });
  }

  // Marcelo Silva #561 = Zagueiro
  {
    const { rows } = await client.query(
      `UPDATE players SET
         position = $2,
         nationality = coalesce(nationality, 'Brasil'),
         nationality_flag = coalesce(nationality_flag, '🇧🇷')
       WHERE id = $1
       RETURNING id, name, position`,
      [561, "Zagueiro"],
    );
    updates.push({ who: "Marcelo Silva", row: rows[0] });
  }

  // Verify Pau / Rau before merge
  const pau = await client.query(`SELECT id, name FROM players WHERE id=$1`, [FROM_PAU]);
  const rau = await client.query(`SELECT id, name FROM players WHERE id=$1`, [TO_RAU]);
  if (!pau.rows[0] || pau.rows[0].name !== "Pau") {
    throw new Error(`Expected Pau #567, got ${JSON.stringify(pau.rows[0])}`);
  }
  if (!rau.rows[0] || rau.rows[0].name !== "Rau") {
    throw new Error(`Expected Rau #572, got ${JSON.stringify(rau.rows[0])}`);
  }

  const mergeCounts = await mergePlayer(FROM_PAU, TO_RAU, "Rau");

  // Fix scorers text that still says Pau
  await client.query(
    `UPDATE matches SET scorers = replace(scorers, 'Pau', 'Rau')
     WHERE scorers ILIKE '%Pau%' AND season='1992'`,
  );

  await client.query("COMMIT");
  console.log(
    JSON.stringify({ ok: true, updates, mergePauToRau: mergeCounts }, null, 2),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
