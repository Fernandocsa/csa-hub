/**
 * Apply merge: "7 de Setembro-AL" (id=190) → "Sete de Setembro-AL" (id=84).
 * Transactional SQL in lib/db/sql/migrate-merge-opponent-sete-de-setembro-al.sql
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const KEEP_ID = 84;
const DISCARD_ID = 190;
const KEEP_NAME = "Sete de Setembro-AL";
const DISCARD_NAME = "7 de Setembro-AL";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  console.log("=== migrate-merge-opponent-sete-de-setembro-al ===");
  const sql = readFileSync(
    "lib/db/sql/migrate-merge-opponent-sete-de-setembro-al.sql",
    "utf8",
  );
  await pool.query(sql);

  const { rows: keepRows } = await pool.query(
    `SELECT id, name FROM opponents WHERE id = $1`,
    [KEEP_ID],
  );
  assert(keepRows.length === 1, `keep id=${KEEP_ID} missing`);
  assert(keepRows[0].name === KEEP_NAME, `keep name mismatch: ${keepRows[0].name}`);

  const { rows: discardRows } = await pool.query(
    `SELECT id FROM opponents WHERE id = $1`,
    [DISCARD_ID],
  );
  assert(discardRows.length === 0, `discard id=${DISCARD_ID} still exists`);

  const { rows: matchRows } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM matches WHERE opponent_id = $1`,
    [KEEP_ID],
  );
  assert(matchRows[0].cnt === 26, `expected 26 matches on keep, got ${matchRows[0].cnt}`);

  const { rows: orphanRows } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM matches WHERE opponent_id = $1`,
    [DISCARD_ID],
  );
  assert(orphanRows[0].cnt === 0, `orphan matches on discard id=${DISCARD_ID}`);

  console.log(`OK keep id=${KEEP_ID} "${KEEP_NAME}" matches=${matchRows[0].cnt}`);
  console.log(`OK discard id=${DISCARD_ID} removed`);
  console.log("=== merge PASSED ===");
} finally {
  await pool.end();
}
