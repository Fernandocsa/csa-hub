/**
 * Apply partial manager fields that don't meet full enrichment gate
 * (e.g. full_name only when birth_date unknown).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();

const patches = [
  {
    id: 72,
    full_name: "Dorian Gray Sobrinho de Melo Junior",
    nationality: "Brasil",
    birth_country: "Brasil",
  },
  {
    id: 68,
    full_name: "José Marlon Araújo dos Santos Júnior",
    nationality: "Brasil",
    birth_country: "Brasil",
    birth_city: "Maceió",
    birth_state: "AL",
  },
];

for (const p of patches) {
  const r = await pool.query(
    `UPDATE managers SET
       full_name = COALESCE(NULLIF(btrim(full_name), ''), $2),
       nationality = COALESCE(NULLIF(btrim(nationality), ''), $3),
       birth_country = COALESCE(NULLIF(btrim(birth_country), ''), $4),
       birth_city = COALESCE(NULLIF(btrim(birth_city), ''), $5),
       birth_state = COALESCE(NULLIF(btrim(birth_state), ''), $6)
     WHERE id = $1
     RETURNING id, name, full_name, birth_city, birth_state`,
    [
      p.id,
      p.full_name ?? null,
      p.nationality ?? null,
      p.birth_country ?? null,
      p.birth_city ?? null,
      p.birth_state ?? null,
    ],
  );
  console.log(r.rows[0]);
}

// Normalize BRA → Brasil
const n = await pool.query(
  `UPDATE managers SET birth_country = 'Brasil'
   WHERE birth_country IS NOT NULL AND upper(btrim(birth_country)) IN ('BRA', 'BRAZIL')`,
);
console.log("birth_country normalized:", n.rowCount);

// Fix Nêdo full_name casing if still title-cased oddly
const nedo = await pool.query(
  `UPDATE managers SET full_name = 'Valdonedo da Silva Xavier'
   WHERE id = 14 AND full_name ILIKE 'Valdonedo%'
   RETURNING id, full_name`,
);
console.log("nedo:", nedo.rows[0]);

await pool.end();
