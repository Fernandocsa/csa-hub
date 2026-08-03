import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

/** @type {{ name: string, playerId?: number, club: string, transferType: string | null }[]} */
const outs = [
  { name: "Matheus Sacramento", playerId: 452, club: "Mamoré", transferType: null },
  { name: "Felipe Rodrigues", playerId: 481, club: "Joinville", transferType: "empréstimo" },
  { name: "Cauã Soares", playerId: 415, club: "Santo André", transferType: "empréstimo" },
  { name: "Luiz Guilherme", playerId: 440, club: "Juventus Jaraguá", transferType: "empréstimo" },
  { name: "Lucas Serafini", playerId: 469, club: "Altos", transferType: null },
  { name: "Robinho", playerId: 493, club: "GE Brasil", transferType: null },
  { name: "Samuel Reis", playerId: 458, club: "GE Brasil", transferType: null },
  { name: "Ciel", playerId: 447, club: "Ferroviário", transferType: null },
  { name: "Wanderson", playerId: 441, club: "Juazeirense", transferType: "empréstimo" },
  { name: "Lucas Matheus", playerId: 445, club: "Treze", transferType: null },
  { name: "Igor Guilherme", playerId: 456, club: "São José-RS", transferType: null },
  { name: "Elvis", playerId: 355, club: "KF Trepça'89", transferType: null },
  { name: "Buba", playerId: 480, club: "Treze", transferType: null },
  { name: "Luquinhas", playerId: 478, club: "Atlético Piauiense", transferType: null },
  { name: "Matheus Mega", playerId: 390, club: "Rio Branco-ES", transferType: null },
  { name: "Pedro Manoel", club: "CSE", transferType: null },
  { name: "Enzo Santos", playerId: 414, club: "Athletic-MG", transferType: "empréstimo" },
];

try {
  await client.query("BEGIN");

  // Create Pedro Manoel if missing
  for (const row of outs) {
    if (row.playerId) continue;
    const found = await client.query(
      `SELECT id FROM players WHERE name ILIKE $1 LIMIT 1`,
      [row.name],
    );
    if (found.rows[0]) {
      row.playerId = found.rows[0].id;
      console.log("Found existing", row.name, row.playerId);
    } else {
      const created = await client.query(
        `INSERT INTO players (name) VALUES ($1) RETURNING id, name`,
        [row.name],
      );
      row.playerId = created.rows[0].id;
      console.log("Created player", created.rows[0]);
    }
  }

  let inserted = 0;
  let skipped = 0;
  for (const row of outs) {
    const exists = await client.query(
      `SELECT id FROM transfers
       WHERE player_id = $1 AND season = '2026' AND direction = 'out'
         AND coalesce(club,'') = $2
       LIMIT 1`,
      [row.playerId, row.club],
    );
    if (exists.rows[0]) {
      console.log("SKIP duplicate", row.name, "→", row.club);
      skipped++;
      continue;
    }
    const r = await client.query(
      `INSERT INTO transfers (player_id, direction, club, season, transfer_type)
       VALUES ($1, 'out', $2, '2026', $3)
       RETURNING id`,
      [row.playerId, row.club, row.transferType],
    );
    console.log(
      "OK",
      r.rows[0].id,
      row.name,
      "→",
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
