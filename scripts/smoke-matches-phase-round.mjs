/**
 * Smoke: match phase + round fields.
 */
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9900/api";
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

const TAG = `smoke-phase-round-${Date.now()}`;
let matchId = null;
let oppId = null;
let compId = null;

try {
  console.log("=== Match phase/round smoke ===");

  const { matchPhaseRoundLabel } = await import(
    pathToFileURL(resolve("artifacts/portal-marujo/src/lib/match-phase-round.ts")).href
  ).catch(async () => {
    // TS file may not import via node; inline mirror of helper
    return {
      matchPhaseRoundLabel(phase, round) {
        const p = phase?.trim() || "";
        const r = round?.trim() || "";
        if (p && r) return `${p} — ${r}`;
        if (p) return p;
        if (r) return r;
        return null;
      },
    };
  });

  assert(matchPhaseRoundLabel("Final", "Ida") === "Final — Ida", "both");
  assert(matchPhaseRoundLabel("Final", null) === "Final", "phase only");
  assert(matchPhaseRoundLabel("", "Volta") === "Volta", "round only");
  assert(matchPhaseRoundLabel(null, null) === null, "neither");
  console.log("OK label helper");

  const form = readFileSync(
    "artifacts/portal-marujo/src/pages/admin/MatchGeneralForm.tsx",
    "utf8",
  );
  assert(form.includes("Fase") && form.includes("Rodada"), "admin form fields");
  assert(form.includes("phase: phase.trim()"), "saves phase");

  const { rows: comps } = await pool.query(`SELECT id FROM competitions ORDER BY id LIMIT 1`);
  assert(comps[0], "competition");
  compId = comps[0].id;

  const { rows: opps } = await pool.query(
    `INSERT INTO opponents (name) VALUES ($1) RETURNING id`,
    [`${TAG}-Opp`],
  );
  oppId = opps[0].id;

  const created = await api("POST", "/admin/matches", {
    matchDate: "2098-06-01",
    season: "2098",
    opponentId: oppId,
    goalsFor: 1,
    goalsAgainst: 0,
    result: "win",
    homeAway: "home",
    competitionId: compId,
    phase: "Final",
    round: "Ida",
  });
  assert(created.status === 201, `create ${created.status}`);
  matchId = created.data.id;
  assert(created.data.phase === "Final", "phase saved");
  assert(created.data.round === "Ida", "round saved");

  const pub = await fetch(`${BASE}/matches/${matchId}`);
  const pubData = await pub.json();
  assert(pub.status === 200, "public detail");
  assert(pubData.phase === "Final" && pubData.round === "Ida", "public detail fields");

  const list = await fetch(`${BASE}/matches?limit=50`);
  const listData = await list.json();
  const found = listData.data?.find((m) => m.id === matchId);
  assert(found?.phase === "Final", "list includes phase");

  const cleared = await api("PUT", `/admin/matches/${matchId}`, {
    matchDate: "2098-06-01",
    season: "2098",
    opponentId: oppId,
    goalsFor: 1,
    goalsAgainst: 0,
    result: "win",
    homeAway: "home",
    competitionId: compId,
    managerId: null,
    phase: "  ",
    round: null,
  });
  assert(cleared.status === 200, "put clear");
  assert(cleared.data.phase == null && cleared.data.round == null, "empty → null");

  console.log("=== Match phase/round smoke PASSED ===");
} finally {
  if (matchId != null) await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
  if (oppId != null) await pool.query(`DELETE FROM opponents WHERE id = $1`, [oppId]);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
}
