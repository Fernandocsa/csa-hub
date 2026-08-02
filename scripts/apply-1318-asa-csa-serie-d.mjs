/**
 * Apply Série D #1318 ASA 2x1 CSA (2026-04-19) from user sumula.
 * Rayan: red (DOGSO/penalty) at 82' — news confirms expulsion, not yellow.
 * Referee: Marcel Phillipe Santos Martins.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1318;
const STADIUM_ID = 22;
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
      norm(r.name).includes("marcel") &&
      (norm(r.name).includes("phillipe") || norm(r.name).includes("philippe")),
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

  const referee = await ensureReferee(
    "Marcel Phillipe Santos Martins",
    "SE",
  );

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
    { shirt: 20, name: "Matheus Melo", id: 483, position: "Meia" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  ];

  const bench = [
    { shirt: 12, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 17, name: "Marcos Ytalo", id: 466, position: "Lateral Direito" },
    { shirt: 14, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 15, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
    { shirt: 25, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 13, name: "Ramon Batista", id: 435, position: "Volante" },
    { shirt: 18, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 22, name: "Matheus Sacramento", id: 452, position: "Centroavante" },
    { shirt: 9, name: "Vitinho", id: 474, position: "Centroavante" },
    { shirt: 19, name: "Lucas Silva", id: 71, position: "Atacante" },
    { shirt: 21, name: "Matheus Souza", id: 454, position: "Atacante" },
  ];

  const goals = [
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 59,
      injury: null,
      assistId: 464,
      assist: "Dudu Figueiredo",
      penalty: false,
    },
    {
      side: "opponent",
      scorer: "Alex Bruno",
      minute: 70,
      injury: null,
      penalty: false,
    },
    {
      side: "opponent",
      scorer: "Alex Bruno",
      minute: 90,
      injury: null,
      penalty: true,
    },
  ];

  const cards = [
    { id: 464, name: "Dudu Figueiredo", type: "yellow", minute: 10, injury: null },
    { id: 463, name: "Fabrício Bigode", type: "yellow", minute: 40, injury: null },
    { id: 470, name: "Caio Hila", type: "yellow", minute: 68, injury: null },
    { id: 484, name: "Rayan", type: "red", minute: 82, injury: null },
    {
      id: 432,
      name: "Camacho",
      type: "yellow",
      minute: 90,
      injury: 8,
    },
    // Vitinho R 13' omitted — no entry minute on sumula / unused bench
  ];

  const subs = [
    {
      outId: 463,
      out: "Fabrício Bigode",
      inId: 452,
      in: "Matheus Sacramento",
      minute: 66,
      injury: null,
    },
    {
      outId: 470,
      out: "Caio Hila",
      inId: 466,
      in: "Marcos Ytalo",
      minute: 79,
      injury: null,
    },
    {
      outId: 460,
      out: "Rian Santana",
      inId: 454,
      in: "Matheus Souza",
      minute: 79,
      injury: null,
    },
    {
      outId: 464,
      out: "Dudu Figueiredo",
      inId: 457,
      in: "Félix Jorge",
      minute: 90,
      injury: 2,
    },
    {
      outId: 483,
      out: "Matheus Melo",
      inId: 71,
      in: "Lucas Silva",
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
       home_away='away'
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
         VALUES ($1,'opponent',NULL,NULL,$2,$3,$4,$5,false)`,
        [MATCH_ID, g.scorer, g.minute, g.injury, g.penalty],
      );
    } else {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
            injury_time_minute, assist_lineup_id, assist_player_id, assist_name,
            is_penalty, is_own_goal)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,$9,$10,false)`,
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
          g.penalty,
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
    `SELECT side, minute, injury_time_minute, scorer_name, assist_name, is_penalty
     FROM match_goals WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  const cd = await client.query(
    `SELECT minute, injury_time_minute, player_name, card_type FROM match_cards
     WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("cards", cd.rows);
  const sb = await client.query(
    `SELECT minute, injury_time_minute, player_out_name, player_in_name
     FROM match_substitutions WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
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
  console.log("OK #1318");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
