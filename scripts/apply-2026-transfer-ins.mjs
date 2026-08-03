import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const ins = [
  { name: "Everton Heleno", playerId: 104, club: "Sousa", transferType: null },
  { name: "Yago Oliveira", playerId: 477, club: "Volta Redonda", transferType: null },
  { name: "Amorim", playerId: 467, club: "CA Votuporanguense", transferType: "empréstimo" },
  { name: "Mikael", playerId: 475, club: "XV de Jaú", transferType: null },
  { name: "Lucas Lima", playerId: 476, club: "Marília", transferType: null },
  { name: "Lucas Silva", playerId: 71, club: "Boavista-RJ", transferType: null },
];

try {
  await client.query("BEGIN");
  let inserted = 0;
  let skipped = 0;
  for (const row of ins) {
    const exists = await client.query(
      `SELECT id FROM transfers
       WHERE player_id = $1 AND season = '2026' AND direction = 'in'
         AND coalesce(club,'') = $2
       LIMIT 1`,
      [row.playerId, row.club],
    );
    if (exists.rows[0]) {
      console.log("SKIP", row.name, "←", row.club);
      skipped++;
      continue;
    }
    const r = await client.query(
      `INSERT INTO transfers (player_id, direction, club, season, transfer_type)
       VALUES ($1, 'in', $2, '2026', $3)
       RETURNING id`,
      [row.playerId, row.club, row.transferType],
    );
    console.log(
      "OK",
      r.rows[0].id,
      row.name,
      "←",
      row.club,
      row.transferType ? `(${row.transferType})` : "",
    );
    inserted++;
  }
  await client.query("COMMIT");
  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
