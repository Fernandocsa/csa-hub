#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "=== Build api-server ==="
npm exec -- pnpm --filter @workspace/api-server run build
echo "=== Build portal ==="
npm exec -- pnpm --filter @workspace/portal-marujo run build

echo "=== Start API :9886 ==="
PORT=9886 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-badges3.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9886/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9886/api/healthz" >/dev/null || {
  echo "API failed"; tail -40 /tmp/api-badges3.log; exit 1;
}

node --input-type=module <<'NODE'
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

const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = crypto
  .createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });
const BASE = "http://127.0.0.1:9886/api";
const YEAR = 2097;

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

try {
  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 3`,
  );
  assert(players.length >= 3, "need ≥3 players");
  const [p1, p2, p3] = players.map((r) => r.id);

  await pool.query(`DELETE FROM entity_badges WHERE season_year = $1`, [YEAR]);
  await pool.query(`DELETE FROM player_season_stats WHERE season = $1`, [
    String(YEAR),
  ]);
  await pool.query(`DELETE FROM seasons WHERE year = $1`, [YEAR]);
  await pool.query(`INSERT INTO seasons (year) VALUES ($1)`, [YEAR]);

  // Tie on goals (p1,p2 = 10); p3 has more assists alone
  await pool.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES
       ($1, $4, 10, 10, 1),
       ($2, $4, 10, 10, 1),
       ($3, $4, 10, 2, 8)`,
    [p1, p2, p3, String(YEAR)],
  );

  const list = await api("GET", "/admin/seasons");
  assert(list.status === 200, "list seasons");
  assert(
    list.data.some((s) => s.year === YEAR),
    "smoke year listed",
  );

  const verify = await api("PUT", `/admin/seasons/${YEAR}/verification`, {
    verified: true,
  });
  assert(verify.status === 200, `verify 200 got ${verify.status}`);
  assert(verify.data.statsFullyVerified === true, "flag true");
  assert(verify.data.badges.created === 3, `created 3 got ${verify.data.badges.created}`);
  assert(
    verify.data.badges.topScorerIds.sort().join(",") ===
      [p1, p2].sort((a, b) => a - b).join(","),
    `artilheiros tie expected ${p1},${p2} got ${verify.data.badges.topScorerIds}`,
  );
  assert(
    verify.data.badges.topAssisterIds.join(",") === String(p3),
    `garçom ${p3}`,
  );
  console.log("OK verify + tie Artilheiro + single Garçom");

  const { rows: badges } = await pool.query(
    `SELECT entity_id, auto_kind, label FROM entity_badges
     WHERE season_year = $1 AND source = 'auto' ORDER BY auto_kind, entity_id`,
    [YEAR],
  );
  assert(badges.length === 3, `db badges 3 got ${badges.length}`);
  assert(
    badges.filter((b) => b.auto_kind === "top_scorer").length === 2,
    "2 scorers in db",
  );

  const recalcBlocked = await api(
    "POST",
    `/admin/seasons/${YEAR}/recalculate-badges`,
  );
  assert(recalcBlocked.status === 200, "recalc while verified");
  assert(recalcBlocked.data.created === 3, "recalc still 3");

  const unverify = await api("PUT", `/admin/seasons/${YEAR}/verification`, {
    verified: false,
  });
  assert(unverify.status === 200, "unverify");
  assert(unverify.data.statsFullyVerified === false, "flag false");
  assert(unverify.data.badges.cleared === 3, "cleared 3");

  const { rows: left } = await pool.query(
    `SELECT count(*)::int AS n FROM entity_badges WHERE season_year = $1`,
    [YEAR],
  );
  assert(left[0].n === 0, "no badges left");

  const recalcUnverified = await api(
    "POST",
    `/admin/seasons/${YEAR}/recalculate-badges`,
  );
  assert(recalcUnverified.status === 400, "recalc requires verified");

  console.log("OK unverify clears auto badges; recalc gated");
} finally {
  await pool.query(`DELETE FROM entity_badges WHERE season_year = $1`, [YEAR]);
  await pool.query(`DELETE FROM player_season_stats WHERE season = $1`, [
    String(YEAR),
  ]);
  await pool.query(`DELETE FROM seasons WHERE year = $1`, [YEAR]);
  await pool.end();
  console.log("OK cleanup year", YEAR);
}

console.log("=== Stage 3 badges auto smoke PASSED ===");
NODE
