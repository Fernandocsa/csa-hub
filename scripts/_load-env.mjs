import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

export function loadEnvFromDotenv(path = ".env") {
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] === undefined) {
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

export function createPgPool() {
  const require = createRequire(resolve("lib/db/package.json"));
  const pg = require("pg");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const u = new URL(url);
  const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
    ? { rejectUnauthorized: false }
    : undefined;
  return new pg.Pool({ connectionString: url, ssl });
}
