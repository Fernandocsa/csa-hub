import type pg from "pg";
import snapshot from "./generated/sql-schema-expectations.json" with { type: "json" };

type MergedExpectations = {
  tables: string[];
  columns: string[];
  dropColumns: string[];
  indexes: string[];
  dropIndexes: string[];
  constraints: string[];
};

type FileExpectations = MergedExpectations & {
  file: string;
  kind: "schema" | "data";
};

const expected = snapshot as {
  merged: MergedExpectations;
  files: Record<string, FileExpectations>;
};

export type SchemaCheckResult = {
  missing: string[];
  extras: string[];
  pendingFiles: string[];
};

async function fetchLiveCatalog(pool: pg.Pool) {
  const [tables, columns, indexes, constraints] = await Promise.all([
    pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    ),
    pool.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'`,
    ),
    pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
    ),
    pool.query<{ conname: string }>(`SELECT conname FROM pg_constraint`),
  ]);
  return {
    tables: new Set(tables.rows.map((r) => r.tablename.toLowerCase())),
    columns: new Set(
      columns.rows.map(
        (r) => `${r.table_name.toLowerCase()}.${r.column_name.toLowerCase()}`,
      ),
    ),
    indexes: new Set(indexes.rows.map((r) => r.indexname.toLowerCase())),
    constraints: new Set(constraints.rows.map((r) => r.conname.toLowerCase())),
  };
}

/**
 * Compare lib/db/sql (via generated snapshot) to the connected Postgres.
 * Missing columns/tables here are what 500'd /api/matches/:id in production.
 */
export async function checkSqlSchema(
  pool: pg.Pool,
): Promise<SchemaCheckResult> {
  const live = await fetchLiveCatalog(pool);
  const missing: string[] = [];
  const extras: string[] = [];
  const { merged, files } = expected;

  for (const t of merged.tables) {
    if (!live.tables.has(t)) missing.push(`table:${t}`);
  }
  for (const c of merged.columns) {
    if (!live.columns.has(c)) missing.push(`column:${c}`);
  }
  for (const c of merged.dropColumns) {
    if (live.columns.has(c)) extras.push(`dropped-column-still-present:${c}`);
  }
  for (const i of merged.indexes) {
    if (!live.indexes.has(i)) missing.push(`index:${i}`);
  }
  for (const i of merged.dropIndexes) {
    if (live.indexes.has(i)) extras.push(`dropped-index-still-present:${i}`);
  }
  for (const c of merged.constraints) {
    if (!live.constraints.has(c)) missing.push(`constraint:${c}`);
  }

  const missingSet = new Set(missing);
  const pendingFiles: string[] = [];
  for (const f of Object.values(files)) {
    if (f.kind !== "schema") continue;
    const hits = [
      ...f.tables.map((t) => `table:${t}`),
      ...f.columns.map((c) => `column:${c}`),
      ...f.indexes.map((i) => `index:${i}`),
      ...f.constraints.map((c) => `constraint:${c}`),
    ];
    if (hits.some((h) => missingSet.has(h))) pendingFiles.push(f.file);
  }

  return { missing, extras, pendingFiles };
}
