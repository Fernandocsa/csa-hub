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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9898/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = crypto
  .createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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

const TAG = `smoke-country-c-${Date.now()}`;
let ids = [];

try {
  console.log("=== Stage C admin opponents country ===");

  const br = await api("POST", "/admin/opponents", {
    name: `${TAG} BR`,
    city: "Maceió",
    state: "AL",
    country: null,
  });
  assert(br.status === 201, `create BR ${br.status}`);
  assert(br.data.state === "AL", "BR state");
  assert(!br.data.country, "BR country empty");
  ids.push(br.data.id);
  console.log("OK create Brazilian opponent");

  const foreign = await api("POST", "/admin/opponents", {
    name: `${TAG} Foreign-ARG`,
    city: "Córdoba",
    country: "ARG",
  });
  assert(foreign.status === 201, `create foreign ${foreign.status}`);
  assert(foreign.data.country === "ARG", "ARG country");
  assert(!foreign.data.state, "foreign state cleared");
  ids.push(foreign.data.id);
  console.log("OK create foreign opponent (ARG, no state)");

  const both = await api("POST", "/admin/opponents", {
    name: `${TAG} Both`,
    state: "AL",
    country: "ARG",
  });
  assert(both.status === 400, "country+state rejected");
  console.log("OK country+state rejected");

  const badCountry = await api("POST", "/admin/opponents", {
    name: `${TAG} Bad`,
    country: "XXX",
  });
  assert(badCountry.status === 400, "invalid country rejected");
  console.log("OK invalid country rejected");

  const braCode = await api("POST", "/admin/opponents", {
    name: `${TAG} BrasilCode`,
    state: "SP",
    country: "BRA",
  });
  assert(braCode.status === 201, "BRA code create");
  assert(!braCode.data.country, "BRA stored as null");
  assert(braCode.data.state === "SP", "BRA keeps state");
  ids.push(braCode.data.id);
  console.log("OK country=BRA normalizes to null");

  const toForeign = await api("PUT", `/admin/opponents/${br.data.id}`, {
    name: `${TAG} BR→Foreign`,
    city: "Buenos Aires",
    country: "ARG",
    state: "AL",
  });
  assert(toForeign.status === 400, "PUT country+state rejected");
  console.log("OK PUT rejects country+state together");

  const toForeignOk = await api("PUT", `/admin/opponents/${br.data.id}`, {
    name: `${TAG} Now-ARG`,
    city: "Buenos Aires",
    country: "ARG",
  });
  assert(toForeignOk.status === 200, "PUT foreign");
  assert(toForeignOk.data.country === "ARG", "PUT country set");
  assert(!toForeignOk.data.state, "PUT cleared state");
  console.log("OK PUT switch to foreign clears state");

  const toBr = await api("PUT", `/admin/opponents/${br.data.id}`, {
    name: `${TAG} Back-BR`,
    city: "Maceió",
    state: "AL",
    country: null,
  });
  assert(toBr.status === 200, "PUT back BR");
  assert(!toBr.data.country, "country cleared");
  assert(toBr.data.state === "AL", "state restored");
  console.log("OK PUT switch back to Brazilian");

  const detail = await api("GET", `/admin/opponents/${foreign.data.id}`);
  assert(detail.status === 200, "GET detail");
  assert(detail.data.country === "ARG", "GET returns country");
  console.log("OK GET detail includes country");

  const existing = await api("GET", "/admin/opponents/162");
  assert(existing.status === 200, "GET Talleres");
  assert(existing.data.country === "ARG", "Talleres country");
  console.log("OK existing foreign opponent has country in GET");
} finally {
  for (const id of ids) {
    await pool.query(`DELETE FROM opponents WHERE id = $1`, [id]);
  }
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage C admin country CRUD smoke PASSED ===");
