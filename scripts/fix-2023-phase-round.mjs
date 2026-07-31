import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES } from "./data/season-2023-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const ROUND = {
  1: { phase: null, round: "1ª rodada" },
  2: { phase: null, round: "2ª rodada" },
  3: { phase: null, round: "3ª rodada" },
  4: { phase: null, round: "4ª rodada" },
  5: { phase: null, round: "5ª rodada" },
  6: { phase: null, round: "6ª rodada" },
  7: { phase: null, round: "7ª rodada" },
  8: { phase: "1ª Fase", round: "1ª rodada" },
  9: { phase: null, round: "2ª rodada" },
  10: { phase: null, round: "3ª rodada" },
  11: { phase: null, round: "5ª rodada" },
  12: { phase: null, round: "6ª rodada" },
  13: { phase: null, round: "7ª rodada" },
  14: { phase: "Quartas", round: "Jogo único" },
  15: { phase: "Semifinal", round: "Jogo único" },
  16: { phase: "Pré-Copa", round: "1ª Fase" },
  17: { phase: "Pré-Copa", round: "2ª Fase" },
  18: { phase: "Fase de grupos", round: "1ª rodada" },
  19: { phase: "Fase de grupos", round: "2ª rodada" },
  20: { phase: "Fase de grupos", round: "3ª rodada" },
  21: { phase: "Fase de grupos", round: "4ª rodada" },
  22: { phase: "Fase de grupos", round: "5ª rodada" },
  23: { phase: "Fase de grupos", round: "6ª rodada" },
  24: { phase: "Fase de grupos", round: "7ª rodada" },
  25: { phase: "Fase de grupos", round: "8ª rodada" },
  26: { phase: "1ª Fase", round: "Jogo único" },
  27: { phase: "2ª Fase", round: "Jogo único" },
  28: { phase: "3ª Fase", round: "Ida" },
  29: { phase: "3ª Fase", round: "Volta" },
};
for (let i = 30; i <= 48; i++) {
  ROUND[i] = { phase: null, round: `${i - 29}ª rodada` };
}

// Patch data file in memory values into DB by date+opp via GAMES match ids from season
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows: db } = await client.query(`
    SELECT m.id, m.match_date::text AS d, o.name AS opp
    FROM matches m JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season='2023'
  `);
  function find(g) {
    const same = db.filter((m) => m.d.slice(0, 10) === g.date);
    if (same.length === 1) return same[0];
    const key = g.opp.toLowerCase().split("-")[0];
    const hit = same.filter((m) => m.opp.toLowerCase().includes(key));
    if (hit.length === 1) return hit[0];
    throw new Error(`no match ${g.n} ${g.date} ${g.opp}`);
  }
  let n = 0;
  for (const g of GAMES) {
    const pr = ROUND[g.n];
    if (!pr) continue;
    const m = find(g);
    await client.query(`UPDATE matches SET phase=$2, round=$3 WHERE id=$1`, [
      m.id,
      pr.phase,
      pr.round,
    ]);
    // also update source object for future re-runs
    g.phase = pr.phase;
    g.round = pr.round;
    n += 1;
  }
  await client.query("COMMIT");
  console.log("updated phase/round", n);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
