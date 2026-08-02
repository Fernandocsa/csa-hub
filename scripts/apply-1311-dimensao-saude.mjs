/**
 * Apply Copa Alagoas #1311 CSA 4x0 Dimensão Saúde (2026-03-05) from user sumula.
 * Venue: Estádio Ferreirão (São Miguel dos Campos) — confirmed by Gazeta/GE.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1311;
const STADIUM_ID = 135; // Ferreirão
const MANAGER_ID = 70; // Rodrigo Ramos

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

async function ensurePlayer(name, position = null) {
  const { rows } = await client.query(
    `SELECT id, name FROM players WHERE lower(name)=lower($1) ORDER BY id LIMIT 1`,
    [name],
  );
  if (rows[0]) return rows[0];
  const ins = await client.query(
    `INSERT INTO players (name, nationality, position, verification_status)
     VALUES ($1,'Brasil',$2,'unverified') RETURNING id, name`,
    [name, position],
  );
  console.log(`created player #${ins.rows[0].id} ${ins.rows[0].name}`);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const caio = await ensurePlayer("Caio Leandro", "Volante");

  const starters = [
    { shirt: 1, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 2, name: "Davi Agra", id: 410, position: "Lateral Direito" },
    { shirt: 3, name: "Cauã Soares", id: 415, position: "Zagueiro" },
    { shirt: 4, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 6, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Felipe Rodrigues", id: 481, position: "Volante" },
    { shirt: 8, name: "Thiago Medeiros", id: 479, position: "Volante" },
    { shirt: 7, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 10, name: "Luiz Guilherme", id: 440, position: "Meia Ofensivo" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
    { shirt: 9, name: "Vitinho", id: 474, position: "Centroavante" },
  ];

  const bench = [
    { shirt: 12, name: "Lucas Matheus", id: 445, position: "Goleiro" },
    { shirt: 13, name: "Calyl", id: 459, position: "Zagueiro" },
    { shirt: 14, name: "Francisco Serrate", id: 436, position: "Zagueiro" },
    { shirt: 15, name: "Caio Leandro", id: caio.id, position: "Volante" },
    { shirt: 18, name: "Gabriel Boquinha", id: 472, position: "Volante" },
    { shirt: 17, name: "Petrucio", id: 465, position: "Meia" },
    { shirt: 16, name: "Marcos Vinicius", id: 409, position: "Ponta Direita" },
  ];

  // Minutes: Vitinho 86', Rian 90', Calyl 90+3', own goal Gleison ~68' (23' 2T)
  const goals = [
    {
      type: "own",
      scorer: "Gleison",
      minute: 68,
      injury: null,
      assistId: 433,
      assist: "Gustavo",
    },
    {
      type: "csa",
      scorerId: 474,
      scorer: "Vitinho",
      minute: 86,
      injury: null,
      assistId: 460,
      assist: "Rian Santana",
    },
    {
      type: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 90,
      injury: null,
      assistId: 440,
      assist: "Luiz Guilherme",
    },
    {
      type: "csa",
      scorerId: 459,
      scorer: "Calyl",
      minute: 90,
      injury: 3,
      assistId: 472,
      assist: "Gabriel Boquinha",
    },
  ];

  const cards = [
    { id: 481, name: "Felipe Rodrigues", type: "yellow", minute: 41 },
    { id: 440, name: "Luiz Guilherme", type: "yellow", minute: 64 },
    { id: 465, name: "Petrucio", type: "yellow", minute: 85 },
  ];

  const subs = [
    {
      outId: 481,
      out: "Felipe Rodrigues",
      inId: 465,
      in: "Petrucio",
      minute: 46,
      injury: null,
    },
    {
      outId: 479,
      out: "Thiago Medeiros",
      inId: 472,
      in: "Gabriel Boquinha",
      minute: 66,
      injury: null,
    },
    {
      outId: 410,
      out: "Davi Agra",
      inId: 459,
      in: "Calyl",
      minute: 75,
      injury: null,
    },
    {
      outId: 433,
      out: "Gustavo",
      inId: 436,
      in: "Francisco Serrate",
      minute: 90,
      injury: 3,
    },
    {
      outId: 460,
      out: "Rian Santana",
      inId: 409,
      in: "Marcos Vinicius",
      minute: 90,
      injury: 3,
    },
  ];

  await client.query(
    `UPDATE matches SET
       stadium_id=$2,
       manager_id=$3,
       scorers=$4,
       own_goals_for_count=1,
       home_away='home'
     WHERE id=$1`,
    [
      MATCH_ID,
      STADIUM_ID,
      MANAGER_ID,
      "Gleison (gc), Vitinho, Rian Santana, Calyl",
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
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5,$6) RETURNING id`,
      [MATCH_ID, p.id, p.name, p.shirt, p.position, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
  }

  for (const g of goals) {
    if (g.type === "own") {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
            injury_time_minute, assist_lineup_id, assist_player_id, assist_name,
            is_penalty, is_own_goal, own_goal_direction)
         VALUES ($1,'csa',NULL,NULL,$2,$3,$4,$5,$6,$7,false,true,'for')`,
        [
          MATCH_ID,
          g.scorer,
          g.minute,
          g.injury,
          g.assistId ? lineupIds.get(g.assistId) ?? null : null,
          g.assistId,
          g.assist,
        ],
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
         (match_id, side, card_type, lineup_id, player_id, player_name, minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6)`,
      [MATCH_ID, c.type, lineupIds.get(c.id) ?? null, c.id, c.name, c.minute],
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
    `SELECT minute, injury_time_minute, scorer_name, assist_name, is_own_goal, own_goal_direction
     FROM match_goals WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
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
    `SELECT minute, injury_time_minute, player_out_name, player_in_name
     FROM match_substitutions WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("subs", sb.rows);
  const meta = await client.query(
    `SELECT m.id, s.name AS stadium, mg.name AS manager, m.scorers, m.own_goals_for_count
     FROM matches m
     LEFT JOIN stadiums s ON s.id=m.stadium_id
     LEFT JOIN managers mg ON mg.id=m.manager_id
     WHERE m.id=$1`,
    [MATCH_ID],
  );
  console.log("meta", meta.rows[0]);
  console.log("OK #1311");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
