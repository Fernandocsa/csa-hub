/**
 * Production data-ops (approved dry-runs):
 * 1) Create manager_season_stats if needed
 * 2) Seed 65 managers (zero matches + stored_*) as ONE manual season row (Option 1)
 * 3) Delete 12 zero-game managers (no matches, no manual badges)
 *
 * Does NOT drop start_year/end_year/seasons or add birth fields (redesign stage later).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

function parseSeasons(raw) {
  if (raw == null || String(raw).trim() === "") return [];
  return String(raw)
    .split(/[,;/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickSeasonYear(row) {
  const seasons = parseSeasons(row.seasons);
  if (seasons.length === 1) return seasons[0];
  if (seasons.length > 1) return seasons[0];
  if (row.start_year != null) return String(row.start_year);
  if (row.end_year != null) return String(row.end_year);
  return null;
}

const DELETE_NAMES = [
  "Márcio Araújo",
  "Jonilson Veloso",
  "Léo Condé",
  "Evandro Guimarães",
  "Dado Cavalcanti",
  "Sérgio Soares",
  "Paulo César Carpegiani",
  "Daniel Paulista",
  "Luizinho Vieira",
  "Moisés Egert",
  "Felipe Surian",
  "Guto Ferreira",
];

const client = await pool.connect();
try {
  console.log("=== 1) create manager_season_stats ===");
  await client.query(
    readFileSync("lib/db/sql/create-manager-season-stats.sql", "utf8"),
  );

  await client.query("BEGIN");

  console.log("=== 2) seed 65 manual season rows ===");
  const { rows: seedCandidates } = await client.query(`
    WITH linked AS (
      SELECT manager_id, count(*)::int AS match_count
      FROM matches
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
    )
    SELECT
      m.id, m.name, m.start_year, m.end_year, m.seasons,
      m.stored_games, m.stored_wins, m.stored_draws, m.stored_losses,
      m.stored_goals_for, m.stored_goals_against
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
    ORDER BY m.id
  `);

  let seeded = 0;
  let skipped = 0;
  for (const r of seedCandidates) {
    const season = pickSeasonYear(r);
    if (!season) {
      console.log("SKIP unresolved", r.id, r.name);
      skipped += 1;
      continue;
    }
    await client.query(
      `INSERT INTO manager_season_stats (
         manager_id, season, games, wins, draws, losses,
         goals_for, goals_against, stats_source, stats_recalculated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'manual',NULL)
       ON CONFLICT (manager_id, season) DO UPDATE SET
         games = EXCLUDED.games,
         wins = EXCLUDED.wins,
         draws = EXCLUDED.draws,
         losses = EXCLUDED.losses,
         goals_for = EXCLUDED.goals_for,
         goals_against = EXCLUDED.goals_against,
         stats_source = 'manual',
         stats_recalculated_at = NULL`,
      [
        r.id,
        season,
        r.stored_games ?? 0,
        r.stored_wins ?? 0,
        r.stored_draws ?? 0,
        r.stored_losses ?? 0,
        r.stored_goals_for ?? 0,
        r.stored_goals_against ?? 0,
      ],
    );
    seeded += 1;
  }
  console.log("SEEDED", seeded, "SKIPPED", skipped, "CANDIDATES", seedCandidates.length);

  console.log("=== 3) delete 12 zero-game managers ===");
  const { rows: deleteCandidates } = await client.query(
    `
    WITH linked AS (
      SELECT manager_id, count(*)::int AS match_count
      FROM matches
      WHERE manager_id IS NOT NULL
      GROUP BY manager_id
    )
    SELECT m.id, m.name
    FROM managers m
    LEFT JOIN linked l ON l.manager_id = m.id
    WHERE m.name = ANY($1::text[])
      AND COALESCE(l.match_count, 0) = 0
      AND COALESCE(m.stored_games, 0) = 0
      AND COALESCE(m.stored_wins, 0) = 0
      AND COALESCE(m.stored_draws, 0) = 0
      AND COALESCE(m.stored_losses, 0) = 0
      AND COALESCE(m.stored_goals_for, 0) = 0
      AND COALESCE(m.stored_goals_against, 0) = 0
    ORDER BY m.id
  `,
    [DELETE_NAMES],
  );

  if (deleteCandidates.length !== 12) {
    throw new Error(
      `expected 12 delete candidates, got ${deleteCandidates.length}: ${deleteCandidates.map((d) => d.name).join(", ")}`,
    );
  }

  // Safety: no matches, no manual badges
  for (const d of deleteCandidates) {
    const mc = await client.query(
      `SELECT count(*)::int AS n FROM matches WHERE manager_id = $1`,
      [d.id],
    );
    if (mc.rows[0].n > 0) throw new Error(`abort: ${d.name} has matches`);
    const bc = await client.query(
      `SELECT count(*)::int AS n FROM entity_badges
       WHERE entity_type = 'manager' AND entity_id = $1 AND source = 'manual'`,
      [d.id],
    );
    if (bc.rows[0].n > 0) throw new Error(`abort: ${d.name} has manual badges`);
  }

  const deleteIds = deleteCandidates.map((d) => d.id);
  const cleaned = {};
  for (const [label, sql] of [
    [
      "entity_badges",
      `DELETE FROM entity_badges WHERE entity_type = 'manager' AND entity_id = ANY($1::int[])`,
    ],
    [
      "ratings",
      `DELETE FROM ratings WHERE entity_type = 'manager' AND entity_id = ANY($1::int[])`,
    ],
    [
      "comments",
      `DELETE FROM comments WHERE entity_type = 'manager' AND entity_id = ANY($1::int[])`,
    ],
    [
      "suggestions",
      `DELETE FROM suggestions WHERE entity_type = 'manager' AND entity_id = ANY($1::int[])`,
    ],
    [
      "manager_season_stats",
      `DELETE FROM manager_season_stats WHERE manager_id = ANY($1::int[])`,
    ],
  ]) {
    const r = await client.query(sql, [deleteIds]);
    cleaned[label] = r.rowCount ?? 0;
  }

  const del = await client.query(
    `DELETE FROM managers WHERE id = ANY($1::int[]) RETURNING id, name`,
    [deleteIds],
  );
  if (del.rowCount !== 12) {
    throw new Error(`expected delete 12 managers, got ${del.rowCount}`);
  }

  await client.query("COMMIT");
  console.log("DELETED", del.rows.map((r) => `#${r.id} ${r.name}`).join("; "));
  console.log("CLEANED_RELATED", JSON.stringify(cleaned));

  // Post counts
  const { rows: post } = await client.query(`
    SELECT
      (SELECT count(*)::int FROM managers) AS managers_total,
      (SELECT count(*)::int FROM manager_season_stats) AS season_rows_total,
      (SELECT count(*)::int FROM manager_season_stats WHERE stats_source = 'manual') AS season_rows_manual,
      (SELECT count(*)::int FROM manager_season_stats WHERE stats_source = 'calculated') AS season_rows_calculated,
      (SELECT count(DISTINCT manager_id)::int FROM manager_season_stats) AS managers_with_season_rows,
      (SELECT count(*)::int FROM managers m
         WHERE NOT EXISTS (SELECT 1 FROM matches mt WHERE mt.manager_id = m.id)
           AND (
             m.stored_games IS NOT NULL OR m.stored_wins IS NOT NULL
             OR m.stored_draws IS NOT NULL OR m.stored_losses IS NOT NULL
             OR m.stored_goals_for IS NOT NULL OR m.stored_goals_against IS NOT NULL
           )
           AND NOT EXISTS (
             SELECT 1 FROM manager_season_stats s WHERE s.manager_id = m.id
           )
      ) AS still_need_seed,
      (SELECT count(*)::int FROM managers m
         WHERE m.name = ANY($1::text[])
      ) AS named_still_present
  `, [DELETE_NAMES]);

  console.log("POST_COUNTS", JSON.stringify(post[0], null, 2));
  console.log("APPLY_OK");
} catch (err) {
  try {
    await client.query("ROLLBACK");
  } catch {
    /* ignore */
  }
  console.error("APPLY_FAILED", err);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
