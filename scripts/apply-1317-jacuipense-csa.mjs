/**
 * Apply Série D #1317 Jacuipense 1x3 CSA (2026-04-11) from user sumula.
 * Arena Cajueiro; referee Elizabete Esmeralda Gomes.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1317;
const STADIUM_ID = 139;
const MANAGER_ID = 29;

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

async function ensureReferee(name, state) {
  let { rows } = await client.query(
    `SELECT id, name FROM referees WHERE lower(name)=lower($1) LIMIT 1`,
    [name],
  );
  if (rows[0]) return rows[0];
  const all = await client.query(`SELECT id, name FROM referees`);
  const norm = (s) =>
    String(s)
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
  const hit = all.rows.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const soft = all.rows.filter(
    (r) =>
      norm(r.name).includes("elizabete") ||
      norm(r.name).includes("esmeralda"),
  );
  if (soft.length === 1) return soft[0];
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [name, state],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const referee = await ensureReferee("Elizabete Esmeralda Gomes", null);

  const starters = [
    { shirt: 1, name: "Wellerson", id: 471, position: "Goleiro" },
    { shirt: 2, name: "Caio Hila", id: 470, position: "Lateral Direito" },
    { shirt: 3, name: "Lucão", id: 486, position: "Zagueiro" },
    { shirt: 4, name: "Rayan", id: 484, position: "Zagueiro" },
    { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Camacho", id: 432, position: "Volante" },
    { shirt: 8, name: "Kayllan", id: 453, position: "Volante" },
    { shirt: 7, name: "Fabrício Bigode", id: 463, position: "Volante" },
    { shirt: 10, name: "Dudu Figueiredo", id: 464, position: "Meia Ofensivo" },
    { shirt: 20, name: "Matheus Melo", id: 483, position: "Meia" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  ];

  const bench = [
    { shirt: 12, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 14, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 15, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 16, name: "Ailton Santos", id: 462, position: "Lateral Esquerdo" },
    { shirt: 21, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 13, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 18, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 19, name: "Luiz Guilherme", id: 440, position: "Meia Ofensivo" },
    { shirt: 22, name: "Matheus Sacramento", id: 452, position: "Centroavante" },
    { shirt: 9, name: "Vitinho", id: 474, position: "Centroavante" },
    { shirt: 17, name: "Matheus Souza", id: 454, position: "Atacante" },
  ];

  const goals = [
    {
      side: "csa",
      scorerId: 463,
      scorer: "Fabrício Bigode",
      minute: 31,
      assistId: null,
      assist: null,
    },
    {
      side: "csa",
      scorerId: 464,
      scorer: "Dudu Figueiredo",
      minute: 47,
      assistId: 460,
      assist: "Rian Santana",
    },
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 60,
      assistId: 432,
      assist: "Camacho",
    },
    {
      side: "opponent",
      scorer: "Adriano Júnior",
      minute: 78,
    },
  ];

  const cards = [
    { id: 432, name: "Camacho", type: "yellow", minute: 35 },
    { id: 470, name: "Caio Hila", type: "yellow", minute: 65 },
  ];

  const subs = [
    {
      outId: 483,
      out: "Matheus Melo",
      inId: 462,
      in: "Ailton Santos",
      minute: 73,
    },
    {
      outId: 463,
      out: "Fabrício Bigode",
      inId: 452,
      in: "Matheus Sacramento",
      minute: 73,
    },
    {
      outId: 484,
      out: "Rayan",
      inId: 457,
      in: "Félix Jorge",
      minute: 81,
    },
    {
      outId: 432,
      out: "Camacho",
      inId: 435,
      in: "Ramon Batista",
      minute: 81,
    },
    {
      outId: 464,
      out: "Dudu Figueiredo",
      inId: 454,
      in: "Matheus Souza",
      minute: 90,
    },
  ];

  await client.query(
    `UPDATE matches SET
       stadium_id=$2,
       manager_id=$3,
       referee_id=$4,
       scorers=$5,
       home_away='away'
     WHERE id=$1`,
    [
      MATCH_ID,
      STADIUM_ID,
      MANAGER_ID,
      referee.id,
      "Fabrício Bigode, Dudu Figueiredo, Rian Santana",
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
    if (g.side === "opponent") {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
            is_penalty, is_own_goal)
         VALUES ($1,'opponent',NULL,NULL,$2,$3,false,false)`,
        [MATCH_ID, g.scorer, g.minute],
      );
    } else {
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
    `SELECT side, minute, scorer_name, assist_name FROM match_goals
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
  console.log("OK #1317");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
