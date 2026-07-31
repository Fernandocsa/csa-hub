/**
 * Fix wrong manager attributions that polluted title credit:
 * - Série C 2017: was all Marcelo Cabo → Ney da Matta (1ª fase) + Flávio Araújo (mata-mata)
 * - Copa Alagoas 2026: final (+ semi CSE) → Moacir Júnior
 * Also set final_match_id on champion campaigns and link Fortaleza final legs.
 *
 * Sources:
 * - Flávio arrived Sep 2017; watched last group match (Cuiabá) from outside; commanded from QF Tombense.
 * - Moacir coached CSE 5x0 (21/03) and ASA final 3x2 (01/04/2026).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const NEY = 27;
const FLAVIO = 33;
const MOACIR = 29;
const CABO = 3;

try {
  await client.query("BEGIN");

  // —— Série C 2017 ——
  const scNey = await client.query(
    `
    UPDATE matches
    SET manager_id = $1
    WHERE season = '2017' AND competition_id = 3
      AND match_date < DATE '2017-09-18'
      AND manager_id = $2
    RETURNING id, match_date::text AS d
  `,
    [NEY, CABO],
  );
  const scFlavio = await client.query(
    `
    UPDATE matches
    SET manager_id = $1
    WHERE season = '2017' AND competition_id = 3
      AND match_date >= DATE '2017-09-18'
      AND manager_id = $2
    RETURNING id, match_date::text AS d
  `,
    [FLAVIO, CABO],
  );
  console.log("Série C 2017 → Ney:", scNey.rowCount, scNey.rows.map((r) => r.d));
  console.log("Série C 2017 → Flávio:", scFlavio.rowCount, scFlavio.rows.map((r) => r.d));

  // Link Fortaleza final legs (ida 14/10, volta 21/10)
  const legs = await client.query(`
    SELECT id, match_date::text AS d
    FROM matches
    WHERE season = '2017' AND competition_id = 3
      AND opponent_id = (SELECT id FROM opponents WHERE name ILIKE 'Fortaleza%' LIMIT 1)
      AND match_date >= DATE '2017-10-01'
    ORDER BY match_date
  `);
  if (legs.rows.length !== 2) {
    throw new Error(`Expected 2 Fortaleza final legs, got ${legs.rows.length}`);
  }
  const [ida, volta] = legs.rows;
  await client.query(
    `UPDATE matches SET related_match_id = $1 WHERE id = $2`,
    [volta.id, ida.id],
  );
  await client.query(
    `UPDATE matches SET related_match_id = $1 WHERE id = $2`,
    [ida.id, volta.id],
  );
  await client.query(
    `
    UPDATE season_competition_stats
    SET final_match_id = $1
    WHERE season = '2017' AND competition_id = 3 AND is_champion = true
  `,
    [volta.id],
  );
  console.log("Série C final linked:", ida.id, "↔", volta.id, "final_match_id=", volta.id);

  // —— Copa Alagoas 2026 ——
  const ca2026 = await client.query(
    `
    UPDATE matches
    SET manager_id = $1
    WHERE season = '2026' AND competition_id = 12
      AND match_date IN (DATE '2026-03-21', DATE '2026-04-01')
    RETURNING id, match_date::text AS d, goals_for, goals_against,
              (SELECT name FROM opponents o WHERE o.id = opponent_id) AS opp
  `,
    [MOACIR],
  );
  console.log("Copa Alagoas 2026 → Moacir:", ca2026.rows);

  const final2026 = ca2026.rows.find((r) => r.d.startsWith("2026-04-01"));
  if (!final2026) throw new Error("Copa Alagoas 2026 final not found");
  await client.query(
    `
    UPDATE season_competition_stats
    SET final_match_id = $1
    WHERE season = '2026' AND competition_id = 12 AND is_champion = true
  `,
    [final2026.id],
  );
  console.log("Copa Alagoas 2026 final_match_id=", final2026.id);

  // —— Alagoano 2019 final (Cabo) ——
  const al2019 = await client.query(`
    SELECT id FROM matches
    WHERE season = '2019' AND competition_id = 5
      AND match_date = DATE '2019-04-21'
    LIMIT 1
  `);
  if (al2019.rows[0]) {
    await client.query(
      `
      UPDATE season_competition_stats
      SET final_match_id = $1
      WHERE season = '2019' AND competition_id = 5 AND is_champion = true
    `,
      [al2019.rows[0].id],
    );
    console.log("Alagoano 2019 final_match_id=", al2019.rows[0].id);
  }

  await client.query("COMMIT");
  console.log("OK");
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
