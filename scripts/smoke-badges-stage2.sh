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

echo "=== Start API :9885 ==="
PORT=9885 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-badges2.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9885/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9885/api/healthz" >/dev/null || {
  echo "API failed"; tail -40 /tmp/api-badges2.log; exit 1;
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
const BASE = "http://127.0.0.1:9885/api";

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
    `SELECT id FROM players ORDER BY id LIMIT 1`,
  );
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  assert(players[0] && managers[0], "need player and manager");
  const playerId = players[0].id;
  const managerId = managers[0].id;

  const labelP = `Smoke Cria ${Date.now()}`;
  const labelM = `Smoke Campeão ${Date.now()}`;

  const p = await api("POST", `/admin/badges/player/${playerId}`, {
    label: labelP,
  });
  assert(p.status === 201, `player badge 201 got ${p.status}`);
  assert(p.data.source === "manual", "manual source");
  console.log("OK create player manual badge", p.data.id);

  const m = await api("POST", `/admin/badges/manager/${managerId}`, {
    label: labelM,
    seasonYear: 2023,
  });
  assert(m.status === 201, `manager badge 201 got ${m.status}`);
  assert(m.data.seasonYear === 2023, "seasonYear");
  console.log("OK create manager manual badge", m.data.id);

  const listP = await api("GET", `/admin/badges/player/${playerId}`);
  assert(listP.status === 200, "list player");
  assert(
    listP.data.some((b) => b.id === p.data.id),
    "player list contains badge",
  );

  const listM = await api("GET", `/admin/managers`);
  assert(listM.status === 200 && Array.isArray(listM.data), "GET managers");
  console.log(`OK GET /admin/managers (${listM.data.length})`);

  const delP = await api("DELETE", `/admin/badges/${p.data.id}`);
  assert(delP.status === 200, "delete player badge");
  const delM = await api("DELETE", `/admin/badges/${m.data.id}`);
  assert(delM.status === 200, "delete manager badge");
  console.log("OK delete manual badges");

  // auto badge cannot be deleted via admin
  await pool.query(
    `INSERT INTO entity_badges
      (entity_type, entity_id, label, source, auto_kind, season_year)
     VALUES ('player', $1, 'Artilheiro Smoke', 'auto', 'top_scorer', 2098)
     RETURNING id`,
    [playerId],
  ).then(async (r) => {
    const autoId = r.rows[0].id;
    const delAuto = await api("DELETE", `/admin/badges/${autoId}`);
    assert(delAuto.status === 400, `auto delete should 400 got ${delAuto.status}`);
    await pool.query(`DELETE FROM entity_badges WHERE id = $1`, [autoId]);
    console.log("OK auto badge delete blocked");
  });
} finally {
  await pool.end();
}

console.log("=== Stage 2 badges admin smoke PASSED ===");
NODE
