/**
 * Fix birth_state typos: BH (Belo Horizonte) → MG
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const { rows: before } = await pool.query(`
  SELECT id, name, birth_city, birth_state
  FROM players
  WHERE upper(trim(birth_state)) = 'BH'
  ORDER BY id
`);
console.log("before", before);

const { rowCount } = await pool.query(`
  UPDATE players
  SET birth_state = 'MG'
  WHERE upper(trim(birth_state)) = 'BH'
`);
console.log("updated", rowCount);

const { rows: mg } = await pool.query(`
  SELECT count(*)::int AS n FROM players WHERE upper(trim(birth_state)) = 'MG'
`);
console.log("MG total", mg[0].n);

await pool.end();
