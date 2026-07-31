/**
 * Set Edinho #610 (Francisco Edson Moreira da Silva) position to Ponta Esquerda.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const EDINHO_2017_ID = 610;

try {
  const { rows } = await client.query(
    `UPDATE players SET
       position = 'Ponta Esquerda',
       secondary_positions = '{}'::text[]
     WHERE id = $1 AND full_name = 'Francisco Edson Moreira da Silva'
     RETURNING id, name, full_name, position, secondary_positions`,
    [EDINHO_2017_ID],
  );
  if (rows.length !== 1) {
    throw new Error(`Expected update of #610, got ${JSON.stringify(rows)}`);
  }
  console.log(JSON.stringify({ ok: true, player: rows[0] }, null, 2));
} finally {
  client.release();
  await pool.end();
}
