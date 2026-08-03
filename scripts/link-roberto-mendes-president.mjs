import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const __dirname = dirname(fileURLToPath(import.meta.url));

await pool.query(
  readFileSync(
    join(__dirname, "../lib/db/sql/alter-presidents-linked-ids.sql"),
    "utf8",
  ),
);

const { rows } = await pool.query(
  `UPDATE presidents
   SET linked_player_id = 1101
   WHERE id = 6 AND name ILIKE 'Roberto Mendes'
   RETURNING id, name, linked_player_id, term_start::text, term_end::text`,
);
console.table(rows);
await pool.end();
