/**
 * Fix full CSA sheet for #1316 CSA 3x0 Atlético-BA (2026-04-05) from user sumula.
 * Keeps referee/attendance already set.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1316;

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
    { shirt: 2, name: "Caio Hila", id: 470, position: "Lateral Direito" },
    { shirt: 3, name: "Lucão", id: 486, position: "Zagueiro" },
    { shirt: 4, name: "Rayan", id: 484, position: "Zagueiro" },
    { shirt: 16, name: "Ailton Santos", id: 462, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Camacho", id: 432, position: "Volante" },
    { shirt: 8, name: "Kayllan", id: 453, position: "Volante" },
    { shirt: 7, name: "Fabrício Bigode", id: 463, position: "Volante" },
    { shirt: 10, name: "Dudu Figueiredo", id: 464, position: "Meia Ofensivo" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
    { shirt: 22, name: "Matheus Sacramento", id: 452, position: "Centroavante" },
  ];

  const bench = [
    { shirt: 12, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 14, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 15, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
    { shirt: 21, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 13, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 18, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 19, name: "Luiz Guilherme", id: 440, position: "Meia Ofensivo" },
    { shirt: 9, name: "Vitinho", id: 474, position: "Centroavante" },
    { shirt: 20, name: "Lucas Silva", id: 71, position: "Atacante" },
    { shirt: 17, name: "Matheus Souza", id: 454, position: "Atacante" },
  ];

  const goals = [
    {
      scorerId: 453,
      scorer: "Kayllan",
      minute: 53,
      assistId: 432,
      assist: "Camacho",
    },
    {
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 67,
      assistId: null,
      assist: null,
    },
    {
      scorerId: 464,
      scorer: "Dudu Figueiredo",
      minute: 89,
      assistId: 484,
      assist: "Rayan",
    },
  ];

  const cards = [
    { id: 471, name: "Wellerson", type: "yellow", minute: 40 },
    { id: 453, name: "Kayllan", type: "yellow", minute: 58 },
  ];

  const subs = [
    {
      outId: 452,
      out: "Matheus Sacramento",
      inId: 71,
      in: "Lucas Silva",
      minute: 66,
    },
    {
      outId: 470,
      out: "Caio Hila",
      inId: 435,
      in: "Ramon Batista",
      minute: 74,
    },
    {
      outId: 463,
      out: "Fabrício Bigode",
      inId: 454,
      in: "Matheus Souza",
      minute: 74,
    },
    {
      outId: 464,
      out: "Dudu Figueiredo",
      inId: 433,
      in: "Gustavo",
      minute: 90,
    },
    {
      outId: 460,
      out: "Rian Santana",
      inId: 474,
      in: "Vitinho",
      minute: 90,
    },
  ];

  await client.query(
    `UPDATE matches SET scorers=$2, manager_id=29 WHERE id=$1`,
    [MATCH_ID, "Kayllan, Rian Santana, Dudu Figueiredo"],
  );

  await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [MATCH_ID]);
  await client.query(
    `DELETE FROM match_cards WHERE match_id=$1 AND side='csa'`,
    [MATCH_ID],
  );
  await client.query(
    `DELETE FROM match_substitutions WHERE match_id=$1 AND side='csa'`,
    [MATCH_ID],
  );
  await client.query(
    `DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`,
    [MATCH_ID],
  );

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
        s.out,
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
    `SELECT minute, scorer_name, assist_name FROM match_goals
     WHERE match_id=$1 ORDER BY minute`,
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
  console.log("OK #1316");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
