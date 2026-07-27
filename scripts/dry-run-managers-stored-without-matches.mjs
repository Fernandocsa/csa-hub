/**
 * Dry-run: managers with stored_* but zero linked matches.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== dry-run managers stored without matches ===");

  const { rows: summary } = await pool.query(`
    WITH linked AS (
      SELECT manager_id, count(*)::int AS match_count
      FROM matches
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
    )
    SELECT
      count(*) FILTER (WHERE true)::int AS total_managers,
      count(*) FILTER (WHERE COALESCE(l.match_count, 0) = 0)::int AS managers_with_zero_matches,
      count(*) FILTER (
        WHERE COALESCE(l.match_count, 0) = 0
          AND (
            m.stored_games IS NOT NULL
            OR m.stored_wins IS NOT NULL
            OR m.stored_draws IS NOT NULL
            OR m.stored_losses IS NOT NULL
            OR m.stored_goals_for IS NOT NULL
            OR m.stored_goals_against IS NOT NULL
          )
      )::int AS zero_matches_with_any_stored,
      count(*) FILTER (
        WHERE COALESCE(l.match_count, 0) = 0
          AND m.stored_games IS NOT NULL
      )::int AS zero_matches_with_stored_games,
      count(*) FILTER (
        WHERE COALESCE(l.match_count, 0) > 0
      )::int AS managers_with_matches
    FROM managers m
    LEFT JOIN linked l ON l.manager_id = m.id
  `);

  console.log("SUMMARY", JSON.stringify(summary[0], null, 2));

  const { rows: cases } = await pool.query(`
    WITH linked AS (
      SELECT manager_id, count(*)::int AS match_count
      FROM matches
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
    )
    SELECT
      m.id,
      m.name,
      m.nationality,
      m.start_year,
      m.end_year,
      m.seasons,
      m.stored_games,
      m.stored_wins,
      m.stored_draws,
      m.stored_losses,
      m.stored_goals_for,
      m.stored_goals_against,
      m.stats_source
    FROM managers m
    LEFT JOIN linked l ON l.manager_id = m.id
    WHERE COALESCE(l.match_count, 0) = 0
      AND (
        m.stored_games IS NOT NULL
        OR m.stored_wins IS NOT NULL
        OR m.stored_draws IS NOT NULL
        OR m.stored_losses IS NOT NULL
        OR m.stored_goals_for IS NOT NULL
        OR m.stored_goals_against IS NOT NULL
      )
    ORDER BY m.name
  `);

  console.log("CASES_COUNT", cases.length);
  for (const r of cases) {
    console.log(
      [
        `#${r.id}`,
        r.name,
        `source=${r.stats_source ?? "null"}`,
        `J=${r.stored_games ?? "-"}`,
        `V=${r.stored_wins ?? "-"}`,
        `E=${r.stored_draws ?? "-"}`,
        `D=${r.stored_losses ?? "-"}`,
        `GP=${r.stored_goals_for ?? "-"}`,
        `GC=${r.stored_goals_against ?? "-"}`,
        `years=${r.start_year ?? "?"}-${r.end_year ?? "?"}`,
        `seasons=${r.seasons ?? "-"}`,
      ].join(" | "),
    );
  }
} finally {
  await pool.end();
}
