/**
 * Move the two 2005 Alagoano 2ª Divisão matches from América EC-AL (#148)
 * → América FC-AL (#297) and mark them as walkovers (1–0).
 *
 * Usage: node scripts/fix-2005-america-ec-to-fc-al.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

const FROM = 148; // América EC-AL
const TO = 297; // América FC-AL
const SEASON = "2005";
const MATCH_IDS = [1591, 1592];

try {
  console.log(DRY ? "DRY" : "APPLY");

  const fromOpp = await c.query(`SELECT id, name FROM opponents WHERE id=$1`, [FROM]);
  const toOpp = await c.query(`SELECT id, name FROM opponents WHERE id=$1`, [TO]);
  console.log("from", fromOpp.rows[0]);
  console.log("to", toOpp.rows[0]);
  if (!fromOpp.rows[0] || !toOpp.rows[0]) {
    throw new Error("opponent missing");
  }

  const { rows } = await c.query(
    `
    SELECT m.id, m.match_date::date AS d, m.season, m.opponent_id, o.name AS opponent,
           m.goals_for, m.goals_against, m.result, m.home_away, c.name AS competition
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    JOIN competitions c ON c.id = m.competition_id
    WHERE m.id = ANY($1::int[])
    ORDER BY m.id
    `,
    [MATCH_IDS],
  );
  console.log("matches", rows);
  if (rows.length !== MATCH_IDS.length) {
    throw new Error(`expected ${MATCH_IDS.length} matches, got ${rows.length}`);
  }
  for (const r of rows) {
    if (r.opponent_id !== FROM || r.season !== SEASON) {
      throw new Error(`unexpected match ${r.id}: opp=${r.opponent_id} season=${r.season}`);
    }
  }

  await c.query("BEGIN");
  if (!DRY) {
    const upd = await c.query(
      `
      UPDATE matches
      SET opponent_id = $1, is_walkover = true
      WHERE id = ANY($2::int[]) AND opponent_id = $3 AND season = $4
      RETURNING id, opponent_id, is_walkover
      `,
      [TO, MATCH_IDS, FROM, SEASON],
    );
    console.log("updated", upd.rows);

    // Remap transfers / next_match if any pointed at these as club context via opponent_id alone — N/A for match rows.
    // Also fix any transfer rows that used EC-AL for 2005 season notes? skip unless present.
  }

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
    console.log(
      "remaining 2005 on #148",
      (
        await c.query(
          `SELECT id FROM matches WHERE opponent_id=$1 AND season=$2`,
          [FROM, SEASON],
        )
      ).rows,
    );
    console.log(
      "2005 on #297",
      (
        await c.query(
          `SELECT m.id, m.match_date::date AS d, o.name, c.name AS competition
           FROM matches m
           JOIN opponents o ON o.id = m.opponent_id
           JOIN competitions c ON c.id = m.competition_id
           WHERE m.opponent_id=$1 AND m.season=$2
           ORDER BY m.id`,
          [TO, SEASON],
        )
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
