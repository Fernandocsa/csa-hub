/**
 * Split Cruzeiro Arapiraca: extinct (id 109) vs refounded 2019+.
 * SQL: lib/db/sql/migrate-split-cruzeiro-arapiraca-al.sql
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const EXTINCT_ID = 109;
const EXTINCT_NAME = "Cruzeiro de Arapiraca-AL";
const NEW_NAME = "Cruzeiro-AL";
const CUTOFF = "2019-01-01";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  console.log("=== migrate-split-cruzeiro-arapiraca-al ===");
  const sql = readFileSync(
    "lib/db/sql/migrate-split-cruzeiro-arapiraca-al.sql",
    "utf8",
  );
  await pool.query(sql);

  const { rows: extinctRows } = await pool.query(
    `SELECT id, name, city, state FROM opponents WHERE id = $1`,
    [EXTINCT_ID],
  );
  assert(extinctRows.length === 1, `extinct id=${EXTINCT_ID} missing`);
  assert(
    extinctRows[0].name === EXTINCT_NAME,
    `extinct name mismatch: ${extinctRows[0].name}`,
  );

  const { rows: newRows } = await pool.query(
    `SELECT id, name, city, state FROM opponents WHERE name = $1`,
    [NEW_NAME],
  );
  assert(newRows.length === 1, `new club "${NEW_NAME}" missing or duplicated`);
  const newId = newRows[0].id;
  assert(newId !== EXTINCT_ID, "new club must be a different id");

  const { rows: extinctMatches } = await pool.query(
    `SELECT COUNT(*)::int AS cnt,
            COUNT(*) FILTER (WHERE match_date >= $2)::int AS modern
     FROM matches WHERE opponent_id = $1`,
    [EXTINCT_ID, CUTOFF],
  );
  assert(extinctMatches[0].modern === 0, "extinct club still has 2019+ matches");
  assert(extinctMatches[0].cnt === 17, `expected 17 historic matches, got ${extinctMatches[0].cnt}`);

  const { rows: newMatches } = await pool.query(
    `SELECT COUNT(*)::int AS cnt,
            COUNT(*) FILTER (WHERE match_date < $2)::int AS historic
     FROM matches WHERE opponent_id = $1`,
    [newId, CUTOFF],
  );
  assert(newMatches[0].historic === 0, "new club has pre-2019 matches");
  assert(newMatches[0].cnt === 9, `expected 9 modern matches, got ${newMatches[0].cnt}`);

  console.log(
    `OK extinct id=${EXTINCT_ID} "${EXTINCT_NAME}" matches=${extinctMatches[0].cnt}`,
  );
  console.log(`OK new id=${newId} "${NEW_NAME}" matches=${newMatches[0].cnt}`);
  console.log("=== split PASSED ===");
} finally {
  await pool.end();
}
