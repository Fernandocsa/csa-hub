/**
 * Apply Série D #1325 Atlético-BA 1x7 CSA (2026-06-14) from user sumula.
 * Waldomirão; referee Iudiney Rocha e Silva.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1325;
const STADIUM_ID = 140;
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
    return n.includes("iudiney") || (n.includes("rocha") && n.includes("silva"));
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

  const referee = await ensureReferee("Iudiney Rocha e Silva");

  const starters = [
    { shirt: 12, name: "Yago Oliveira", id: 477, position: "Goleiro" },
    { shirt: 17, name: "Marcos Ytalo", id: 466, position: "Lateral Direito" },
    { shirt: 32, name: "Amorim", id: 467, position: "Zagueiro" },
    { shirt: 4, name: "Rayan", id: 484, position: "Zagueiro" },
    { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
    { shirt: 47, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 5, name: "Camacho", id: 432, position: "Volante" },
    { shirt: 7, name: "Ronaldo Mendes", id: 468, position: "Meia" },
    { shirt: 27, name: "Gustavo", id: 433, position: "Meia Esquerda" },
    { shirt: 9, name: "Lucas Lima", id: 476, position: "Atacante" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  ];

  const bench = [
    { shirt: 1, name: "Wellerson", id: 471, position: "Goleiro" },
    { shirt: 22, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 13, name: "Mikael", id: 475, position: "Zagueiro" },
    { shirt: 20, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 3, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 60, name: "Ailton Santos", id: 462, position: "Lateral Esquerdo" },
    { shirt: 18, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 15, name: "Fabrício Bigode", id: 463, position: "Volante" },
    { shirt: 19, name: "Vitinho", id: 474, position: "Centroavante" },
    { shirt: 23, name: "Lucas Silva", id: 71, position: "Atacante" },
    { shirt: 70, name: "Matheus Souza", id: 454, position: "Atacante" },
  ];

  const goals = [
    {
      side: "csa",
      scorerId: 468,
      scorer: "Ronaldo Mendes",
      minute: 5,
      injury: null,
      assistId: 476,
      assist: "Lucas Lima",
    },
    {
      side: "csa",
      scorerId: 433,
      scorer: "Gustavo",
      minute: 8,
      injury: null,
      assistId: 466,
      assist: "Marcos Ytalo",
    },
    {
      side: "csa",
      scorerId: 476,
      scorer: "Lucas Lima",
      minute: 46,
      injury: null,
      assistId: 460,
      assist: "Rian Santana",
    },
    {
      side: "csa",
      scorerId: 433,
      scorer: "Gustavo",
      minute: 67,
      injury: null,
      assistId: 308,
      assist: "Wesley",
    },
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 70,
      injury: null,
      assistId: null,
      assist: null,
    },
    {
      side: "csa",
      scorerId: 432,
      scorer: "Camacho",
      minute: 76,
      injury: null,
      assistId: 455,
      assist: "Kaike",
    },
    {
      side: "opponent",
      scorer: "Kevin Chaves",
      minute: 82,
      injury: null,
    },
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 87,
      injury: null,
      assistId: 308,
      assist: "Wesley",
    },
  ];

  const cards = [
    { id: 476, name: "Lucas Lima", type: "yellow", minute: 17, injury: null },
  ];

  const subs = [
    {
      outId: 435,
      out: "Ramon Batista",
      inId: 308,
      in: "Wesley",
      minute: 37,
      injury: null,
    },
    {
      outId: 468,
      out: "Ronaldo Mendes",
      inId: 71,
      in: "Lucas Silva",
      minute: 46,
      injury: null,
    },
    {
      outId: 477,
      out: "Yago Oliveira",
      inId: 482,
      in: "Arthur Silveira",
      minute: 63,
      injury: null,
    },
    {
      outId: 467,
      out: "Amorim",
      inId: 473,
      in: "Marlon Lopes",
      minute: 63,
      injury: null,
    },
    {
      outId: 433,
      out: "Gustavo",
      inId: 475,
      in: "Mikael",
      minute: 74,
      injury: null,
    },
  ];

  await client.query(
    `UPDATE matches SET
       stadium_id=$2,
       manager_id=$3,
       referee_id=$4,
       captain_player_id=$5,
       scorers=$6,
       home_away='away'
     WHERE id=$1`,
    [
      MATCH_ID,
      STADIUM_ID,
      MANAGER_ID,
      referee.id,
      432, // Camacho (C)
      "Ronaldo Mendes, Gustavo, Lucas Lima, Gustavo, Rian Santana, Camacho, Rian Santana",
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
    `SELECT m.id, s.name AS stadium, r.name AS referee, mg.name AS manager,
            m.scorers, p.name AS captain
     FROM matches m
     LEFT JOIN stadiums s ON s.id=m.stadium_id
     LEFT JOIN referees r ON r.id=m.referee_id
     LEFT JOIN managers mg ON mg.id=m.manager_id
     LEFT JOIN players p ON p.id=m.captain_player_id
     WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log("meta", meta.rows[0]);
  console.log("OK #1325");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
