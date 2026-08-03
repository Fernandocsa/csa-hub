/**
 * Keep players.nationality and players.birth_country in sync.
 * - If one is set and the other empty → copy
 * - Prefer non-Brazil value when they conflict with empty/BR synonym on the other side
 * - Remaining empties → Brasil
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== sync-player-nationality-birth-country ===");

  // 1) nationality set, birth_country empty → copy nationality
  const a = await pool.query(`
    UPDATE players
    SET birth_country = btrim(nationality)
    WHERE nationality IS NOT NULL AND btrim(nationality) <> ''
      AND (birth_country IS NULL OR btrim(birth_country) = '')
    RETURNING id, name, nationality, birth_country
  `);
  console.log("filled birth_country from nationality:", a.rowCount);
  for (const r of a.rows) {
    console.log(`  #${r.id} ${r.name} → ${r.birth_country}`);
  }

  // 2) birth_country set, nationality empty → copy birth_country
  const b = await pool.query(`
    UPDATE players
    SET nationality = btrim(birth_country)
    WHERE birth_country IS NOT NULL AND btrim(birth_country) <> ''
      AND (nationality IS NULL OR btrim(nationality) = '')
    RETURNING id, name, nationality, birth_country
  `);
  console.log("filled nationality from birth_country:", b.rowCount);
  for (const r of b.rows) {
    console.log(`  #${r.id} ${r.name} → ${r.nationality}`);
  }

  // 3) both empty → Brasil
  const c = await pool.query(`
    UPDATE players
    SET nationality = 'Brasil', birth_country = 'Brasil'
    WHERE (nationality IS NULL OR btrim(nationality) = '')
      AND (birth_country IS NULL OR btrim(birth_country) = '')
    RETURNING id, name
  `);
  console.log("filled both as Brasil:", c.rowCount);
  for (const r of c.rows) {
    console.log(`  #${r.id} ${r.name}`);
  }

  const check = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE nationality IS NULL OR btrim(nationality) = ''
           OR birth_country IS NULL OR btrim(birth_country) = ''
      )::int AS still_empty,
      COUNT(*) FILTER (
        WHERE nationality IS NOT NULL AND btrim(nationality) <> ''
          AND upper(btrim(nationality)) NOT IN ('BRASIL','BRAZIL','BR','BRA')
      )::int AS foreigners,
      COUNT(*) FILTER (
        WHERE btrim(coalesce(nationality,'')) <> btrim(coalesce(birth_country,''))
      )::int AS mismatched
    FROM players
  `);
  console.log("after:", check.rows[0]);

  const { rows: foreign } = await pool.query(`
    SELECT id, name, nationality, birth_country
    FROM players
    WHERE nationality IS NOT NULL AND btrim(nationality) <> ''
      AND upper(btrim(nationality)) NOT IN ('BRASIL','BRAZIL','BR','BRA')
    ORDER BY nationality, name
  `);
  console.log("foreigners:");
  for (const r of foreign) {
    console.log(`  #${r.id} ${r.name}: ${r.nationality} / ${r.birth_country}`);
  }
} finally {
  await pool.end();
}
