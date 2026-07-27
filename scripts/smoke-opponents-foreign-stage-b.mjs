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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9895/api";

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

const TAG = `smoke-foreign-b-${Date.now()}`;
let tempOppId = null;
let compId = null;
let matchId = null;

try {
  console.log("=== Stage B GET /opponents/by-foreign ===");

  const live = await fetch(`${BASE}/opponents/by-foreign`);
  const liveData = await live.json();
  assert(live.status === 200, `by-foreign ${live.status}`);
  assert(liveData.overall?.matches === 4, `overall matches ${liveData.overall?.matches}`);
  assert(liveData.overall?.opponentCount === 2, `overall opponents ${liveData.overall?.opponentCount}`);
  assert(liveData.countries?.length === 2, `countries ${liveData.countries?.length}`);
  assert(liveData.opponents?.length === 2, `opponents ${liveData.opponents?.length}`);

  const arg = liveData.countries.find((c) => c.code === "ARG");
  const ven = liveData.countries.find((c) => c.code === "VEN");
  assert(arg?.name === "Argentina", "ARG name");
  assert(ven?.name === "Venezuela", "VEN name");
  assert(arg?.matches === 2 && ven?.matches === 2, "country match counts");
  console.log("OK live data ARG/VEN aggregate");

  const talleres = liveData.opponents.find((o) => o.id === 162);
  assert(talleres?.country === "ARG", "Talleres country");
  assert(talleres?.matches === 2, "Talleres matches");
  console.log("OK opponents list includes Talleres-ARG");

  const { rows: comps } = await pool.query(`SELECT id FROM competitions ORDER BY id LIMIT 1`);
  assert(comps[0], "need competition");
  compId = comps[0].id;

  const { rows: inserted } = await pool.query(
    `INSERT INTO opponents (name, country) VALUES ($1, 'VEN') RETURNING id`,
    [`${TAG}-Club-VEN`],
  );
  tempOppId = inserted[0].id;

  const { rows: matchRows } = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
       competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2094-06-01', '2094', $1, 3, 0, 'win', 'home', $2, false, false, 0, $3)
     RETURNING id`,
    [tempOppId, compId, TAG],
  );
  matchId = matchRows[0].id;

  const updated = await fetch(`${BASE}/opponents/by-foreign`);
  const updatedData = await updated.json();
  assert(updated.status === 200, "by-foreign after insert");
  assert(updatedData.overall?.opponentCount === 3, `opponents ${updatedData.overall?.opponentCount}`);
  assert(updatedData.overall?.matches === 5, `matches ${updatedData.overall?.matches}`);
  assert(
    updatedData.opponents.some((o) => o.id === tempOppId),
    "temp opponent listed",
  );
  const venAfter = updatedData.countries.find((c) => c.code === "VEN");
  assert(venAfter?.opponentCount === 2, `VEN teams ${venAfter?.opponentCount}`);
  assert(venAfter?.matches === 3, `VEN matches ${venAfter?.matches}`);
  console.log("OK temp VEN opponent included in aggregate");

  const brOnly = await fetch(`${BASE}/opponents/by-state`);
  const brData = await brOnly.json();
  assert(brOnly.status === 200, "by-state still works");
  assert(!brData.states.some((s) => s.state === "VEN"), "VEN not in by-state");
  console.log("OK foreign clubs excluded from by-state");
} finally {
  if (matchId != null) {
    await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
  }
  if (tempOppId != null) {
    await pool.query(`DELETE FROM opponents WHERE id = $1`, [tempOppId]);
  }
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.query(`DELETE FROM matches WHERE scorers = $1`, [TAG]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage B foreign opponents API smoke PASSED ===");
