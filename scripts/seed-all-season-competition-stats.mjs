/**
 * Seed calculated season_competition_stats for every season that has official matches.
 * Preserves existing manual rows.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const { rows: seasons } = await pool.query(`
  SELECT DISTINCT season FROM matches
  WHERE is_friendly = false
  ORDER BY season DESC
`);

let seasonsDone = 0;
let upsertedTotal = 0;
let preservedTotal = 0;

for (const { season } of seasons) {
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
    [season],
  );

  const computedIds = computed.map((c) => c.competition_id);
  let upserted = 0;
  let preserved = 0;

  for (const c of computed) {
    const { rows: existing } = await pool.query(
      `SELECT id, stats_source FROM season_competition_stats
       WHERE season = $1 AND competition_id = $2`,
      [season, c.competition_id],
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
        [season, c.competition_id, c.games, c.wins, c.draws, c.losses, c.goals_for, c.goals_against],
      );
    }
    upserted += 1;
  }

  if (computedIds.length > 0) {
    await pool.query(
      `DELETE FROM season_competition_stats
       WHERE season = $1 AND stats_source = 'calculated'
         AND competition_id <> ALL($2::int[])`,
      [season, computedIds],
    );
  }

  seasonsDone += 1;
  upsertedTotal += upserted;
  preservedTotal += preserved;
}

const { rows: totals } = await pool.query(
  `SELECT count(*)::int AS rows, count(DISTINCT season)::int AS seasons
   FROM season_competition_stats`,
);
console.log(JSON.stringify({ seasonsDone, upsertedTotal, preservedTotal, ...totals[0] }, null, 2));
await pool.end();
