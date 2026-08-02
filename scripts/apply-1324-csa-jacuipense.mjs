/**
 * Apply Série D #1324 CSA 1x1 Jacuipense (2026-05-31) from user sumula.
 * Rei Pelé; referee Diego da Costa (Transfermarkt).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1324;
const STADIUM_ID = 1;
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
    return n.includes("diego") && n.includes("costa");
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

  const referee = await ensureReferee("Diego da Costa");

  const starters = [
    { shirt: 1, name: "Wellerson", id: 471, position: "Goleiro" },
    { shirt: 2, name: "Caio Hila", id: 470, position: "Lateral Direito" },
    { shirt: 32, name: "Amorim", id: 467, position: "Zagueiro" },
    { shirt: 4, name: "Rayan", id: 484, position: "Zagueiro" },
    { shirt: 60, name: "Ailton Santos", id: 462, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Camacho", id: 432, position: "Volante" },
    { shirt: 8, name: "Kayllan", id: 453, position: "Volante" },
    { shirt: 30, name: "Matheus Melo", id: 483, position: "Meia" },
    { shirt: 15, name: "Fabrício Bigode", id: 463, position: "Volante" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
    { shirt: 23, name: "Lucas Silva", id: 71, position: "Atacante" },
  ];

  const bench = [
    { shirt: 12, name: "Pedro Ariel", id: 1667, position: "Goleiro" },
    { shirt: 22, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 17, name: "Marcos Ytalo", id: 466, position: "Lateral Direito" },
    { shirt: 20, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 3, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 27, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 18, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 47, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 7, name: "Ronaldo Mendes", id: 468, position: "Meia" },
    { shirt: 19, name: "Vitinho", id: 474, position: "Centroavante" },
    { shirt: 9, name: "Lucas Lima", id: 476, position: "Atacante" },
    { shirt: 70, name: "Matheus Souza", id: 454, position: "Atacante" },
  ];

  const goals = [
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 14,
      injury: null,
      assistId: 432,
      assist: "Camacho",
    },
    {
      side: "opponent",
      scorer: "Pedro Henrique",
      minute: 69,
      injury: null,
    },
  ];

  const cards = [
    {
      id: 462,
      name: "Ailton Santos",
      type: "yellow",
      minute: 25,
      injury: null,
    },
    { id: 71, name: "Lucas Silva", type: "yellow", minute: 41, injury: null },
    {
      id: 470,
      name: "Caio Hila",
      type: "yellow",
      minute: 45,
      injury: 4,
    },
    { id: 484, name: "Rayan", type: "yellow", minute: 73, injury: null },
    { id: 432, name: "Camacho", type: "yellow", minute: 88, injury: null },
    {
      id: 483,
      name: "Matheus Melo",
      type: "yellow",
      minute: 90,
      injury: 3,
    },
  ];

  const subs = [
    {
      outId: 71,
      out: "Lucas Silva",
      inId: 454,
      in: "Matheus Souza",
      minute: 46,
      injury: null,
    },
    {
      outId: 467,
      out: "Amorim",
      inId: 457,
      in: "Félix Jorge",
      minute: 60,
      injury: null,
    },
    {
      outId: 463,
      out: "Fabrício Bigode",
      inId: 476,
      in: "Lucas Lima",
      minute: 60,
      injury: null,
    },
    {
      outId: 483,
      out: "Matheus Melo",
      inId: 433,
      in: "Gustavo",
      minute: 79,
      injury: null,
    },
    {
      outId: 460,
      out: "Rian Santana",
      inId: 474,
      in: "Vitinho",
      minute: 90,
      injury: 2,
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
    [MATCH_ID, STADIUM_ID, MANAGER_ID, referee.id, "Rian Santana"],
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
     FROM match_goals WHERE match_id=$1 ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  const cd = await client.query(
    `SELECT minute, injury_time_minute, player_name FROM match_cards
     WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("cards", cd.rows);
  const sb = await client.query(
    `SELECT minute, injury_time_minute, player_out_name, player_in_name
     FROM match_substitutions WHERE match_id=$1
     ORDER BY minute, coalesce(injury_time_minute,0)`,
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
  console.log("OK #1324");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
