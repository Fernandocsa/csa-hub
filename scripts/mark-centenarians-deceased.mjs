/**
 * Mark centenarian historical players as deceased.
 * No individual obituaries found; ages 100–105 (born 1921–1925)
 * from CBF/sumulastche records with no living confirmation.
 * Dry-run by default; pass --apply to write.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const apply = process.argv.includes("--apply");
const pool = createPgPool();

const ids = [808, 918, 716, 979, 774, 806, 1188, 704, 689, 1033];

const { rows: before } = await pool.query(
  `SELECT id, name, full_name, birth_date::text, is_deceased,
          DATE_PART('year', AGE(CURRENT_DATE, birth_date::date))::int AS age
   FROM players
   WHERE id = ANY($1::int[])
   ORDER BY birth_date`,
  [ids],
);
console.log("before", before);

if (!apply) {
  console.log("\nDry-run only. Re-run with --apply to update.");
  await pool.end();
  process.exit(0);
}

const { rows: updated } = await pool.query(
  `UPDATE players
   SET is_deceased = true
   WHERE id = ANY($1::int[]) AND is_deceased = false
   RETURNING id, name, full_name, birth_date::text, is_deceased`,
  [ids],
);
console.log("updated", updated.length, updated);

const { rows: left } = await pool.query(`
  SELECT COUNT(*)::int AS still_100_plus_alive
  FROM players
  WHERE is_deceased = false
    AND (
      (birth_date IS NOT NULL AND birth_date::date <= CURRENT_DATE - INTERVAL '100 years')
      OR (birth_year IS NOT NULL AND birth_year <= EXTRACT(YEAR FROM CURRENT_DATE)::int - 100)
    )
`);
console.log("still_100_plus_alive", left[0]);

const { rows: summary } = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE is_deceased) AS deceased,
    COUNT(*) FILTER (WHERE NOT is_deceased) AS alive,
    COUNT(*) AS total
  FROM players
`);
console.log("summary", summary[0]);

await pool.end();
