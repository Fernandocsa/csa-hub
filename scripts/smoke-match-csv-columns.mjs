/**
 * Smoke test: match CSV template columns (referee, phase, round, own_goals_for_count).
 * Loads .env, rebuilds are assumed done; hits local API on :8080.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const BASE = process.env.API_BASE ?? "http://127.0.0.1:8080/api";
const stamp = Date.now();
const opponentName = `CSV Test Opp ${stamp}`;
const refereeName = `CSV Test Ref ${stamp}`;
const competitionName = `CSV Test Comp ${stamp}`;
const matchDate = "2099-01-15"; // far future — easy to find/cleanup

const TEMPLATE_HEADERS =
  "date,season,opponent,goals_for,goals_against,own_goals_for_count,result,home_away,competition,phase,round,stadium,manager,referee,scorers,attendance";

const csv = [
  TEMPLATE_HEADERS,
  `${matchDate},2099,${opponentName},3,1,1,win,home,${competitionName},Final,Ida,Estádio Rei Pelé,,${refereeName},Autor Exemplo,1234`,
].join("\n");

async function login() {
  const password = process.env.ADMIN_PASSWORD ?? "admin";
  const r = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) throw new Error(`login failed ${r.status}`);
  const data = await r.json();
  return data.token;
}

async function admin(token, path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  return r;
}

async function main() {
  console.log("1) Login…");
  const token = await login();

  console.log("2) Import CSV with new columns…");
  const imp = await admin(token, "/admin/import/matches", {
    method: "POST",
    body: JSON.stringify({ csv }),
  });
  const impBody = await imp.json();
  console.log("   import:", imp.status, impBody);
  if (!imp.ok || impBody.created !== 1) {
    throw new Error(`expected created=1, got ${JSON.stringify(impBody)}`);
  }

  console.log("3) Find imported match via search…");
  const search = await admin(
    token,
    `/admin/matches/search?q=${encodeURIComponent(opponentName)}`,
  );
  const searchBody = await search.json();
  const matches = Array.isArray(searchBody) ? searchBody : searchBody.data ?? searchBody.matches ?? [];
  console.log("   search hits:", matches.length);
  const found = matches.find((m) => m.opponentName === opponentName);
  let matchId = found?.id;
  if (!matchId) throw new Error("imported match not found");

  console.log("4) GET match detail…");
  const detail = await admin(token, `/admin/matches/${matchId}`);
  const m = await detail.json();
  console.log("   detail:", {
    id: m.id,
    phase: m.phase,
    round: m.round,
    ownGoalsForCount: m.ownGoalsForCount ?? m.own_goals_for_count,
    refereeId: m.refereeId ?? m.referee_id,
    refereeName: m.refereeName ?? m.referee,
  });

  const own = m.ownGoalsForCount ?? m.own_goals_for_count;
  const phase = m.phase;
  const round = m.round;
  const refName = m.refereeName ?? m.referee;
  const refId = m.refereeId ?? m.referee_id;

  if (phase !== "Final") throw new Error(`phase expected Final, got ${phase}`);
  if (round !== "Ida") throw new Error(`round expected Ida, got ${round}`);
  if (Number(own) !== 1) throw new Error(`own_goals_for_count expected 1, got ${own}`);
  if (!refId) throw new Error("refereeId missing — referee was not linked");
  if (refName && refName !== refereeName) {
    console.warn("   referee name on detail differs (ok if only id returned):", refName);
  }

  // Confirm referee was created
  const refs = await admin(token, "/admin/referees");
  const refsBody = await refs.json();
  const refRows = Array.isArray(refsBody) ? refsBody : refsBody.data ?? [];
  const createdRef = refRows.find((r) => r.name === refereeName);
  if (!createdRef) throw new Error("referee was not auto-created");
  console.log("   referee auto-created id:", createdRef.id);

  console.log("5) Export matches CSV — check headers…");
  const exp = await admin(token, "/admin/export/matches");
  const expText = await exp.text();
  const headerLine = expText.split(/\r?\n/)[0];
  console.log("   export headers:", headerLine);
  for (const col of ["own_goals_for_count", "phase", "round", "referee"]) {
    if (!headerLine.split(",").includes(col)) {
      throw new Error(`export missing column ${col}`);
    }
  }
  const exportRow = expText.split(/\r?\n/).find((line) => line.includes(opponentName));
  if (!exportRow) throw new Error("export missing imported opponent row");
  console.log("   export row snippet:", exportRow.slice(0, 160));
  if (!exportRow.includes(refereeName)) throw new Error("export row missing referee name");
  if (!exportRow.includes("Final") || !exportRow.includes("Ida")) {
    throw new Error("export row missing phase/round");
  }

  console.log("6) Cleanup test match…");
  const del = await admin(token, `/admin/matches/${matchId}`, { method: "DELETE" });
  console.log("   delete match:", del.status);
  // leave orphan referee/opponent/competition — or try delete if endpoints allow
  if (createdRef?.id) {
    const delRef = await admin(token, `/admin/referees/${createdRef.id}`, { method: "DELETE" });
    console.log("   delete referee:", delRef.status);
  }

  console.log("\nPASS — CSV import/export includes referee, phase, round, own_goals_for_count");
}

main().catch((err) => {
  console.error("FAIL", err);
  process.exit(1);
});
