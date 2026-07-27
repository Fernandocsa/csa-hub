import crypto from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9891/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = crypto
  .createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

console.log("=== Apply alter-opponents-stage-b.sql ===");
await pool.query(readFileSync("lib/db/sql/alter-opponents-stage-b.sql", "utf8"));

const TAG = `smoke-opp-b-${Date.now()}`;
let createdId = null;

try {
  const { rows: cols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='opponents'
      AND column_name IN ('city','state')
    ORDER BY column_name`);
  assert(cols.length === 2, "city/state columns missing");
  console.log("OK opponents.city + opponents.state");

  const cities = JSON.parse(
    readFileSync("artifacts/portal-marujo/src/lib/br-cities.json", "utf8"),
  );
  assert(cities.length > 5000, "br-cities.json too small");
  const maceio = cities.filter((c) => c.name === "Maceió");
  assert(maceio.length === 1 && maceio[0].uf === "AL", "Maceió/AL");
  const santaCruz = cities.filter(
    (c) => c.name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase() === "santa cruz",
  );
  assert(santaCruz.length > 1, "Santa Cruz should be ambiguous");
  console.log(`OK br-cities.json (${cities.length}); Santa Cruz UFs=${santaCruz.map((c)=>c.uf).join(",")}`);

  const created = await api("POST", "/admin/opponents", {
    name: `${TAG} Base`,
    city: "Ijuí",
    state: "rs",
  });
  assert(created.status === 201, `create ${created.status} ${JSON.stringify(created.data)}`);
  createdId = created.data.id;
  assert(created.data.state === "RS", "UF uppercased");
  assert(created.data.city === "Ijuí", "city stored");
  console.log("OK create opponent with city/state");

  const updated = await api("PUT", `/admin/opponents/${createdId}`, {
    name: `${TAG} Base-RS`,
    city: "Ijuí",
    state: "RS",
  });
  assert(updated.status === 200, `update ${updated.status}`);
  assert(updated.data.name.endsWith("-RS"), "suffix in name");
  console.log("OK apply suffix via PUT name");

  const detail = await api("GET", `/admin/opponents/${createdId}`);
  assert(detail.status === 200, "GET detail");
  assert(Array.isArray(detail.data.matches), "matches array");
  console.log("OK GET /admin/opponents/:id includes matches");

  const badUf = await api("POST", "/admin/opponents", {
    name: `${TAG} Bad`,
    city: "X",
    state: "XX",
  });
  assert(badUf.status === 400, "invalid UF rejected");
  console.log("OK invalid UF rejected");
} finally {
  if (createdId != null) {
    await pool.query(`DELETE FROM opponents WHERE id = $1`, [createdId]);
  }
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage B opponents smoke PASSED ===");
