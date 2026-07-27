#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "=== Apply alter-players-profile.sql ==="
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
const sql = readFileSync("lib/db/sql/alter-players-profile.sql", "utf8");
try {
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='players'
      AND column_name IN (
        'full_name','birth_date','birth_city','birth_state',
        'birth_country','preferred_foot','height_cm'
      )
    ORDER BY column_name
  `);
  console.log("OK columns:", rows.map((r) => r.column_name).join(", "));
  if (rows.length !== 7) throw new Error("expected 7 new columns");
} finally {
  await pool.end();
}
NODE

echo "=== Build api-server ==="
npm exec -- pnpm --filter @workspace/api-server run build >/tmp/api-build-profile.log 2>&1
tail -3 /tmp/api-build-profile.log

echo "=== Build portal (admin form) ==="
npm exec -- pnpm --filter @workspace/portal-marujo run build >/tmp/portal-build-profile.log 2>&1
tail -5 /tmp/portal-build-profile.log

echo "=== Start API :9883 ==="
PORT=9883 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-profile.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9883/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9883/api/healthz" >/dev/null || {
  echo "API failed"; tail -40 /tmp/api-profile.log; exit 1;
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
let playerId;
let playerName;
try {
  const { rows } = await pool.query(`SELECT id, name FROM players ORDER BY id LIMIT 1`);
  if (!rows[0]) throw new Error("no players");
  playerId = rows[0].id;
  playerName = rows[0].name;
} finally {
  await pool.end();
}

const base = "http://127.0.0.1:9883";
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const list = await (await fetch(`${base}/api/admin/players`, { headers })).json();
const orig = list.find((p) => p.id === playerId);
if (!orig) throw new Error("player missing from admin list");
console.log(`Using player #${playerId} ${playerName}`);

const payload = {
  name: orig.name,
  fullName: "Nome Completo Smoke Test",
  position: orig.position,
  nationality: orig.nationality,
  birthYear: orig.birthYear,
  birthDate: "1995-03-15",
  birthCity: "Maceió",
  birthState: "AL",
  birthCountry: "Brasil",
  preferredFoot: "destro",
  heightCm: 178,
};

const putRes = await fetch(`${base}/api/admin/players/${playerId}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(payload),
});
const putBody = await putRes.json();
console.log("PUT status=", putRes.status);
console.log(
  JSON.stringify(
    {
      id: putBody.id,
      name: putBody.name,
      fullName: putBody.fullName,
      birthDate: putBody.birthDate,
      birthCity: putBody.birthCity,
      birthState: putBody.birthState,
      birthCountry: putBody.birthCountry,
      preferredFoot: putBody.preferredFoot,
      heightCm: putBody.heightCm,
    },
    null,
    2,
  ),
);
if (!putRes.ok) throw new Error("PUT failed");

const getRes = await fetch(`${base}/api/players/${playerId}`);
const pub = await getRes.json();
console.log("GET public status=", getRes.status);
for (const k of [
  "fullName",
  "birthDate",
  "birthCity",
  "birthState",
  "birthCountry",
  "preferredFoot",
  "heightCm",
]) {
  if (pub[k] == null) throw new Error("public missing " + k);
}
console.log(
  JSON.stringify(
    {
      id: pub.id,
      name: pub.name,
      fullName: pub.fullName,
      birthDate: pub.birthDate,
      birthCity: pub.birthCity,
      preferredFoot: pub.preferredFoot,
      heightCm: pub.heightCm,
    },
    null,
    2,
  ),
);
if (!getRes.ok) throw new Error("GET public failed");

const restore = {
  name: orig.name,
  fullName: orig.fullName ?? null,
  position: orig.position ?? null,
  nationality: orig.nationality ?? null,
  birthYear: orig.birthYear ?? null,
  birthDate: orig.birthDate ?? null,
  birthCity: orig.birthCity ?? null,
  birthState: orig.birthState ?? null,
  birthCountry: orig.birthCountry ?? null,
  preferredFoot: orig.preferredFoot ?? null,
  heightCm: orig.heightCm ?? null,
};
await fetch(`${base}/api/admin/players/${playerId}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(restore),
});
console.log(`Restored original profile fields for #${playerId}`);
console.log(`PLAYER_PROFILE_SMOKE_OK playerId=${playerId}`);
NODE
