/**
 * Normalize walkover scores to conventional 1–0 (win) / 0–1 (loss)
 * and refresh season_competition_stats including W.O. (officialPlayedMatchConditions).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const { rows: updatedWins } = await client.query(
    `UPDATE matches
     SET goals_for = 1, goals_against = 0
     WHERE coalesce(is_walkover, false) = true
       AND result = 'win'
       AND (goals_for IS NULL OR goals_against IS NULL
            OR goals_for IS DISTINCT FROM 1 OR goals_against IS DISTINCT FROM 0)
     RETURNING id, season, competition_id`,
  );

  const { rows: updatedLosses } = await client.query(
    `UPDATE matches
     SET goals_for = 0, goals_against = 1
     WHERE coalesce(is_walkover, false) = true
       AND result = 'loss'
       AND (goals_for IS NULL OR goals_against IS NULL
            OR goals_for IS DISTINCT FROM 0 OR goals_against IS DISTINCT FROM 1)
     RETURNING id, season, competition_id`,
  );

  // Seasons/competitions that have any walkover — recompute official aggregates (incl. W.O.)
  const { rows: pairs } = await client.query(
    `SELECT DISTINCT season, competition_id
     FROM matches
     WHERE coalesce(is_walkover, false) = true
       AND coalesce(is_friendly, false) = false`,
  );

  const refreshed = [];
  for (const p of pairs) {
    const { rows: agg } = await client.query(
      `SELECT
         count(*)::int AS games,
         coalesce(sum(case when result = 'win' then 1 else 0 end), 0)::int AS wins,
         coalesce(sum(case when result = 'draw' then 1 else 0 end), 0)::int AS draws,
         coalesce(sum(case when result = 'loss' then 1 else 0 end), 0)::int AS losses,
         coalesce(sum(goals_for), 0)::int AS goals_for,
         coalesce(sum(goals_against), 0)::int AS goals_against
       FROM matches
       WHERE season = $1
         AND competition_id = $2
         AND coalesce(is_friendly, false) = false
         AND coalesce(status, 'played') <> 'scheduled'
         AND result IN ('win', 'draw', 'loss')`,
      [p.season, p.competition_id],
    );
    const a = agg[0];

    const { rows: existing } = await client.query(
      `SELECT id FROM season_competition_stats
       WHERE season = $1 AND competition_id = $2`,
      [p.season, p.competition_id],
    );

    if (existing[0]) {
      await client.query(
        `UPDATE season_competition_stats
         SET games = $1, wins = $2, draws = $3, losses = $4,
             goals_for = $5, goals_against = $6,
             stats_source = 'calculated',
             stats_recalculated_at = now()
         WHERE id = $7`,
        [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, existing[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO season_competition_stats
           (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
            stats_source, stats_recalculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'calculated', now())`,
        [p.season, p.competition_id, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
      );
    }

    refreshed.push({ season: p.season, competitionId: p.competition_id, ...a });
  }

  const { rows: stillNull } = await client.query(
    `SELECT count(*)::int AS n FROM matches
     WHERE coalesce(is_walkover, false) = true
       AND result IN ('win', 'loss')
       AND (goals_for IS NULL OR goals_against IS NULL)`,
  );

  if (stillNull[0].n > 0) {
    throw new Error(`Still ${stillNull[0].n} W.O. without scores`);
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        updatedWins: updatedWins.length,
        updatedLosses: updatedLosses.length,
        winIds: updatedWins.map((r) => r.id),
        lossIds: updatedLosses.map((r) => r.id),
        refreshedSeasonCompStats: refreshed.filter(
          (r) => r.season === "1937" || r.season === "1939",
        ),
        refreshedCount: refreshed.length,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
