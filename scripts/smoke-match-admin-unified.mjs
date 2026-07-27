/**
 * Smoke: unified match admin — GET by id, general save, sheet tabs wiring.
 */
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
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

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9899/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = crypto
  .createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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

const TAG = `smoke-match-unify-${Date.now()}`;
let matchId = null;
let oppId = null;
let compId = null;

try {
  console.log("=== Unified match admin smoke ===");

  const listPage = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/AdminMatches.tsx",
    "utf8",
  );
  const detail = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/AdminMatchSheet.tsx",
    "utf8",
  );
  const form = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/MatchGeneralForm.tsx",
    "utf8",
  );
  const root = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/AdminRoot.tsx",
    "utf8",
  );

  assert(!listPage.includes("Pencil"), "pencil icon removed from list");
  assert(!listPage.includes("ClipboardList"), "clipboard icon removed from list");
  assert(!listPage.includes("Dialog"), "edit dialog removed from list");
  assert(listPage.includes("/admin/partidas/novo"), "novo link in list");
  assert(listPage.includes("setLocation(`/admin/partidas/${m.id}`)"), "row navigates to detail");

  assert(detail.includes('"general"'), "general tab");
  assert(detail.includes('"manager"'), "manager tab");
  assert(detail.includes("MatchGeneralForm"), "general form used");
  assert(detail.includes("showSheetFooter"), "sheet footer gated");
  assert(detail.includes("Excluir partida") || form.includes("Excluir partida"), "delete in general");
  assert(form.includes("onDelete"), "delete prop on form");

  assert(root.includes('/admin/partidas/novo'), "novo route");
  assert(root.includes('/admin/partidas/:id"'), "detail route");
  assert(root.includes("AdminMatchSheetRedirect"), "ficha redirect");
  console.log("OK UI wiring");

  const { rows: comps } = await pool.query(
    `SELECT id FROM competitions ORDER BY id LIMIT 1`,
  );
  assert(comps[0], "need competition");
  compId = comps[0].id;

  const { rows: opps } = await pool.query(
    `INSERT INTO opponents (name) VALUES ($1) RETURNING id`,
    [`${TAG}-Opp`],
  );
  oppId = opps[0].id;

  const created = await api("POST", "/admin/matches", {
    matchDate: "2099-01-15",
    season: "2099",
    opponentId: oppId,
    goalsFor: 2,
    goalsAgainst: 1,
    result: "win",
    homeAway: "home",
    competitionId: compId,
    ownGoalsForCount: 0,
  });
  assert(created.status === 201, `create ${created.status}`);
  matchId = created.data.id;

  const got = await api("GET", `/admin/matches/${matchId}`);
  assert(got.status === 200, `GET by id ${got.status}`);
  assert(got.data.opponentName === `${TAG}-Opp`, "opponent name joined");
  assert(got.data.goalsFor === 2, "goalsFor");
  console.log("OK GET /admin/matches/:id");

  const updated = await api("PUT", `/admin/matches/${matchId}`, {
    matchDate: "2099-01-15",
    season: "2099",
    opponentId: oppId,
    goalsFor: 3,
    goalsAgainst: 1,
    result: "win",
    homeAway: "home",
    competitionId: compId,
    managerId: null,
    attendance: 1000,
    scorers: null,
    ownGoalsForCount: 1,
  });
  assert(updated.status === 200, `PUT ${updated.status}`);
  assert(updated.data.goalsFor === 3, "updated goals");
  assert(updated.data.ownGoalsForCount === 1, "own goals");
  console.log("OK PUT general fields");

  const sheet = await api("PUT", `/admin/matches/${matchId}/sheet`, {
    lineups: [],
    goals: [],
    cards: [],
    substitutions: [],
  });
  assert(sheet.status === 200, `sheet ${sheet.status}`);
  console.log("OK sheet still works");

  const del = await api("DELETE", `/admin/matches/${matchId}`);
  assert(del.status === 200, `delete ${del.status}`);
  matchId = null;

  const missing = await api("GET", "/admin/matches/99999999");
  assert(missing.status === 404, "404 for missing");
  console.log("OK delete + 404");

  console.log("=== Unified match admin smoke PASSED ===");
} finally {
  if (matchId != null) {
    await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
  }
  if (oppId != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [oppId]);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.query(`DELETE FROM matches WHERE season = '2099' AND scorers IS NULL`);
  await pool.end();
}
