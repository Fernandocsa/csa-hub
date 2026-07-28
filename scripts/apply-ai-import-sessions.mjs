import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const sql = readFileSync(resolve("lib/db/sql/create-ai-import-sessions.sql"), "utf8");
const pool = createPgPool();
await pool.query(sql);
console.log("ai_import_sessions applied");
await pool.end();
