/**
 * Apply Copa Alagoas #1312 CRB 1x3 CSA (2026-03-18) from user sumula.
 * Venue: Ferreirão (already set). Referee: Márcio dos Santos Alves.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1312;
const STADIUM_ID = 135;
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

async function ensureReferee(name, state = "AL") {
  let { rows } = await client.query(
    `SELECT id, name FROM referees WHERE lower(name)=lower($1) LIMIT 1`,
    [name],
  );
  if (rows[0]) return rows[0];
  const all = await client.query(`SELECT id, name FROM referees`);
  const hit = all.rows.find(
    (r) =>
      r.name
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase() ===
      name
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase(),
  );
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [name, state],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

try {
  await client.query("BEGIN");

  const referee = await ensureReferee("Márcio dos Santos Alves", "AL");

  const starters = [
    { shirt: 1, name: "Arthur Silveira", id: 482, position: "Goleiro" },
    { shirt: 2, name: "Cauã Soares", id: 415, position: "Lateral Direito" },
    { shirt: 3, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
    { shirt: 4, name: "Félix Jorge", id: 457, position: "Zagueiro" },
    { shirt: 6, name: "Gustavo", id: 433, position: "Lateral Esquerdo" },
    { shirt: 5, name: "Wesley", id: 308, position: "Volante" },
    { shirt: 8, name: "Thiago Medeiros", id: 479, position: "Volante" },
    { shirt: 10, name: "Matheus Melo", id: 483, position: "Meia" },
    { shirt: 11, name: "Rian Santana", id: 460, position: "Ponta Direita" },
    { shirt: 7, name: "Robinho", id: 493, position: "Ponta Esquerda" },
    { shirt: 9, name: "Samuel Reis", id: 458, position: "Atacante" },
  ];

  const bench = [
    { shirt: 12, name: "Lucas Matheus", id: 445, position: "Goleiro" },
    { shirt: 13, name: "Calyl", id: 459, position: "Zagueiro" },
    { shirt: 14, name: "Davi Agra", id: 410, position: "Zagueiro" },
    { shirt: 16, name: "Francisco Serrate", id: 436, position: "Zagueiro" },
    { shirt: 17, name: "Gabriel Boquinha", id: 472, position: "Volante" },
    { shirt: 20, name: "Petrucio", id: 465, position: "Meia" },
    { shirt: 18, name: "Luiz Guilherme", id: 440, position: "Meia Ofensivo" },
    { shirt: 15, name: "Marcos Vinicius", id: 409, position: "Ponta Direita" },
    { shirt: 19, name: "Vitinho", id: 474, position: "Centroavante" },
  ];

  const goals = [
    {
      side: "csa",
      scorerId: 460,
      scorer: "Rian Santana",
      minute: 19,
      assistId: null,
      assist: null,
    },
    {
      side: "csa",
      scorerId: 493,
      scorer: "Robinho",
      minute: 35,
      assistId: 460,
      assist: "Rian Santana",
    },
    {
      side: "csa",
      scorerId: 474,
      scorer: "Vitinho",
      minute: 90,
      assistId: 457,
      assist: "Félix Jorge",
    },
    {
      side: "opponent",
      scorer: "David Braw",
      minute: 90,
      injury: 3,
    },
  ];

  const cards = [
    { id: 458, name: "Samuel Reis", type: "yellow", minute: 38 },
    { id: 472, name: "Gabriel Boquinha", type: "yellow", minute: 79 },
    { id: 473, name: "Marlon Lopes", type: "yellow", minute: 81 },
    // Luiz Guilherme R n/d — skipped (no minute)
  ];

  const subs = [
    {
      outId: 308,
      out: "Wesley",
      inId: 472,
      in: "Gabriel Boquinha",
      minute: 58,
    },
    {
      outId: 458,
      out: "Samuel Reis",
      inId: 440,
      in: "Luiz Guilherme",
      minute: 58,
    },
    {
      outId: 493,
      out: "Robinho",
      inId: 474,
      in: "Vitinho",
      minute: 58,
    },
    {
      outId: 479,
      out: "Thiago Medeiros",
      inId: 410,
      in: "Davi Agra",
      minute: 70,
    },
    {
      outId: 415,
      out: "Cauã Soares",
      inId: 436,
      in: "Francisco Serrate",
      minute: 75,
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
      "Rian Santana, Robinho, Vitinho",
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
    if (g.side === "opponent") {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute,
            injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'opponent',NULL,NULL,$2,$3,$4,false,false)`,
        [MATCH_ID, g.scorer, g.minute, g.injury ?? null],
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
    `SELECT side, minute, injury_time_minute, scorer_name, assist_name
     FROM match_goals WHERE match_id=$1 ORDER BY minute, coalesce(injury_time_minute,0)`,
    [MATCH_ID],
  );
  console.log("goals", gl.rows);
  const cd = await client.query(
    `SELECT minute, player_name, card_type FROM match_cards
     WHERE match_id=$1 ORDER BY minute nulls last`,
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
  console.log("OK #1312");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
