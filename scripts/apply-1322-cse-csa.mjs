/**
 * Apply Série D #1322 CSE 1x5 CSA (2026-05-17) from user sumula.
 * Juca Sampaio; referee Bruno Monteiro Cunha (Transfermarkt).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1322;
const STADIUM_ID = 34;
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

async function ensureReferee(name) {
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
  const soft = all.rows.filter((r) => {
    const n = norm(r.name);
    return n.includes("bruno") && n.includes("monteiro") && n.includes("cunha");
  });
  if (soft.length === 1) return soft[0];
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [name, null],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const referee = await ensureReferee("Bruno Monteiro Cunha");

  const starters = [
    { shirt: 1, name: "Wellerson", id: 471, position: "Goleiro" },
    { shirt: 2, name: "Caio Hila", id: 470, position: "Lateral Direito" },
    { shirt: 3, name: "Rayan", id: 484, position: "Zagueiro" },
    { shirt: 4, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 16, name: "Ailton Santos", id: 462, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Kayllan", id: 453, position: "Volante" },
    { shirt: 8, name: "Camacho", id: 432, position: "Volante" },
    { shirt: 10, name: "Dudu Figueiredo", id: 464, position: "Meia Ofensivo" },
    { shirt: 7, name: "Matheus Melo", id: 483, position: "Meia" },
    { shirt: 9, name: "Lucas Lima", id: 476, position: "Atacante" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  ];

  const bench = [
    { shirt: 12, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 17, name: "Marcos Ytalo", id: 466, position: "Lateral Direito" },
    { shirt: 14, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 18, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
    { shirt: 13, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 15, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 20, name: "Vitinho", id: 474, position: "Centroavante" },
    { shirt: 22, name: "Matheus Sacramento", id: 452, position: "Centroavante" },
    { shirt: 19, name: "Lucas Silva", id: 71, position: "Atacante" },
    { shirt: 21, name: "Matheus Souza", id: 454, position: "Atacante" },
  ];

  const goals = [
    {
      side: "csa",
      scorerId: 462,
      scorer: "Ailton Santos",
      minute: 23,
      injury: null,
      assistId: null,
      assist: null,
    },
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 66,
      injury: null,
      assistId: null,
      assist: null,
    },
    {
      side: "opponent",
      scorer: "Celestino",
      minute: 69,
      injury: null,
    },
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 71,
      injury: null,
      assistId: 464,
      assist: "Dudu Figueiredo",
    },
    {
      side: "csa",
      scorerId: 71,
      scorer: "Lucas Silva",
      minute: 77,
      injury: null,
      assistId: 470,
      assist: "Caio Hila",
    },
    {
      side: "csa",
      scorerId: 433,
      scorer: "Gustavo",
      minute: 86,
      injury: null,
      assistId: 454,
      assist: "Matheus Souza",
    },
  ];

  const cards = [
    {
      id: 457,
      name: "Félix Jorge",
      type: "yellow",
      minute: 45,
      injury: 3,
    },
  ];

  const subs = [
    {
      outId: 483,
      out: "Matheus Melo",
      inId: 71,
      in: "Lucas Silva",
      minute: 57,
      injury: null,
    },
    {
      outId: 464,
      out: "Dudu Figueiredo",
      inId: 466,
      in: "Marcos Ytalo",
      minute: 72,
      injury: null,
    },
    {
      outId: 476,
      out: "Lucas Lima",
      inId: 454,
      in: "Matheus Souza",
      minute: 72,
      injury: null,
    },
    {
      outId: 470,
      out: "Caio Hila",
      inId: 433,
      in: "Gustavo",
      minute: 83,
      injury: null,
    },
    {
      outId: 460,
      out: "Rian Santana",
      inId: 474,
      in: "Vitinho",
      minute: 83,
      injury: null,
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
      "Ailton Santos, Rian Santana, Rian Santana, Lucas Silva, Gustavo",
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
            injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'opponent',NULL,NULL,$2,$3,$4,false,false)`,
        [MATCH_ID, g.scorer, g.minute, g.injury],
      );
    } else {
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
  }

  for (const c of cards) {
    await client.query(
      `INSERT INTO match_cards
         (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7)`,
      [
        MATCH_ID,
        c.type,
        lineupIds.get(c.id) ?? null,
        c.id,
        c.name,
        c.minute,
        c.injury,
      ],
    );
  }

  for (const s of subs) {
    await client.query(
      `INSERT INTO match_substitutions
         (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
          player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        MATCH_ID,
        lineupIds.get(s.outId) ?? null,
        s.outId,
        s.out,
        lineupIds.get(s.inId) ?? null,
        s.inId,
        s.in,
        s.minute,
        s.injury,
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
    `SELECT side, minute, injury_time_minute, scorer_name, assist_name
     FROM match_goals WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  const cd = await client.query(
    `SELECT minute, injury_time_minute, player_name FROM match_cards
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
    `SELECT m.id, s.name AS stadium, r.name AS referee, mg.name AS manager, m.scorers
     FROM matches m
     LEFT JOIN stadiums s ON s.id=m.stadium_id
     LEFT JOIN referees r ON r.id=m.referee_id
     LEFT JOIN managers mg ON mg.id=m.manager_id
     WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log("meta", meta.rows[0]);
  console.log("OK #1322");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
