/**
 * Create missing 2017 roster players (not the 2026 Lucas Silva #71):
 * - Anderson da Costa Silva Santana (Goleiro, 1995-03-18) → 2017
 * - Dalton Alan Munaretto (Goleiro, 1986-09-08) → 2017 + 2018
 * - Lucas Rodriguez Ramos da Silva (Zagueiro, 1992-04-20) → 2017
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

async function ensureSeason(playerId, season) {
  const { rows } = await client.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1, $2, 0, 0, 0)
     ON CONFLICT (player_id, season) DO NOTHING
     RETURNING id, player_id, season, appearances, goals, assists`,
    [playerId, season],
  );
  if (rows[0]) return rows[0];
  const ex = await client.query(
    `SELECT id, player_id, season, appearances, goals, assists
     FROM player_season_stats WHERE player_id=$1 AND season=$2`,
    [playerId, season],
  );
  return { ...ex.rows[0], already: true };
}

try {
  await client.query("BEGIN");

  // Guard: do not reuse 2026 Lucas Silva
  const { rows: lucas2026 } = await client.query(
    `SELECT id, name, full_name FROM players WHERE id = 71`,
  );
  if (!lucas2026[0] || lucas2026[0].name !== "Lucas Silva") {
    throw new Error(`Expected #71 Lucas Silva, got ${JSON.stringify(lucas2026[0])}`);
  }

  const dupCheck = await client.query(
    `SELECT id, name, full_name FROM players
     WHERE full_name IN (
       'Anderson da Costa Silva Santana',
       'Dalton Alan Munaretto',
       'Lucas Rodriguez Ramos da Silva'
     )
     OR (name = 'Dalton' AND position = 'Goleiro')
     OR (name = 'Anderson' AND position = 'Goleiro')`,
  );
  if (dupCheck.rows.length) {
    throw new Error(`Already exists: ${JSON.stringify(dupCheck.rows)}`);
  }

  const { rows: andersonRows } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, '{}'::text[], $4,
       $5, $6::date, $7, $8, $9,
       $10, $11, $12
     )
     RETURNING id, name, full_name, position, birth_date, birth_year`,
    [
      "Anderson",
      "Anderson da Costa Silva Santana",
      "Goleiro",
      "Brasil",
      1995,
      "1995-03-18",
      null,
      null,
      "Brasil",
      "destro",
      null,
      null,
    ],
  );

  const { rows: daltonRows } = await client.query(
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
      "Dalton",
      "Dalton Alan Munaretto",
      "Goleiro",
      "Brasil",
      1986,
      "1986-09-08",
      "Chapecó",
      "SC",
      "Brasil",
      "destro",
      198,
      90,
    ],
  );

  const { rows: lucasRows } = await client.query(
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
               height_cm, weight_kg`,
    [
      "Lucas Silva",
      "Lucas Rodriguez Ramos da Silva",
      "Zagueiro",
      "Brasil",
      1992,
      "1992-04-20",
      null,
      null,
      "Brasil",
      null,
      189,
      78,
    ],
  );

  const anderson = andersonRows[0];
  const dalton = daltonRows[0];
  const lucas = lucasRows[0];

  const roster = {
    anderson2017: await ensureSeason(anderson.id, "2017"),
    dalton2017: await ensureSeason(dalton.id, "2017"),
    dalton2018: await ensureSeason(dalton.id, "2018"),
    lucas2017: await ensureSeason(lucas.id, "2017"),
  };

  const { rows: ages } = await client.query(
    `SELECT pss.season, p.id, p.name, p.full_name, p.position,
            EXTRACT(YEAR FROM AGE(
              make_date(pss.season::int, 12, 31), p.birth_date::date
            ))::int AS season_age
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE p.id = ANY($1::int[])
     ORDER BY p.id, pss.season`,
    [[anderson.id, dalton.id, lucas.id]],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        distinctFromLucas2026: lucas2026[0],
        anderson,
        dalton,
        lucas2017: lucas,
        roster,
        ages,
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
