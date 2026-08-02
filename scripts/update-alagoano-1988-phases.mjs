/**
 * Backfill phase/round on Campeonato Alagoano 1988 matches already imported.
 * Run after: node scripts/_gen-1988-data.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1988-alagoano.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

try {
  await client.query("BEGIN");
  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Competition missing: ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  let updated = 0;
  let missing = [];

  for (const g of GAMES) {
    const { rows } = await client.query(
      `SELECT m.id, m.phase, m.round
       FROM matches m
       JOIN opponents o ON o.id=m.opponent_id
       WHERE m.season::text=$1 AND m.competition_id=$2
         AND m.match_date=$3 AND o.name=$4 AND m.home_away=$5
         AND m.goals_for=$6 AND m.goals_against=$7
       LIMIT 1`,
      [String(SEASON), competitionId, g.date, g.opponent, g.ha, g.gf, g.ga],
    );
    if (!rows[0]) {
      missing.push({ date: g.date, opponent: g.opponent, score: `${g.gf}x${g.ga}` });
      continue;
    }
    await client.query(`UPDATE matches SET phase=$2, round=$3 WHERE id=$1`, [
      rows[0].id,
      g.phase,
      g.round,
    ]);
    updated++;
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, updated, missing, total: GAMES.length }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
