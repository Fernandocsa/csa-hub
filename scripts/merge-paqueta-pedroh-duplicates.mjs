/**
 * Merge duplicate players from user bio:
 * - Paquetá (609) → Wykley (261)  [same: Wykley Flysmaky Alves de Almeida]
 * - Pedro Henrique (599) → Pedrão (319)  [same: Pedro Henrique Gonçalo de Paiva]
 *
 * Also applies José Victor bio via enrich-user-provided-2.json (run apply-player-bio separately).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

async function mergePlayer(fromId, toId, toName, profilePatch = {}) {
  const fromP = (
    await client.query(`SELECT id, name, full_name FROM players WHERE id=$1`, [fromId])
  ).rows[0];
  const toP = (
    await client.query(`SELECT id, name, full_name FROM players WHERE id=$1`, [toId])
  ).rows[0];
  if (!fromP || !toP) throw new Error(`Missing player from=${fromId} to=${toId}`);

  console.log(`Merging ${fromP.name} (#${fromId}) → ${toP.name} (#${toId})`);

  await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [
    fromId,
    toId,
  ]);

  // lineup conflicts: same match+side
  const conflicts = await client.query(
    `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
     FROM match_lineups a
     JOIN match_lineups b ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
     WHERE a.player_id=$1`,
    [fromId, toId],
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
      [fromId, toId, toName],
    );
  }

  // Merge season stats (sum apps/goals/assists)
  const fromStats = (
    await client.query(
      `SELECT season, appearances, goals, assists, shirt_number FROM player_season_stats WHERE player_id=$1`,
      [fromId],
    )
  ).rows;
  for (const s of fromStats) {
    const existing = (
      await client.query(
        `SELECT id, appearances, goals, assists FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [toId, s.season],
      )
    ).rows[0];
    if (existing) {
      await client.query(
        `UPDATE player_season_stats SET
           appearances = COALESCE(appearances,0) + COALESCE($2,0),
           goals = COALESCE(goals,0) + COALESCE($3,0),
           assists = COALESCE(assists,0) + COALESCE($4,0)
         WHERE id=$1`,
        [existing.id, s.appearances, s.goals, s.assists],
      );
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists, shirt_number)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [toId, s.season, s.appearances, s.goals, s.assists, s.shirt_number],
      );
    }
  }
  await client.query(`DELETE FROM player_season_stats WHERE player_id=$1`, [fromId]);

  // Profile patch on target
  if (Object.keys(profilePatch).length) {
    await client.query(
      `UPDATE players SET
         full_name = COALESCE($2, full_name),
         position = COALESCE($3, position),
         preferred_foot = COALESCE($4, preferred_foot),
         birth_date = COALESCE($5::date, birth_date),
         birth_year = COALESCE($6, birth_year),
         nationality = COALESCE($7, nationality),
         height_cm = COALESCE($8, height_cm),
         weight_kg = COALESCE($9, weight_kg)
       WHERE id=$1`,
      [
        toId,
        profilePatch.fullName ?? null,
        profilePatch.position ?? null,
        profilePatch.preferredFoot ?? null,
        profilePatch.birthDate ?? null,
        profilePatch.birthYear ?? null,
        profilePatch.nationality ?? null,
        profilePatch.heightCm ?? null,
        profilePatch.weightKg ?? null,
      ],
    );
  }

  await client.query(`DELETE FROM players WHERE id=$1`, [fromId]);
  console.log(`  deleted #${fromId}; conflicts removed: ${conflicts.rows.length}`);
}

try {
  await client.query("BEGIN");

  // Paquetá → Wykley
  await mergePlayer(609, 261, "Wykley", {
    fullName: "Wykley Flysmaky Alves de Almeida",
    position: "Atacante",
    birthDate: "2002-09-11",
    birthYear: 2002,
    nationality: "Brasil",
  });

  // Pedro Henrique → Pedrão
  await mergePlayer(599, 319, "Pedrão", {
    fullName: "Pedro Henrique Gonçalo de Paiva",
    position: "Meia",
    birthDate: "2003-05-14",
    birthYear: 2003,
    nationality: "Brasil",
  });

  await client.query("COMMIT");
  console.log("ok");
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
