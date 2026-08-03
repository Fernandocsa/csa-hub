import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, "../lib/db/sql/alter-suggestions-expand-types.sql"),
  "utf8",
);
await pool.query(sql);
const { rows } = await pool.query(`
  SELECT conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
  WHERE conrelid = 'suggestions'::regclass
  ORDER BY conname
`);
console.table(rows);
await pool.end();
