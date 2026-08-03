/**
 * Fix: CSA scorers with player_id but missing from match_lineups
 * get a starter row so player profiles list those matches.
 *
 * Usage: node scripts/fix-csa-scorers-on-lineup.mjs [--dry] [season...]
 * Default: all seasons.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const seasons = process.argv.filter((a) => /^\d{4}$/.test(a));

const pool = createPgPool();
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const seasonFilter =
    seasons.length > 0
      ? `AND m.season::text = ANY($1::text[])`
      : "";
  const params = seasons.length > 0 ? [seasons] : [];

  const { rows: missing } = await client.query(
    `
    SELECT DISTINCT mg.match_id, mg.scorer_player_id AS player_id, p.name AS player_name,
           m.season::text AS season
    FROM match_goals mg
    JOIN matches m ON m.id = mg.match_id
    JOIN players p ON p.id = mg.scorer_player_id
    WHERE mg.side = 'csa'
      AND mg.scorer_player_id IS NOT NULL
      AND coalesce(mg.is_own_goal, false) = false
      AND coalesce(m.is_friendly, false) = false
      AND coalesce(m.status, 'played') <> 'scheduled'
      ${seasonFilter}
      AND NOT EXISTS (
        SELECT 1 FROM match_lineups ml
        WHERE ml.match_id = mg.match_id
          AND ml.side = 'csa'
          AND ml.player_id = mg.scorer_player_id
      )
    ORDER BY m.season, mg.match_id, p.name
    `,
    params,
  );

  console.log("missing lineup rows", missing.length);
  if (missing.length) console.table(missing.slice(0, 40));

  let inserted = 0;
  for (const row of missing) {
    const { rows: sortRows } = await client.query(
      `SELECT coalesce(max(sort_order), -1)::int AS mx FROM match_lineups WHERE match_id=$1 AND side='csa'`,
      [row.match_id],
    );
    const sort = (sortRows[0]?.mx ?? -1) + 1;
    // starter: goals-only sheets — we know they played; profile requires actually-played
    if (!DRY) {
      await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4)`,
        [row.match_id, row.player_id, row.player_name, sort],
      );
    }
    inserted++;
  }

  // Also link goals to lineup_id when possible
  if (!DRY) {
    await client.query(`
      UPDATE match_goals mg
      SET scorer_lineup_id = ml.id
      FROM match_lineups ml
      WHERE mg.side = 'csa'
        AND mg.scorer_player_id = ml.player_id
        AND mg.match_id = ml.match_id
        AND ml.side = 'csa'
        AND mg.scorer_lineup_id IS NULL
        AND coalesce(mg.is_own_goal, false) = false
    `);
  }

  // Re-sync appearances/goals for touched seasons
  const touchedSeasons = [...new Set(missing.map((r) => r.season))];
  const syncSeasons = seasons.length ? seasons : touchedSeasons;
  const syncResults = [];

  for (const season of syncSeasons) {
    const { rows: stats } = await client.query(
      `
      WITH played AS (
        SELECT DISTINCT ml.match_id, ml.player_id
        FROM match_lineups ml
        JOIN matches m ON m.id=ml.match_id
        WHERE m.season::text=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
          AND coalesce(m.is_friendly,false)=false
          AND coalesce(m.status,'played')<>'scheduled'
          AND (
            ml.role='starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions ms
              WHERE ms.match_id=ml.match_id AND ms.side='csa' AND ms.player_in_id=ml.player_id
            )
          )
      ),
      apps AS (SELECT player_id, count(*)::int AS appearances FROM played GROUP BY player_id),
      goals AS (
        SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
        FROM match_goals mg JOIN matches m ON m.id=mg.match_id
        WHERE m.season::text=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
          AND coalesce(mg.is_own_goal,false)=false
          AND coalesce(m.is_friendly,false)=false
          AND coalesce(m.status,'played')<>'scheduled'
        GROUP BY mg.scorer_player_id
      )
      SELECT coalesce(a.player_id,g.player_id) AS player_id,
             coalesce(a.appearances,0)::int AS appearances,
             coalesce(g.goals,0)::int AS goals
      FROM apps a
      FULL OUTER JOIN goals g ON g.player_id=a.player_id
      `,
      [season],
    );

    let updated = 0;
    for (const s of stats) {
      const { rows: cur } = await client.query(
        `SELECT id, appearances, goals FROM player_season_stats
         WHERE player_id=$1 AND season::text=$2`,
        [s.player_id, season],
      );
      if (cur[0]) {
        if (cur[0].appearances !== s.appearances || cur[0].goals !== s.goals) {
          if (!DRY) {
            await client.query(
              `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
              [cur[0].id, s.appearances, s.goals],
            );
          }
          updated++;
        }
      } else if (!DRY) {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1,$2,$3,$4,0)`,
          [s.player_id, season, s.appearances, s.goals],
        );
        updated++;
      }
    }
    syncResults.push({ season, players: stats.length, updated });
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await client.query("COMMIT");
    console.log("OK");
  }
  console.log("inserted", inserted);
  console.log("sync", syncResults);

  // verify Naílson
  const { rows: v } = await client.query(
    `
    SELECT m.match_date::date::text d, count(*)::int goals,
           bool_or(ml.id IS NOT NULL) AS on_lineup
    FROM match_goals mg
    JOIN matches m ON m.id=mg.match_id
    LEFT JOIN match_lineups ml
      ON ml.match_id=mg.match_id AND ml.side='csa' AND ml.player_id=mg.scorer_player_id
    WHERE mg.scorer_player_id=1843 AND mg.side='csa'
      AND coalesce(mg.is_own_goal,false)=false
      AND m.season::text='1999'
    GROUP BY m.id, m.match_date
    ORDER BY m.match_date
    `,
  );
  console.log("Naílson 1999 after:");
  console.table(v);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
