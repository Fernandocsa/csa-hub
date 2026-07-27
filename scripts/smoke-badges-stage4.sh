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

echo "=== Start API :9887 ==="
PORT=9887 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-badges4.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9887/api/healthz" >/dev/null && break
  sleep 0.25
done

node --input-type=module <<'NODE'
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

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });
const BASE = "http://127.0.0.1:9887/api";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 1`,
  );
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  const playerId = players[0].id;
  const managerId = managers[0].id;
  const labelP = `Smoke Público Player ${Date.now()}`;
  const labelM = `Smoke Público Manager ${Date.now()}`;

  const insP = await pool.query(
    `INSERT INTO entity_badges (entity_type, entity_id, label, source)
     VALUES ('player', $1, $2, 'manual') RETURNING id`,
    [playerId, labelP],
  );
  const insM = await pool.query(
    `INSERT INTO entity_badges (entity_type, entity_id, label, source)
     VALUES ('manager', $1, $2, 'manual') RETURNING id`,
    [managerId, labelM],
  );
  const badgeP = insP.rows[0].id;
  const badgeM = insM.rows[0].id;

  const pRes = await fetch(`${BASE}/players/${playerId}`);
  const player = await pRes.json();
  assert(pRes.status === 200, "player detail");
  assert(Array.isArray(player.badges), "player.badges array");
  assert(
    player.badges.some((b) => b.id === badgeP && b.label === labelP),
    "player has smoke badge",
  );
  console.log(`OK GET /players/${playerId} badges=${player.badges.length}`);

  const mRes = await fetch(`${BASE}/managers/${managerId}`);
  const manager = await mRes.json();
  assert(mRes.status === 200, "manager detail");
  assert(Array.isArray(manager.badges), "manager.badges array");
  assert(
    manager.badges.some((b) => b.id === badgeM && b.label === labelM),
    "manager has smoke badge",
  );
  console.log(`OK GET /managers/${managerId} badges=${manager.badges.length}`);

  // player without badges still returns []
  const { rows: emptyCandidates } = await pool.query(`
    SELECT p.id FROM players p
    WHERE NOT EXISTS (
      SELECT 1 FROM entity_badges b
      WHERE b.entity_type='player' AND b.entity_id=p.id
    )
    ORDER BY p.id LIMIT 1
  `);
  if (emptyCandidates[0]) {
    const empty = await (await fetch(`${BASE}/players/${emptyCandidates[0].id}`)).json();
    assert(Array.isArray(empty.badges) && empty.badges.length === 0, "empty badges []");
    console.log(`OK player ${emptyCandidates[0].id} badges=[]`);
  }

  await pool.query(`DELETE FROM entity_badges WHERE id IN ($1, $2)`, [
    badgeP,
    badgeM,
  ]);
  console.log("OK cleanup");
} finally {
  await pool.end();
}

console.log("=== Stage 4 public badges smoke PASSED ===");
NODE
