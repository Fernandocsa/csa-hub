/**
 * Simulates Vercel loading the /api handler as CommonJS (require), while the
 * Express app remains ESM (dist/app.mjs). Fails if the entry statically
 * require()s the .mjs file.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import http from "node:http";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "api", "index.js");

async function loadEnv() {
  const text = await readFile(path.join(root, ".env"), "utf8").catch(() => "");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] === undefined) {
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — needed to import app.mjs");
  }
}

function assertEntryIsSafeCjs(source) {
  if (!source.includes("import(")) {
    throw new Error("api/index.js must use dynamic import() for app.mjs");
  }
  if (
    /require\([^)]*app\.mjs/.test(source) ||
    /require\([^)]*dist\/app/.test(source)
  ) {
    throw new Error("api/index.js must not require() app.mjs");
  }
  // Must be CJS-export style so Vercel launcher can require() it
  if (!source.includes("module.exports")) {
    throw new Error("api/index.js must use module.exports for CJS require()");
  }
  console.log("OK: entry is CJS with dynamic import() of app.mjs");
}

async function main() {
  const source = await readFile(entry, "utf8");
  assertEntryIsSafeCjs(source);
  await loadEnv();

  // Exact Vercel-style load: CommonJS require of the handler file
  const require = createRequire(entry);
  let mod;
  try {
    mod = require(entry);
  } catch (err) {
    console.error("FAIL: require(api/index.js) threw —", err);
    process.exit(1);
  }

  const handler = mod.default || mod;
  if (typeof handler !== "function") {
    throw new Error("handler is not a function");
  }
  console.log("OK: require(api/index.js) succeeded");

  const server = http.createServer((req, res) => {
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error(err);
      if (!res.headersSent) res.writeHead(500).end(String(err));
    });
  });

  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", (err) => (err ? reject(err) : resolve()));
  });
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/healthz`);
    const body = await res.text();
    console.log("STATUS", res.status);
    console.log("BODY", body);
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${body}`);
    }
    if (JSON.parse(body).status !== "ok") {
      throw new Error(`Unexpected body: ${body}`);
    }
    console.log(
      "OK: CJS require → dynamic import(app.mjs) → /api/healthz responded",
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error("FAIL", err);
  process.exit(1);
});
