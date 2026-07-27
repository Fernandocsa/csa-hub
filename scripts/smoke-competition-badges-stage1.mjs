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

const YEAR = 2096;
const TAG = `smoke-comp-badge-${YEAR}`;
const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9889/api";

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

console.log("=== Apply alter-competition-badges.sql ===");
await pool.query(
  readFileSync("lib/db/sql/alter-competition-badges.sql", "utf8"),
);
{
  const { rows } = await pool.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND (
      (table_name='matches' AND column_name='own_goals_for_count')
      OR (table_name='entity_badges' AND column_name='competition_id')
    ) ORDER BY 1,2`);
  console.log(
    "OK",
    rows.map((r) => `${r.table_name}.${r.column_name}`).join(", "),
  );
  assert(rows.length === 2, "missing columns");
}

try {
  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 2`,
  );
  const { rows: comps } = await pool.query(
    `SELECT id, name FROM competitions ORDER BY id LIMIT 2`,
  );
  const { rows: opps } = await pool.query(
    `SELECT id FROM opponents ORDER BY id LIMIT 1`,
  );
  assert(players.length >= 2 && comps.length >= 2 && opps[0], "fixtures base");
  const [p1, p2] = players.map((r) => r.id);
  const [cOk, cBad] = comps;
  const oppId = opps[0].id;

  await pool.query(`DELETE FROM entity_badges WHERE season_year = $1`, [YEAR]);
  await pool.query(
    `DELETE FROM match_goals WHERE match_id IN (SELECT id FROM matches WHERE season = $1)`,
    [String(YEAR)],
  );
  await pool.query(`DELETE FROM matches WHERE season = $1`, [String(YEAR)]);
  await pool.query(`DELETE FROM player_season_stats WHERE season = $1`, [
    String(YEAR),
  ]);
  await pool.query(`DELETE FROM seasons WHERE year = $1`, [YEAR]);
  await pool.query(`INSERT INTO seasons (year) VALUES ($1)`, [YEAR]);

  const mA = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
       competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2096-01-01', $1, $2, 2, 0, 'win', 'home', $3, false, false, 0, $4)
     RETURNING id`,
    [String(YEAR), oppId, cOk.id, TAG],
  );
  await pool.query(
    `INSERT INTO match_goals (match_id, side, scorer_player_id, scorer_name, minute)
     VALUES ($1,'csa',$2,'P1',10), ($1,'csa',$3,'P2',20)`,
    [mA.rows[0].id, p1, p2],
  );

  const mB = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
       competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2096-01-08', $1, $2, 2, 0, 'win', 'home', $3, false, false, 1, $4)
     RETURNING id`,
    [String(YEAR), oppId, cOk.id, TAG],
  );
  await pool.query(
    `INSERT INTO match_goals (match_id, side, scorer_player_id, scorer_name, minute)
     VALUES ($1,'csa',$2,'P1',15)`,
    [mB.rows[0].id, p1],
  );

  const mC = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away,
       competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2096-02-01', $1, $2, 2, 0, 'win', 'home', $3, false, false, 0, $4)
     RETURNING id`,
    [String(YEAR), oppId, cBad.id, TAG],
  );
  await pool.query(
    `INSERT INTO match_goals (match_id, side, scorer_player_id, scorer_name, minute)
     VALUES ($1,'csa',$2,'P1',5)`,
    [mC.rows[0].id, p1],
  );

  await pool.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1,$3,1,5,0), ($2,$3,1,1,3)`,
    [p1, p2, String(YEAR)],
  );

  const verify = await api("PUT", `/admin/seasons/${YEAR}/verification`, {
    verified: true,
  });
  assert(verify.status === 200, `verify ${verify.status} ${JSON.stringify(verify.data)}`);
  const comp = verify.data.badges.competition;
  assert(comp, "competition summary missing");
  console.log(
    "eligible/incomplete/created:",
    comp.eligible,
    comp.incomplete,
    comp.created,
  );

  const okStatus = comp.details.find((d) => d.competitionId === cOk.id);
  const badStatus = comp.details.find((d) => d.competitionId === cBad.id);
  assert(okStatus?.eligible === true, "eligible competition should pass gate");
  assert(badStatus?.eligible === false, "incomplete competition should fail gate");
  assert(
    okStatus.topScorerIds.length === 1 && okStatus.topScorerIds[0] === p1,
    `expected only p1 got ${okStatus.topScorerIds}`,
  );
  assert(okStatus.topGoals === 2, `topGoals 2 got ${okStatus.topGoals}`);
  assert(badStatus.badgesCreated === 0, "no badge for incomplete");

  const { rows: badges } = await pool.query(
    `SELECT label, auto_kind, competition_id, entity_id FROM entity_badges
     WHERE season_year = $1 AND source = 'auto' ORDER BY auto_kind, entity_id`,
    [YEAR],
  );
  const compBadges = badges.filter(
    (b) => b.auto_kind === "top_scorer_competition",
  );
  assert(compBadges.length === 1, `comp badges 1 got ${compBadges.length}`);
  assert(compBadges[0].competition_id === cOk.id, "competition_id");
  assert(
    compBadges[0].label === `Artilheiro ${cOk.name} ${YEAR}`,
    `label ${compBadges[0].label}`,
  );
  assert(
    badges.some((b) => b.auto_kind === "top_scorer" && b.entity_id === p1),
    "season artilheiro",
  );
  assert(
    badges.some((b) => b.auto_kind === "top_assister" && b.entity_id === p2),
    "season garçom",
  );
  console.log("OK competition badge + season badges; incomplete skipped");

  await api("PUT", `/admin/seasons/${YEAR}/verification`, { verified: false });
} finally {
  await pool.query(`DELETE FROM entity_badges WHERE season_year = $1`, [YEAR]);
  await pool.query(
    `DELETE FROM match_goals WHERE match_id IN (SELECT id FROM matches WHERE season = $1)`,
    [String(YEAR)],
  );
  await pool.query(`DELETE FROM matches WHERE season = $1`, [String(YEAR)]);
  await pool.query(`DELETE FROM player_season_stats WHERE season = $1`, [
    String(YEAR),
  ]);
  await pool.query(`DELETE FROM seasons WHERE year = $1`, [YEAR]);
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Competition badges stage1 smoke PASSED ===");
