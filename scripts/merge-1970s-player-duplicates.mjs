/**
 * Merge confirmed duplicate CSA players (same full_name / same person).
 *
 * KEEP ← REMOVE
 * 546 Carlinhos Marechal ← 1700 Carlinhos
 * 741 Carlos Alberto Rocha ← 1690 Carlos Alberto
 * 531 Hélio ← 891 Hélio Sururu  (rename keep → Hélio Sururu)
 * 1776 Jaminho ← 908 Jaiminho   (rename keep → Jaiminho)
 * 551 Chico ← 748 Chiquinho
 * 1180 Zé Luiz ← 1783 Zé Luiz (Albuquerque)
 * 494 Ênio Oliveira ← 812 Ênio
 * 778 Dentinho ← 496 Dentinho (shell + histórico)
 * 804 Édson Silva ← 1708 Édson Silva
 * 1769 Espinoza ← 818 Espinosa
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

/** @type {{ keep: number, remove: number, keepName: string, patch?: Record<string, unknown> }[]} */
const MERGES = [
  {
    keep: 546,
    remove: 1700,
    keepName: "Carlinhos Marechal",
    patch: {
      fullName: "José Carlos de Oliveira",
      position: "Lateral Direito",
      preferredFoot: "destro",
      birthDate: "1962-03-04",
      birthCity: "Maceió",
      birthState: "AL",
    },
  },
  {
    keep: 741,
    remove: 1690,
    keepName: "Carlos Alberto Rocha",
    patch: {
      fullName: "Carlos Alberto Rocha Cunha",
      position: "Lateral Esquerdo",
      birthDate: "1955-05-28",
      birthCity: "Salvador",
      birthState: "BA",
    },
  },
  {
    keep: 531,
    remove: 891,
    keepName: "Hélio Sururu",
    patch: {
      name: "Hélio Sururu",
      fullName: "Hélio Soares da Silva",
      position: "Atacante",
      preferredFoot: "ambidestro",
      birthDate: "1954-07-11",
      birthCity: "Maceió",
      birthState: "AL",
    },
  },
  {
    keep: 1776,
    remove: 908,
    keepName: "Jaiminho",
    patch: {
      name: "Jaiminho",
      fullName: "Jamesson Alves da Paixão",
      position: "Lateral Esquerdo",
      birthDate: "1948-07-21",
      birthCity: "Recife",
      birthState: "PE",
    },
  },
  {
    keep: 551,
    remove: 748,
    keepName: "Chico",
    patch: {
      fullName: "Francisco dos Santos Ângelo",
      birthDate: "1967-03-03",
      birthCity: "Maceió",
      birthState: "AL",
      heightCm: 180,
    },
  },
  {
    keep: 1180,
    remove: 1783,
    keepName: "Zé Luiz",
    patch: {
      fullName: "José Luiz Albuquerque Silva",
      position: "Goleiro",
      birthDate: "1948-09-13",
      birthCity: "Águas Belas",
      birthState: "PE",
    },
  },
  {
    keep: 494,
    remove: 812,
    keepName: "Ênio Oliveira",
    patch: {
      fullName: "Ênio Oliveira",
      position: "Ponta Esquerda",
      birthDate: "1950-09-02",
      birthCity: "Porto Alegre",
      birthState: "RS",
      isDeceased: true,
    },
  },
  {
    keep: 778,
    remove: 496,
    keepName: "Dentinho",
    patch: {
      fullName: "Sebastião do Socorro Araújo de Oliveira",
      position: "Centroavante",
      preferredFoot: "destro",
      birthDate: "1956-09-28",
      birthCity: "Manaus",
      birthState: "AM",
      heightCm: 185,
    },
  },
  {
    keep: 804,
    remove: 1708,
    keepName: "Édson Silva",
    patch: {
      fullName: "Édson de Souza Silva",
      position: "Volante",
      birthDate: "1953-04-04",
      birthCity: "Salvador",
      birthState: "BA",
    },
  },
  {
    keep: 1769,
    remove: 818,
    keepName: "Espinoza",
    patch: {
      name: "Espinosa",
      fullName: "Valdir Atahualpa Ramires Espinosa",
      position: "Lateral Direito",
      birthDate: "1947-10-17",
      birthCity: "Porto Alegre",
      birthState: "RS",
      isDeceased: true,
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

  // Season stats: SUM when both exist (lineups were disjoint in these merges)
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

  // Keep display name on keep row when renamed
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

  const checkIds = MERGES.flatMap((m) => [m.keep, m.remove]);
  const { rows } = await client.query(
    `SELECT id, name, full_name, position, birth_date::text, preferred_foot,
            (SELECT COALESCE(sum(appearances),0)::int FROM player_season_stats WHERE player_id=p.id) AS apps,
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

  console.log(JSON.stringify({ ok: true, merges: MERGES.length }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
