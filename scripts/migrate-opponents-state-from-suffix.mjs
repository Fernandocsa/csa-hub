/**
 * Fill opponents.state from trailing -UF suffix (valid Brazilian UFs only).
 * Transactional SQL in lib/db/sql/migrate-opponents-state-from-suffix.sql
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

function detectUfFromName(name) {
  const m = name.trim().match(/-\s*([A-Za-z]{2})\s*$/);
  if (!m) return null;
  const uf = m[1].toUpperCase();
  return BRAZIL_UFS.has(uf) ? uf : null;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  console.log("=== migrate-opponents-state-from-suffix ===");
  const sql = readFileSync("lib/db/sql/migrate-opponents-state-from-suffix.sql", "utf8");
  await pool.query(sql);

  const { rows: all } = await pool.query(
    `SELECT id, name, state FROM opponents ORDER BY name`,
  );

  let suffixWithState = 0;
  let conflicts = 0;
  let emptyWithValidSuffix = 0;

  for (const o of all) {
    const detected = detectUfFromName(o.name);
    const current = o.state?.trim().toUpperCase() || null;
    if (!detected) continue;
    if (!current) {
      emptyWithValidSuffix++;
      continue;
    }
    if (current === detected) suffixWithState++;
    else conflicts++;
  }

  assert(conflicts === 0, `${conflicts} state/suffix conflict(s) remain`);
  assert(emptyWithValidSuffix === 0, `${emptyWithValidSuffix} suffix rows still missing state`);
  // After merge: 168 with valid suffix (170 total − 2 foreign clubs without BR suffix).
  // Two were already correct before migration (ABC-RN, 4 de Julho-PI) → 166 updated.
  assert(suffixWithState === 168, `expected 168 with state=suffix, got ${suffixWithState}`);

  const { rows: keepCheck } = await pool.query(
    `SELECT state FROM opponents WHERE id = 84`,
  );
  assert(keepCheck[0]?.state === "AL", `Sete de Setembro-AL state=${keepCheck[0]?.state}`);

  const updatedCount = suffixWithState - 2;
  console.log(`OK ${updatedCount} opponents updated with state (${suffixWithState} total with suffix)`);
  console.log(`OK total opponents: ${all.length}`);
  console.log("=== suffix migration PASSED ===");
} finally {
  await pool.end();
}
