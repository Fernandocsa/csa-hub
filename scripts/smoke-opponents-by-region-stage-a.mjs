import { readFileSync } from "node:fs";
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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9896/api";

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

const TAG = `smoke-region-a-${Date.now()}`;
let tempOppId = null;
let compId = null;
let matchId = null;

try {
  console.log("=== Stage A GET /opponents/by-region ===");

  const list = await fetch(`${BASE}/opponents/by-region`);
  const listData = await list.json();
  assert(list.status === 200, `by-region list ${list.status}`);
  assert(listData.regions?.length === 5, `regions ${listData.regions?.length}`);
  console.log("OK list returns 5 regions with matches");

  const nordeste = listData.regions.find((r) => r.slug === "nordeste");
  assert(nordeste?.region === "Nordeste", "Nordeste name");
  assert(nordeste?.stateCount === 9, `Nordeste stateCount ${nordeste?.stateCount}`);
  assert(nordeste?.matches >= 1000, `Nordeste matches ${nordeste?.matches}`);
  console.log("OK Nordeste aggregate");

  const detail = await fetch(`${BASE}/opponents/by-region/nordeste`);
  const detailData = await detail.json();
  assert(detail.status === 200, "nordeste detail");
  assert(detailData.region === "Nordeste", "detail region");
  assert(detailData.slug === "nordeste", "detail slug");
  assert(detailData.states?.length === 9, `detail states ${detailData.states?.length}`);
  assert(detailData.statesBreakdown?.length === 9, `breakdown ${detailData.statesBreakdown?.length}`);
  assert(detailData.statesBreakdown.some((s) => s.state === "AL"), "AL in breakdown");
  assert(detailData.opponents?.length >= 50, "opponents list");
  assert(detailData.matches === nordeste.matches, "list/detail match count");
  console.log("OK GET /opponents/by-region/nordeste detail + UF breakdown");

  const sul = await fetch(`${BASE}/opponents/by-region/sul`);
  const sulData = await sul.json();
  assert(sul.status === 200, "sul detail");
  assert(sulData.states?.join(",") === "PR,RS,SC", `sul states ${sulData.states}`);
  console.log("OK Sul includes PR, RS, SC");

  const bad = await fetch(`${BASE}/opponents/by-region/invalido`);
  assert(bad.status === 400, "invalid slug");
  console.log("OK invalid slug rejected");

  const foreign = await fetch(`${BASE}/opponents/by-foreign`);
  const foreignData = await foreign.json();
  assert(foreign.status === 200, "by-foreign");
  const totalForeign = foreignData.overall?.matches ?? 0;
  const totalRegions = listData.regions.reduce((s, r) => s + r.matches, 0);
  assert(totalRegions >= 1400, "regions total matches");
  console.log(`OK ${totalRegions} regional matches; ${totalForeign} foreign separate`);

  const { rows: comps } = await pool.query(`SELECT id FROM competitions ORDER BY id LIMIT 1`);
  compId = comps[0].id;
  const { rows: inserted } = await pool.query(
    `INSERT INTO opponents (name, state) VALUES ($1, 'AL') RETURNING id`,
    [`${TAG}-AL`],
  );
  tempOppId = inserted[0].id;
  const { rows: matchRows } = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
       competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2095-01-01', '2095', $1, 2, 0, 'win', 'home', $2, false, false, 0, $3)
     RETURNING id`,
    [tempOppId, compId, TAG],
  );
  matchId = matchRows[0].id;

  const after = await fetch(`${BASE}/opponents/by-region/nordeste`);
  const afterData = await after.json();
  assert(afterData.opponents.some((o) => o.id === tempOppId), "temp opponent in Nordeste");
  assert(afterData.matches === detailData.matches + 1, "match count incremented");
  console.log("OK temp AL opponent appears in Nordeste");

  const brRegions = readFileSync("artifacts/portal-marujo/src/lib/br-regions.ts", "utf8");
  const apiRegions = readFileSync("artifacts/api-server/src/lib/br-regions.ts", "utf8");
  assert(brRegions === apiRegions, "portal/api br-regions.ts differ");
  console.log("OK br-regions.ts identical in portal and API");
} finally {
  if (matchId != null) await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
  if (tempOppId != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [tempOppId]);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.query(`DELETE FROM matches WHERE scorers = $1`, [TAG]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage A CSA x Regiões API smoke PASSED ===");
