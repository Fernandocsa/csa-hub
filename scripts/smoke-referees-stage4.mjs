import { createHmac } from "node:crypto";
import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:9914/api";
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

const withUf = await j("POST", "/admin/referees", { name: "Smoke UF AL", state: "AL" }, auth);
const noUf = await j("POST", "/admin/referees", { name: "Smoke Sem UF", state: null }, auth);
check(withUf.ok && noUf.ok, "create referees", { withUf: withUf.body?.id, noUf: noUf.body?.id });

const matches = await j("GET", "/admin/matches?limit=5", null, { Authorization: auth.Authorization });
const matchA = matches.body?.data?.[0];
const matchB = matches.body?.data?.[1] ?? matchA;
check(!!matchA?.id, "have matches", matchA?.id);

async function link(matchId, refereeId, snapshot) {
  await j(
    "PUT",
    `/admin/matches/${matchId}`,
    {
      matchDate: snapshot.matchDate,
      season: snapshot.season,
      opponentId: snapshot.opponentId,
      goalsFor: snapshot.goalsFor,
      goalsAgainst: snapshot.goalsAgainst,
      result: snapshot.result,
      homeAway: snapshot.homeAway,
      competitionId: snapshot.competitionId,
      stadiumId: snapshot.stadiumId,
      managerId: snapshot.managerId,
      refereeId,
      attendance: snapshot.attendance,
      scorers: snapshot.scorers,
      ownGoalsForCount: snapshot.ownGoalsForCount ?? 0,
      phase: snapshot.phase,
      round: snapshot.round,
    },
    auth,
  );
}

const beforeA = await j("GET", `/admin/matches/${matchA.id}`, null, { Authorization: auth.Authorization });
const beforeB = await j("GET", `/admin/matches/${matchB.id}`, null, { Authorization: auth.Authorization });
await link(matchA.id, withUf.body.id, beforeA.body);
await link(matchB.id, noUf.body.id, beforeB.body);

const byState = await j("GET", "/referees/by-state");
const al = byState.body?.states?.find((s) => s.state === "AL");
check(
  byState.ok && al && al.matches >= 1 && al.refereeCount >= 1,
  "by-state includes AL",
  al,
);
check(
  byState.body?.unknown && byState.body.unknown.matches >= 1,
  "by-state unknown bucket",
  byState.body?.unknown,
);

const alDetail = await j("GET", "/referees/by-state/AL");
check(
  alDetail.ok &&
    alDetail.body?.state === "AL" &&
    alDetail.body?.homeRecord &&
    alDetail.body?.awayRecord &&
    alDetail.body?.referees?.some((r) => r.id === withUf.body.id),
  "by-state AL detail",
  {
    matches: alDetail.body?.matches,
    refs: alDetail.body?.referees?.length,
  },
);

const sem = await j("GET", "/referees/by-state/sem-estado");
check(
  sem.ok &&
    sem.body?.state == null &&
    sem.body?.referees?.some((r) => r.id === noUf.body.id),
  "by-state sem-estado",
  { matches: sem.body?.matches, refs: sem.body?.referees?.length },
);

const bad = await j("GET", "/referees/by-state/XX");
check(bad.status === 400, "invalid UF rejected");

// restore
await link(matchA.id, beforeA.body.refereeId ?? null, beforeA.body);
await link(matchB.id, beforeB.body.refereeId ?? null, beforeB.body);
await j("DELETE", `/admin/referees/${withUf.body.id}`, null, { Authorization: auth.Authorization });
await j("DELETE", `/admin/referees/${noUf.body.id}`, null, { Authorization: auth.Authorization });

console.log(fails.length === 0 ? "REFEREES_STAGE4_SMOKE_PASS" : `REFEREES_STAGE4_SMOKE_FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
