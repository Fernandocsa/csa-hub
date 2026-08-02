/**
 * Merge duplicate Jorge Siri players:
 *   remove #490 (shell + season "histórico" 77 gols)
 *   keep   #931 (Jorge Antônio dos Santos + lineups 1978/79)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const KEEP = 931;
const REMOVE = 490;

try {
  await client.query("BEGIN");

  const keepP = (
    await client.query(`SELECT id, name, full_name, position FROM players WHERE id=$1`, [KEEP])
  ).rows[0];
  const removeP = (
    await client.query(`SELECT id, name, full_name, position FROM players WHERE id=$1`, [REMOVE])
  ).rows[0];
  if (!keepP || !removeP) throw new Error("Missing Jorge Siri player row");
  if (keepP.name !== "Jorge Siri" || removeP.name !== "Jorge Siri") {
    throw new Error(
      `Unexpected names: keep=${keepP.name} (#${KEEP}) remove=${removeP.name} (#${REMOVE})`,
    );
  }

  const keepName = keepP.name;
  console.log(
    `Merging #${REMOVE} (${removeP.position}) → #${KEEP} (${keepP.full_name || keepP.name}, ${keepP.position})`,
  );

  const conflicts = await client.query(
    `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id
     FROM match_lineups a
     JOIN match_lineups b
       ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
     WHERE a.player_id=$1`,
    [REMOVE, KEEP],
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

  await client.query(`UPDATE match_lineups SET player_id=$2, player_name=$3 WHERE player_id=$1`, [
    REMOVE,
    KEEP,
    keepName,
  ]);
  await client.query(
    `UPDATE match_goals SET scorer_player_id=$2, scorer_name=$3 WHERE scorer_player_id=$1`,
    [REMOVE, KEEP, keepName],
  );
  await client.query(
    `UPDATE match_goals SET assist_player_id=$2, assist_name=$3 WHERE assist_player_id=$1`,
    [REMOVE, KEEP, keepName],
  );
  await client.query(`UPDATE match_cards SET player_id=$2, player_name=$3 WHERE player_id=$1`, [
    REMOVE,
    KEEP,
    keepName,
  ]);
  await client.query(
    `UPDATE match_substitutions SET player_out_id=$2, player_out_name=$3 WHERE player_out_id=$1`,
    [REMOVE, KEEP, keepName],
  );
  await client.query(
    `UPDATE match_substitutions SET player_in_id=$2, player_in_name=$3 WHERE player_in_id=$1`,
    [REMOVE, KEEP, keepName],
  );
  await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [
    REMOVE,
    KEEP,
  ]);

  const pss = await client.query(
    `SELECT season, appearances, goals, assists, shirt_number
     FROM player_season_stats WHERE player_id=$1`,
    [REMOVE],
  );
  for (const row of pss.rows) {
    const exist = (
      await client.query(
        `SELECT id, appearances, goals, assists FROM player_season_stats
         WHERE player_id=$1 AND season=$2`,
        [KEEP, row.season],
      )
    ).rows[0];
    if (exist) {
      await client.query(
        `UPDATE player_season_stats SET
           appearances = GREATEST(COALESCE(appearances,0), COALESCE($2,0)),
           goals = GREATEST(COALESCE(goals,0), COALESCE($3,0)),
           assists = GREATEST(COALESCE(assists,0), COALESCE($4,0)),
           shirt_number = COALESCE(shirt_number, $5)
         WHERE id=$1`,
        [exist.id, row.appearances ?? 0, row.goals ?? 0, row.assists ?? 0, row.shirt_number],
      );
      await client.query(
        `DELETE FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [REMOVE, row.season],
      );
    } else {
      await client.query(
        `UPDATE player_season_stats SET player_id=$2 WHERE player_id=$1 AND season=$3`,
        [REMOVE, KEEP, row.season],
      );
    }
  }

  // Prefer atacante label from the historic goal record if keep still has midfield-only.
  if (removeP.position === "Atacante" && keepP.position && /meia/i.test(keepP.position)) {
    await client.query(`UPDATE players SET position=$2 WHERE id=$1`, [KEEP, "Atacante"]);
    console.log(`  position updated: ${keepP.position} → Atacante`);
  }

  await client.query(
    `UPDATE entity_badges SET entity_id=$2
     WHERE entity_type='player' AND entity_id=$1
       AND NOT EXISTS (
         SELECT 1 FROM entity_badges b
         WHERE b.entity_type='player' AND b.entity_id=$2
           AND b.label = entity_badges.label
           AND COALESCE(b.season_year, -1) = COALESCE(entity_badges.season_year, -1)
       )`,
    [REMOVE, KEEP],
  );
  await client.query(`DELETE FROM entity_badges WHERE entity_type='player' AND entity_id=$1`, [
    REMOVE,
  ]);

  await client.query(`DELETE FROM players WHERE id=$1`, [REMOVE]);

  const after = (
    await client.query(
      `SELECT
         (SELECT count(*)::int FROM players WHERE id=$1) AS keep_exists,
         (SELECT count(*)::int FROM players WHERE id=$2) AS remove_exists,
         (SELECT count(*)::int FROM players WHERE name='Jorge Siri') AS siri_count,
         (SELECT count(*)::int FROM match_lineups WHERE player_id=$1) AS lineups,
         (SELECT goals FROM player_season_stats WHERE player_id=$1 AND season='histórico') AS hist_goals`,
      [KEEP, REMOVE],
    )
  ).rows[0];

  if (after.keep_exists !== 1) throw new Error("keep player missing after merge");
  if (after.remove_exists !== 0) throw new Error("remove player still exists");
  if (after.siri_count !== 1) throw new Error(`expected 1 Jorge Siri, got ${after.siri_count}`);
  if (Number(after.hist_goals) !== 77) {
    throw new Error(`histórico goals expected 77, got ${after.hist_goals}`);
  }

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        kept: KEEP,
        removed: REMOVE,
        lineupConflictsRemoved: conflicts.rows.length,
        lineups: after.lineups,
        historicoGoals: after.hist_goals,
      },
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
