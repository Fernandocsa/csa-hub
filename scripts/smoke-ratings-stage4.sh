#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "=== Confirm ratings table on Supabase ==="
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
if (!url) throw new Error("DATABASE_URL missing");
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });
try {
  const sql = readFileSync("lib/db/sql/create-ratings.sql", "utf8");
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ratings'
    ORDER BY column_name
  `);
  console.log("OK ratings columns:", rows.map((r) => r.column_name).join(", "));
  if (rows.length !== 6) throw new Error("expected 6 columns on ratings");

  const { rows: idx } = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public' AND tablename='ratings'
    ORDER BY indexname
  `);
  console.log("OK indexes:", idx.map((r) => r.indexname).join(", "));
} finally {
  await pool.end();
}
NODE

echo "=== Confirm weight_kg column ==="
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
try {
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='players'
      AND column_name='weight_kg'
  `);
  if (!rows.length) throw new Error("weight_kg missing");
  console.log("OK weight_kg present");
} finally {
  await pool.end();
}
NODE

echo "=== Build api-server ==="
npm exec -- pnpm --filter @workspace/api-server run build
echo "OK api-server build"

echo "=== Build portal-marujo ==="
npm exec -- pnpm --filter @workspace/portal-marujo run build
echo "OK portal build"

echo "=== Start API :9884 ==="
PORT=9884 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-ratings.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9884/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9884/api/healthz" >/dev/null || {
  echo "API failed"; tail -40 /tmp/api-ratings.log; exit 1;
}
echo "OK API up"

echo "=== Cross-entity vote smoke (same voterToken) ==="
node --input-type=module <<'NODE'
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

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

const BASE = "http://127.0.0.1:9884/api";
const voterToken = `smoke-stage4-${crypto.randomUUID()}`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

try {
  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 1`,
  );
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  const { rows: matches } = await pool.query(
    `SELECT id FROM matches ORDER BY id LIMIT 1`,
  );
  assert(players[0], "need player");
  assert(managers[0], "need manager");
  assert(matches[0], "need match");

  // Clear any leftover smoke rows from prior interrupted runs
  await pool.query(
    `DELETE FROM ratings WHERE voter_token LIKE 'smoke-stage4-%'`,
  );

  const playerId = players[0].id;
  const managerId = managers[0].id;
  const matchId = matches[0].id;
  console.log(`entities: player=${playerId} manager=${managerId} match=${matchId}`);
  console.log(`voterToken=${voterToken}`);

  // empty GET
  for (const [type, id] of [
    ["player", playerId],
    ["manager", managerId],
    ["match", matchId],
  ]) {
    const r = await json(
      await fetch(
        `${BASE}/ratings/${type}/${id}?voterToken=${encodeURIComponent(voterToken)}`,
      ),
    );
    assert(r.status === 200, `GET ${type} status ${r.status}`);
    assert(r.body.myRating == null, `GET ${type} should have no myRating yet`);
  }

  // vote all three with SAME token
  const votes = [
    ["player", playerId, 5, "Ídolo"],
    ["manager", managerId, 4, "Mestre"],
    ["match", matchId, 3, "Bom jogo"],
  ];

  for (const [type, id, stars, expectedLabel] of votes) {
    const r = await json(
      await fetch(`${BASE}/ratings/${type}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, voterToken }),
      }),
    );
    assert(r.status === 201, `POST ${type} expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.myRating === stars, `POST ${type} myRating`);
    assert(r.body.label === expectedLabel, `POST ${type} label got ${r.body.label}`);
    console.log(`OK vote ${type} ${stars}★ → ${r.body.label} (avg ${r.body.average}, n=${r.body.count})`);
  }

  // duplicate on player should 409 — must NOT block the other votes already cast
  const dup = await json(
    await fetch(`${BASE}/ratings/player/${playerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: 1, voterToken }),
    }),
  );
  assert(dup.status === 409, `dup player expected 409 got ${dup.status}`);
  console.log("OK duplicate player vote → 409");

  // re-GET all three: each still has its own myRating
  for (const [type, id, stars, expectedLabel] of votes) {
    const r = await json(
      await fetch(
        `${BASE}/ratings/${type}/${id}?voterToken=${encodeURIComponent(voterToken)}`,
      ),
    );
    assert(r.status === 200, `re-GET ${type}`);
    assert(r.body.myRating === stars, `re-GET ${type} myRating=${r.body.myRating}`);
    assert(r.body.label === expectedLabel, `re-GET ${type} label`);
    assert(r.body.count >= 1, `re-GET ${type} count`);
    console.log(`OK re-GET ${type}: myRating=${r.body.myRating} label=${r.body.label}`);
  }

  // different token can still vote the same player
  const other = `smoke-stage4-other-${crypto.randomUUID()}`;
  const otherVote = await json(
    await fetch(`${BASE}/ratings/player/${playerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars: 2, voterToken: other }),
    }),
  );
  assert(otherVote.status === 201, `other voter 201 got ${otherVote.status}`);
  assert(otherVote.body.count >= 2, "aggregate should include both votes");
  console.log(`OK second device voted player → count=${otherVote.body.count} avg=${otherVote.body.average}`);

  await pool.query(`DELETE FROM ratings WHERE voter_token LIKE 'smoke-stage4-%'`);
  console.log("OK cleanup smoke votes");
} finally {
  await pool.end();
}

console.log("=== Stage 4 ratings smoke PASSED ===");
NODE
