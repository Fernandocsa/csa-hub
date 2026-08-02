/**
 * Regression: saving a W.O. match without wiping is_walkover.
 * 1) Find a walkover match
 * 2) PUT changing only goalsFor (+1 then restore), omitting flags (old bug path)
 * 3) Assert is_walkover still true
 * 4) PUT with explicit isWalkover/isFriendly (form path) and assert preserved
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import crypto from "node:crypto";

loadEnvFromDotenv();
const pool = createPgPool();

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:11911/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = crypto
  .createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");

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

const { rows } = await pool.query(`
  SELECT id, match_date::text, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, stadium_id, manager_id, referee_id,
         attendance, scorers, own_goals_for_count, phase, round,
         is_walkover, is_friendly
  FROM matches
  WHERE is_walkover = true
  ORDER BY match_date DESC
  LIMIT 1
`);

if (!rows[0]) {
  console.error("FAIL: no walkover match in DB");
  await pool.end();
  process.exit(1);
}

const m = rows[0];
const id = m.id;
const originalGf = m.goals_for;

function bodyFromRow(row, extras = {}) {
  return {
    matchDate: String(row.match_date).slice(0, 10),
    season: row.season,
    opponentId: row.opponent_id,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    result: row.result,
    homeAway: row.home_away,
    competitionId: row.competition_id,
    stadiumId: row.stadium_id,
    managerId: row.manager_id,
    refereeId: row.referee_id,
    attendance: row.attendance,
    scorers: row.scorers,
    ownGoalsForCount: row.own_goals_for_count ?? 0,
    phase: row.phase,
    round: row.round,
    ...extras,
  };
}

// A) PUT without isWalkover/isFriendly (manager-tab style) — must NOT clear flag
const bump = await api("PUT", `/admin/matches/${id}`, bodyFromRow(m, {
  goalsFor: Number(originalGf) + 1,
}));
if (bump.status !== 200) {
  console.error("FAIL bump", bump.status, bump.data);
  await pool.end();
  process.exit(1);
}

const { rows: afterOmit } = await pool.query(
  `SELECT is_walkover, is_friendly, goals_for FROM matches WHERE id = $1`,
  [id],
);
const omitOk = afterOmit[0]?.is_walkover === true;

// B) PUT with explicit flags (form path) — still W.O.
const restore = await api("PUT", `/admin/matches/${id}`, bodyFromRow({
  ...m,
  goals_for: originalGf,
}, {
  goalsFor: originalGf,
  isWalkover: true,
  isFriendly: m.is_friendly === true,
}));
if (restore.status !== 200) {
  console.error("FAIL restore", restore.status, restore.data);
  await pool.end();
  process.exit(1);
}

const { rows: afterForm } = await pool.query(
  `SELECT is_walkover, is_friendly, goals_for FROM matches WHERE id = $1`,
  [id],
);

const formOk =
  afterForm[0]?.is_walkover === true &&
  Number(afterForm[0]?.goals_for) === Number(originalGf);

console.log(
  JSON.stringify(
    {
      matchId: id,
      omitFlagsPath: { stillWalkover: omitOk, row: afterOmit[0] },
      formPath: { stillWalkover: formOk, row: afterForm[0] },
      pass: omitOk && formOk,
    },
    null,
    2,
  ),
);

await pool.end();
if (!omitOk || !formOk) process.exit(1);
console.log("OK");
