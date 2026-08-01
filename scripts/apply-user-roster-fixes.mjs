/**
 * Apply user-provided roster fixes:
 * - Delete Clevinho (512)
 * - Jefferson Júnior (394): 6 apps + 1 gol in 2023, 9 apps in 2024, remove 2025
 *
 * Usage: node scripts/apply-user-roster-fixes.mjs [--dry-run]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const dryRun = process.argv.includes("--dry-run");
loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

try {
  if (!dryRun) await client.query("BEGIN");

  const { rows: clevRefs } = await client.query(`
    SELECT
      (SELECT count(*)::int FROM match_lineups WHERE player_id = 512) AS lineups,
      (SELECT count(*)::int FROM match_goals WHERE scorer_player_id = 512 OR assist_player_id = 512) AS goals,
      (SELECT count(*)::int FROM match_cards WHERE player_id = 512) AS cards,
      (SELECT count(*)::int FROM match_substitutions WHERE player_out_id = 512 OR player_in_id = 512) AS subs,
      (SELECT count(*)::int FROM matches WHERE captain_player_id = 512) AS captain
  `);
  const refs = clevRefs[0];
  const hasMatchData =
    refs.lineups + refs.goals + refs.cards + refs.subs + refs.captain > 0;
  console.log("Clevinho match refs:", refs);

  const { rows: existingJeff } = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats WHERE player_id = 394 ORDER BY season`,
  );
  console.log("Jefferson before:", existingJeff);

  if (!dryRun) {
    await client.query(`DELETE FROM player_season_stats WHERE player_id = 512`);
    if (!hasMatchData) {
      await client.query(`DELETE FROM players WHERE id = 512`);
      console.log("Deleted player Clevinho (512)");
    } else {
      console.log("Kept player 512 (has match data); only removed season stats");
    }

    await client.query(
      `DELETE FROM player_season_stats WHERE player_id = 394 AND season = '2025'`,
    );

    const { rows: s2023 } = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id = 394 AND season = '2023'`,
    );
    if (s2023[0]) {
      await client.query(
        `UPDATE player_season_stats SET appearances = 6, goals = 1, assists = 0 WHERE id = $1`,
        [s2023[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES (394, '2023', 6, 1, 0)`,
      );
    }

    const { rows: s2024 } = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id = 394 AND season = '2024'`,
    );
    if (s2024[0]) {
      await client.query(
        `UPDATE player_season_stats SET appearances = 9, goals = 0 WHERE id = $1`,
        [s2024[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES (394, '2024', 9, 0, 0)`,
      );
    }

    await client.query("COMMIT");
  } else {
    console.log("DRY: would delete Clevinho stats" + (hasMatchData ? "" : " + player"));
    console.log("DRY: Jefferson → 2023:6/1, 2024:9/0, remove 2025");
  }

  if (!dryRun) {
    const { rows: afterJeff } = await pool.query(
      `SELECT season, appearances, goals FROM player_season_stats WHERE player_id = 394 ORDER BY season`,
    );
    console.log("Jefferson after:", afterJeff);
  }
  console.log("ok");
} catch (e) {
  if (!dryRun) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
