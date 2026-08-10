/**
 * Apply CBF registrations + shirt numbers for CSA x Santa Rita (28/01/2015),
 * and upsert technical commission members with professional registries.
 *
 * Usage: node scripts/apply-2015-01-28-santa-rita-sheet.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const MATCH_ID = 1338;
const SEASON = "2015";

/** shirt → { playerId, fullName, cbf } from current lineup probe + user sheet */
const PLAYERS = [
  { shirt: 1, playerId: 82, fullName: "Jeferson Gomes do Nascimento", cbf: "165400" },
  { shirt: 2, playerId: 114, fullName: "José Romário Barbosa de Oliveira", cbf: "392794" },
  { shirt: 3, playerId: 1191, fullName: "Breno Thiago Gadelha Silva", cbf: "164325" },
  { shirt: 4, playerId: 1192, fullName: "Samuel Teram", cbf: "173576" },
  { shirt: 5, playerId: 1193, fullName: "Thiago de Freitas Conceição", cbf: "164429" },
  { shirt: 6, playerId: 1197, fullName: "Manoel Afonso Junior", cbf: "306188" },
  { shirt: 7, playerId: 1194, fullName: "Fabiano da Silva", cbf: "165530" },
  { shirt: 8, playerId: 1195, fullName: "Elyeser Maciel da Silva", cbf: "333676" },
  { shirt: 9, playerId: 626, fullName: "Damião Viturino de Lima", cbf: "402787" },
  { shirt: 10, playerId: 1196, fullName: "José Paulo dos Santos", cbf: "169694" },
  { shirt: 11, playerId: 1198, fullName: "Rafael Menezes da Cruz", cbf: "175828" },
  { shirt: 12, playerId: 2317, fullName: "João Paulo Azevedo Barbosa", cbf: "142940" },
  { shirt: 13, playerId: 1815, fullName: "José Sergio Alves do Bonfim Junior", cbf: "408939" },
  { shirt: 14, playerId: 95, fullName: "Marcelo Augusto Silva de Lima", cbf: "326858" },
  { shirt: 15, playerId: 2315, fullName: "José Williams dos Santos", cbf: "402552" },
  { shirt: 16, playerId: 2314, fullName: "Vitor Lins Barbosa", cbf: "409292" },
  { shirt: 17, playerId: 2316, fullName: "Edmilson Andrade da Silva", cbf: "410073" },
  { shirt: 18, playerId: 1213, fullName: "Romário Santos de Oliveira", cbf: "408706" },
];

const STAFF = [
  {
    role: "manager",
    name: "Bagé",
    fullName: "Ronaldo Rodrigues Rangel",
    registrationType: "CREF",
    registrationNumber: "94720-P/RS",
  },
  {
    role: "assistant",
    name: "Jairo Carreiro",
    fullName: "Jairo dos Santos Carreiro",
    registrationType: "RG/PE",
    registrationNumber: "856905",
  },
  {
    role: "fitness",
    name: "Bruno Nunes",
    fullName: "Bruno Nunes",
    registrationType: "RG/RS",
    registrationNumber: "1083034114",
  },
  {
    role: "doctor",
    name: "Nehemias Alencar",
    fullName: "Nehemias Rodrigues Alencar Neto",
    registrationType: "CRM/AL",
    registrationNumber: "6320",
  },
  {
    role: "masseur",
    name: "Dorgival Costa",
    fullName: "Dorgival Costa da Silva",
    registrationType: "RG/AL",
    registrationNumber: "355314",
  },
];

async function upsertStaff(client, s) {
  // Prefer full legal name — display nicknames (ex.: Bagé) must not create duplicates.
  const { rows: byFull } = await client.query(
    `SELECT id FROM managers
     WHERE staff_role = $1
       AND lower(coalesce(full_name,'')) = lower($2)
     ORDER BY id
     LIMIT 1`,
    [s.role, s.fullName],
  );
  if (byFull[0]) {
    const id = byFull[0].id;
    await client.query(
      `UPDATE managers
       SET name = $2,
           full_name = $3,
           registration_type = $4,
           registration_number = $5,
           staff_role = $6
       WHERE id = $1`,
      [id, s.name, s.fullName, s.registrationType, s.registrationNumber, s.role],
    );
    return id;
  }
  const { rows: byName } = await client.query(
    `SELECT id FROM managers
     WHERE staff_role = $1 AND lower(name) = lower($2)
     ORDER BY id LIMIT 1`,
    [s.role, s.name],
  );
  if (byName[0]) {
    const id = byName[0].id;
    await client.query(
      `UPDATE managers
       SET full_name = COALESCE(full_name, $2),
           registration_type = $3,
           registration_number = $4
       WHERE id = $1`,
      [id, s.fullName, s.registrationType, s.registrationNumber],
    );
    return id;
  }
  const { rows } = await client.query(
    `INSERT INTO managers (
       name, full_name, nationality, staff_role,
       registration_type, registration_number, verification_status
     ) VALUES ($1,$2,'Brasil',$3,$4,$5,'unverified')
     RETURNING id`,
    [s.name, s.fullName, s.role, s.registrationType, s.registrationNumber],
  );
  return rows[0].id;
}

async function ensureSeason(client, managerId) {
  await client.query(
    `INSERT INTO manager_season_stats (manager_id, season, games, wins, draws, losses, goals_for, goals_against, stats_source)
     VALUES ($1, $2, 0, 0, 0, 0, 0, 0, 'manual')
     ON CONFLICT (manager_id, season) DO NOTHING`,
    [managerId, SEASON],
  );
}

const client = await pool.connect();
try {
  await client.query("BEGIN");

  const { rows: matchRows } = await client.query(
    `SELECT id, opponent_id FROM matches WHERE id = $1 AND match_date = '2015-01-28'`,
    [MATCH_ID],
  );
  if (!matchRows[0]) throw new Error(`Match ${MATCH_ID} on 2015-01-28 not found`);

  for (const p of PLAYERS) {
    await client.query(
      `UPDATE players
       SET cbf_registration = $2,
           full_name = COALESCE(NULLIF(btrim(full_name), ''), $3)
       WHERE id = $1`,
      [p.playerId, p.cbf, p.fullName],
    );
    // Prefer setting full_name to the sheet value when empty or close
    await client.query(
      `UPDATE players SET full_name = $2 WHERE id = $1`,
      [p.playerId, p.fullName],
    );
    const { rowCount } = await client.query(
      `UPDATE match_lineups
       SET shirt_number = $3
       WHERE match_id = $1 AND side = 'csa' AND player_id = $2`,
      [MATCH_ID, p.playerId, p.shirt],
    );
    if (!rowCount) {
      console.warn(`No lineup row for player ${p.playerId} (#${p.shirt}) on match ${MATCH_ID}`);
    }
  }

  const staffIds = {};
  for (const s of STAFF) {
    const id = await upsertStaff(client, s);
    staffIds[s.role] = id;
    await ensureSeason(client, id);
    console.log(`${s.role}: #${id} ${s.fullName}`);
  }

  // Head coach on the match sheet
  await client.query(`UPDATE matches SET manager_id = $2 WHERE id = $1`, [
    MATCH_ID,
    staffIds.manager,
  ]);

  await client.query("COMMIT");
  console.log("OK — CBF, shirts, staff applied for match", MATCH_ID);
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
