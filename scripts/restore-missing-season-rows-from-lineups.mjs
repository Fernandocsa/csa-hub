/**
 * Restore player_season_stats rows for seasons where the player appears on a
 * CSA sheet (including unused bench) but has no season-stat row.
 * Apps/goals are filled from sheets when the player actually played.
 *
 * Usage:
 *   node scripts/restore-missing-season-rows-from-lineups.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

try {
  const { rows: missing } = await client.query(`
    WITH lineup_seasons AS (
      SELECT l.player_id, m.season::text AS season,
             MAX(l.shirt_number) FILTER (WHERE l.shirt_number IS NOT NULL) AS shirt_number
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.side = 'csa' AND l.player_id IS NOT NULL
      GROUP BY l.player_id, m.season
    ),
    played AS (
      SELECT ml.player_id, m.season::text AS season,
             COUNT(DISTINCT ml.match_id)::int AS appearances
      FROM match_lineups ml
      JOIN matches m ON m.id = ml.match_id
      WHERE ml.side = 'csa' AND ml.player_id IS NOT NULL
        AND (
          ml.role = 'starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions s
            WHERE s.match_id = ml.match_id
              AND s.side = 'csa'
              AND s.player_in_id = ml.player_id
          )
        )
      GROUP BY ml.player_id, m.season
    ),
    goals AS (
      SELECT mg.scorer_player_id AS player_id, m.season::text AS season,
             COUNT(*)::int AS goals
      FROM match_goals mg
      JOIN matches m ON m.id = mg.match_id
      WHERE mg.side = 'csa'
        AND coalesce(mg.is_own_goal, false) = false
        AND mg.scorer_player_id IS NOT NULL
      GROUP BY mg.scorer_player_id, m.season
    ),
    assists AS (
      SELECT mg.assist_player_id AS player_id, m.season::text AS season,
             COUNT(*)::int AS assists
      FROM match_goals mg
      JOIN matches m ON m.id = mg.match_id
      WHERE mg.side = 'csa' AND mg.assist_player_id IS NOT NULL
      GROUP BY mg.assist_player_id, m.season
    )
    SELECT ls.player_id, ls.season, ls.shirt_number, p.name,
           coalesce(pl.appearances, 0)::int AS appearances,
           coalesce(g.goals, 0)::int AS goals,
           coalesce(a.assists, 0)::int AS assists
    FROM lineup_seasons ls
    JOIN players p ON p.id = ls.player_id
    LEFT JOIN player_season_stats pss
      ON pss.player_id = ls.player_id AND pss.season::text = ls.season
    LEFT JOIN played pl ON pl.player_id = ls.player_id AND pl.season = ls.season
    LEFT JOIN goals g ON g.player_id = ls.player_id AND g.season = ls.season
    LEFT JOIN assists a ON a.player_id = ls.player_id AND a.season = ls.season
    WHERE pss.id IS NULL
    ORDER BY ls.season DESC, p.name
  `);

  console.log(`Missing season rows: ${missing.length}`);
  for (const r of missing.slice(0, 40)) {
    console.log(
      `  #${r.player_id} ${r.name} → ${r.season} (apps=${r.appearances} g=${r.goals} a=${r.assists})`,
    );
  }
  if (missing.length > 40) console.log(`  ... +${missing.length - 40} more`);

  if (DRY) {
    console.log("DRY RUN — no writes");
    process.exit(0);
  }

  await client.query("BEGIN");
  let inserted = 0;
  for (const r of missing) {
    await client.query(
      `INSERT INTO player_season_stats
         (player_id, season, appearances, goals, assists, shirt_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        r.player_id,
        r.season,
        r.appearances,
        r.goals,
        r.assists,
        r.shirt_number ?? null,
      ],
    );
    inserted += 1;
  }
  await client.query("COMMIT");
  console.log(`Inserted ${inserted} season rows`);

  const check = await client.query(
    `SELECT season, appearances, goals, assists, shirt_number
     FROM player_season_stats WHERE player_id=445 ORDER BY season`,
  );
  console.log("Player #445 after:", check.rows);
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
