/**
 * Fill profile for #63 Raul (2017 lateral) = Raul Diogo Souza Rocha.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const ID = 63;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, secondary_positions, birth_year, birth_date,
            birth_city, birth_state, preferred_foot, height_cm, weight_kg
     FROM players WHERE id = $1`,
    [ID],
  );
  if (!before[0]) throw new Error(`player ${ID} missing`);
  if (before[0].name !== "Raul") {
    throw new Error(`Expected Raul, got ${before[0].name}`);
  }

  const { rows: seasons } = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats WHERE player_id = $1`,
    [ID],
  );
  if (!seasons.some((s) => s.season === "2017") || seasons.some((s) => s.season !== "2017")) {
    throw new Error(`Expected only 2017 season, got ${JSON.stringify(seasons)}`);
  }

  const { rows: after } = await client.query(
    `UPDATE players SET
       full_name = 'Raul Diogo Souza Rocha',
       position = 'Lateral Esquerdo',
       secondary_positions = ARRAY['Meia Esquerda']::text[],
       nationality = 'Brasil',
       birth_year = 1985,
       birth_date = '1985-11-09'::date,
       birth_city = 'Poço Verde',
       birth_state = 'SE',
       birth_country = 'Brasil',
       preferred_foot = 'canhoto',
       height_cm = 170,
       weight_kg = 74
     WHERE id = $1
     RETURNING id, name, full_name, position, secondary_positions,
               birth_date, birth_year, birth_city, birth_state,
               preferred_foot, height_cm, weight_kg`,
    [ID],
  );

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, before: before[0], after: after[0], seasons }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
