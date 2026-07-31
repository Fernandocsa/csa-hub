/**
 * 1) Update #213 João Victor → João Victor Da Silva Rocha (2002)
 *    Seasons already linked: 2020, 2021, 2023 (2022 was youth/base — no senior row)
 * 2) Create João Victor Cunha Borges (1994 Centroavante) and add to 2019 roster
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SILVA_ROCHA_ID = 213;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [SILVA_ROCHA_ID],
  );
  if (!before[0] || before[0].name !== "João Victor") {
    throw new Error(`Expected João Victor #213, got ${JSON.stringify(before[0])}`);
  }

  // 1) Profile: João Victor Da Silva Rocha
  const { rows: silvaRocha } = await client.query(
    `UPDATE players SET
       name = 'João Victor',
       full_name = 'João Victor Da Silva Rocha',
       position = 'Meia Central',
       secondary_positions = ARRAY['Meia Ofensivo']::text[],
       nationality = 'Brasil',
       birth_year = 2002,
       birth_date = '2002-01-11'::date,
       birth_city = 'Suzano',
       birth_state = 'SP',
       birth_country = 'Brasil',
       preferred_foot = 'destro',
       height_cm = 186,
       weight_kg = NULL
     WHERE id = $1
     RETURNING id, name, full_name, position, secondary_positions,
               birth_date, birth_year, birth_city, birth_state,
               preferred_foot, height_cm`,
    [SILVA_ROCHA_ID],
  );

  const { rows: silvaSeasons } = await client.query(
    `SELECT season, appearances, goals,
            EXTRACT(YEAR FROM AGE(
              make_date(season::int, 12, 31), '2002-01-11'::date
            ))::int AS season_age
     FROM player_season_stats WHERE player_id = $1 ORDER BY season`,
    [SILVA_ROCHA_ID],
  );

  // Ensure no accidental 2022 senior row (base only)
  const has2022 = silvaSeasons.some((s) => s.season === "2022");
  if (has2022) {
    throw new Error("Unexpected senior 2022 row for João Victor #213 (was base)");
  }

  // 2) Create João Victor Cunha Borges (2019)
  const { rows: cunha } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, '{}'::text[], $4,
       $5, $6::date, $7, $8, $9,
       $10, $11, $12
     )
     RETURNING id, name, full_name, position, birth_date, birth_year,
               birth_city, birth_state, preferred_foot, height_cm, weight_kg`,
    [
      "João Victor",
      "João Victor Cunha Borges",
      "Centroavante",
      "Brasil",
      1994,
      "1994-12-07",
      "São Carlos",
      "SP",
      "Brasil",
      "destro",
      183,
      80,
    ],
  );
  const cunhaId = cunha[0].id;

  const { rows: cunha2019 } = await client.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1, '2019', 0, 0, 0)
     ON CONFLICT (player_id, season) DO NOTHING
     RETURNING id, player_id, season, appearances, goals, assists`,
    [cunhaId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        silvaRocha: silvaRocha[0],
        silvaRochaSeasons: silvaSeasons,
        note2022: "No senior roster row — base only in 2022",
        cunhaBorges: cunha[0],
        cunha2019: cunha2019[0] ?? "already existed",
        distinctFrom: {
          id: 24,
          name: "João Vitor",
          note: "Different spelling; Meia on 2019 roster (20J)",
        },
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
