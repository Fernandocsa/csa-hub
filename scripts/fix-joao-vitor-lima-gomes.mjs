/**
 * Fill profile for #24 João Vitor = João Vitor Lima Gomes (2019 Meia/Volante).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const ID = 24;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, secondary_positions, birth_year, birth_date,
            birth_city, birth_state, preferred_foot, height_cm, weight_kg
     FROM players WHERE id = $1`,
    [ID],
  );
  if (!before[0]) throw new Error(`player ${ID} missing`);
  if (before[0].name !== "João Vitor") {
    throw new Error(`Expected João Vitor, got ${before[0].name}`);
  }

  const { rows: seasons } = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats WHERE player_id = $1 ORDER BY season`,
    [ID],
  );

  const { rows: after } = await client.query(
    `UPDATE players SET
       full_name = 'João Vitor Lima Gomes',
       position = 'Volante',
       secondary_positions = ARRAY['Lateral Direito']::text[],
       nationality = 'Brasil',
       birth_year = 1988,
       birth_date = '1988-06-01'::date,
       birth_city = 'Maceió',
       birth_state = 'AL',
       birth_country = 'Brasil',
       preferred_foot = 'destro',
       height_cm = 176,
       weight_kg = 66
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
