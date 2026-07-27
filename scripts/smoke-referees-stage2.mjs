import { createHmac } from "node:crypto";
import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:9912/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function j(method, path, body) {
  const r = await fetch(base + path, {
    method,
    headers: method === "GET" ? { Authorization: headers.Authorization } : headers,
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

const created = await j("POST", "/admin/referees", {
  name: "Smoke Árbitro AL",
  state: "AL",
});
check(
  created.ok && created.body?.name === "Smoke Árbitro AL" && created.body?.state === "AL",
  "POST referee with UF",
  created.body,
);
const refereeId = created.body?.id;

const noUf = await j("POST", "/admin/referees", { name: "Smoke Sem UF", state: null });
check(noUf.ok && noUf.body?.state == null, "POST referee without UF", noUf.body);

const badUf = await j("POST", "/admin/referees", { name: "X", state: "XX" });
check(badUf.status === 400, "reject invalid UF", badUf.body);

const list = await j("GET", "/admin/referees");
check(
  list.ok && list.body?.some((r) => r.id === refereeId),
  "GET list includes smoke referee",
);

const lookup = await j("GET", "/admin/lookup");
check(
  lookup.ok && Array.isArray(lookup.body?.referees) && lookup.body.referees.some((r) => r.id === refereeId),
  "lookup.referees",
  lookup.body?.referees?.length,
);

const matches = await j("GET", "/admin/matches?limit=1");
const matchId = matches.body?.data?.[0]?.id;
check(!!matchId, "have a match to link", matchId);

let linkedOk = false;
if (matchId) {
  const before = await j("GET", `/admin/matches/${matchId}`);
  const put = await j("PUT", `/admin/matches/${matchId}`, {
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
  });
  const after = await j("GET", `/admin/matches/${matchId}`);
  linkedOk =
    put.ok &&
    after.body?.refereeId === refereeId &&
    after.body?.refereeName === "Smoke Árbitro AL";
  check(linkedOk, "link referee to match", {
    refereeId: after.body?.refereeId,
    refereeName: after.body?.refereeName,
  });

  // restore
  await j("PUT", `/admin/matches/${matchId}`, {
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
  });
}

const del1 = await j("DELETE", `/admin/referees/${refereeId}`);
const del2 = await j("DELETE", `/admin/referees/${noUf.body?.id}`);
check(del1.ok && del2.ok, "DELETE smoke referees");

console.log(fails.length === 0 ? "REFEREES_STAGE2_SMOKE_PASS" : `REFEREES_STAGE2_SMOKE_FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
