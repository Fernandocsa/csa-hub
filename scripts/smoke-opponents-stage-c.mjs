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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9892/api";
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

console.log("=== Apply alter-opponents-stage-c.sql ===");
await pool.query(readFileSync("lib/db/sql/alter-opponents-stage-c.sql", "utf8"));

const TAG = `smoke-opp-c-${Date.now()}`;
let stadiumId = null;
let opponentId = null;

try {
  const { rows: cols } = await pool.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND (
      (table_name='stadiums' AND column_name='state')
      OR (table_name='opponents' AND column_name='home_stadium_id')
    ) ORDER BY 1,2`);
  assert(cols.length === 2, "stage C columns missing");
  console.log("OK stadiums.state + opponents.home_stadium_id");

  const stadium = await api("POST", "/admin/stadiums", {
    name: `${TAG} Arena`,
    city: "Curitiba",
    state: "pr",
    capacity: 40000,
  });
  assert(stadium.status === 201, `stadium create ${stadium.status}`);
  assert(stadium.data.state === "PR", "stadium UF");
  stadiumId = stadium.data.id;
  console.log("OK create stadium with city/UF/capacity");

  const search = await api(
    "GET",
    `/admin/stadiums/search?q=${encodeURIComponent(TAG)}`,
  );
  assert(search.status === 200, "search");
  assert(search.data.some((s) => s.id === stadiumId), "search finds stadium");
  console.log("OK stadium search");

  const opponent = await api("POST", "/admin/opponents", {
    name: `${TAG} FC`,
    city: "Curitiba",
    state: "PR",
    homeStadiumId: stadiumId,
  });
  assert(opponent.status === 201, `opponent ${opponent.status}`);
  opponentId = opponent.data.id;
  assert(opponent.data.homeStadiumId === stadiumId, "linked");
  console.log("OK create opponent linked to stadium");

  const detail = await api("GET", `/admin/opponents/${opponentId}`);
  assert(detail.status === 200, "detail");
  assert(detail.data.homeStadium?.id === stadiumId, "homeStadium nested");
  console.log("OK opponent detail includes homeStadium");

  const publicStadium = await fetch(`${BASE}/stadiums/${stadiumId}`);
  const pub = await publicStadium.json();
  assert(publicStadium.status === 200, "public stadium");
  assert(pub.state === "PR", "public state");
  assert(
    Array.isArray(pub.homeClubs) && pub.homeClubs.some((c) => c.id === opponentId),
    "homeClubs",
  );
  console.log("OK public stadium exposes homeClubs");

  const unlink = await api("PUT", `/admin/opponents/${opponentId}`, {
    name: `${TAG} FC`,
    city: "Curitiba",
    state: "PR",
    homeStadiumId: null,
  });
  assert(unlink.status === 200 && unlink.data.homeStadiumId == null, "unlink");
  console.log("OK unlink home stadium");
} finally {
  if (opponentId != null) {
    await pool.query(`DELETE FROM opponents WHERE id = $1`, [opponentId]);
  }
  if (stadiumId != null) {
    await pool.query(`DELETE FROM stadiums WHERE id = $1`, [stadiumId]);
  }
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.query(`DELETE FROM stadiums WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage C home stadium smoke PASSED ===");
