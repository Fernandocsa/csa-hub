/**
 * Apply lib/db/sql/alter-matches-opponent-manager.sql.
 *
 * Needs the `pg` package on NODE_PATH / PG_NODE_MODULES (a node_modules dir
 * that contains `pg`), or after a normal pnpm install:
 *
 *   set PG_NODE_MODULES=%TEMP%\pm-pg-mig\node_modules
 *   node scripts/apply-matches-opponent-manager.mjs
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv } from "./_load-env.mjs";

function loadPg() {
  const here = dirname(fileURLToPath(import.meta.url));
  const nodeModuleDirs = [
    process.env.PG_NODE_MODULES,
    join(here, "..", "lib", "db", "node_modules"),
    join(here, "..", "node_modules"),
  ].filter(Boolean);
  for (const dir of nodeModuleDirs) {
    if (!existsSync(join(dir, "pg", "package.json"))) continue;
    const req = createRequire(join(dir, "pg", "package.json"));
    return req("pg");
  }
  throw new Error(
    "Cannot find package 'pg'. Set PG_NODE_MODULES to a node_modules directory that contains pg.",
  );
}

loadEnvFromDotenv();
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const host = new URL(url).hostname;
const ssl = /supabase|neon|railway|amazonaws/i.test(host)
  ? { rejectUnauthorized: false }
  : undefined;
const pg = loadPg();
const pool = new pg.Pool({ connectionString: url, ssl });
const sql = readFileSync("lib/db/sql/alter-matches-opponent-manager.sql", "utf8");

const columnSql = `
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'matches'
    AND column_name = 'opponent_manager_id'
`;

try {
  const before = await pool.query(columnSql);
  console.log("before_count", before.rows.length);
  await pool.query(sql);
  const after = await pool.query(columnSql);
  console.log("after_count", after.rows.length);
  if (after.rows.length !== 1) {
    throw new Error("matches.opponent_manager_id missing after migration");
  }
  console.log("OK matches.opponent_manager_id ready");
} finally {
  await pool.end();
}
