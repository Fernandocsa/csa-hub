/**
 * Merge duplicate recent CSA players created by complementary sheets
 * into already-enriched historical rows.
 *
 * KEEP ← REMOVE
 * 1593 Levi ← 2088 Levi (Levi Nepomuceno da Silva)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MERGES = [
  {
    keep: 1593,
    remove: 2088,
    keepName: "Levi",
    patch: {
      fullName: "Levi Nepomuceno da Silva",
      position: "Meia",
      preferredFoot: "destro",
      birthDate: "1990-05-22",
      birthCity: "Olinda",
      birthState: "PE",
      heightCm: 181,
      weightKg: 75,
      nationality: "Brasil",
    },
  },
];

async function mergePlayer({ keep, remove, keepName, patch = {} }) {
  const keepP = (
    await client.query(`SELECT id, name, full_name FROM players WHERE id=$1`, [keep])
  ).rows[0];
  const removeP = (
    await client.query(`SELECT id, name, full_name FROM players WHERE id=$1`, [remove])
  ).rows[0];
  if (!keepP || !removeP) {
    throw new Error(`Missing player keep=#${keep} remove=#${remove}`);
  }

  console.log(`\nMerging #${remove} (${removeP.name}) → #${keep} (${keepName})`);

  await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [
    remove,
    keep,
  ]);

  const conflicts = await client.query(
    `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
     FROM match_lineups a
     JOIN match_lineups b
       ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
     WHERE a.player_id=$1`,
    [remove, keep],
  );
  for (const c of conflicts.rows) {
    await client.query(`UPDATE match_goals SET scorer_lineup_id=$2 WHERE scorer_lineup_id=$1`, [
      c.from_lineup_id,
      c.to_lineup_id,
    ]);
    await client.query(`UPDATE match_goals SET assist_lineup_id=$2 WHERE assist_lineup_id=$1`, [
      c.from_lineup_id,
      c.to_lineup_id,
    ]);
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

  const nameUpdates = [
    ["match_lineups", "player_id", "player_name"],
    ["match_goals", "scorer_player_id", "scorer_name"],
    ["match_goals", "assist_player_id", "assist_name"],
    ["match_cards", "player_id", "player_name"],
    ["match_substitutions", "player_out_id", "player_out_name"],
    ["match_substitutions", "player_in_id", "player_in_name"],
  ];
  for (const [table, idCol, nameCol] of nameUpdates) {
    await client.query(
      `UPDATE ${table} SET ${idCol}=$2, ${nameCol}=$3 WHERE ${idCol}=$1`,
      [remove, keep, keepName],
    );
  }

  const fromStats = (
    await client.query(
      `SELECT season, appearances, goals, assists, shirt_number
       FROM player_season_stats WHERE player_id=$1`,
      [remove],
    )
  ).rows;
  for (const s of fromStats) {
    const existing = (
      await client.query(
        `SELECT id, appearances, goals, assists FROM player_season_stats
         WHERE player_id=$1 AND season=$2`,
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
           AND COALESCE(b.season_year, -1) = COALESCE(entity_badges.season_year, -1)
       )`,
    [remove, keep],
  );
  await client.query(`DELETE FROM entity_badges WHERE entity_type='player' AND entity_id=$1`, [
    remove,
  ]);

  await client.query(
    `UPDATE players SET
       name = COALESCE($2, name),
       full_name = COALESCE($3, full_name),
       position = COALESCE($4, position),
       preferred_foot = COALESCE($5, preferred_foot),
       birth_date = COALESCE($6::date, birth_date),
       birth_year = COALESCE($7, birth_year),
       birth_city = COALESCE($8, birth_city),
       birth_state = COALESCE($9, birth_state),
       nationality = COALESCE($10, nationality),
       height_cm = COALESCE($11, height_cm),
       weight_kg = COALESCE($12, weight_kg),
       is_deceased = COALESCE($13, is_deceased)
     WHERE id=$1`,
    [
      keep,
      patch.name ?? null,
      patch.fullName ?? null,
      patch.position ?? null,
      patch.preferredFoot ?? null,
      patch.birthDate ?? null,
      patch.birthDate ? Number(String(patch.birthDate).slice(0, 4)) : null,
      patch.birthCity ?? null,
      patch.birthState ?? null,
      patch.nationality ?? null,
      patch.heightCm ?? null,
      patch.weightKg ?? null,
      patch.isDeceased ?? null,
    ],
  );

  if (patch.name) {
    await client.query(`UPDATE players SET name=$2 WHERE id=$1`, [keep, patch.name]);
  }

  await client.query(`DELETE FROM players WHERE id=$1`, [remove]);
  console.log(`  OK — conflicts removed: ${conflicts.rows.length}`);
}

try {
  await client.query("BEGIN");
  for (const m of MERGES) {
    await mergePlayer(m);
  }
  await client.query("COMMIT");

  const { rows } = await client.query(
    `SELECT id, name, full_name, position, birth_date::text,
            (SELECT count(*)::int FROM match_lineups WHERE player_id=p.id) AS lineups
     FROM players p WHERE id = ANY($1::int[]) ORDER BY id`,
    [MERGES.map((m) => m.keep)],
  );
  console.log("\n=== kept players ===");
  console.table(rows);

  const gone = await client.query(`SELECT id FROM players WHERE id = ANY($1::int[])`, [
    MERGES.map((m) => m.remove),
  ]);
  if (gone.rows.length) throw new Error(`remove ids still exist: ${gone.rows.map((r) => r.id)}`);

  const rem = await client.query(
    `SELECT count(*)::int AS n FROM players WHERE id >= 2029 AND (full_name IS NULL OR btrim(full_name) = '')`,
  );
  console.log(JSON.stringify({ ok: true, merges: MERGES.length, stillWithoutFullName: rem.rows[0].n }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
