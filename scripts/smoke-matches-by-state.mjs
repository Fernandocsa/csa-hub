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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9893/api";
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

const TAG = `smoke-state-d-${Date.now()}`;
let oppA = null;
let oppB = null;
let compId = null;
let matchIds = [];

try {
  const createdA = await api("POST", "/admin/opponents", {
    name: `${TAG} Alfa`,
    city: "Maceió",
    state: "AL",
  });
  const createdB = await api("POST", "/admin/opponents", {
    name: `${TAG} Beta`,
    city: "Arapiraca",
    state: "AL",
  });
  assert(createdA.status === 201 && createdB.status === 201, "create opponents");
  oppA = createdA.data.id;
  oppB = createdB.data.id;

  const { rows: comps } = await pool.query(
    `SELECT id FROM competitions ORDER BY id LIMIT 1`,
  );
  assert(comps[0], "need competition");
  compId = comps[0].id;

  for (const [oppId, gf, ga, result] of [
    [oppA, 2, 0, "win"],
    [oppB, 1, 1, "draw"],
  ]) {
    const { rows } = await pool.query(
      `INSERT INTO matches
        (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
         competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
       VALUES ('2093-03-01', '2093', $1, $2, $3, $4, 'home', $5, false, false, 0, $6)
       RETURNING id`,
      [oppId, gf, ga, result, compId, TAG],
    );
    matchIds.push(rows[0].id);
  }

  const list = await fetch(`${BASE}/opponents/by-state`);
  const listData = await list.json();
  assert(list.status === 200, "by-state list");
  const al = listData.states.find((s) => s.state === "AL");
  assert(al, "AL present");
  assert(al.opponentCount >= 2, `AL opponents ${al.opponentCount}`);
  assert(al.matches >= 2, `AL matches ${al.matches}`);
  console.log("OK GET /opponents/by-state includes AL");

  const detail = await fetch(`${BASE}/opponents/by-state/AL`);
  const detailData = await detail.json();
  assert(detail.status === 200, "by-state AL");
  assert(detailData.state === "AL", "state");
  assert(
    detailData.opponents.some((o) => o.id === oppA)
      && detailData.opponents.some((o) => o.id === oppB),
    "both opponents listed",
  );
  console.log("OK GET /opponents/by-state/AL lists teams");

  const bad = await fetch(`${BASE}/opponents/by-state/XX`);
  assert(bad.status === 400, "invalid UF");
  console.log("OK invalid UF rejected");
} finally {
  if (matchIds.length) {
    await pool.query(`DELETE FROM matches WHERE id = ANY($1::int[])`, [matchIds]);
  }
  if (oppA != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [oppA]);
  if (oppB != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [oppB]);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.query(`DELETE FROM matches WHERE scorers = $1`, [TAG]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage D CSA x Estados smoke PASSED ===");
