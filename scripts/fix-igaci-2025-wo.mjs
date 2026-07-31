/**
 * Mark CSA 3x0 Igaci (2025-01-15, Alagoano) as W.O. with official 3–0 score
 * (exception to the usual 1–0 / 0–1 walkover convention).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1256;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT m.id, m.match_date::text AS match_date, m.season, m.home_away,
            m.goals_for, m.goals_against, m.result, m.is_walkover, o.name AS opponent
     FROM matches m
     JOIN opponents o ON o.id = m.opponent_id
     WHERE m.id = $1
     FOR UPDATE`,
    [MATCH_ID],
  );

  if (!before[0]) throw new Error(`Match ${MATCH_ID} not found`);
  const b = before[0];
  if (!String(b.opponent).toLowerCase().includes("igaci")) {
    throw new Error(`Expected Igaci, got ${b.opponent}`);
  }
  if (b.goals_for !== 3 || b.goals_against !== 0 || b.result !== "win") {
    throw new Error(
      `Expected win 3-0, got ${b.result} ${b.goals_for}-${b.goals_against}`,
    );
  }

  const { rows: updated } = await client.query(
    `UPDATE matches
     SET is_walkover = true
     WHERE id = $1
     RETURNING id, goals_for, goals_against, result, is_walkover, season, competition_id`,
    [MATCH_ID],
  );

  // Refresh season/competition aggregates (W.O. counts as official result).
  const u = updated[0];
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
    [u.season, u.competition_id],
  );
  const a = agg[0];

  const { rows: existing } = await client.query(
    `SELECT id, stats_source FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [u.season, u.competition_id],
  );

  let statsAction = "skipped_manual";
  if (!existing[0]) {
    await client.query(
      `INSERT INTO season_competition_stats
         (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
          stats_source, stats_recalculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'calculated', now())`,
      [u.season, u.competition_id, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
    statsAction = "inserted";
  } else if (existing[0].stats_source !== "manual") {
    await client.query(
      `UPDATE season_competition_stats
       SET games = $1, wins = $2, draws = $3, losses = $4,
           goals_for = $5, goals_against = $6,
           stats_source = 'calculated',
           stats_recalculated_at = now()
       WHERE id = $7`,
      [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, existing[0].id],
    );
    statsAction = "updated";
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        before: { id: b.id, opponent: b.opponent, score: `${b.goals_for}-${b.goals_against}`, is_walkover: b.is_walkover },
        after: updated[0],
        seasonStats: { action: statsAction, ...a },
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
