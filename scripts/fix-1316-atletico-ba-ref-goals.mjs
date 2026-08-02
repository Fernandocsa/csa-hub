/**
 * #1316 CSA 3x0 Atlético-BA (2026-04-05) — referee + goals (+ attendance from GE).
 * Referee: João Marcos Gonçalves Fernandes (user: João Marcos Fernandes).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1316;

try {
  await client.query("BEGIN");

  let { rows: refs } = await client.query(
    `SELECT id, name FROM referees
     WHERE lower(name)=lower($1)
        OR name ILIKE 'João Marcos%Fernandes%'
        OR name ILIKE 'Joao Marcos%Fernandes%'
     ORDER BY id LIMIT 1`,
    ["João Marcos Gonçalves Fernandes"],
  );
  if (!refs[0]) {
    const ins = await client.query(
      `INSERT INTO referees (name, state) VALUES ($1,'RJ') RETURNING id, name`,
      ["João Marcos Gonçalves Fernandes"],
    );
    refs = ins.rows;
    console.log("REF_CREATED", refs[0]);
  }

  await client.query(
    `UPDATE matches SET
       referee_id=$2,
       scorers=$3,
       attendance=$4,
       attendance_paid=$5,
       gross_revenue=$6,
       manager_id=29
     WHERE id=$1`,
    [
      MATCH_ID,
      refs[0].id,
      "Kayllan, Rian Santana, Dudu Figueiredo",
      4117,
      2846,
      69235,
    ],
  );

  await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [MATCH_ID]);

  const lineup = await client.query(
    `SELECT id, player_id FROM match_lineups WHERE match_id=$1 AND side='csa'`,
    [MATCH_ID],
  );
  const lid = new Map(lineup.rows.map((r) => [r.player_id, r.id]));

  // 2T minutes: Kayllan 7'→52', Rian 23'→68', Dudu 44'→89'
  const goals = [
    { id: 453, name: "Kayllan", minute: 52 },
    { id: 460, name: "Rian Santana", minute: 68 },
    { id: 464, name: "Dudu Figueiredo", minute: 89 },
  ];

  for (const g of goals) {
    await client.query(
      `INSERT INTO match_goals
         (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
          is_penalty, is_own_goal)
       VALUES ($1,'csa',$2,$3,$4,$5,false,false)`,
      [MATCH_ID, lid.get(g.id) ?? null, g.id, g.name, g.minute],
    );
  }

  await client.query("COMMIT");

  const meta = await client.query(
    `SELECT m.id, r.name AS referee, m.scorers, m.attendance, m.attendance_paid, m.gross_revenue
     FROM matches m LEFT JOIN referees r ON r.id=m.referee_id WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log(meta.rows[0]);
  const gl = await client.query(
    `SELECT minute, scorer_name FROM match_goals WHERE match_id=$1 ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  console.log("OK #1316");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
