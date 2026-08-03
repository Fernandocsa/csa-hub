/**
 * Backfill players.birth_country + nationality to "Brasil" for everyone
 * who is not an already-known foreigner.
 *
 * Foreigners = nationality or birth_country set to a non-Brazil country.
 * Brazil synonyms (BR, Brazil, Brasileiro, …) are normalized to "Brasil".
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const BRAZIL_SYNONYMS = `
  '', 'BRASIL', 'BRAZIL', 'BR', 'BRA',
  'BRASILEIRO', 'BRASILEIRA', 'BRASILEIROS', 'BRASILEIRAS'
`;

function normCountry(col) {
  return `upper(
    translate(
      regexp_replace(btrim(coalesce(${col}, '')), '\\s+', ' ', 'g'),
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
      'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
    )
  )`;
}

const isBrazil = (col) => `(${normCountry(col)} IN (${BRAZIL_SYNONYMS}))`;

const isForeign = `
  (
    (nationality IS NOT NULL AND btrim(nationality) <> '' AND NOT ${isBrazil("nationality")})
    OR
    (birth_country IS NOT NULL AND btrim(birth_country) <> '' AND NOT ${isBrazil("birth_country")})
  )
`;

try {
  console.log("=== backfill-player-brazil-country ===");

  const before = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE NOT (${isForeign})
          AND (
            coalesce(nullif(btrim(nationality), ''), '') <> 'Brasil'
            OR coalesce(nullif(btrim(birth_country), ''), '') <> 'Brasil'
          )
      )::int AS to_fix,
      COUNT(*) FILTER (WHERE ${isForeign})::int AS foreigners
    FROM players
  `);
  console.log("to set Brasil:", before.rows[0].to_fix);
  console.log("known foreigners:", before.rows[0].foreigners);

  const { rows: foreignSample } = await pool.query(`
    SELECT id, name, nationality, birth_country
    FROM players
    WHERE ${isForeign}
    ORDER BY name
  `);
  console.log("foreign list:");
  for (const r of foreignSample) {
    console.log(
      `  #${r.id} ${r.name} · nat=${r.nationality ?? "∅"} · país=${r.birth_country ?? "∅"}`,
    );
  }

  const upd = await pool.query(`
    UPDATE players
    SET nationality = 'Brasil', birth_country = 'Brasil'
    WHERE NOT (${isForeign})
      AND (
        coalesce(nullif(btrim(nationality), ''), '') <> 'Brasil'
        OR coalesce(nullif(btrim(birth_country), ''), '') <> 'Brasil'
      )
  `);
  console.log("updated to Brasil:", upd.rowCount);

  const foreignBirth = await pool.query(`
    UPDATE players
    SET birth_country = btrim(nationality)
    WHERE ${isForeign}
      AND (birth_country IS NULL OR btrim(birth_country) = '')
      AND nationality IS NOT NULL AND btrim(nationality) <> ''
    RETURNING id, name, nationality, birth_country
  `);
  console.log(
    "foreigners filled birth_country from nationality:",
    foreignBirth.rowCount,
  );
  for (const r of foreignBirth.rows) {
    console.log(`  #${r.id} ${r.name}: ${r.birth_country}`);
  }

  const after = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE nationality = 'Brasil' AND birth_country = 'Brasil'
      )::int AS both_brasil,
      COUNT(*) FILTER (
        WHERE NOT (${isForeign})
          AND (
            nationality IS NULL OR btrim(nationality) = ''
            OR birth_country IS NULL OR btrim(birth_country) = ''
          )
      )::int AS still_missing,
      COUNT(*) FILTER (WHERE ${isForeign})::int AS foreigners
    FROM players
  `);
  console.log("after:", after.rows[0]);
} finally {
  await pool.end();
}
