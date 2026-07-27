/**
 * Smoke: admin stadiums CRUD + country + home-clubs linking.
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

const TAG = `smoke-stadium-${Date.now()}`;
let stadiumId = null;
let oppId = null;

try {
  console.log("=== Admin stadiums smoke ===");

  const form = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/AdminStadiumDetail.tsx",
    "utf8",
  );
  assert(form.includes("lookupCountriesByName"), "country autocomplete");
  assert(form.includes("StadiumClubsSection"), "clubs tab");
  assert(form.includes("home-clubs"), "home clubs API wiring");

  const created = await api("POST", "/admin/stadiums", {
    name: `${TAG}-BR`,
    city: "Maceió",
    state: "AL",
    capacity: 19000,
  });
  assert(created.status === 201, `create BR ${created.status}`);
  stadiumId = created.data.id;
  assert(!created.data.country, "BR has no country");

  const foreign = await api("POST", "/admin/stadiums", {
    name: `${TAG}-UY`,
    city: "Montevidéu",
    country: "URY",
  });
  assert(foreign.status === 201, `create URY ${foreign.status}`);
  const foreignId = foreign.data.id;
  assert(foreign.data.country === "URY", "URY saved");
  assert(!foreign.data.state, "state cleared");

  const both = await api("POST", "/admin/stadiums", {
    name: `${TAG}-bad`,
    state: "AL",
    country: "ARG",
  });
  assert(both.status === 400, "reject state+country");

  const list = await api("GET", "/admin/stadiums");
  assert(list.status === 200, "list");
  assert(list.data.some((s) => s.id === stadiumId), "in list");

  const { rows: opps } = await pool.query(
    `INSERT INTO opponents (name, city, state) VALUES ($1, 'Maceió', 'AL') RETURNING id`,
    [`${TAG}-Club`],
  );
  oppId = opps[0].id;

  const link = await api("PUT", `/admin/stadiums/${stadiumId}/home-clubs`, {
    opponentIds: [oppId],
  });
  assert(link.status === 200, `link clubs ${link.status}`);
  assert(link.data.homeClubs?.some((c) => c.id === oppId), "club linked");

  const detail = await api("GET", `/admin/stadiums/${stadiumId}`);
  assert(detail.status === 200, "detail");
  assert(detail.data.homeClubs?.length === 1, "detail has club");

  const { rows: oppRow } = await pool.query(
    `SELECT home_stadium_id FROM opponents WHERE id = $1`,
    [oppId],
  );
  assert(oppRow[0].home_stadium_id === stadiumId, "opponent home_stadium_id set");

  await api("DELETE", `/admin/stadiums/${foreignId}`);
  console.log("OK admin stadiums smoke PASSED");
} finally {
  if (oppId != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [oppId]);
  if (stadiumId != null) await pool.query(`DELETE FROM stadiums WHERE id = $1`, [stadiumId]);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.query(`DELETE FROM stadiums WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
}
