/**
 * Schema stage: add manager profile columns + batch season recalc for managers with matches.
 * Preserves manual season rows. Does not drop start_year/end_year/seasons.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

async function computeSeasons(client, managerId) {
  const { rows } = await client.query(
    `
    SELECT
      season,
      count(*)::int AS games,
      count(*) FILTER (WHERE result = 'win')::int AS wins,
      count(*) FILTER (WHERE result = 'draw')::int AS draws,
      count(*) FILTER (WHERE result = 'loss')::int AS losses,
      coalesce(sum(goals_for), 0)::int AS goals_for,
      coalesce(sum(goals_against), 0)::int AS goals_against
    FROM matches
    WHERE manager_id = $1
    GROUP BY season
    ORDER BY season DESC
  `,
    [managerId],
  );
  return rows;
}

async function syncCareer(client, managerId) {
  await client.query(
    `
    UPDATE managers m SET
      stored_games = s.games,
      stored_wins = s.wins,
      stored_draws = s.draws,
      stored_losses = s.losses,
      stored_goals_for = s.goals_for,
      stored_goals_against = s.goals_against,
      stats_source = CASE
        WHEN s.row_count = 0 THEN NULL
        WHEN s.manual_count > 0 THEN 'manual'
        ELSE 'calculated'
      END,
      stats_recalculated_at = CASE WHEN s.row_count > 0 THEN now() ELSE NULL END
    FROM (
      SELECT
        manager_id,
        coalesce(sum(games),0)::int AS games,
        coalesce(sum(wins),0)::int AS wins,
        coalesce(sum(draws),0)::int AS draws,
        coalesce(sum(losses),0)::int AS losses,
        coalesce(sum(goals_for),0)::int AS goals_for,
        coalesce(sum(goals_against),0)::int AS goals_against,
        count(*)::int AS row_count,
        count(*) FILTER (WHERE stats_source = 'manual')::int AS manual_count
      FROM manager_season_stats
      WHERE manager_id = $1
      GROUP BY manager_id
    ) s
    WHERE m.id = s.manager_id
  `,
    [managerId],
  );

  // If no season rows left, clear stored_*
  await client.query(
    `
    UPDATE managers m SET
      stored_games = NULL,
      stored_wins = NULL,
      stored_draws = NULL,
      stored_losses = NULL,
      stored_goals_for = NULL,
      stored_goals_against = NULL,
      stats_source = NULL,
      stats_recalculated_at = NULL
    WHERE m.id = $1
      AND NOT EXISTS (
        SELECT 1 FROM manager_season_stats s WHERE s.manager_id = m.id
      )
  `,
    [managerId],
  );
}

async function recalcManager(client, managerId, name) {
  const seasons = await computeSeasons(client, managerId);
  const seasonKeys = seasons.map((s) => s.season);

  const { rows: existing } = await client.query(
    `SELECT id, season, stats_source FROM manager_season_stats WHERE manager_id = $1`,
    [managerId],
  );
  const bySeason = new Map(existing.map((r) => [r.season, r]));

  let upserted = 0;
  let preservedManual = 0;

  for (const s of seasons) {
    const cur = bySeason.get(s.season);
    if (cur?.stats_source === "manual") {
      preservedManual += 1;
      continue;
    }
    await client.query(
      `
      INSERT INTO manager_season_stats (
        manager_id, season, games, wins, draws, losses,
        goals_for, goals_against, stats_source, stats_recalculated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated', now())
      ON CONFLICT (manager_id, season) DO UPDATE SET
        games = EXCLUDED.games,
        wins = EXCLUDED.wins,
        draws = EXCLUDED.draws,
        losses = EXCLUDED.losses,
        goals_for = EXCLUDED.goals_for,
        goals_against = EXCLUDED.goals_against,
        stats_source = 'calculated',
        stats_recalculated_at = now()
      WHERE manager_season_stats.stats_source IS DISTINCT FROM 'manual'
    `,
      [
        managerId,
        s.season,
        s.games,
        s.wins,
        s.draws,
        s.losses,
        s.goals_for,
        s.goals_against,
      ],
    );
    upserted += 1;
  }

  let removed = 0;
  if (seasonKeys.length === 0) {
    const del = await client.query(
      `DELETE FROM manager_season_stats
       WHERE manager_id = $1 AND stats_source = 'calculated'
       RETURNING id`,
      [managerId],
    );
    removed = del.rowCount ?? 0;
  } else {
    const del = await client.query(
      `DELETE FROM manager_season_stats
       WHERE manager_id = $1
         AND stats_source = 'calculated'
         AND NOT (season = ANY($2::text[]))
       RETURNING id`,
      [managerId, seasonKeys],
    );
    removed = del.rowCount ?? 0;
  }

  await syncCareer(client, managerId);

  const { rows: finalRows } = await client.query(
    `SELECT season, games, wins, draws, losses, goals_for, goals_against, stats_source
     FROM manager_season_stats WHERE manager_id = $1 ORDER BY season DESC`,
    [managerId],
  );

  console.log(
    `RECALC #${managerId} ${name}: matchSeasons=${seasons.length} upserted=${upserted} preservedManual=${preservedManual} removedCalculated=${removed}`,
  );
  for (const r of finalRows) {
    console.log(
      `  ${r.season} J=${r.games} V=${r.wins} E=${r.draws} D=${r.losses} GP=${r.goals_for} GC=${r.goals_against} (${r.stats_source})`,
    );
  }
  return { managerId, name, seasons: finalRows.length, upserted, preservedManual, removed };
}

const client = await pool.connect();
try {
  console.log("=== alter managers profile columns ===");
  await client.query(readFileSync("lib/db/sql/alter-managers-profile.sql", "utf8"));

  console.log("=== ensure manager_season_stats ===");
  await client.query(
    readFileSync("lib/db/sql/create-manager-season-stats.sql", "utf8"),
  );

  const { rows: cols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='managers'
      AND column_name IN ('full_name','birth_date','birth_city','birth_state','birth_country','is_deceased')
    ORDER BY column_name
  `);
  console.log(
    "PROFILE_COLS",
    cols.map((c) => c.column_name).join(", "),
  );
  if (cols.length !== 6) throw new Error("missing profile columns");

  await client.query("BEGIN");

  const { rows: withMatches } = await client.query(`
    SELECT m.id, m.name, count(mt.id)::int AS match_count
    FROM managers m
    JOIN matches mt ON mt.manager_id = m.id
    GROUP BY m.id, m.name
    ORDER BY m.name
  `);
  console.log("MANAGERS_WITH_MATCHES", withMatches.length);
  for (const m of withMatches) {
    console.log(`  #${m.id} ${m.name} matches=${m.match_count}`);
  }

  const results = [];
  for (const m of withMatches) {
    results.push(await recalcManager(client, m.id, m.name));
  }

  await client.query("COMMIT");

  const { rows: post } = await client.query(`
    SELECT
      (SELECT count(*)::int FROM managers) AS managers_total,
      (SELECT count(*)::int FROM manager_season_stats) AS season_rows_total,
      (SELECT count(*)::int FROM manager_season_stats WHERE stats_source='manual') AS season_manual,
      (SELECT count(*)::int FROM manager_season_stats WHERE stats_source='calculated') AS season_calculated,
      (SELECT count(DISTINCT manager_id)::int FROM manager_season_stats) AS managers_with_rows,
      (SELECT count(*)::int FROM managers m
         WHERE EXISTS (SELECT 1 FROM matches mt WHERE mt.manager_id = m.id)) AS managers_with_matches
  `);
  console.log("POST_COUNTS", JSON.stringify(post[0], null, 2));
  console.log("BATCH_RECALC_OK", JSON.stringify(results));
} catch (err) {
  try {
    await client.query("ROLLBACK");
  } catch {
    /* ignore */
  }
  console.error("FAILED", err);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
