import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getPgPoolOptions } from "./connection";
import { loadRootEnv } from "./load-env";
import * as schema from "./schema";
import { checkSqlSchema } from "./sql-schema-check";

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

export { checkSqlSchema } from "./sql-schema-check";
export type { SchemaCheckResult } from "./sql-schema-check";

/**
 * Fail closed when a .sql file in lib/db/sql has not been applied.
 * Backed by lib/db/src/generated/sql-schema-expectations.json (regenerate with
 * `node scripts/check-pending-migrations.mjs --write-snapshot`).
 */
export async function inspectSqlSchema() {
  return checkSqlSchema(pool);
}

export async function assertCriticalSchema(): Promise<string[]> {
  const { missing, extras, pendingFiles } = await inspectSqlSchema();
  const problems = [...missing, ...extras];
  if (problems.length > 0) {
    console.error(
      JSON.stringify({
        msg: "pg-schema-missing",
        missing: problems,
        pendingFiles,
        hint: "Apply the matching file in lib/db/sql/ then re-run scripts/check-pending-migrations.mjs",
      }),
    );
  }
  return problems;
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
