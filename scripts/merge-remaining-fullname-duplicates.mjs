/**
 * Merge remaining same-full_name player duplicates (mostly 2010s+).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MERGES = [
  // Patrick Hartwig Borges — keep Turuçu nickname on the active record
  {
    keep: 1622,
    remove: 1595,
    keepName: "Turuçu",
    patch: { name: "Turuçu", fullName: "Patrick Hartwig Borges", position: "Lateral Direito", birthDate: "1992-08-07", preferredFoot: null },
  },
  {
    keep: 1622,
    remove: 1140,
    keepName: "Turuçu",
    patch: { name: "Turuçu", fullName: "Patrick Hartwig Borges" },
  },
  {
    keep: 1624,
    remove: 611,
    keepName: "Cassiano",
    patch: { fullName: "Cassiano Juvêncio da Silva", position: "Meia Ofensivo", birthDate: "1993-07-20" },
  },
  {
    keep: 415,
    remove: 330,
    keepName: "Cauã Soares",
    patch: { fullName: "Cauã Soares Ferreira Cavalcante", position: "Zagueiro", birthDate: "2005-04-20" },
  },
  {
    keep: 1591,
    remove: 831,
    keepName: "Felipe Garopaba",
    patch: { fullName: "Fellipe Cardoso", position: "Atacante", birthDate: "1982-10-19" },
  },
  {
    keep: 394,
    remove: 359,
    keepName: "Jefferson Júnior",
    patch: { fullName: "Jefferson Francisco de Oliveira Junior", position: "Ponta Esquerda", birthDate: "2002-01-28" },
  },
  {
    keep: 213,
    remove: 249,
    keepName: "João Victor",
    patch: { fullName: "João Victor da Silva Rocha", position: "Meia Central", birthDate: "2002-01-11" },
  },
  {
    keep: 607,
    remove: 257,
    keepName: "Montanhas",
    patch: { name: "Montanhas", fullName: "José Victor das Montanhas Melo", position: "Goleiro", birthDate: "2001-03-03" },
  },
  {
    keep: 644,
    remove: 109,
    keepName: "Luís Maranhão",
    patch: { name: "Luís Maranhão", fullName: "Luís Ricardo Gonçalves Evangelista", position: "Atacante", birthDate: "1993-01-30" },
  },
  {
    keep: 1192,
    remove: 1114,
    keepName: "Samuel",
    patch: { fullName: "Samuel Teram", position: "Zagueiro", birthDate: "1984-11-30" },
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

  const fromStats = (await client.query(
    `SELECT season, appearances, goals, assists, shirt_number FROM player_season_stats WHERE player_id=$1`,
    [remove],
  )).rows;
  for (const s of fromStats) {
    const existing = (await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [keep, s.season],
    )).rows[0];
    if (existing) {
      // Overlapping season with possible double-count: prefer GREATEST for apps/goals
      await client.query(
        `UPDATE player_season_stats SET
           appearances = GREATEST(COALESCE(appearances,0), COALESCE($2,0)),
           goals = GREATEST(COALESCE(goals,0), COALESCE($3,0)),
           assists = GREATEST(COALESCE(assists,0), COALESCE($4,0)),
           shirt_number = COALESCE(shirt_number, $5)
         WHERE id=$1`,
        [existing.id, s.appearances, s.goals, s.assists, s.shirt_number],
      );
    } else {
      await client.query(`UPDATE player_season_stats SET player_id=$2 WHERE player_id=$1 AND season=$3`, [remove, keep, s.season]);
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
       name = COALESCE($2, name),
       full_name = COALESCE($3, full_name),
       position = COALESCE($4, position),
       preferred_foot = COALESCE($5, preferred_foot),
       birth_date = COALESCE($6::date, birth_date),
       birth_year = COALESCE($7, birth_year),
       birth_city = COALESCE($8, birth_city),
       birth_state = COALESCE($9, birth_state),
       nationality = COALESCE($10, nationality),
       height_cm = COALESCE($11, height_cm)
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
    ],
  );

  await client.query(`DELETE FROM players WHERE id=$1`, [remove]);
  console.log(`  OK — conflicts: ${conflicts.rows.length}`);
}

try {
  await client.query("BEGIN");
  for (const m of MERGES) await mergePlayer(m);
  await client.query("COMMIT");

  const remaining = await client.query(`
    SELECT lower(btrim(full_name)) AS fn, array_agg(id ORDER BY id) AS ids, array_agg(name ORDER BY id) AS names, count(*)::int AS n
    FROM players
    WHERE full_name IS NOT NULL AND btrim(full_name) <> ''
    GROUP BY 1 HAVING count(*) > 1
    ORDER BY n DESC, fn
  `);
  console.log("\nRemaining same full_name:", remaining.rows.length);
  console.table(remaining.rows);
  console.log(JSON.stringify({ ok: true, merges: MERGES.length }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
