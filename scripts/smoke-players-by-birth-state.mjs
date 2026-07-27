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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9894/api";
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

console.log("=== Apply alter-players-birth-state-idx.sql ===");
await pool.query(
  readFileSync("lib/db/sql/alter-players-birth-state-idx.sql", "utf8"),
);

const TAG = `smoke-birth-e-${Date.now()}`;
const createdIds = [];

try {
  for (const [name, city, state] of [
    [`${TAG} A`, "Maceió", "al"],
    [`${TAG} B`, "Arapiraca", "AL"],
  ]) {
    const r = await api("POST", "/admin/players", {
      name,
      birthCity: city,
      birthState: state,
      nationality: "Brasil",
    });
    assert(r.status === 201 || r.status === 200, `create player ${r.status} ${JSON.stringify(r.data)}`);
    createdIds.push(r.data.id);
  }

  // Normalize lowercase al -> AL in list
  const list = await fetch(`${BASE}/players/by-birth-state`);
  const listData = await list.json();
  assert(list.status === 200, "list");
  const al = listData.states.find((s) => s.state === "AL");
  assert(al, "AL group");
  assert(al.playerCount >= 2, `AL count ${al.playerCount}`);
  console.log("OK GET /players/by-birth-state groups AL");

  const detail = await fetch(`${BASE}/players/by-birth-state/AL`);
  const detailData = await detail.json();
  assert(detail.status === 200, "detail");
  assert(detailData.state === "AL", "state");
  assert(
    detailData.players.some((p) => createdIds.includes(p.id)),
    "created players listed",
  );
  console.log("OK GET /players/by-birth-state/AL");

  const bad = await fetch(`${BASE}/players/by-birth-state/XX`);
  assert(bad.status === 400, "invalid UF");
  console.log("OK invalid UF rejected");
} finally {
  if (createdIds.length) {
    await pool.query(`DELETE FROM players WHERE id = ANY($1::int[])`, [createdIds]);
  }
  await pool.query(`DELETE FROM players WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage E players by birth state smoke PASSED ===");
