/**
 * Create referees table and matches.referee_id (Árbitros stage 1).
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

try {
  console.log("=== migrate-create-referees ===");
  const sql = readFileSync("lib/db/sql/create-referees.sql", "utf8");
  await pool.query(sql);

  const { rows: refCols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referees'
    ORDER BY ordinal_position
  `);
  const cols = refCols.map((r) => r.column_name);
  for (const c of ["id", "name", "state"]) {
    if (!cols.includes(c)) throw new Error(`referees missing column ${c}`);
  }

  const { rows: matchCols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches'
      AND column_name = 'referee_id'
  `);
  if (matchCols.length !== 1) throw new Error("matches.referee_id missing");

  const { rows: fk } = await pool.query(`
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'matches'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = 'matches'
          AND kcu.column_name = 'referee_id'
          AND ccu.table_name = 'referees'
      )
    LIMIT 1
  `);
  // FK may be anonymous on ADD COLUMN — also accept via pg_constraint
  const { rows: fk2 } = await pool.query(`
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = ANY (c.conkey)
    JOIN pg_class frel ON frel.oid = c.confrelid
    WHERE rel.relname = 'matches'
      AND a.attname = 'referee_id'
      AND frel.relname = 'referees'
      AND c.contype = 'f'
    LIMIT 1
  `);
  if (fk2.length === 0 && fk.length === 0) {
    throw new Error("FK matches.referee_id → referees.id missing");
  }

  console.log("OK referees columns:", cols.join(", "));
  console.log("OK matches.referee_id + FK present");
} finally {
  await pool.end();
}
