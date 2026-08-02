/**
 * Read-only: list managers whose nationality looks like a demonym.
 * Does NOT update any rows.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const exactDemonyms = [
  "Brasileiro",
  "Brasileira",
  "Argentino",
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

const brasilVariants = await pool.query(
  `SELECT id, name, nationality
   FROM managers
   WHERE nationality IS NOT NULL
     AND lower(btrim(nationality)) IN (
       'brasileiro','brasileira','brasileiros','brasileiras'
     )
   ORDER BY name`,
);

const exact = await pool.query(
  `SELECT id, name, nationality
   FROM managers
   WHERE nationality IS NOT NULL
     AND lower(btrim(nationality)) = ANY($1::text[])
   ORDER BY nationality, name`,
  [exactDemonyms.map((d) => d.toLowerCase())],
);

const top = await pool.query(
  `SELECT nationality, count(*)::int AS n
   FROM managers
   WHERE nationality IS NOT NULL AND btrim(nationality) <> ''
   GROUP BY 1
   ORDER BY n DESC, nationality
   LIMIT 50`,
);

const nullish = await pool.query(
  `SELECT
     count(*) FILTER (WHERE nationality IS NULL OR btrim(nationality) = '')::int AS empty_or_null,
     count(*)::int AS total
   FROM managers`,
);

console.log("=== Técnicos: Brasileiros (gentílico) ===");
console.log("count:", brasilVariants.rows.length);
for (const row of brasilVariants.rows) {
  console.log(`#${row.id} ${row.name} | nationality=${JSON.stringify(row.nationality)}`);
}

console.log("\n=== Técnicos: outros gentílicos (lista fechada) ===");
console.log("count:", exact.rows.length);
for (const row of exact.rows) {
  console.log(`#${row.id} ${row.name} | nationality=${JSON.stringify(row.nationality)}`);
}

console.log("\n=== Técnicos: top nationality values ===");
for (const row of top.rows) {
  console.log(`${row.n}\t${JSON.stringify(row.nationality)}`);
}

console.log("\n=== Técnicos: vazios ===");
console.log(nullish.rows[0]);

await pool.end();
