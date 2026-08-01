/**
 * Export incomplete CSA roster players (2016–2026) for bio enrichment.
 * Complete = full_name + birth_date + position + preferred_foot.
 */
import { writeFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const { rows } = await pool.query(`
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
    array_agg(DISTINCT pss.season ORDER BY pss.season) AS seasons,
    max(pss.appearances) AS max_apps
  FROM player_season_stats pss
  JOIN players p ON p.id = pss.player_id
  WHERE pss.season ~ '^[0-9]{4}$'
    AND pss.season::int BETWEEN 2016 AND 2026
    AND NOT (
      p.full_name IS NOT NULL AND btrim(p.full_name) <> ''
      AND p.birth_date IS NOT NULL
      AND p.position IS NOT NULL AND btrim(p.position) <> ''
      AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot) <> ''
    )
  GROUP BY p.id
  ORDER BY min(pss.season), p.name
`);

writeFileSync(
  new URL("./data/incomplete-players-2016-2026.json", import.meta.url),
  JSON.stringify(rows, null, 2),
  "utf8",
);
console.log(`exported ${rows.length} incomplete players`);
await pool.end();
