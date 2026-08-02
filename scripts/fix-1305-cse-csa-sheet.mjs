/**
 * Fix CSA sheet for #1305 CSE 0x1 CSA (2026-02-01) from user sumula.
 * Keeps opponent lineups, goals, cards, substitutions (player ids).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const MATCH_ID = 1305;

const starters = [
  { shirt: 1, name: "Wellerson", id: 471 },
  { shirt: 17, name: "Marcos Ytalo", id: 466 },
  { shirt: 3, name: "Lucão", id: 486 },
  { shirt: 4, name: "Rayan", id: 484 },
  { shirt: 6, name: "Kaike", id: 455 },
  { shirt: 5, name: "Kayllan", id: 453 },
  { shirt: 10, name: "Dudu Figueiredo", id: 464 },
  { shirt: 8, name: "Fabrício Bigode", id: 463 },
  { shirt: 11, name: "Buba", id: 480 },
  { shirt: 99, name: "Ciel", id: 447 },
  { shirt: 7, name: "Matheus Souza", id: 454 },
];

const bench = [
  { shirt: 12, name: "Arthur Silveira", id: 482 },
  { shirt: 27, name: "Lucas Serafini", id: 469 },
  { shirt: 16, name: "Félix Jorge", id: 457 },
  { shirt: 14, name: "Ramon Batista", id: 435 },
  { shirt: 15, name: "Renato Pitbull", id: 461 },
  { shirt: 18, name: "Igor Guilherme", id: 456 },
  { shirt: 20, name: "Matheus Melo", id: 483 },
  { shirt: 22, name: "Ronaldo Mendes", id: 468 },
  { shirt: 13, name: "Wesley", id: 308 },
  { shirt: 19, name: "Samuel Reis", id: 458 },
  { shirt: 2, name: "Rian Santana", id: 460 },
  { shirt: 21, name: "Robinho", id: 493 },
];

try {
  await client.query("BEGIN");

  // Ensure manager
  const mgr = await client.query(
    `SELECT id FROM managers WHERE name ILIKE 'Itamar%' ORDER BY id LIMIT 1`,
  );
  if (mgr.rows[0]) {
    await client.query(`UPDATE matches SET manager_id=$2 WHERE id=$1`, [
      MATCH_ID,
      mgr.rows[0].id,
    ]);
  }

  await client.query(
    `DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`,
    [MATCH_ID],
  );

  let sort = 0;
  for (const p of starters) {
    await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, sort_order)
       VALUES ($1,'csa',$2,$3,'starter',$4,$5)`,
      [MATCH_ID, p.id, p.name, p.shirt, sort++],
    );
  }
  for (const p of bench) {
    await client.query(
      `INSERT INTO match_lineups
         (match_id, side, player_id, player_name, role, shirt_number, sort_order)
       VALUES ($1,'csa',$2,$3,'bench',$4,$5)`,
      [MATCH_ID, p.id, p.name, p.shirt, sort++],
    );
  }

  // Normalize names on events
  await client.query(
    `UPDATE match_substitutions SET player_in_name='Fabrício Bigode'
     WHERE match_id=$1 AND player_in_id=463`,
    [MATCH_ID],
  );
  await client.query(
    `UPDATE match_substitutions SET player_out_name='Fabrício Bigode'
     WHERE match_id=$1 AND player_out_id=463`,
    [MATCH_ID],
  );
  await client.query(
    `UPDATE match_substitutions SET player_in_name='Samuel Reis'
     WHERE match_id=$1 AND player_in_id=458`,
    [MATCH_ID],
  );

  await client.query("COMMIT");

  const check = await client.query(
    `SELECT role, shirt_number, player_name FROM match_lineups
     WHERE match_id=$1 AND side='csa'
     ORDER BY sort_order`,
    [MATCH_ID],
  );
  console.log("CSA lineup updated:");
  for (const r of check.rows) {
    console.log(`  ${r.role} #${r.shirt_number} ${r.player_name}`);
  }
  const counts = await client.query(
    `SELECT
       (SELECT count(*) FROM match_lineups WHERE match_id=$1 AND side='csa' AND role='starter') AS starters,
       (SELECT count(*) FROM match_lineups WHERE match_id=$1 AND side='csa' AND role='bench') AS bench,
       (SELECT count(*) FROM match_goals WHERE match_id=$1) AS goals,
       (SELECT count(*) FROM match_cards WHERE match_id=$1 AND side='csa') AS cards,
       (SELECT count(*) FROM match_substitutions WHERE match_id=$1 AND side='csa') AS subs`,
    [MATCH_ID],
  );
  console.log(counts.rows[0]);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
