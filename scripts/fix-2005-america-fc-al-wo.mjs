/**
 * Mark América FC-AL 2005 Alagoano 2ª Divisão matches (#1591, #1592) as walkovers.
 * Score stays 1–0 (standard W.O. convention).
 *
 * Usage: node scripts/fix-2005-america-fc-al-wo.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

const MATCH_IDS = [1591, 1592];
const OPP_ID = 297; // América FC-AL

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows } = await c.query(
    `
    SELECT m.id, m.match_date::date AS d, m.season, m.opponent_id, o.name AS opponent,
           m.goals_for, m.goals_against, m.result, m.is_walkover, c.name AS competition
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    JOIN competitions c ON c.id = m.competition_id
    WHERE m.id = ANY($1::int[])
    ORDER BY m.id
    `,
    [MATCH_IDS],
  );
  console.log("before", rows);
  if (rows.length !== MATCH_IDS.length) {
    throw new Error(`expected ${MATCH_IDS.length} matches, got ${rows.length}`);
  }
  for (const r of rows) {
    if (r.opponent_id !== OPP_ID) {
      throw new Error(`match ${r.id} opponent ${r.opponent_id}, expected ${OPP_ID}`);
    }
    if (r.result !== "win" || r.goals_for !== 1 || r.goals_against !== 0) {
      throw new Error(
        `match ${r.id} expected win 1-0, got ${r.result} ${r.goals_for}-${r.goals_against}`,
      );
    }
  }

  await c.query("BEGIN");
  if (!DRY) {
    const upd = await c.query(
      `
      UPDATE matches
      SET is_walkover = true
      WHERE id = ANY($1::int[]) AND opponent_id = $2
      RETURNING id, is_walkover, goals_for, goals_against, result
      `,
      [MATCH_IDS, OPP_ID],
    );
    console.log("updated", upd.rows);
  }

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
