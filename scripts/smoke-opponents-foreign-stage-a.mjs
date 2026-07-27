/**
 * Stage A smoke: opponents.country column + backfill from name suffix.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const TAG = `smoke-foreign-a-${Date.now()}`;
let tempId = null;

try {
  console.log("=== Apply alter-opponents-foreign-stage-a.sql ===");
  await pool.query(readFileSync("lib/db/sql/alter-opponents-foreign-stage-a.sql", "utf8"));

  const { rows: cols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opponents'
      AND column_name = 'country'
  `);
  assert(cols.length === 1, "opponents.country column missing");
  console.log("OK opponents.country column");

  const { rows: idx } = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'opponents' AND indexname = 'opponents_country_idx'
  `);
  assert(idx.length === 1, "opponents_country_idx missing");
  console.log("OK opponents_country_idx");

  console.log("=== Apply migrate-opponents-country-from-suffix.sql ===");
  await pool.query(readFileSync("lib/db/sql/migrate-opponents-country-from-suffix.sql", "utf8"));

  const { rows: arg } = await pool.query(
    `SELECT id, name, country, state FROM opponents WHERE id = 162`,
  );
  assert(arg[0]?.country === "ARG", `Talleres-ARG country=${arg[0]?.country}`);
  assert(!arg[0]?.state?.trim(), "Talleres-ARG state should be empty");
  console.log("OK Talleres-ARG → country=ARG");

  const { rows: ven } = await pool.query(
    `SELECT id, name, country, state FROM opponents WHERE id = 163`,
  );
  assert(ven[0]?.country === "VEN", `Estudiantes country=${ven[0]?.country}`);
  assert(!ven[0]?.state?.trim(), "Estudiantes state should be empty");
  console.log("OK Estudiantes de Mérida-VEN → country=VEN");

  const { rows: foreignCount } = await pool.query(`
    SELECT COUNT(*)::int AS cnt FROM opponents
    WHERE country IS NOT NULL AND trim(country) <> ''
  `);
  assert(foreignCount[0].cnt === 2, `expected 2 with country, got ${foreignCount[0].cnt}`);
  console.log("OK exactly 2 opponents with country");

  const { rows: crb } = await pool.query(
    `SELECT country FROM opponents WHERE id = 1`,
  );
  assert(!crb[0]?.country?.trim(), "CRB-AL should not have country");
  console.log("OK Brazilian clubs unchanged (CRB-AL sample)");

  const { rows: inserted } = await pool.query(
    `INSERT INTO opponents (name) VALUES ($1) RETURNING id`,
    [`${TAG}-TEST-VEN`],
  );
  tempId = inserted[0].id;
  await pool.query(readFileSync("lib/db/sql/migrate-opponents-country-from-suffix.sql", "utf8"));
  const { rows: temp } = await pool.query(
    `SELECT country FROM opponents WHERE id = $1`,
    [tempId],
  );
  assert(temp[0]?.country === "VEN", `temp backfill country=${temp[0]?.country}`);
  console.log("OK idempotent backfill on new -VEN suffix row");
} finally {
  if (tempId != null) {
    await pool.query(`DELETE FROM opponents WHERE id = $1`, [tempId]);
  }
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage A foreign opponents smoke PASSED ===");
