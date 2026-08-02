/**
 * Fix CSA sheet for #1307 CRB 2x0 CSA SF Ida (2026-02-18) from user sumula.
 * Keeps opponent lineups/goals/cards/subs.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1307;
const MANAGER_ID = 36; // Itamar Schülle
const REFEREE_ID = 74; // Ramon Abatti Abel

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
  { shirt: 1, name: "Wellerson", id: 471, position: "Goleiro" },
  { shirt: 17, name: "Marcos Ytalo", id: 466, position: "Lateral Direito" },
  { shirt: 3, name: "Lucão", id: 486, position: "Zagueiro" },
  { shirt: 4, name: "Rayan", id: 484, position: "Zagueiro" },
  { shirt: 6, name: "Kaike", id: 455, position: "Lateral Esquerdo" },
  { shirt: 5, name: "Kayllan", id: 453, position: "Volante" },
  { shirt: 8, name: "Fabrício Bigode", id: 463, position: "Volante" },
  { shirt: 10, name: "Dudu Figueiredo", id: 464, position: "Meia Ofensivo" },
  { shirt: 11, name: "Buba", id: 480, position: "Centroavante" },
  { shirt: 99, name: "Ciel", id: 447, position: "Centroavante" },
  { shirt: 7, name: "Matheus Souza", id: 454, position: "Atacante" },
];

const bench = [
  { shirt: 12, name: "Arthur Silveira", id: 482, position: "Goleiro" },
  { shirt: 27, name: "Lucas Serafini", id: 469, position: "Lateral Direito" },
  { shirt: 13, name: "Marlon Lopes", id: 473, position: "Zagueiro" },
  { shirt: 16, name: "Félix Jorge", id: 457, position: "Zagueiro" },
  { shirt: 14, name: "Ramon Batista", id: 435, position: "Volante" },
  { shirt: 15, name: "Renato Pitbull", id: 461, position: "Volante" },
  { shirt: 18, name: "Igor Guilherme", id: 456, position: "Volante" },
  { shirt: 20, name: "Matheus Melo", id: 483, position: "Meia" },
  { shirt: 22, name: "Ronaldo Mendes", id: 468, position: "Meia" },
  { shirt: 25, name: "Rian Santana", id: 460, position: "Ponta Direita" },
  { shirt: 21, name: "Robinho", id: 493, position: "Ponta Esquerda" },
  { shirt: 19, name: "Samuel Reis", id: 458, position: "Atacante" },
];

const cards = [
  { id: 466, name: "Marcos Ytalo", type: "yellow", minute: 1 },
];

const subs = [
  {
    outId: 466,
    out: "Marcos Ytalo",
    inId: 460,
    in: "Rian Santana",
    minute: 68,
  },
  {
    outId: 454,
    out: "Matheus Souza",
    inId: 468,
    in: "Ronaldo Mendes",
    minute: 68,
  },
  {
    outId: 464,
    out: "Dudu Figueiredo",
    inId: 483,
    in: "Matheus Melo",
    minute: 76,
  },
  {
    outId: 468,
    out: "Ronaldo Mendes",
    inId: 493,
    in: "Robinho",
    minute: 76,
  },
  {
    outId: 480,
    out: "Buba",
    inId: 458,
    in: "Samuel Reis",
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
    `UPDATE matches SET manager_id=$2, referee_id=$3, scorers=NULL WHERE id=$1`,
    [MATCH_ID, MANAGER_ID, REFEREE_ID],
  );

  await client.query(
    `DELETE FROM match_goals WHERE match_id=$1 AND side='csa'`,
    [MATCH_ID],
  );
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
    const { rows } = await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5,$6) RETURNING id`,
      [MATCH_ID, p.id, p.name, p.shirt, p.position, sort++],
    );
    lineupIds.set(p.id, rows[0].id);
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
  const cd = await client.query(
    `SELECT minute, player_name, card_type FROM match_cards
     WHERE match_id=$1 AND side='csa' ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("cards", cd.rows);
  const sb = await client.query(
    `SELECT minute, player_out_name, player_in_name FROM match_substitutions
     WHERE match_id=$1 AND side='csa' ORDER BY minute`,
    [MATCH_ID],
  );
  console.log("subs", sb.rows);
  console.log("OK #1307");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
