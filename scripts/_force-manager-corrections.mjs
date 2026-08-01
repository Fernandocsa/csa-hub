/**
 * Force-apply enrichments that need overwrite (wrong identity corrections).
 * Usage: node scripts/_force-manager-corrections.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFromDotenv(".env");
const pool = createPgPool();

const rows = JSON.parse(
  readFileSync(join(__dirname, "data", "enrich-managers-14.json"), "utf8"),
);

for (const e of rows) {
  if (e.confidence === "low") continue;

  const fullName = e.fullName ?? null;
  const birthDate = e.birthDate ?? null;
  const birthCity = e.birthCity ?? null;
  const birthState = e.birthState ?? null;
  const birthCountry = e.birthCountry ?? "Brasil";
  const nationality = e.nationality ?? "Brasil";
  const isDeceased = e.isDeceased ?? null;

  if (e.forceOverwrite) {
    const r = await pool.query(
      `UPDATE managers SET
         full_name = COALESCE($2, full_name),
         birth_date = COALESCE($3::date, birth_date),
         birth_city = COALESCE($4, birth_city),
         birth_state = COALESCE($5, birth_state),
         birth_country = COALESCE($6, birth_country),
         nationality = COALESCE($7, nationality),
         is_deceased = COALESCE($8, is_deceased)
       WHERE id = $1
       RETURNING id, name, full_name, birth_date::text, birth_city, birth_state`,
      [
        e.id,
        fullName,
        birthDate,
        birthCity,
        birthState,
        birthCountry,
        nationality,
        isDeceased,
      ],
    );
    console.log("FORCE", r.rows[0]);
    continue;
  }

  // Non-force: fill empties only (and require fullName+birthDate for apply path
  // except Lucio which only has name)
  if (!fullName) continue;
  const r = await pool.query(
    `UPDATE managers SET
       full_name = COALESCE(NULLIF(btrim(full_name), ''), $2),
       birth_date = COALESCE(birth_date, $3::date),
       birth_city = COALESCE(NULLIF(btrim(birth_city), ''), $4),
       birth_state = COALESCE(NULLIF(btrim(birth_state), ''), $5),
       birth_country = COALESCE(NULLIF(btrim(birth_country), ''), $6),
       nationality = COALESCE(NULLIF(btrim(nationality), ''), $7),
       is_deceased = COALESCE($8, is_deceased)
     WHERE id = $1
     RETURNING id, name, full_name, birth_date::text, birth_city, birth_state`,
    [
      e.id,
      fullName,
      birthDate,
      birthCity,
      birthState,
      birthCountry,
      nationality,
      isDeceased,
    ],
  );
  console.log("FILL", r.rows[0]);
}

await pool.end();
