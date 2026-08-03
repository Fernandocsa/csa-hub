/**
 * Merge Jorginho (#1774) → Jorge Siri (#931).
 * Usage: node scripts/merge-jorginho-to-jorge-siri.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

const KEEP = 931;
const REMOVE = 1774;
const KEEP_NAME = "Jorge Siri";

try {
  if (!DRY) await client.query("BEGIN");

  const keepP = (
    await client.query(`SELECT id, name, full_name FROM players WHERE id=$1`, [KEEP])
  ).rows[0];
  const removeP = (
    await client.query(`SELECT id, name, full_name FROM players WHERE id=$1`, [REMOVE])
  ).rows[0];
  if (!keepP || !removeP) throw new Error("Missing player");

  console.log(`Merging #${REMOVE} (${removeP.name}) → #${KEEP} (${KEEP_NAME})`);

  const conflicts = await client.query(
    `SELECT a.id AS from_lineup_id, b.id AS to_lineup_id, a.match_id
     FROM match_lineups a
     JOIN match_lineups b
       ON a.match_id=b.match_id AND a.side=b.side AND b.player_id=$2
     WHERE a.player_id=$1`,
    [REMOVE, KEEP],
  );
  console.log("lineup conflicts:", conflicts.rows.length);
  for (const c of conflicts.rows) {
    if (DRY) continue;
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

  if (!DRY) {
    await client.query(`UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`, [
      REMOVE,
      KEEP,
    ]);

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
        [REMOVE, KEEP, KEEP_NAME],
      );
    }

    // Merge season stats
    const { rows: remStats } = await client.query(
      `SELECT * FROM player_season_stats WHERE player_id=$1`,
      [REMOVE],
    );
    for (const s of remStats) {
      const { rows: keepStats } = await client.query(
        `SELECT id, appearances, goals, assists FROM player_season_stats
         WHERE player_id=$1 AND season=$2`,
        [KEEP, s.season],
      );
      if (keepStats[0]) {
        await client.query(
          `UPDATE player_season_stats
           SET appearances = GREATEST(appearances, $2),
               goals = GREATEST(goals, $3),
               assists = GREATEST(coalesce(assists,0), coalesce($4,0))
           WHERE id=$1`,
          [keepStats[0].id, s.appearances ?? 0, s.goals ?? 0, s.assists ?? 0],
        );
        await client.query(`DELETE FROM player_season_stats WHERE id=$1`, [s.id]);
      } else {
        await client.query(`UPDATE player_season_stats SET player_id=$2 WHERE id=$1`, [
          s.id,
          KEEP,
        ]);
      }
    }

    // entity badges
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
    await client.query(
      `DELETE FROM entity_badges WHERE entity_type='player' AND entity_id=$1`,
      [REMOVE],
    );

    await client.query(`DELETE FROM players WHERE id=$1`, [REMOVE]);
  }

  // Resync seasons that had Jorginho apps from sheets
  if (!DRY) {
    for (const season of ["1976", "1980"]) {
      const { rows: stats } = await client.query(
        `
        WITH played AS (
          SELECT DISTINCT ml.match_id, ml.player_id
          FROM match_lineups ml
          JOIN matches m ON m.id=ml.match_id
          WHERE m.season::text=$1 AND ml.player_id=$2 AND ml.side='csa'
            AND (
              ml.role='starter'
              OR EXISTS (
                SELECT 1 FROM match_substitutions ms
                WHERE ms.match_id=ml.match_id AND ms.side='csa' AND ms.player_in_id=ml.player_id
              )
            )
        ),
        apps AS (SELECT count(*)::int AS appearances FROM played),
        goals AS (
          SELECT count(*)::int AS goals FROM match_goals mg
          JOIN matches m ON m.id=mg.match_id
          WHERE m.season::text=$1 AND mg.scorer_player_id=$2 AND mg.side='csa'
            AND coalesce(mg.is_own_goal,false)=false
        )
        SELECT (SELECT appearances FROM apps) AS appearances,
               (SELECT goals FROM goals) AS goals
        `,
        [season, KEEP],
      );
      const a = stats[0]?.appearances ?? 0;
      const g = stats[0]?.goals ?? 0;
      const { rows: cur } = await client.query(
        `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [KEEP, season],
      );
      if (cur[0]) {
        await client.query(
          `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
          [cur[0].id, a, g],
        );
      }
      console.log(`resync ${season}: apps=${a} goals=${g}`);
    }
  }

  if (DRY) {
    console.log("DRY RUN — no writes");
  } else {
    await client.query("COMMIT");
    console.log("COMMIT ok");
  }

  const after = await client.query(
    `SELECT id, name FROM players WHERE id=ANY($1::int[])`,
    [[KEEP, REMOVE]],
  );
  console.log("players left:", after.rows);
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
