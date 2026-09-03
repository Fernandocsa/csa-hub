/**
 * Extract tables / columns / indexes / constraints from lib/db/sql/*.sql.
 * Used by check-pending-migrations.mjs and to generate the runtime snapshot
 * that /api/healthz compares against Postgres.
 */

const TABLE_CONSTRAINT_START =
  /^(CONSTRAINT|UNIQUE|PRIMARY|CHECK|FOREIGN|LIKE|EXCLUDE)\b/i;

/**
 * @param {string} sql
 * @returns {string}
 */
export function stripSqlNoise(sql) {
  let out = "";
  let i = 0;
  let inLine = false;
  let inBlock = false;
  let inSingle = false;
  let inDollar = false;
  while (i < sql.length) {
    const c = sql[i];
    const n = sql[i + 1];
    if (inLine) {
      if (c === "\n") {
        inLine = false;
        out += c;
      }
      i += 1;
      continue;
    }
    if (inBlock) {
      if (c === "*" && n === "/") {
        inBlock = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (inSingle) {
      out += c;
      if (c === "'" && n === "'") {
        out += n;
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i += 1;
      continue;
    }
    if (inDollar) {
      out += c;
      if (c === "$" && n === "$") {
        out += n;
        inDollar = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (c === "-" && n === "-") {
      inLine = true;
      i += 2;
      continue;
    }
    if (c === "/" && n === "*") {
      inBlock = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      out += c;
      i += 1;
      continue;
    }
    if (c === "$" && n === "$") {
      inDollar = true;
      out += c + n;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/**
 * @param {string} ident
 * @returns {string}
 */
function unquoteIdent(ident) {
  const t = ident.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("`") && t.endsWith("`"))
  ) {
    return t.slice(1, -1);
  }
  const dotted = t.split(".");
  return dotted[dotted.length - 1].replace(/^["']|["']$/g, "").toLowerCase();
}

/**
 * @param {string} body
 * @returns {string[]}
 */
function splitTopLevel(body) {
  const parts = [];
  let cur = "";
  let depth = 0;
  for (const c of body) {
    if (c === "(") depth += 1;
    else if (c === ")") depth = Math.max(0, depth - 1);
    if (c === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.filter(Boolean);
}

/**
 * @param {string} table
 * @param {string} body
 * @param {{ columns: Set<string>, constraints: Set<string> }} into
 */
function parseCreateTableBody(table, body, into) {
  for (const raw of splitTopLevel(body)) {
    const item = raw.replace(/\s+/g, " ").trim();
    if (!item) continue;
    const constraint = item.match(/^CONSTRAINT\s+([a-zA-Z_][\w$]*)/i);
    if (constraint) {
      into.constraints.add(constraint[1].toLowerCase());
      continue;
    }
    if (TABLE_CONSTRAINT_START.test(item)) continue;
    const col = item.match(/^([a-zA-Z_][\w$]*)\s+/);
    if (col) into.columns.add(`${table}.${col[1].toLowerCase()}`);
  }
}

/**
 * @typedef {{
 *   file: string,
 *   kind: "schema" | "data",
 *   tables: string[],
 *   columns: string[],
 *   dropColumns: string[],
 *   indexes: string[],
 *   dropIndexes: string[],
 *   constraints: string[],
 * }} FileExpectations
 */

/**
 * @param {string} file
 * @param {string} sql
 * @returns {FileExpectations}
 */
export function parseSqlFile(file, sql) {
  const text = stripSqlNoise(sql);
  const tables = new Set();
  const columns = new Set();
  const dropColumns = new Set();
  const indexes = new Set();
  const dropIndexes = new Set();
  const constraints = new Set();

  const createTableRe =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][\w$."]*)\s*\(/gi;
  let m;
  while ((m = createTableRe.exec(text))) {
    const table = unquoteIdent(m[1]);
    tables.add(table);
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (c === "(") depth += 1;
      else if (c === ")") depth -= 1;
      i += 1;
    }
    parseCreateTableBody(table, text.slice(start, i - 1), {
      columns,
      constraints,
    });
  }

  const alterSeqRe =
    /ALTER\s+TABLE\s+([a-zA-Z_][\w$."]*)|ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][\w$]*)|DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?([a-zA-Z_][\w$]*)/gi;
  let currentTable = null;
  while ((m = alterSeqRe.exec(text))) {
    if (m[1]) {
      currentTable = unquoteIdent(m[1]);
      tables.add(currentTable);
      continue;
    }
    if (!currentTable) continue;
    if (m[2]) columns.add(`${currentTable}.${m[2].toLowerCase()}`);
    if (m[3]) dropColumns.add(`${currentTable}.${m[3].toLowerCase()}`);
  }

  const addConstraintRe =
    /ADD\s+CONSTRAINT\s+([a-zA-Z_][\w$]*)/gi;
  while ((m = addConstraintRe.exec(text))) {
    constraints.add(m[1].toLowerCase());
  }

  const createIndexRe =
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][\w$]*)\s+ON\s+/gi;
  while ((m = createIndexRe.exec(text))) {
    indexes.add(m[1].toLowerCase());
  }

  const dropIndexRe =
    /DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?([a-zA-Z_][\w$]*)/gi;
  while ((m = dropIndexRe.exec(text))) {
    dropIndexes.add(m[1].toLowerCase());
  }

  const hasSchema =
    tables.size +
      columns.size +
      dropColumns.size +
      indexes.size +
      dropIndexes.size +
      constraints.size >
    0;

  return {
    file,
    kind: hasSchema ? "schema" : "data",
    tables: [...tables].sort(),
    columns: [...columns].sort(),
    dropColumns: [...dropColumns].sort(),
    indexes: [...indexes].sort(),
    dropIndexes: [...dropIndexes].sort(),
    constraints: [...constraints].sort(),
  };
}

/**
 * @param {FileExpectations[]} files
 */
export function mergeExpectations(files) {
  const tables = new Set();
  const columns = new Set();
  const dropColumns = new Set();
  const indexes = new Set();
  const dropIndexes = new Set();
  const constraints = new Set();
  for (const f of files) {
    for (const t of f.tables) tables.add(t);
    for (const c of f.columns) columns.add(c);
    for (const c of f.dropColumns) dropColumns.add(c);
    for (const i of f.indexes) indexes.add(i);
    for (const i of f.dropIndexes) dropIndexes.add(i);
    for (const c of f.constraints) constraints.add(c);
  }
  return {
    tables: [...tables].sort(),
    columns: [...columns].sort(),
    dropColumns: [...dropColumns].sort(),
    indexes: [...indexes].sort(),
    dropIndexes: [...dropIndexes].sort(),
    constraints: [...constraints].sort(),
  };
}

/**
 * @param {FileExpectations} parsed
 * @param {string} fileName
 * @returns {string | null}
 */
export function schemaFileWithoutObjects(parsed, fileName) {
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? fileName;
  if (parsed.kind === "schema") return null;
  if (/^(alter|create)-/i.test(base)) {
    return `${base}: alter/create SQL produced no schema objects (parser gap or empty file)`;
  }
  return null;
}

/**
 * @typedef {{
 *   tables: Set<string>,
 *   columns: Set<string>,
 *   indexes: Set<string>,
 *   constraints: Set<string>,
 * }} LiveCatalog
 */

/**
 * @param {ReturnType<typeof mergeExpectations>} expected
 * @param {LiveCatalog} live
 * @param {FileExpectations[]} perFile
 * @returns {{ missing: string[], extras: string[], pendingFiles: string[] }}
 */
export function diffAgainstCatalog(expected, live, perFile) {
  const missing = [];
  const extras = [];

  for (const t of expected.tables) {
    if (!live.tables.has(t)) missing.push(`table:${t}`);
  }
  for (const c of expected.columns) {
    if (!live.columns.has(c)) missing.push(`column:${c}`);
  }
  for (const c of expected.dropColumns) {
    if (live.columns.has(c)) extras.push(`dropped-column-still-present:${c}`);
  }
  for (const i of expected.indexes) {
    if (!live.indexes.has(i)) missing.push(`index:${i}`);
  }
  for (const i of expected.dropIndexes) {
    if (live.indexes.has(i)) extras.push(`dropped-index-still-present:${i}`);
  }
  for (const c of expected.constraints) {
    if (!live.constraints.has(c)) missing.push(`constraint:${c}`);
  }

  const missingSet = new Set(missing);
  const pendingFiles = [];
  for (const f of perFile) {
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
