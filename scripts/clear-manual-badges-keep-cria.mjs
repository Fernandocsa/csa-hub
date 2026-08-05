/**
 * Delete all manual entity badges except Cria do Mutange.
 * Auto badges (artilheiro/garçom from verified seasons) are kept.
 *
 * Usage: node scripts/clear-manual-badges-keep-cria.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows } = await c.query(`
    SELECT id, entity_type, entity_id, label, template, season_year
    FROM entity_badges
    WHERE source = 'manual'
      AND coalesce(template, '') <> 'cria_do_mutange'
      AND lower(label) NOT LIKE '%cria do mutange%'
    ORDER BY id
  `);

  console.log(`to delete: ${rows.length}`);
  for (const r of rows) {
    console.log(`  #${r.id} ${r.entity_type}/${r.entity_id} ${r.label}`);
  }

  await c.query("BEGIN");
  if (!DRY && rows.length) {
    const del = await c.query(
      `
      DELETE FROM entity_badges
      WHERE source = 'manual'
        AND coalesce(template, '') <> 'cria_do_mutange'
        AND lower(label) NOT LIKE '%cria do mutange%'
      RETURNING id
      `,
    );
    console.log(`deleted: ${del.rowCount}`);
  }

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
    console.log(
      "remaining",
      (
        await c.query(`
          SELECT source, coalesce(template,'(null)') template, count(*)::int n
          FROM entity_badges
          GROUP BY 1,2
          ORDER BY 1,2
        `)
      ).rows,
    );
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
