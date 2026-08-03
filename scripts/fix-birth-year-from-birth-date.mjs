/**
 * Align players.birth_year with the year of players.birth_date (date wins).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== fix-birth-year-from-birth-date ===");
  const before = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM players
    WHERE birth_date IS NOT NULL
      AND (
        birth_year IS NULL
        OR birth_year <> extract(year from birth_date::date)::int
      )
  `);
  console.log("to update:", before.rows[0].n);

  const upd = await pool.query(`
    UPDATE players
    SET birth_year = extract(year from birth_date::date)::int
    WHERE birth_date IS NOT NULL
      AND (
        birth_year IS NULL
        OR birth_year <> extract(year from birth_date::date)::int
      )
    RETURNING id, name, birth_date::text AS birth_date, birth_year
  `);
  console.log("updated:", upd.rowCount);

  const after = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM players
    WHERE birth_year IS NOT NULL
      AND birth_date IS NOT NULL
      AND extract(year from birth_date::date)::int <> birth_year
  `);
  console.log("mismatches remaining:", after.rows[0].n);
  for (const r of upd.rows.slice(0, 10)) {
    console.log(`  #${r.id} ${r.name}: ${r.birth_date} → year ${r.birth_year}`);
  }
  if (upd.rowCount > 10) console.log(`  … +${upd.rowCount - 10} more`);
} finally {
  await pool.end();
}
