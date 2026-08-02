/**
 * After enrich-1970-1989-batch-c:
 * 1704 Ademir → 652 Ademir Pereira (Ademir Pereira da Silva)
 * 1698 Ditinho → 789 Ditinho Souza
 * 1760 Milano → 1020 Milani (Expedito José Milano)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MERGES = [
  {
    keep: 652,
    remove: 1704,
    keepName: "Ademir Pereira",
    patch: {
      fullName: "Ademir Pereira da Silva",
      position: "Volante",
      birthDate: "1955-09-08",
      birthCity: "Nova Lima",
      birthState: "MG",
    },
  },
  {
    keep: 789,
    remove: 1698,
    keepName: "Ditinho Souza",
    patch: {
      fullName: "Benedito Luiz Souza e Silva",
      position: "Ponta Direita",
      preferredFoot: "canhoto",
      birthDate: "1964-08-12",
      birthCity: "Espírito Santo do Pinhal",
      birthState: "SP",
    },
  },
  {
    keep: 1020,
    remove: 1760,
    keepName: "Milani",
    patch: {
      fullName: "Expedito José Milano",
      position: "Goleiro",
      birthDate: "1952-10-11",
      birthCity: "Maceió",
      birthState: "AL",
    },
  },
];

async function mergePlayer({ keep, remove, keepName, patch = {} }) {
  const keepP = (await client.query(`SELECT id, name FROM players WHERE id=$1`, [keep])).rows[0];
  const removeP = (await client.query(`SELECT id, name FROM players WHERE id=$1`, [remove])).rows[0];
  if (!keepP || !removeP) throw new Error(`Missing keep=#${keep} remove=#${remove}`);
  console.log(`Merging #${remove} (${removeP.name}) → #${keep} (${keepName})`);

  await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [remove, keep]);

  const conflicts = await client.query(
    `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
     FROM match_lineups a
     JOIN match_lineups b ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
     WHERE a.player_id=$1`,
    [remove, keep],
  );
  for (const c of conflicts.rows) {
    await client.query(`UPDATE match_goals SET scorer_lineup_id=$2 WHERE scorer_lineup_id=$1`, [c.from_lineup_id, c.to_lineup_id]);
    await client.query(`UPDATE match_goals SET assist_lineup_id=$2 WHERE assist_lineup_id=$1`, [c.from_lineup_id, c.to_lineup_id]);
    await client.query(`UPDATE match_cards SET lineup_id=$2 WHERE lineup_id=$1`, [c.from_lineup_id, c.to_lineup_id]);
    await client.query(`UPDATE match_substitutions SET player_out_lineup_id=$2 WHERE player_out_lineup_id=$1`, [c.from_lineup_id, c.to_lineup_id]);
    await client.query(`UPDATE match_substitutions SET player_in_lineup_id=$2 WHERE player_in_lineup_id=$1`, [c.from_lineup_id, c.to_lineup_id]);
    await client.query(`DELETE FROM match_lineups WHERE id=$1`, [c.from_lineup_id]);
  }

  for (const [table, idCol, nameCol] of [
    ["match_lineups", "player_id", "player_name"],
    ["match_goals", "scorer_player_id", "scorer_name"],
    ["match_goals", "assist_player_id", "assist_name"],
    ["match_cards", "player_id", "player_name"],
    ["match_substitutions", "player_out_id", "player_out_name"],
    ["match_substitutions", "player_in_id", "player_in_name"],
  ]) {
    await client.query(`UPDATE ${table} SET ${idCol}=$2, ${nameCol}=$3 WHERE ${idCol}=$1`, [remove, keep, keepName]);
  }

  const fromStats = (
    await client.query(
      `SELECT season, appearances, goals, assists, shirt_number FROM player_season_stats WHERE player_id=$1`,
      [remove],
    )
  ).rows;
  for (const s of fromStats) {
    const existing = (
      await client.query(
        `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [keep, s.season],
      )
    ).rows[0];
    if (existing) {
      await client.query(
        `UPDATE player_season_stats SET
           appearances = COALESCE(appearances,0) + COALESCE($2,0),
           goals = COALESCE(goals,0) + COALESCE($3,0),
           assists = COALESCE(assists,0) + COALESCE($4,0),
           shirt_number = COALESCE(shirt_number, $5)
         WHERE id=$1`,
        [existing.id, s.appearances, s.goals, s.assists, s.shirt_number],
      );
    } else {
      await client.query(
        `UPDATE player_season_stats SET player_id=$2 WHERE player_id=$1 AND season=$3`,
        [remove, keep, s.season],
      );
    }
  }
  await client.query(`DELETE FROM player_season_stats WHERE player_id=$1`, [remove]);

  await client.query(
    `UPDATE entity_badges SET entity_id=$2
     WHERE entity_type='player' AND entity_id=$1
       AND NOT EXISTS (
         SELECT 1 FROM entity_badges b
         WHERE b.entity_type='player' AND b.entity_id=$2
           AND b.label = entity_badges.label
           AND COALESCE(b.season_year,-1)=COALESCE(entity_badges.season_year,-1)
       )`,
    [remove, keep],
  );
  await client.query(`DELETE FROM entity_badges WHERE entity_type='player' AND entity_id=$1`, [remove]);

  await client.query(
    `UPDATE players SET
       full_name = COALESCE($2, full_name),
       position = COALESCE($3, position),
       preferred_foot = COALESCE($4, preferred_foot),
       birth_date = COALESCE($5::date, birth_date),
       birth_year = COALESCE($6, birth_year),
       birth_city = COALESCE($7, birth_city),
       birth_state = COALESCE($8, birth_state),
       nationality = COALESCE($9, nationality)
     WHERE id=$1`,
    [
      keep,
      patch.fullName ?? null,
      patch.position ?? null,
      patch.preferredFoot ?? null,
      patch.birthDate ?? null,
      patch.birthDate ? Number(String(patch.birthDate).slice(0, 4)) : null,
      patch.birthCity ?? null,
      patch.birthState ?? null,
      "Brasil",
    ],
  );

  await client.query(`DELETE FROM players WHERE id=$1`, [remove]);
  console.log(`  OK — conflicts: ${conflicts.rows.length}`);
}

try {
  await client.query("BEGIN");
  for (const m of MERGES) await mergePlayer(m);
  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, merges: MERGES.length }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
