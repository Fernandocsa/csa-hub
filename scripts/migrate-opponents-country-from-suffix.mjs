/**
 * Backfill opponents.country from trailing -XXX country suffix.
 * Transactional SQL in lib/db/sql/migrate-opponents-country-from-suffix.sql
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const KNOWN_COUNTRY_CODES = new Set([
  "ARG", "AUS", "BEL", "BOL", "CAN", "CHL", "CHN", "COL", "DEU", "ECU",
  "ENG", "ESP", "FRA", "GBR", "GER", "ITA", "JPN", "KOR", "MEX", "NED",
  "NLD", "PAR", "PER", "POR", "PRY", "URY", "URU", "USA", "VEN",
]);

function detectCountryFromName(name) {
  const m = name.trim().match(/-\s*([A-Za-z]{3})\s*$/);
  if (!m) return null;
  const code = m[1].toUpperCase();
  return KNOWN_COUNTRY_CODES.has(code) ? code : null;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  console.log("=== migrate-opponents-country-from-suffix ===");
  const sql = readFileSync("lib/db/sql/migrate-opponents-country-from-suffix.sql", "utf8");
  await pool.query(sql);

  const { rows: foreignRows } = await pool.query(`
    SELECT id, name, country, state FROM opponents
    WHERE country IS NOT NULL AND trim(country) <> ''
    ORDER BY name
  `);
  assert(foreignRows.length === 2, `expected 2 foreign opponents, got ${foreignRows.length}`);

  const talleres = foreignRows.find((r) => r.id === 162);
  const estudiantes = foreignRows.find((r) => r.id === 163);
  assert(talleres?.country === "ARG", `Talleres country=${talleres?.country}`);
  assert(estudiantes?.country === "VEN", `Estudiantes country=${estudiantes?.country}`);
  assert(!talleres?.state?.trim(), "Talleres should not have state");
  assert(!estudiantes?.state?.trim(), "Estudiantes should not have state");

  for (const o of foreignRows) {
    const detected = detectCountryFromName(o.name);
    assert(detected === o.country, `id=${o.id} country mismatch suffix`);
  }

  const { rows: brWithCountry } = await pool.query(`
    SELECT COUNT(*)::int AS cnt FROM opponents
    WHERE country IS NOT NULL AND trim(country) <> ''
      AND state IS NOT NULL AND trim(state) <> ''
  `);
  assert(brWithCountry[0].cnt === 0, "rows with both state and country");

  const { rows: brCountryLeak } = await pool.query(`
    SELECT COUNT(*)::int AS cnt FROM opponents
    WHERE country IS NOT NULL AND trim(country) <> ''
      AND regexp_match(name, '-\\s*([A-Za-z]{2})\\s*$') IS NOT NULL
      AND upper((regexp_match(name, '-\\s*([A-Za-z]{2})\\s*$'))[1]) IN (
        'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
        'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
        'RS','RO','RR','SC','SP','SE','TO'
      )
  `);
  assert(brCountryLeak[0].cnt === 0, "Brazilian UF-suffix clubs with country set");

  console.log("OK 2 foreign opponents backfilled (ARG, VEN)");
  console.log("=== country backfill PASSED ===");
} finally {
  await pool.end();
}
