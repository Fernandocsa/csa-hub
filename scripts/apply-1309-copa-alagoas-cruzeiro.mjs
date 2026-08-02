/**
 * Apply Copa Alagoas #1309 CSA 3x0 Cruzeiro-AL (2026-02-04)
 * Venue: Estádio Gerson Amaral (Coruripe) — user correction.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1309;
const STADIUM_ID = 37; // Estádio Gerson Amaral, Coruripe
const MANAGER_ID = 36; // Itamar Schülle

async function ensurePlayer(name) {
  const { rows } = await client.query(
    `SELECT id, name FROM players WHERE lower(name)=lower($1) ORDER BY id LIMIT 1`,
    [name],
  );
  if (rows[0]) return rows[0];
  const ins = await client.query(
    `INSERT INTO players (name, nationality, verification_status)
     VALUES ($1,'Brasil','unverified') RETURNING id, name`,
    [name],
  );
  console.log(`created player #${ins.rows[0].id} ${ins.rows[0].name}`);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const pedro = await ensurePlayer("Pedro Ariel");

  const starters = [
    { shirt: 1, name: "Arthur Silveira", id: 482 },
    { shirt: 3, name: "Cauã Soares", id: 415 },
    { shirt: 6, name: "Félix Jorge", id: 457 },
    { shirt: 4, name: "Ramon Batista", id: 435 },
    { shirt: 5, name: "Renato Pitbull", id: 461 },
    { shirt: 8, name: "Igor Guilherme", id: 456 },
    { shirt: 10, name: "Matheus Melo", id: 483 },
    { shirt: 11, name: "Ronaldo Mendes", id: 468 },
    { shirt: 9, name: "Samuel Reis", id: 458 },
    { shirt: 2, name: "Rian Santana", id: 460 },
    { shirt: 7, name: "Robinho", id: 493 },
  ];
  const bench = [
    { shirt: 12, name: "Lucas Matheus", id: 445 },
    { shirt: 23, name: "Pedro Ariel", id: pedro.id },
    { shirt: 27, name: "Lucas Serafini", id: 469 },
    { shirt: 13, name: "Calyl", id: 459 },
    { shirt: 15, name: "Thiago Medeiros", id: 479 },
    { shirt: 17, name: "Luiz Guilherme", id: 440 },
    { shirt: 14, name: "Wesley", id: 308 },
    { shirt: 16, name: "Felipe Rodrigues", id: 481 },
    { shirt: 18, name: "Vitinho", id: 474 },
  ];

  const goals = [
    { scorerId: 483, scorer: "Matheus Melo", minute: 39, assistId: null, assist: null },
    {
      scorerId: 457,
      scorer: "Félix Jorge",
      minute: 72,
      assistId: 468,
      assist: "Ronaldo Mendes",
    },
    {
      scorerId: 458,
      scorer: "Samuel Reis",
      minute: 79,
      assistId: 440,
      assist: "Luiz Guilherme",
    },
  ];

  const cards = [{ id: 479, name: "Thiago Medeiros", type: "yellow", minute: 81 }];

  const subs = [
    { outId: 483, out: "Matheus Melo", inId: 469, in: "Lucas Serafini", minute: 46 },
    { outId: 493, out: "Robinho", inId: 308, in: "Wesley", minute: 59 },
    { outId: 415, out: "Cauã Soares", inId: 440, in: "Luiz Guilherme", minute: 63 },
    { outId: 456, out: "Igor Guilherme", inId: 459, in: "Calyl", minute: 74 },
    { outId: 468, out: "Ronaldo Mendes", inId: 479, in: "Thiago Medeiros", minute: 74 },
  ];

  await client.query(
    `UPDATE matches SET
       stadium_id=$2,
       manager_id=$3,
       scorers=$4,
       home_away='home'
     WHERE id=$1`,
    [MATCH_ID, STADIUM_ID, MANAGER_ID, "Matheus Melo, Félix Jorge, Samuel Reis"],
  );

  await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [MATCH_ID]);

  const lineupIds = new Map();
  let sort = 0;
  for (const p of starters) {
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, sort_order)
       VALUES ($1,'csa',$2,$3,'starter',$4,$5) RETURNING id`,
      [MATCH_ID, p.id, p.name, p.shirt, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
  }
  for (const p of bench) {
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5) RETURNING id`,
      [MATCH_ID, p.id, p.name, p.shirt, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
  }

  for (const g of goals) {
    await client.query(
      `INSERT INTO match_goals
         (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
          assist_lineup_id, assist_player_id, assist_name, is_penalty, is_own_goal)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,false,false)`,
      [
        MATCH_ID,
        lineupIds.get(g.scorerId) ?? null,
        g.scorerId,
        g.scorer,
        g.minute,
        g.assistId ? lineupIds.get(g.assistId) ?? null : null,
        g.assistId,
        g.assist,
      ],
    );
  }

  for (const c of cards) {
    await client.query(
      `INSERT INTO match_cards
         (match_id, side, card_type, lineup_id, player_id, player_name, minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6)`,
      [MATCH_ID, c.type, lineupIds.get(c.id) ?? null, c.id, c.name, c.minute],
    );
  }

  for (const s of subs) {
    await client.query(
      `INSERT INTO match_substitutions
         (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
          player_in_lineup_id, player_in_id, player_in_name, minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8)`,
      [
        MATCH_ID,
        lineupIds.get(s.outId) ?? null,
        s.outId,
        s.out,
        lineupIds.get(s.inId) ?? null,
        s.inId,
        s.in,
        s.minute,
      ],
    );
  }

  await client.query("COMMIT");

  const summary = await client.query(
    `SELECT
       (SELECT count(*)::int FROM match_lineups WHERE match_id=$1 AND role='starter') AS starters,
       (SELECT count(*)::int FROM match_lineups WHERE match_id=$1 AND role='bench') AS bench,
       (SELECT count(*)::int FROM match_goals WHERE match_id=$1) AS goals,
       (SELECT count(*)::int FROM match_cards WHERE match_id=$1) AS cards,
       (SELECT count(*)::int FROM match_substitutions WHERE match_id=$1) AS subs,
       s.name AS stadium, s.city
     FROM matches m
     JOIN stadiums s ON s.id=m.stadium_id
     WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log(summary.rows[0]);
  const gl = await client.query(
    `SELECT minute, scorer_name, assist_name FROM match_goals WHERE match_id=$1 ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
