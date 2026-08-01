/**
 * Export managers missing bio fields for enrichment.
 * Complete = full_name + birth_date + nationality + birth_city + birth_state
 * (birth_country optional but tracked; no position/foot for managers).
 */
import { writeFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const { rows: summary } = await pool.query(`
  SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE full_name IS NULL OR btrim(full_name) = '')::int AS missing_full_name,
    count(*) FILTER (WHERE birth_date IS NULL)::int AS missing_birth_date,
    count(*) FILTER (WHERE nationality IS NULL OR btrim(nationality) = '')::int AS missing_nationality,
    count(*) FILTER (WHERE birth_city IS NULL OR btrim(birth_city) = '')::int AS missing_birth_city,
    count(*) FILTER (WHERE birth_state IS NULL OR btrim(birth_state) = '')::int AS missing_birth_state,
    count(*) FILTER (WHERE birth_country IS NULL OR btrim(birth_country) = '')::int AS missing_birth_country,
    count(*) FILTER (
      WHERE NOT (
        full_name IS NOT NULL AND btrim(full_name) <> ''
        AND birth_date IS NOT NULL
        AND nationality IS NOT NULL AND btrim(nationality) <> ''
        AND birth_city IS NOT NULL AND btrim(birth_city) <> ''
        AND birth_state IS NOT NULL AND btrim(birth_state) <> ''
      )
    )::int AS incomplete
  FROM managers
`);

const { rows } = await pool.query(`
  SELECT
    m.id,
    m.name,
    m.full_name,
    m.nationality,
    m.birth_date::text AS birth_date,
    m.birth_city,
    m.birth_state,
    m.birth_country,
    m.is_deceased,
    m.player_id,
    m.verification_status,
    m.stored_games,
    (
      SELECT array_agg(DISTINCT mss.season ORDER BY mss.season)
      FROM manager_season_stats mss
      WHERE mss.manager_id = m.id
    ) AS seasons
  FROM managers m
  WHERE NOT (
    m.full_name IS NOT NULL AND btrim(m.full_name) <> ''
    AND m.birth_date IS NOT NULL
    AND m.nationality IS NOT NULL AND btrim(m.nationality) <> ''
    AND m.birth_city IS NOT NULL AND btrim(m.birth_city) <> ''
    AND m.birth_state IS NOT NULL AND btrim(m.birth_state) <> ''
  )
  ORDER BY m.name
`);

writeFileSync(
  new URL("./data/incomplete-managers.json", import.meta.url),
  JSON.stringify({ summary: summary[0], managers: rows }, null, 2),
  "utf8",
);
console.log(JSON.stringify(summary[0], null, 2));
console.log(`exported ${rows.length} incomplete managers`);
await pool.end();
