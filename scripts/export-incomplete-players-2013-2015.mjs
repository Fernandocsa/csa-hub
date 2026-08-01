/**
 * Export incomplete CSA roster players (2013–2015) for bio enrichment.
 * Includes players with season stats OR match lineups in those seasons.
 * Complete = full_name + birth_date + position + preferred_foot.
 */
import { writeFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const { rows } = await pool.query(`
  WITH season_players AS (
    SELECT player_id, season::text AS season, appearances
    FROM player_season_stats
    WHERE season ~ '^[0-9]{4}$'
      AND season::int BETWEEN 2013 AND 2015

    UNION ALL

    SELECT ml.player_id, m.season::text AS season, 0 AS appearances
    FROM match_lineups ml
    JOIN matches m ON m.id = ml.match_id
    WHERE ml.side = 'csa'
      AND ml.player_id IS NOT NULL
      AND m.season ~ '^[0-9]{4}$'
      AND m.season::int BETWEEN 2013 AND 2015
  )
  SELECT
    p.id,
    p.name,
    p.full_name,
    p.position,
    p.birth_date::text AS birth_date,
    p.birth_year,
    p.birth_city,
    p.birth_state,
    p.preferred_foot,
    p.nationality,
    p.height_cm,
    p.weight_kg,
    p.verification_status,
    array_agg(DISTINCT sp.season ORDER BY sp.season) AS seasons,
    max(sp.appearances) AS max_apps,
    (p.full_name IS NULL OR btrim(p.full_name) = '') AS miss_full,
    (p.birth_date IS NULL) AS miss_birth,
    (p.position IS NULL OR btrim(p.position) = '') AS miss_pos,
    (p.preferred_foot IS NULL OR btrim(p.preferred_foot) = '') AS miss_foot
  FROM season_players sp
  JOIN players p ON p.id = sp.player_id
  WHERE NOT (
    p.full_name IS NOT NULL AND btrim(p.full_name) <> ''
    AND p.birth_date IS NOT NULL
    AND p.position IS NOT NULL AND btrim(p.position) <> ''
    AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot) <> ''
  )
  GROUP BY p.id
  ORDER BY min(sp.season), p.name
`);

writeFileSync(
  new URL("./data/incomplete-players-2013-2015.json", import.meta.url),
  JSON.stringify(rows, null, 2),
  "utf8",
);

const summary = {
  total: rows.length,
  missingFull: rows.filter((r) => r.miss_full).length,
  missingBirth: rows.filter((r) => r.miss_birth).length,
  missingPos: rows.filter((r) => r.miss_pos).length,
  missingFoot: rows.filter((r) => r.miss_foot).length,
  bySeason: {},
};
for (const r of rows) {
  for (const s of r.seasons || []) {
    summary.bySeason[s] = (summary.bySeason[s] || 0) + 1;
  }
}
console.log(JSON.stringify(summary, null, 2));
console.log(`exported ${rows.length} incomplete players → scripts/data/incomplete-players-2013-2015.json`);
await pool.end();
