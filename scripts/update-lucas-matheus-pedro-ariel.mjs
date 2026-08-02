/**
 * Update bios: Lucas Matheus (#445) and Pedro Ariel (#1667).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const lucas = await client.query(
    `UPDATE players SET
       full_name = $2,
       position = 'Goleiro',
       preferred_foot = 'destro',
       birth_date = $3,
       birth_year = 2003,
       birth_state = 'AL',
       birth_country = 'Brasil',
       nationality = 'Brasil',
       nationality_flag = '🇧🇷',
       height_cm = 186,
       weight_kg = 68
     WHERE id = $1
     RETURNING id, name, full_name, birth_date, birth_state, height_cm, weight_kg, preferred_foot`,
    [445, "Lucas Matheus Pedro da Silva", "2003-02-28"],
  );

  const pedro = await client.query(
    `UPDATE players SET
       full_name = $2,
       position = 'Goleiro',
       preferred_foot = 'destro',
       birth_date = $3,
       birth_year = 2007,
       birth_country = 'Brasil',
       nationality = 'Brasil',
       nationality_flag = '🇧🇷',
       height_cm = 182,
       weight_kg = 83
     WHERE id = $1
     RETURNING id, name, full_name, birth_date, birth_country, height_cm, weight_kg, preferred_foot`,
    [1667, "Pedro Ariel Silva dos Santos", "2007-12-20"],
  );

  await client.query("COMMIT");
  console.log("Lucas Matheus", lucas.rows[0]);
  console.log("Pedro Ariel", pedro.rows[0]);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
