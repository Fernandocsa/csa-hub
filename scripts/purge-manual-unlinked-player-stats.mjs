/**
 * Remove manual goal/app floors that are not backed by linked match sheets:
 * 1) DELETE non-YYYY seasons (e.g. "histórico")
 * 2) Rebuild YYYY appearances/goals from sheets (assists preserved)
 *
 * Usage: node scripts/purge-manual-unlinked-player-stats.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const __dirname = dirname(fileURLToPath(import.meta.url));
const pool = createPgPool();
const client = await pool.connect();

try {
  if (!DRY) await client.query("BEGIN");

  const { rows: doomed } = await client.query(`
    SELECT p.id, p.name, pss.season, pss.appearances, pss.goals, pss.assists, pss.id AS pss_id
    FROM player_season_stats pss
    JOIN players p ON p.id = pss.player_id
    WHERE pss.season !~ '^[0-9]{4}$'
    ORDER BY pss.goals DESC NULLS LAST, p.name
  `);

  console.log(`non-YYYY rows to delete: ${doomed.length}`);
  console.table(
    doomed.map((r) => ({
      id: r.id,
      name: r.name,
      season: r.season,
      apps: r.appearances,
      goals: r.goals,
      assists: r.assists,
    })),
  );

  if (!DRY && doomed.length) {
    const del = await client.query(
      `DELETE FROM player_season_stats WHERE season !~ '^[0-9]{4}$' RETURNING id`,
    );
    console.log(`deleted ${del.rowCount} non-YYYY rows`);
  }

  if (DRY) {
    console.log("DRY RUN — no writes; skipping sheet sync");
  } else {
    await client.query("COMMIT");
    console.log("COMMIT ok (histórico purged)");
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}

if (!DRY && process.exitCode !== 1) {
  const sync = join(__dirname, "sync-player-season-from-sheets.mjs");
  console.log("\nRunning sheet sync…");
  const r = spawnSync(process.execPath, [sync], {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  });
  if (r.status) process.exitCode = r.status;
}
