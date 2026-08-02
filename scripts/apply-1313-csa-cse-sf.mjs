/**
 * Apply Copa Alagoas #1313 CSA 5x0 CSE SF (2026-03-21) from user sumula.
 * Moacir Júnior debut, Ferreirão, Márcio dos Santos Oliveira.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1313;
const STADIUM_ID = 135; // Ferreirão
const MANAGER_ID = 29; // Moacir Júnior
const REFEREE_ID = 45; // Márcio dos Santos Oliveira

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

function rank(pos) {
  const i = ORDER.indexOf(pos || "");
  return i < 0 ? 999 : i;
}

try {
  await client.query("BEGIN");

  const starters = [
    { shirt: 1, name: "Wellerson", id: 471, position: "Goleiro" },
    { shirt: 17, name: "Marcos Ytalo", id: 466, position: "Lateral Direito" },
    { shirt: 3, name: "Lucão", id: 486, position: "Zagueiro" },
    { shirt: 4, name: "Rayan", id: 484, position: "Zagueiro" },
    { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Kayllan", id: 453, position: "Volante" },
    { shirt: 8, name: "Camacho", id: 432, position: "Volante" },
    { shirt: 10, name: "Dudu Figueiredo", id: 464, position: "Meia Ofensivo" },
    { shirt: 11, name: "Matheus Melo", id: 483, position: "Meia" },
    { shirt: 9, name: "Fabrício Bigode", id: 463, position: "Centroavante" },
    { shirt: 26, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  ];

  const bench = [
    { shirt: 12, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 13, name: "Cauã Soares", id: 415, position: "Zagueiro" },
    { shirt: 14, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 16, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 25, name: "Calyl", id: 459, position: "Zagueiro" },
    { shirt: 20, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 15, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 18, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 21, name: "Luiz Guilherme", id: 440, position: "Meia Ofensivo" },
    { shirt: 7, name: "Robinho", id: 493, position: "Ponta Esquerda" },
    { shirt: 19, name: "Samuel Reis", id: 458, position: "Atacante" },
    { shirt: 22, name: "Vitinho", id: 474, position: "Centroavante" },
  ];

  const goals = [
    {
      scorerId: 463,
      scorer: "Fabrício Bigode",
      minute: 7,
      injury: null,
      assistId: 464,
      assist: "Dudu Figueiredo",
    },
    {
      scorerId: 464,
      scorer: "Dudu Figueiredo",
      minute: 39,
      injury: null,
      assistId: null,
      assist: null,
    },
    {
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 45,
      injury: 1,
      assistId: 455,
      assist: "Kaike",
    },
    {
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 64,
      injury: null,
      assistId: 463,
      assist: "Fabrício Bigode",
    },
    {
      scorerId: 493,
      scorer: "Robinho",
      minute: 84,
      injury: null,
      assistId: 460,
      assist: "Rian Santana",
    },
  ];

  const cards = [
    { id: 483, name: "Matheus Melo", type: "yellow", minute: 23 },
    { id: 455, name: "Kaike", type: "yellow", minute: 73 },
  ];

  const subs = [
    {
      outId: 432,
      out: "Camacho",
      inId: 308,
      in: "Wesley",
      minute: 46,
    },
    {
      outId: 483,
      out: "Matheus Melo",
      inId: 493,
      in: "Robinho",
      minute: 46,
    },
    {
      outId: 455,
      out: "Kaike",
      inId: 433,
      in: "Gustavo",
      minute: 75,
    },
    {
      outId: 464,
      out: "Dudu Figueiredo",
      inId: 440,
      in: "Luiz Guilherme",
      minute: 75,
    },
    {
      outId: 453,
      out: "Kayllan",
      inId: 435,
      in: "Ramon Batista",
      minute: 85,
    },
  ];

  await client.query(
    `UPDATE matches SET
       stadium_id=$2,
       manager_id=$3,
       referee_id=$4,
       scorers=$5,
       home_away='home'
     WHERE id=$1`,
    [
      MATCH_ID,
      STADIUM_ID,
      MANAGER_ID,
      REFEREE_ID,
      "Fabrício Bigode, Dudu Figueiredo, Rian Santana, Rian Santana, Robinho",
    ],
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
    const display = p.id === 308 ? "Wesley" : p.name;
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'starter',$4,$5,$6) RETURNING id`,
      [MATCH_ID, p.id, display, p.shirt, p.position, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
  }
  sort = 100;
  for (const p of benchSorted) {
    const display = p.id === 308 ? "Wesley" : p.name;
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5,$6) RETURNING id`,
      [MATCH_ID, p.id, display, p.shirt, p.position, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
  }

  for (const g of goals) {
    await client.query(
      `INSERT INTO match_goals
         (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
          injury_time_minute, assist_lineup_id, assist_player_id, assist_name,
          is_penalty, is_own_goal)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,$9,false,false)`,
      [
        MATCH_ID,
        lineupIds.get(g.scorerId) ?? null,
        g.scorerId,
        g.scorer,
        g.minute,
        g.injury,
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
    const outName = s.outId === 308 ? "Wesley" : s.out;
    const inName = s.inId === 308 ? "Wesley" : s.in;
    await client.query(
      `INSERT INTO match_substitutions
         (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
          player_in_lineup_id, player_in_id, player_in_name, minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8)`,
      [
        MATCH_ID,
        lineupIds.get(s.outId) ?? null,
        s.outId,
        outName,
        lineupIds.get(s.inId) ?? null,
        s.inId,
        inName,
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
    `SELECT minute, injury_time_minute, scorer_name, assist_name
     FROM match_goals WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  const cd = await client.query(
    `SELECT minute, player_name FROM match_cards WHERE match_id=$1 ORDER BY minute`,
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
    `SELECT m.id, s.name AS stadium, r.name AS referee, mg.name AS manager, m.scorers
     FROM matches m
     LEFT JOIN stadiums s ON s.id=m.stadium_id
     LEFT JOIN referees r ON r.id=m.referee_id
     LEFT JOIN managers mg ON mg.id=m.manager_id
     WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log("meta", meta.rows[0]);

  console.log("OK #1313");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
