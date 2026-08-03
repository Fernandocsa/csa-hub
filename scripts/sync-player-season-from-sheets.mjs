/**
 * Rebuild player_season_stats.appearances / goals from linked match sheets only.
 * Assists are never overwritten (manual season assist totals are preserved).
 * Season "histórico" and other non-YYYY keys are skipped.
 *
 * Usage:
 *   node scripts/sync-player-season-from-sheets.mjs [--dry]
 *   node scripts/sync-player-season-from-sheets.mjs [--dry] 1969 1970 1972
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const seasonsArg = process.argv.slice(2).filter((a) => /^\d{4}$/.test(a));

const pool = createPgPool();
const client = await pool.connect();

try {
  if (!DRY) await client.query("BEGIN");

  let TARGETS = seasonsArg;
  if (!TARGETS.length) {
    const { rows } = await client.query(`
      SELECT season FROM (
        SELECT DISTINCT season::text AS season FROM matches
        WHERE season::text ~ '^[0-9]{4}$'
        UNION
        SELECT DISTINCT season::text AS season FROM player_season_stats
        WHERE season::text ~ '^[0-9]{4}$'
      ) s
      ORDER BY season
    `);
    TARGETS = rows.map((r) => r.season);
  }

  let totalUpdated = 0;
  let totalInserted = 0;
  let totalZeroed = 0;

  for (const season of TARGETS) {
    const { rows: sheetStats } = await client.query(
      `
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id = ml.match_id
        WHERE m.season::text = $1
          AND coalesce(m.is_friendly, false) = false
          AND coalesce(m.status, 'played') <> 'scheduled'
          AND coalesce(m.result, '') <> 'unknown'
          AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
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
        WHERE m.season::text = $1
          AND coalesce(m.is_friendly, false) = false
          AND coalesce(m.status, 'played') <> 'scheduled'
          AND coalesce(m.result, '') <> 'unknown'
          AND lower(coalesce(m.phase, '')) NOT LIKE '%anulad%'
          AND mg.side = 'csa'
          AND coalesce(mg.is_own_goal, false) = false
          AND mg.scorer_player_id IS NOT NULL
        GROUP BY mg.scorer_player_id
      ),
      players AS (
        SELECT player_id FROM apps
        UNION
        SELECT player_id FROM goals
      )
      SELECT
        p.player_id,
        coalesce(a.appearances, 0)::int AS appearances,
        coalesce(g.goals, 0)::int AS goals
      FROM players p
      LEFT JOIN apps a ON a.player_id = p.player_id
      LEFT JOIN goals g ON g.player_id = p.player_id
      ORDER BY appearances DESC, goals DESC, player_id
      `,
      [season],
    );

    const touched = new Set(sheetStats.map((s) => s.player_id));

    const { rows: roster } = await client.query(
      `SELECT id, player_id, appearances, goals, assists
       FROM player_season_stats WHERE season::text = $1`,
      [season],
    );

    let updated = 0;
    let inserted = 0;
    let zeroed = 0;

    for (const s of sheetStats) {
      const { rows: cur } = await client.query(
        `SELECT id, appearances, goals, assists
         FROM player_season_stats WHERE player_id = $1 AND season::text = $2`,
        [s.player_id, season],
      );
      if (cur[0]) {
        const same =
          cur[0].appearances === s.appearances && cur[0].goals === s.goals;
        if (!same) {
          if (!DRY) {
            await client.query(
              `UPDATE player_season_stats
               SET appearances = $2, goals = $3
               WHERE id = $1`,
              [cur[0].id, s.appearances, s.goals],
            );
          }
          updated += 1;
        }
      } else {
        if (!DRY) {
          await client.query(
            `INSERT INTO player_season_stats
               (player_id, season, appearances, goals, assists)
             VALUES ($1, $2, $3, $4, 0)`,
            [s.player_id, season, s.appearances, s.goals],
          );
        }
        inserted += 1;
      }
    }

    for (const r of roster) {
      if (touched.has(r.player_id)) continue;
      // No linked sheet activity: drop manual apps/goals (or the whole row if no assists)
      if ((r.appearances ?? 0) === 0 && (r.goals ?? 0) === 0) continue;
      if (!DRY) {
        if ((r.assists ?? 0) > 0) {
          await client.query(
            `UPDATE player_season_stats
             SET appearances = 0, goals = 0 WHERE id = $1`,
            [r.id],
          );
        } else {
          await client.query(`DELETE FROM player_season_stats WHERE id = $1`, [
            r.id,
          ]);
        }
      }
      zeroed += 1;
    }

    totalUpdated += updated;
    totalInserted += inserted;
    totalZeroed += zeroed;

    if (updated || inserted || zeroed || sheetStats.length) {
      const goalSum = sheetStats.reduce((n, s) => n + s.goals, 0);
      console.log(
        `${season}: sheet=${sheetStats.length} updated=${updated} inserted=${inserted} zeroed=${zeroed} goals_sum=${goalSum}`,
      );
    }
  }

  // Drop fully empty season rows (no apps/goals/assists)
  let emptyDeleted = 0;
  if (!DRY) {
    const del = await client.query(
      `DELETE FROM player_season_stats
       WHERE coalesce(appearances,0)=0 AND coalesce(goals,0)=0 AND coalesce(assists,0)=0
       RETURNING id`,
    );
    emptyDeleted = del.rowCount ?? 0;
  }

  console.log(
    `\nTOTAL updated=${totalUpdated} inserted=${totalInserted} zeroed=${totalZeroed} emptyDeleted=${emptyDeleted} seasons=${TARGETS.length}`,
  );

  if (DRY) {
    console.log("DRY RUN — no writes");
  } else {
    await client.query("COMMIT");
    console.log("COMMIT ok (assists preserved; histórico skipped)");
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
