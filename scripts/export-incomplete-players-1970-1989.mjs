/**
 * Export incomplete CSA roster players (1970–1989) for bio enrichment.
 * Complete = full_name + birth_date + position + preferred_foot.
 */
import { writeFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const { rows: summary } = await pool.query(`
  SELECT
    count(DISTINCT p.id)::int AS total_players,
    count(DISTINCT p.id) FILTER (WHERE NOT (
      p.full_name IS NOT NULL AND btrim(p.full_name) <> ''
      AND p.birth_date IS NOT NULL
      AND p.position IS NOT NULL AND btrim(p.position) <> ''
      AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot) <> ''
    ))::int AS incomplete,
    count(DISTINCT p.id) FILTER (WHERE
      p.full_name IS NOT NULL AND btrim(p.full_name) <> ''
      AND p.birth_date IS NOT NULL
      AND p.position IS NOT NULL AND btrim(p.position) <> ''
      AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot) <> ''
    )::int AS complete
  FROM player_season_stats pss
  JOIN players p ON p.id = pss.player_id
  WHERE pss.season ~ '^[0-9]{4}$'
    AND pss.season::int BETWEEN 1970 AND 1989
`);
console.log("summary 1970-1989:", summary[0]);

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
    COALESCE(sum(pss.appearances), 0)::int AS apps
  FROM player_season_stats pss
  JOIN players p ON p.id = pss.player_id
  WHERE pss.season ~ '^[0-9]{4}$'
    AND pss.season::int BETWEEN 1970 AND 1989
    AND NOT (
      p.full_name IS NOT NULL AND btrim(p.full_name) <> ''
      AND p.birth_date IS NOT NULL
      AND p.position IS NOT NULL AND btrim(p.position) <> ''
      AND p.preferred_foot IS NOT NULL AND btrim(p.preferred_foot) <> ''
    )
  GROUP BY p.id
  ORDER BY COALESCE(sum(pss.appearances), 0) DESC, min(pss.season), p.name
`);

writeFileSync(
  new URL("./data/incomplete-players-1970-1989.json", import.meta.url),
  JSON.stringify(rows, null, 2),
  "utf8",
);
console.log(`exported ${rows.length} incomplete players`);

const missing = {
  full_name: rows.filter((r) => !r.full_name?.trim()).length,
  birth_date: rows.filter((r) => !r.birth_date).length,
  position: rows.filter((r) => !r.position?.trim()).length,
  preferred_foot: rows.filter((r) => !r.preferred_foot?.trim()).length,
};
console.log("missing among incomplete:", missing);
console.log(
  "sample:",
  rows.slice(0, 15).map((r) => ({
    id: r.id,
    name: r.name,
    pos: r.position,
    fn: !!r.full_name,
    bd: !!r.birth_date,
    foot: r.preferred_foot,
    apps: r.apps,
  })),
);

await pool.end();
