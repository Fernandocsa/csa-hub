import { createHmac } from "node:crypto";
import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:9913/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");
const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function j(method, path, body, headers = {}) {
  const r = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => null);
  return { status: r.status, ok: r.ok, body: data };
}

const fails = [];
function check(cond, label, detail) {
  if (cond) console.log("OK ", label, detail ?? "");
  else {
    console.log("FAIL", label, detail ?? "");
    fails.push(label);
  }
}

const created = await j("POST", "/admin/referees", { name: "Smoke Público AL", state: "AL" }, auth);
check(created.ok, "create referee", created.body);
const refereeId = created.body?.id;

const matches = await j("GET", "/admin/matches?limit=1", null, { Authorization: auth.Authorization });
const matchId = matches.body?.data?.[0]?.id;
const before = await j("GET", `/admin/matches/${matchId}`, null, { Authorization: auth.Authorization });
await j(
  "PUT",
  `/admin/matches/${matchId}`,
  {
    matchDate: before.body.matchDate,
    season: before.body.season,
    opponentId: before.body.opponentId,
    goalsFor: before.body.goalsFor,
    goalsAgainst: before.body.goalsAgainst,
    result: before.body.result,
    homeAway: before.body.homeAway,
    competitionId: before.body.competitionId,
    stadiumId: before.body.stadiumId,
    managerId: before.body.managerId,
    refereeId,
    attendance: before.body.attendance,
    scorers: before.body.scorers,
    ownGoalsForCount: before.body.ownGoalsForCount ?? 0,
    phase: before.body.phase,
    round: before.body.round,
  },
  auth,
);

const list = await j("GET", "/referees");
const listed = list.body?.find((r) => r.id === refereeId);
check(
  list.ok && listed?.matches >= 1 && listed?.state === "AL",
  "public list",
  listed,
);

const detail = await j("GET", `/referees/${refereeId}`);
check(
  detail.ok &&
    detail.body?.name === "Smoke Público AL" &&
    detail.body?.homeRecord &&
    detail.body?.awayRecord &&
    Array.isArray(detail.body?.allMatches) &&
    detail.body.allMatches.length >= 1,
  "public detail",
  {
    matches: detail.body?.matches,
    all: detail.body?.allMatches?.length,
  },
);

const pubMatch = await j("GET", `/matches/${matchId}`);
check(
  pubMatch.ok &&
    pubMatch.body?.refereeId === refereeId &&
    pubMatch.body?.referee === "Smoke Público AL",
  "match detail includes referee",
  { refereeId: pubMatch.body?.refereeId, referee: pubMatch.body?.referee },
);

// restore + cleanup
await j(
  "PUT",
  `/admin/matches/${matchId}`,
  {
    matchDate: before.body.matchDate,
    season: before.body.season,
    opponentId: before.body.opponentId,
    goalsFor: before.body.goalsFor,
    goalsAgainst: before.body.goalsAgainst,
    result: before.body.result,
    homeAway: before.body.homeAway,
    competitionId: before.body.competitionId,
    stadiumId: before.body.stadiumId,
    managerId: before.body.managerId,
    refereeId: before.body.refereeId ?? null,
    attendance: before.body.attendance,
    scorers: before.body.scorers,
    ownGoalsForCount: before.body.ownGoalsForCount ?? 0,
    phase: before.body.phase,
    round: before.body.round,
  },
  auth,
);
await j("DELETE", `/admin/referees/${refereeId}`, null, { Authorization: auth.Authorization });

console.log(fails.length === 0 ? "REFEREES_STAGE3_SMOKE_PASS" : `REFEREES_STAGE3_SMOKE_FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
