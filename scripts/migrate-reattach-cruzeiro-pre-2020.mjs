/**
 * Move pre-2020 matches from Cruzeiro-AL (231) → Cruzeiro de Arapiraca-AL (109).
 * SQL: lib/db/sql/migrate-reattach-cruzeiro-pre-2020.sql
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const EXTINCT_ID = 109;
const MODERN_ID = 231;
const EXTINCT_NAME = "Cruzeiro de Arapiraca-AL";
const MODERN_NAME = "Cruzeiro-AL";
const CUTOFF = "2020-01-01";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  console.log("=== migrate-reattach-cruzeiro-pre-2020 ===");

  const { rows: before } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE opponent_id = $1 AND match_date < $3)::int AS extinct_pre,
       COUNT(*) FILTER (WHERE opponent_id = $1)::int AS extinct_all,
       COUNT(*) FILTER (WHERE opponent_id = $2 AND match_date < $3)::int AS modern_pre,
       COUNT(*) FILTER (WHERE opponent_id = $2 AND match_date >= $3)::int AS modern_post,
       COUNT(*) FILTER (WHERE opponent_id = $2)::int AS modern_all
     FROM matches`,
    [EXTINCT_ID, MODERN_ID, CUTOFF],
  );
  console.log("before:", before[0]);

  const sql = readFileSync(
    "lib/db/sql/migrate-reattach-cruzeiro-pre-2020.sql",
    "utf8",
  );
  await pool.query(sql);

  const { rows: extinctRows } = await pool.query(
    `SELECT id, name FROM opponents WHERE id = $1`,
    [EXTINCT_ID],
  );
  assert(extinctRows.length === 1, `extinct id=${EXTINCT_ID} missing`);
  assert(
    extinctRows[0].name === EXTINCT_NAME,
    `extinct name mismatch: ${extinctRows[0].name}`,
  );

  const { rows: modernRows } = await pool.query(
    `SELECT id, name FROM opponents WHERE id = $1`,
    [MODERN_ID],
  );
  assert(modernRows.length === 1, `modern id=${MODERN_ID} missing`);
  assert(
    modernRows[0].name === MODERN_NAME,
    `modern name mismatch: ${modernRows[0].name}`,
  );

  const { rows: after } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE opponent_id = $1)::int AS extinct_all,
       COUNT(*) FILTER (WHERE opponent_id = $1 AND match_date >= $3)::int AS extinct_modern,
       MIN(match_date) FILTER (WHERE opponent_id = $1)::text AS extinct_first,
       MAX(match_date) FILTER (WHERE opponent_id = $1)::text AS extinct_last,
       COUNT(*) FILTER (WHERE opponent_id = $2)::int AS modern_all,
       COUNT(*) FILTER (WHERE opponent_id = $2 AND match_date < $3)::int AS modern_pre,
       MIN(match_date) FILTER (WHERE opponent_id = $2)::text AS modern_first,
       MAX(match_date) FILTER (WHERE opponent_id = $2)::text AS modern_last
     FROM matches`,
    [EXTINCT_ID, MODERN_ID, CUTOFF],
  );

  assert(after[0].modern_pre === 0, "modern club still has pre-2020 matches");
  assert(after[0].extinct_modern === 0, "extinct club has 2020+ matches");
  assert(
    after[0].extinct_all === 29,
    `expected 29 historic matches on extinct, got ${after[0].extinct_all}`,
  );
  assert(
    after[0].modern_all === 9,
    `expected 9 modern matches on Cruzeiro-AL, got ${after[0].modern_all}`,
  );

  console.log("after:", after[0]);
  console.log(
    `OK extinct id=${EXTINCT_ID} "${EXTINCT_NAME}" matches=${after[0].extinct_all} (${after[0].extinct_first} → ${after[0].extinct_last})`,
  );
  console.log(
    `OK modern id=${MODERN_ID} "${MODERN_NAME}" matches=${after[0].modern_all} (${after[0].modern_first} → ${after[0].modern_last})`,
  );
  console.log("=== reattach PASSED ===");
} finally {
  await pool.end();
}
