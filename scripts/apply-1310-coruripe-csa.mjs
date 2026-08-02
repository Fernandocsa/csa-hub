/**
 * Apply Copa Alagoas #1310 Coruripe 2x1 CSA (2026-02-12) from user sumula.
 * Venue: Estádio Gerson Amaral (Coruripe).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1310;
const STADIUM_ID = 37; // Estádio Gerson Amaral, Coruripe
const MANAGER_ID = 36; // Itamar Schülle
const REFEREE_ID = 50; // Carlos Vitor Oliveira Alves

const ORDER = [
  "Goleiro",
  "Lateral Direito",
  "Lateral",
  "Zagueiro",
  "Lateral Esquerdo",
  "Volante",
  "Meia",
  "Meia Central",
  "Meia Ofensivo",
  "Meia Direita",
  "Meia Esquerda",
  "Ponta Direita",
  "Ponta Esquerda",
  "2º Atacante",
  "Centroavante",
  "Atacante",
];

const starters = [
  { shirt: 1, name: "Arthur Silveira", id: 482, position: "Goleiro" },
  { shirt: 3, name: "Lucão", id: 486, position: "Zagueiro" },
  { shirt: 6, name: "Félix Jorge", id: 457, position: "Zagueiro" },
  { shirt: 4, name: "Ramon Batista", id: 435, position: "Zagueiro" },
  { shirt: 5, name: "Renato Pitbull", id: 461, position: "Volante" },
  { shirt: 8, name: "Fabrício Bigode", id: 463, position: "Volante" },
  { shirt: 10, name: "Matheus Melo", id: 483, position: "Meia" },
  { shirt: 11, name: "Ronaldo Mendes", id: 468, position: "Meia" },
  { shirt: 2, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  { shirt: 7, name: "Matheus Souza", id: 454, position: "Atacante" },
  { shirt: 9, name: "Samuel Reis", id: 458, position: "Atacante" },
];

const bench = [
  { shirt: 12, name: "Lucas Matheus", id: 445, position: "Goleiro" },
  { shirt: 27, name: "Lucas Serafini", id: 469, position: "Lateral Direito" },
  { shirt: 13, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
  { shirt: 14, name: "Cauã Soares", id: 415, position: "Zagueiro" },
  { shirt: 15, name: "Wesley", id: 308, position: "Volante" },
  { shirt: 16, name: "Thiago Medeiros", id: 479, position: "Volante" },
  { shirt: 17, name: "Felipe Rodrigues", id: 481, position: "Meia" },
  { shirt: 20, name: "Luiz Guilherme", id: 440, position: "Meia Ofensivo" },
  { shirt: 21, name: "Robinho", id: 493, position: "Ponta Esquerda" },
];

const goals = [
  {
    scorerId: 483,
    scorer: "Matheus Melo",
    minute: 64,
    assistId: 463,
    assist: "Fabrício Bigode",
  },
];

const cards = [
  { id: 435, name: "Ramon Batista", type: "yellow", minute: 76 },
  { id: 469, name: "Lucas Serafini", type: "yellow", minute: 76 },
];

const subs = [
  {
    outId: 458,
    out: "Samuel Reis",
    inId: 493,
    in: "Robinho",
    minute: 46,
  },
  {
    outId: 454,
    out: "Matheus Souza",
    inId: 469,
    in: "Lucas Serafini",
    minute: 60,
  },
  {
    outId: 461,
    out: "Renato Pitbull",
    inId: 481,
    in: "Felipe Rodrigues",
    minute: 79,
  },
  {
    outId: 457,
    out: "Félix Jorge",
    inId: 440,
    in: "Luiz Guilherme",
    minute: 86,
  },
  {
    outId: 463,
    out: "Fabrício Bigode",
    inId: 308,
    in: "Wesley",
    minute: 86,
  },
];

function rank(pos) {
  const i = ORDER.indexOf(pos || "");
  return i < 0 ? 999 : i;
}

try {
  await client.query("BEGIN");

  await client.query(
    `UPDATE matches SET
       stadium_id=$2,
       manager_id=$3,
       referee_id=$4,
       scorers=$5,
       home_away='away'
     WHERE id=$1`,
    [MATCH_ID, STADIUM_ID, MANAGER_ID, REFEREE_ID, "Matheus Melo"],
  );

  await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [MATCH_ID]);
  await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [
    MATCH_ID,
  ]);
  await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [MATCH_ID]);

  const lineupIds = new Map();
  const starterSorted = [...starters].sort(
    (a, b) => rank(a.position) - rank(b.position) || a.shirt - b.shirt,
  );
  const benchSorted = [...bench].sort(
    (a, b) => rank(a.position) - rank(b.position) || a.shirt - b.shirt,
  );

  let sort = 0;
  for (const p of starterSorted) {
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'starter',$4,$5,$6) RETURNING id`,
      [MATCH_ID, p.id, p.name, p.shirt, p.position, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
  }
  sort = 100;
  for (const p of benchSorted) {
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5,$6) RETURNING id`,
      [MATCH_ID, p.id, p.name, p.shirt, p.position, sort++],
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

  const lu = await client.query(
    `SELECT role, shirt_number, position, player_name FROM match_lineups
     WHERE match_id=$1 AND side='csa' ORDER BY sort_order`,
    [MATCH_ID],
  );
  console.log("CSA lineup:");
  for (const r of lu.rows) {
    console.log(
      `  ${r.role} #${r.shirt_number} ${r.position} ${r.player_name}`,
    );
  }
  const gl = await client.query(
    `SELECT minute, scorer_name, assist_name FROM match_goals
     WHERE match_id=$1 ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  const cd = await client.query(
    `SELECT minute, player_name, card_type FROM match_cards
     WHERE match_id=$1 ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("cards", cd.rows);
  const sb = await client.query(
    `SELECT minute, player_out_name, player_in_name FROM match_substitutions
     WHERE match_id=$1 ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("subs", sb.rows);

  const meta = await client.query(
    `SELECT m.id, r.name AS referee, s.name AS stadium, mg.name AS manager
     FROM matches m
     LEFT JOIN referees r ON r.id=m.referee_id
     LEFT JOIN stadiums s ON s.id=m.stadium_id
     LEFT JOIN managers mg ON mg.id=m.manager_id
     WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log("meta", meta.rows[0]);
  console.log("OK #1310");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
