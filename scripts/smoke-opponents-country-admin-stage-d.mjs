/**
 * Stage D smoke: admin opponent form country autocomplete + conditional UI wiring.
 */
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";

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

const TAG = `smoke-country-d-${Date.now()}`;
let id = null;

try {
  console.log("=== Stage D admin form wiring ===");

  const form = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/AdminOpponentDetail.tsx",
    "utf8",
  );
  const list = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/AdminOpponents.tsx",
    "utf8",
  );

  assert(form.includes("lookupCountriesByName"), "country autocomplete import");
  assert(form.includes("country-suggestions"), "country datalist");
  assert(form.includes("isForeign"), "foreign mode flag");
  assert(form.includes("!isForeign"), "conditional BR fields");
  assert(form.includes("country: isForeign ? countryCode : null"), "save payload country");
  assert(form.includes("defaultCountry"), "stadium link preserves country");
  assert(list.includes("countryDisplayName"), "list shows country");
  console.log("OK form and list wired");

  const created = await api("POST", "/admin/opponents", {
    name: `${TAG}-UY`,
    city: "Montevidéu",
    country: "URY",
  });
  assert(created.status === 201, `create URY ${created.status}`);
  id = created.data.id;
  assert(created.data.country === "URY", "URY saved");
  assert(!created.data.state, "state cleared");
  console.log("OK API round-trip foreign opponent");

  const byState = await fetch(`${BASE}/opponents/by-state`);
  const byStateData = await byState.json();
  assert(byStateData.unknown == null, "foreign not in sem-estado");
  console.log("OK foreign excluded from by-state after form save path");

  const got = await api("GET", `/admin/opponents/${id}`);
  assert(got.status === 200, `get opponent ${got.status}`);
  assert(got.data.country === "URY", "GET returns country");
  assert(!got.data.state, "GET clears state for foreign");
  console.log("OK admin GET returns country");
} finally {
  if (id != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [id]);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage D admin country form smoke PASSED ===");
