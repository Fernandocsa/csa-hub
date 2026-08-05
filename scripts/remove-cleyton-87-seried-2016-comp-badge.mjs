/**
 * Remove auto "Artilheiro Campeonato Brasileiro Série D 2016" from #87
 * Cleyton Lima. He led CSA's Série D scoring, not the competition.
 *
 * Usage: node scripts/remove-cleyton-87-seried-2016-comp-badge.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

const PLAYER_ID = 87;
const YEAR = 2016;
const COMP_ID = 8; // Campeonato Brasileiro Série D

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows } = await c.query(
    `
    SELECT id, entity_id, label, source, auto_kind, season_year, competition_id
    FROM entity_badges
    WHERE entity_type = 'player'
      AND entity_id = $1
      AND source = 'auto'
      AND auto_kind = 'top_scorer_competition'
      AND season_year = $2
      AND competition_id = $3
    ORDER BY id
    `,
    [PLAYER_ID, YEAR, COMP_ID],
  );

  console.log("to delete", rows);
  if (!rows.length) {
    console.log("nothing to do");
  } else {
    await c.query("BEGIN");
    if (!DRY) {
      const del = await c.query(
        `
        DELETE FROM entity_badges
        WHERE id = ANY($1::int[])
        RETURNING id, label
        `,
        [rows.map((r) => r.id)],
      );
      console.log("deleted", del.rows);
    }

    if (DRY) {
      await c.query("ROLLBACK");
      console.log("DRY — rolled back");
    } else {
      await c.query("COMMIT");
      console.log("COMMIT ok");
      console.log(
        "remaining badges #87",
        (
          await c.query(
            `SELECT id, label, source, auto_kind, season_year, competition_id
             FROM entity_badges
             WHERE entity_type='player' AND entity_id=$1
             ORDER BY id`,
            [PLAYER_ID],
          )
        ).rows,
      );
    }
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
