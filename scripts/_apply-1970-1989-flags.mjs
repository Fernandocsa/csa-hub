/**
 * Post-apply flags/partial fields for 1970-1989 enrichments
 * that the bio apply script cannot set (is_deceased, city without full bio).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const patches = [
  {
    id: 1031,
    sql: `UPDATE players SET is_deceased = true WHERE id = 1031 AND is_deceased = false RETURNING id, name`,
  },
  {
    id: 1769,
    sql: `UPDATE players SET is_deceased = true WHERE id = 1769 AND is_deceased = false RETURNING id, name`,
  },
  {
    id: 494,
    sql: `UPDATE players SET
      position = COALESCE(NULLIF(btrim(position), ''), 'Ponta Esquerda'),
      birth_city = COALESCE(NULLIF(btrim(birth_city), ''), 'Porto Alegre'),
      birth_state = COALESCE(NULLIF(btrim(birth_state), ''), 'RS'),
      is_deceased = true
     WHERE id = 494
     RETURNING id, name, position, birth_city, birth_state, is_deceased`,
  },
  {
    id: 1689,
    sql: `UPDATE players SET
      birth_city = COALESCE(NULLIF(btrim(birth_city), ''), 'Itabaiana'),
      birth_state = COALESCE(NULLIF(btrim(birth_state), ''), 'SE')
     WHERE id = 1689
     RETURNING id, name, birth_city, birth_state`,
  },
  {
    id: 1704,
    sql: `UPDATE players SET
      full_name = COALESCE(NULLIF(btrim(full_name), ''), 'Ademir Ferreira da Silva')
     WHERE id = 1704
     RETURNING id, name, full_name`,
  },
];

for (const p of patches) {
  const { rows } = await pool.query(p.sql);
  console.log(p.id, rows);
}

await pool.end();
