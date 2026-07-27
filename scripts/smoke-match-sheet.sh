#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "=== Create match sheet tables ==="
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
const sql = readFileSync("lib/db/sql/create-match-sheet.sql", "utf8");
try {
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name IN ('match_lineups','match_goals','match_cards')
    ORDER BY table_name
  `);
  console.log("OK tables:", rows.map((r) => r.table_name).join(", "));
} finally {
  await pool.end();
}
NODE

echo "=== Build api-server ==="
npm exec -- pnpm --filter @workspace/api-server run build >/tmp/api-build-sheet.log 2>&1
tail -3 /tmp/api-build-sheet.log

echo "=== Start API :9880 ==="
PORT=9880 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-sheet.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9880/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9880/api/healthz" >/dev/null || {
  echo "API failed"; tail -50 /tmp/api-sheet.log; exit 1;
}

echo "=== Pick real match + 2 players from its season ==="
PICK=$(node --input-type=module <<'NODE'
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
  const { rows: matches } = await pool.query(`
    SELECT m.id, m.season, m.match_date, o.name AS opponent, m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    WHERE m.result <> 'unknown' AND m.is_friendly = false
    ORDER BY m.match_date DESC
    LIMIT 50
  `);

  for (const match of matches) {
    const { rows: players } = await pool.query(
      `
      SELECT p.id, p.name, p.position
      FROM player_season_stats s
      JOIN players p ON p.id = s.player_id
      WHERE s.season = $1
      ORDER BY s.appearances DESC, p.name
      LIMIT 5
      `,
      [match.season],
    );
    if (players.length >= 2) {
      console.log(JSON.stringify({
        matchId: match.id,
        season: match.season,
        date: match.match_date,
        opponent: match.opponent,
        score: `${match.goals_for ?? "?"}-${match.goals_against ?? "?"}`,
        players: players.slice(0, 3).map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position,
        })),
      }));
      process.exit(0);
    }
  }
  throw new Error("No match with >=2 season players found");
} finally {
  await pool.end();
}
NODE
)
echo "$PICK"

MATCH_ID=$(echo "$PICK" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).matchId))")
P1=$(echo "$PICK" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);console.log(JSON.stringify(j.players[0]))})")
P2=$(echo "$PICK" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);console.log(JSON.stringify(j.players[1]))})")
P1_ID=$(echo "$P1" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).id))")
P2_ID=$(echo "$P2" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).id))")
P1_NAME=$(echo "$P1" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).name))")
P2_NAME=$(echo "$P2" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).name))")
P1_POS=$(echo "$P1" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).position||'ATA'))")
P2_POS=$(echo "$P2" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).position||'MEI'))")

TOKEN=$(node --input-type=module <<'NODE'
import crypto from "node:crypto";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
process.stdout.write(
  crypto.createHmac("sha256", secret).update(`marujo-admin:${password}`).digest("hex"),
);
NODE
)

PAYLOAD=$(node --input-type=module <<NODE
const p1 = { id: Number("$P1_ID"), name: process.env.P1N, pos: process.env.P1P };
NODE
)

# Build JSON payload safely with node
export P1_ID P2_ID P1_NAME P2_NAME P1_POS P2_POS
PAYLOAD=$(node --input-type=module <<'NODE'
const payload = {
  lineups: [
    {
      playerId: Number(process.env.P1_ID),
      playerName: process.env.P1_NAME,
      role: "starter",
      shirtNumber: 9,
      position: process.env.P1_POS || "ATA",
      sortOrder: 0,
    },
    {
      playerId: Number(process.env.P2_ID),
      playerName: process.env.P2_NAME,
      role: "bench",
      shirtNumber: 17,
      position: process.env.P2_POS || "MEI",
      sortOrder: 1,
    },
  ],
  goals: [
    {
      scorerPlayerId: Number(process.env.P1_ID),
      minute: 23,
      injuryTimeMinute: null,
      assistPlayerId: Number(process.env.P2_ID),
    },
    {
      scorerPlayerId: Number(process.env.P1_ID),
      minute: 45,
      injuryTimeMinute: 2,
      assistPlayerId: null,
    },
  ],
  cards: [
    {
      cardType: "yellow",
      playerId: Number(process.env.P2_ID),
      minute: 40,
    },
  ],
};
process.stdout.write(JSON.stringify(payload));
NODE
)

echo "=== PUT /api/admin/matches/$MATCH_ID/sheet ==="
PUT=$(curl -sS -w "\nHTTP:%{http_code}" -X PUT "http://127.0.0.1:9880/api/admin/matches/${MATCH_ID}/sheet" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
PUT_BODY=$(echo "$PUT" | sed '$d')
PUT_CODE=$(echo "$PUT" | tail -1 | sed 's/HTTP://')
echo "status=$PUT_CODE"
echo "$PUT_BODY" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s); console.log(JSON.stringify({lineups:j.lineups?.length,goals:j.goals?.length,cards:j.cards?.length,sampleGoal:j.goals?.[0],sampleCard:j.cards?.[0]},null,2))})"
test "$PUT_CODE" = "200"

echo "=== GET /api/matches/$MATCH_ID (public detail with sheet) ==="
GET=$(curl -sS -w "\nHTTP:%{http_code}" "http://127.0.0.1:9880/api/matches/${MATCH_ID}")
GET_BODY=$(echo "$GET" | sed '$d')
GET_CODE=$(echo "$GET" | tail -1 | sed 's/HTTP://')
echo "status=$GET_CODE"
echo "$GET_BODY" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s); console.log(JSON.stringify({id:j.id,date:j.date,opponent:j.opponent,season:j.season,score:\`\${j.goalsFor}-\${j.goalsAgainst}\`,scorers:j.scorers,lineups:j.lineups,goals:j.goals,cards:j.cards},null,2))})"
test "$GET_CODE" = "200"
echo "$GET_BODY" | grep -q '"side":"csa"'
echo "$GET_BODY" | grep -q '"role":"starter"'

echo
echo "MATCH_SHEET_SMOKE_OK matchId=$MATCH_ID"
