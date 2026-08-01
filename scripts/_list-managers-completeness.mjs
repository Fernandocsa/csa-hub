/**
 * List all managers completeness status.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const { rows } = await pool.query(`
  SELECT
    id,
    name,
    full_name IS NOT NULL AND btrim(full_name) <> '' AS has_full,
    birth_date IS NOT NULL AS has_birth,
    nationality IS NOT NULL AND btrim(nationality) <> '' AS has_nat,
    birth_city IS NOT NULL AND btrim(birth_city) <> '' AS has_city,
    birth_state IS NOT NULL AND btrim(birth_state) <> '' AS has_state,
    birth_country,
    full_name,
    birth_date::text AS birth_date,
    nationality,
    birth_city,
    birth_state
  FROM managers
  ORDER BY name
`);

const complete = rows.filter(
  (r) => r.has_full && r.has_birth && r.has_nat && r.has_city && r.has_state,
);
console.log("COMPLETE:", complete.length);
for (const r of complete) {
  console.log(`  ${r.id}\t${r.name}\t${r.full_name}\t${r.birth_date}\t${r.birth_city}/${r.birth_state}`);
}
console.log("\nALL IDS:");
for (const r of rows) {
  const miss = [
    !r.has_full && "full",
    !r.has_birth && "birth",
    !r.has_nat && "nat",
    !r.has_city && "city",
    !r.has_state && "state",
  ]
    .filter(Boolean)
    .join(",");
  console.log(`${r.id}\t${r.name}\t${miss || "OK"}\t${r.full_name || ""}\t${r.birth_date || ""}`);
}
await pool.end();
