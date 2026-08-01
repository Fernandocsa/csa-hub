/**
 * Rebuild player_season_stats.appearances / goals from match sheets.
 * Assists are only overwritten when the season has assist_player_id on match_goals
 * (manual season assist totals are preserved otherwise).
 *
 * Usage:
 *   node scripts/sync-player-season-from-sheets.mjs [--dry] [2013 2014 2015]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const seasons = process.argv
  .slice(2)
  .filter((a) => /^\d{4}$/.test(a));
const TARGETS = seasons.length ? seasons : ["2013", "2014", "2015"];

const pool = createPgPool();
const client = await pool.connect();

try {
  if (!DRY) await client.query("BEGIN");

  for (const season of TARGETS) {
    const { rows: assistGate } = await client.query(
      `SELECT count(*)::int AS n
       FROM match_goals mg
       JOIN matches m ON m.id = mg.match_id
       WHERE m.season = $1
         AND m.is_friendly = false
         AND mg.side = 'csa'
         AND mg.assist_player_id IS NOT NULL`,
      [season],
    );
    const syncAssists = (assistGate[0]?.n ?? 0) > 0;

    const { rows: sheetStats } = await client.query(
      `
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id = ml.match_id
        WHERE m.season = $1
          AND m.is_friendly = false
          AND ml.side = 'csa'
          AND ml.player_id IS NOT NULL
          AND (
            ml.role = 'starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions s
              WHERE s.match_id = ml.match_id
                AND s.side = 'csa'
                AND s.player_in_id = ml.player_id
            )
          )
        GROUP BY ml.player_id
      ),
      goals AS (
        SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
        FROM match_goals mg
        JOIN matches m ON m.id = mg.match_id
        WHERE m.season = $1
          AND m.is_friendly = false
          AND mg.side = 'csa'
          AND coalesce(mg.is_own_goal, false) = false
          AND mg.scorer_player_id IS NOT NULL
        GROUP BY mg.scorer_player_id
      ),
      assists AS (
        SELECT mg.assist_player_id AS player_id, count(*)::int AS assists
        FROM match_goals mg
        JOIN matches m ON m.id = mg.match_id
        WHERE m.season = $1
          AND m.is_friendly = false
          AND mg.side = 'csa'
          AND coalesce(mg.is_own_goal, false) = false
          AND mg.assist_player_id IS NOT NULL
        GROUP BY mg.assist_player_id
      ),
      players AS (
        SELECT player_id FROM apps
        UNION
        SELECT player_id FROM goals
        UNION
        SELECT player_id FROM assists
      )
      SELECT
        p.player_id,
        coalesce(a.appearances, 0)::int AS appearances,
        coalesce(g.goals, 0)::int AS goals,
        coalesce(as_.assists, 0)::int AS assists
      FROM players p
      LEFT JOIN apps a ON a.player_id = p.player_id
      LEFT JOIN goals g ON g.player_id = p.player_id
      LEFT JOIN assists as_ ON as_.player_id = p.player_id
      ORDER BY appearances DESC, goals DESC, assists DESC, player_id
      `,
      [season],
    );

    const touched = new Set(sheetStats.map((s) => s.player_id));

    // Zero out roster rows that have no sheet activity (stale manual leftovers)
    const { rows: roster } = await client.query(
      `SELECT id, player_id, appearances, goals, assists
       FROM player_season_stats WHERE season = $1`,
      [season],
    );

    let updated = 0;
    let inserted = 0;
    let zeroed = 0;

    for (const s of sheetStats) {
      const { rows: cur } = await client.query(
        `SELECT id, appearances, goals, assists
         FROM player_season_stats WHERE player_id = $1 AND season = $2`,
        [s.player_id, season],
      );
      if (cur[0]) {
        const nextAssists = syncAssists ? s.assists : cur[0].assists;
        const same =
          cur[0].appearances === s.appearances &&
          cur[0].goals === s.goals &&
          cur[0].assists === nextAssists;
        if (!same) {
          if (!DRY) {
            await client.query(
              `UPDATE player_season_stats
               SET appearances = $2, goals = $3, assists = $4
               WHERE id = $1`,
              [cur[0].id, s.appearances, s.goals, nextAssists],
            );
          }
          updated += 1;
        }
      } else {
        if (!DRY) {
          await client.query(
            `INSERT INTO player_season_stats
               (player_id, season, appearances, goals, assists)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              s.player_id,
              season,
              s.appearances,
              s.goals,
              syncAssists ? s.assists : 0,
            ],
          );
        }
        inserted += 1;
      }
    }

    for (const r of roster) {
      if (touched.has(r.player_id)) continue;
      if (r.appearances === 0 && r.goals === 0 && r.assists === 0) continue;
      if (!DRY) {
        // Preserve manual assists when sheets have no assist events
        await client.query(
          syncAssists
            ? `UPDATE player_season_stats
               SET appearances = 0, goals = 0, assists = 0 WHERE id = $1`
            : `UPDATE player_season_stats
               SET appearances = 0, goals = 0 WHERE id = $1`,
          [r.id],
        );
      }
      zeroed += 1;
    }

    const topApps = sheetStats.slice(0, 5).map(
      (s) => `#${s.player_id}:${s.appearances}J`,
    );
    const topGoals = [...sheetStats]
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5)
      .map((s) => `#${s.player_id}:${s.goals}G`);
    const goalSum = sheetStats.reduce((n, s) => n + s.goals, 0);

    console.log(
      `\n${season}: players=${sheetStats.length} updated=${updated} inserted=${inserted} zeroed=${zeroed} goals_sum=${goalSum}`,
    );
    console.log(`  top apps: ${topApps.join(", ") || "—"}`);
    console.log(`  top goals: ${topGoals.join(", ") || "—"}`);
  }

  if (DRY) {
    console.log("\nDRY RUN — no writes");
  } else {
    await client.query("COMMIT");
    console.log("\nCOMMIT ok");
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
