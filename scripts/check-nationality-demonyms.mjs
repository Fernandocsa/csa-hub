/**
 * Read-only: list players whose nationality looks like a demonym (gentílico)
 * instead of a country name. Does NOT update any rows.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const demonymExact = [
  "Brasileiro",
  "Brasileira",
  "Argentino",
  "Argentina", // ambiguous (country vs feminine demonym) — still list if stored as demonym-like alone; country "Argentina" is valid
  "Uruguaio",
  "Uruguaia",
  "Paraguaio",
  "Paraguaia",
  "Chileno",
  "Chilena",
  "Colombiano",
  "Colombiana",
  "Peruano",
  "Peruana",
  "Boliviano",
  "Boliviana",
  "Venezuelano",
  "Venezuelana",
  "Equatoriano",
  "Equatoriana",
  "Mexicano",
  "Mexicana",
  "Americano",
  "Americana",
  "Portugues",
  "Português",
  "Portuguesa",
  "Espanhol",
  "Espanhola",
  "Italiano",
  "Italiana",
  "Frances",
  "Francês",
  "Francesa",
  "Alemao",
  "Alemão",
  "Alema",
  "Alemã",
  "Japones",
  "Japonês",
  "Japonesa",
  "Nigeriano",
  "Nigeriana",
];

// Exact demonym hits (exclude valid country names that collide, e.g. Argentina)
const exactDemonyms = demonymExact.filter(
  (d) => !["Argentina"].includes(d), // country name — handled separately only via pattern if needed
);

const exact = await pool.query(
  `SELECT id, name, nationality, nationality_flag
   FROM players
   WHERE nationality IS NOT NULL
     AND lower(btrim(nationality)) = ANY($1::text[])
   ORDER BY nationality, name`,
  [exactDemonyms.map((d) => d.toLowerCase())],
);

const brasilVariants = await pool.query(
  `SELECT id, name, nationality, nationality_flag
   FROM players
   WHERE nationality IS NOT NULL
     AND lower(btrim(nationality)) IN (
       'brasileiro','brasileira','brasileiros','brasileiras'
     )
   ORDER BY name`,
);

const top = await pool.query(
  `SELECT nationality, count(*)::int AS n
   FROM players
   WHERE nationality IS NOT NULL AND btrim(nationality) <> ''
   GROUP BY 1
   ORDER BY n DESC, nationality
   LIMIT 50`,
);

console.log("=== Brasileiros (gentílico) ===");
console.log("count:", brasilVariants.rows.length);
for (const row of brasilVariants.rows) {
  console.log(
    `#${row.id} ${row.name} | nationality=${JSON.stringify(row.nationality)} | flag=${row.nationality_flag}`,
  );
}

console.log("\n=== Outros gentílicos (lista fechada) ===");
console.log("count:", exact.rows.length);
for (const row of exact.rows) {
  console.log(
    `#${row.id} ${row.name} | nationality=${JSON.stringify(row.nationality)} | flag=${row.nationality_flag}`,
  );
}

console.log("\n=== Top nationality values (amostra) ===");
for (const row of top.rows) {
  console.log(`${row.n}\t${JSON.stringify(row.nationality)}`);
}

await pool.end();
