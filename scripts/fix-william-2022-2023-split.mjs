/**
 * Split conflated player #292 "William" into two athletes:
 * - #292 William Jackson dos Santos (Defensor) → season 2023
 * - new William Fernando da Silva (Volante) → season 2022
 *
 * No match-sheet FKs exist for #292; only player_season_stats is moved.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const JACKSON_ID = 292;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, secondary_positions, birth_year, birth_date
     FROM players WHERE id = $1`,
    [JACKSON_ID],
  );
  if (!before[0]) throw new Error(`player ${JACKSON_ID} missing`);
  if (before[0].name !== "William") {
    throw new Error(`Expected name William, got ${before[0].name}`);
  }

  // 1) Create William Fernando da Silva (2022 midfielder)
  const { rows: fernandoRows } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, $4::text[], $5,
       $6, $7::date, $8, $9, $10,
       $11, $12, $13
     )
     RETURNING id, name, full_name, position, birth_date, birth_year`,
    [
      "William Fernando",
      "William Fernando da Silva",
      "Volante",
      ["Meia Esquerda"],
      "Brasil",
      1986,
      "1986-11-20",
      "São Paulo",
      "SP",
      "Brasil",
      "canhoto",
      175,
      70,
    ],
  );
  const fernandoId = fernandoRows[0].id;

  // 2) Move 2022 season row from 292 → Fernando
  const { rows: moved } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2022'
     RETURNING id, season, appearances, goals, assists`,
    [fernandoId, JACKSON_ID],
  );
  if (moved.length !== 1) {
    throw new Error(`Expected one 2022 PSS row to move, got ${moved.length}`);
  }

  // 3) Update #292 to William Jackson dos Santos (2023 defender)
  const { rows: jackson } = await client.query(
    `UPDATE players SET
       name = 'William',
       full_name = 'William Jackson dos Santos',
       position = 'Zagueiro',
       secondary_positions = '{}'::text[],
       nationality = 'Brasil',
       birth_country = 'Brasil',
       birth_year = 2003,
       birth_date = '2003-08-02'::date,
       preferred_foot = NULL,
       height_cm = NULL,
       weight_kg = NULL,
       birth_city = NULL,
       birth_state = NULL
     WHERE id = $1
     RETURNING id, name, full_name, position, birth_date, birth_year`,
    [JACKSON_ID],
  );

  // Sanity: 2023 still on Jackson; 2022 on Fernando
  const { rows: rosterCheck } = await client.query(
    `SELECT pss.season, pss.player_id, p.name, p.full_name, p.birth_date,
            CASE
              WHEN p.birth_date IS NOT NULL THEN
                EXTRACT(YEAR FROM AGE(
                  make_date(pss.season::int, 12, 31), p.birth_date::date
                ))::int
              ELSE NULL
            END AS season_age
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.player_id IN ($1, $2)
     ORDER BY pss.season, pss.player_id`,
    [JACKSON_ID, fernandoId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        williamJackson: jackson[0],
        williamFernando: fernandoRows[0],
        movedSeasonStats: moved,
        rosterCheck,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
