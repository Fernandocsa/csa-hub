/**
 * Compare lib/db/sql/*.sql against the live Postgres schema.
 *
 *   node scripts/check-pending-migrations.mjs
 *   node scripts/check-pending-migrations.mjs --require-db
 *   node scripts/check-pending-migrations.mjs --write-snapshot
 *
 * --require-db  fail if DATABASE_URL is missing (Vercel build / deploy gate)
 * --write-snapshot  refresh lib/db/src/generated/sql-schema-expectations.json
 *                   (runtime /api/healthz reads this file)
 */
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv } from "./_load-env.mjs";
import {
  diffAgainstCatalog,
  mergeExpectations,
  parseSqlFile,
  schemaFileWithoutObjects,
} from "./sql-schema-parser.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const sqlDir = join(root, "lib", "db", "sql");
const snapshotPath = join(
  root,
  "lib",
  "db",
  "src",
  "generated",
  "sql-schema-expectations.json",
);

const args = new Set(process.argv.slice(2));
const requireDb = args.has("--require-db");
const writeSnapshot = args.has("--write-snapshot");

function loadSqlFiles() {
  const names = readdirSync(sqlDir)
    .filter((n) => n.endsWith(".sql"))
    .sort();
  if (names.length === 0) {
    throw new Error(`No .sql files in ${sqlDir}`);
  }
  return names.map((name) => {
    const rel = relative(root, join(sqlDir, name)).replace(/\\/g, "/");
    return parseSqlFile(rel, readFileSync(join(sqlDir, name), "utf8"));
  });
}

function snapshotPayload(files) {
  return {
    generatedBy: "scripts/check-pending-migrations.mjs",
    sqlDir: "lib/db/sql",
    fileCount: files.length,
    merged: mergeExpectations(files),
    files: Object.fromEntries(files.map((f) => [f.file, f])),
  };
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function loadPg() {
  const nodeModuleDirs = [
    process.env.PG_NODE_MODULES,
    join(root, "lib", "db", "node_modules"),
    join(root, "node_modules"),
  ].filter(Boolean);
  for (const dir of nodeModuleDirs) {
    if (!existsSync(join(dir, "pg", "package.json"))) continue;
    const req = createRequire(join(dir, "pg", "package.json"));
    return req("pg");
  }
  throw new Error(
    "Cannot find package 'pg'. Run pnpm install or set PG_NODE_MODULES.",
  );
}

async function loadLiveCatalog(pool) {
  const tables = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const columns = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'`,
  );
  const indexes = await pool.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
  );
  const constraints = await pool.query(
    `SELECT conname FROM pg_constraint`,
  );
  return {
    tables: new Set(tables.rows.map((r) => String(r.tablename).toLowerCase())),
    columns: new Set(
      columns.rows.map(
        (r) =>
          `${String(r.table_name).toLowerCase()}.${String(r.column_name).toLowerCase()}`,
      ),
    ),
    indexes: new Set(indexes.rows.map((r) => String(r.indexname).toLowerCase())),
    constraints: new Set(
      constraints.rows.map((r) => String(r.conname).toLowerCase()),
    ),
  };
}

const files = loadSqlFiles();
const parseErrors = files
  .map((f) => schemaFileWithoutObjects(f, f.file))
  .filter(Boolean);

if (parseErrors.length > 0) {
  console.error("SQL parser produced no schema objects for alter/create files:");
  for (const err of parseErrors) console.error(`  ${err}`);
  process.exit(1);
}

const merged = mergeExpectations(files);
if (!merged.columns.includes("matches.opponent_manager_id")) {
  console.error("Parser regression: matches.opponent_manager_id was not extracted.");
  process.exit(1);
}
const nextMatch = files.find((f) => f.file.endsWith("alter-next-match-links.sql"));
if (
  !nextMatch?.columns.includes("next_match.opponent_id") ||
  !nextMatch.columns.includes("next_match.match_id")
) {
  console.error("Parser regression: multi-column ADD COLUMN in alter-next-match-links.sql");
  process.exit(1);
}

const payload = snapshotPayload(files);
const serialized = stableStringify(payload);

if (writeSnapshot) {
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, serialized);
  console.log(`Wrote ${relative(root, snapshotPath).replace(/\\/g, "/")}`);
} else if (!existsSync(snapshotPath)) {
  console.error(
    `Missing snapshot ${relative(root, snapshotPath)}. Run with --write-snapshot.`,
  );
  process.exit(1);
} else {
  const current = readFileSync(snapshotPath, "utf8").replace(/\r\n/g, "\n");
  if (current !== serialized) {
    console.error(
      "lib/db/src/generated/sql-schema-expectations.json is stale vs lib/db/sql/.",
    );
    console.error("Run: node scripts/check-pending-migrations.mjs --write-snapshot");
    process.exit(1);
  }
  console.log("Snapshot is in sync with lib/db/sql/");
}

const dataOnly = files.filter((f) => f.kind === "data");
if (dataOnly.length > 0) {
  console.log(
    `Data-only SQL (not schema-checkable): ${dataOnly.map((f) => f.file).join(", ")}`,
  );
}

if (existsSync(join(root, ".env"))) loadEnvFromDotenv(join(root, ".env"));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (requireDb) {
    console.error("DATABASE_URL missing (--require-db).");
    process.exit(1);
  }
  console.log("No DATABASE_URL; skipped live Postgres check.");
  process.exit(0);
}

const url = new URL(databaseUrl);
const ssl = /supabase|neon|railway|amazonaws/i.test(url.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pg = loadPg();
const pool = new pg.Pool({ connectionString: databaseUrl, ssl, max: 1 });

try {
  const live = await loadLiveCatalog(pool);
  const diff = diffAgainstCatalog(mergeExpectations(files), live, files);
  const problems = [...diff.missing, ...diff.extras];
  if (problems.length > 0) {
    console.error(
      JSON.stringify(
        {
          msg: "pending-sql-migrations",
          missing: diff.missing,
          extras: diff.extras,
          pendingFiles: diff.pendingFiles,
          hint: "Apply the listed files in lib/db/sql/ before releasing traffic.",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
  console.log(
    `OK ${files.filter((f) => f.kind === "schema").length} schema SQL files match public schema`,
  );
} finally {
  await pool.end();
}
