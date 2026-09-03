import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getPgPoolOptions } from "./connection";
import { loadRootEnv } from "./load-env";
import * as schema from "./schema";

const { Pool } = pg;

loadRootEnv();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool(getPgPoolOptions(process.env.DATABASE_URL));
export const db = drizzle(pool, { schema });

pool.on("error", (err) => {
  console.error(
    JSON.stringify({
      msg: "pg-pool-error",
      code: (err as NodeJS.ErrnoException).code,
      message: err.message,
    }),
  );
});

/** Cheap liveness probe used by /api/healthz. */
export async function pingDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}

/**
 * Schema the running API assumes exists. A missing column 500s every match
 * detail / admin sheet (see 6018c0b / opponent_manager_id). Health checks
 * surface this before a user hits a detail page.
 */
const CRITICAL_COLUMNS: Array<{ table: string; column: string }> = [
  { table: "matches", column: "opponent_manager_id" },
  { table: "opponents", column: "founded_on" },
];

const CRITICAL_TABLES = ["club_stadiums"];

export async function assertCriticalSchema(): Promise<string[]> {
  const missing: string[] = [];
  for (const table of CRITICAL_TABLES) {
    const { rows } = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    if (rows.length === 0) missing.push(table);
  }
  for (const { table, column } of CRITICAL_COLUMNS) {
    const { rows } = await pool.query<{ ok: number }>(
      `SELECT 1 AS ok FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (rows.length === 0) missing.push(`${table}.${column}`);
  }
  if (missing.length > 0) {
    console.error(
      JSON.stringify({
        msg: "pg-schema-missing",
        missing,
        hint: "Apply the matching file in lib/db/sql/ (e.g. alter-matches-opponent-manager.sql)",
      }),
    );
  }
  return missing;
}

void (async () => {
  try {
    await pingDatabase();
    await assertCriticalSchema();
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: "pg-startup-check-failed",
        code: (err as NodeJS.ErrnoException).code,
        message: err instanceof Error ? err.message : String(err),
      }),
    );
  }
})();

export * from "./schema";
