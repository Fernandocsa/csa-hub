/**
 * Smoke: recalculate season competition stats for a sample year via DB helpers logic.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const YEAR = process.argv[2] || "2025";

try {
  // Clear sample season calculated rows for clean smoke (keep manuals if any)
  await pool.query(
    `DELETE FROM season_competition_stats WHERE season = $1 AND stats_source = 'calculated'`,
    [YEAR],
  );

  // Insert a manual row that should be preserved (use first competition from matches if needed)
  const { rows: comps } = await pool.query(
    `SELECT DISTINCT competition_id AS id FROM matches
     WHERE season = $1 AND is_friendly = false ORDER BY competition_id LIMIT 2`,
    [YEAR],
  );
  if (comps.length === 0) {
    console.log("No competitions for season", YEAR);
    process.exit(0);
  }

  const manualComp = comps[0].id;
  await pool.query(
    `INSERT INTO season_competition_stats
       (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
        classification, stats_source)
     VALUES ($1, $2, 99, 99, 0, 0, 0, 0, 'TEST-MANUAL', 'manual')
     ON CONFLICT (season, competition_id) DO UPDATE SET
       games = 99, wins = 99, classification = 'TEST-MANUAL', stats_source = 'manual'`,
    [YEAR, manualComp],
  );

  // Mimic recalculate
  const { rows: computed } = await pool.query(
    `SELECT competition_id,
            count(*)::int AS games,
            coalesce(sum(case when result = 'win' then 1 else 0 end),0)::int AS wins,
            coalesce(sum(case when result = 'draw' then 1 else 0 end),0)::int AS draws,
            coalesce(sum(case when result = 'loss' then 1 else 0 end),0)::int AS losses,
            coalesce(sum(goals_for),0)::int AS goals_for,
            coalesce(sum(goals_against),0)::int AS goals_against
     FROM matches
     WHERE season = $1 AND is_friendly = false
     GROUP BY competition_id`,
    [YEAR],
  );

  let upserted = 0;
  let preserved = 0;
  for (const c of computed) {
    const { rows: existing } = await pool.query(
      `SELECT id, stats_source, classification FROM season_competition_stats
       WHERE season = $1 AND competition_id = $2`,
      [YEAR, c.competition_id],
    );
    if (existing[0]?.stats_source === "manual") {
      preserved += 1;
      continue;
    }
    if (existing[0]) {
      await pool.query(
        `UPDATE season_competition_stats SET
           games=$1, wins=$2, draws=$3, losses=$4, goals_for=$5, goals_against=$6,
           stats_source='calculated', stats_recalculated_at=now()
         WHERE id=$7`,
        [c.games, c.wins, c.draws, c.losses, c.goals_for, c.goals_against, existing[0].id],
      );
    } else {
      await pool.query(
        `INSERT INTO season_competition_stats
           (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
            stats_source, stats_recalculated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
        [YEAR, c.competition_id, c.games, c.wins, c.draws, c.losses, c.goals_for, c.goals_against],
      );
    }
    upserted += 1;
  }

  const { rows: final } = await pool.query(
    `SELECT s.competition_id, c.name, s.games, s.wins, s.stats_source, s.classification
     FROM season_competition_stats s
     JOIN competitions c ON c.id = s.competition_id
     WHERE s.season = $1
     ORDER BY c.name`,
    [YEAR],
  );

  const manualRow = final.find((r) => r.competition_id === manualComp);
  console.log(JSON.stringify({
    year: YEAR,
    upserted,
    preserved,
    rows: final,
    manualPreserved:
      manualRow?.games === 99 &&
      manualRow?.wins === 99 &&
      manualRow?.classification === "TEST-MANUAL" &&
      manualRow?.stats_source === "manual",
  }, null, 2));

  // Cleanup test manual classification so we don't leave junk — restore via delete of test values
  await pool.query(
    `DELETE FROM season_competition_stats WHERE season = $1 AND classification = 'TEST-MANUAL'`,
    [YEAR],
  );
  // Re-run clean recalculate for the season so admin starts with calculated data
  for (const c of computed) {
    await pool.query(
      `INSERT INTO season_competition_stats
         (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
          stats_source, stats_recalculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())
       ON CONFLICT (season, competition_id) DO UPDATE SET
         games = EXCLUDED.games,
         wins = EXCLUDED.wins,
         draws = EXCLUDED.draws,
         losses = EXCLUDED.losses,
         goals_for = EXCLUDED.goals_for,
         goals_against = EXCLUDED.goals_against,
         stats_source = 'calculated',
         stats_recalculated_at = now()
         WHERE season_competition_stats.stats_source <> 'manual'`,
      [YEAR, c.competition_id, c.games, c.wins, c.draws, c.losses, c.goals_for, c.goals_against],
    );
  }

  const { rows: after } = await pool.query(
    `SELECT count(*)::int AS n FROM season_competition_stats WHERE season = $1`,
    [YEAR],
  );
  console.log("CLEAN_SEED_ROWS", after[0].n);
} finally {
  await pool.end();
}
