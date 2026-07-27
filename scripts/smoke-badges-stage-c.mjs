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

const YEAR = 2095;
const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9887/api";

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

// Mirror portal manual-badge-templates (UI selector source)
const PLAYER_TEMPLATES = [
  "cria_do_mutange",
  "garcom",
  "artilheiro",
  "artilheiro_comp",
  "campeao",
];
const MANAGER_TEMPLATES = ["campeao"];
const TEMPLATE_SELECT_LABELS = {
  cria_do_mutange: "Cria do Mutange",
  garcom: "Garçom",
  artilheiro: "Artilheiro",
  artilheiro_comp: "Artilheiro (competição)",
  campeao: "Campeão",
};

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

console.log("=== Apply alter-badges-manual-constraint.sql ===");
await pool.query(
  readFileSync("lib/db/sql/alter-badges-manual-constraint.sql", "utf8"),
);

{
  const { rows } = await pool.query(`
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conname = 'entity_badges_auto_fields_check'
  `);
  assert(rows[0]?.def, "entity_badges_auto_fields_check exists");
  console.log("OK constraint updated:", rows[0].def.slice(0, 80) + "…");
}

// Prove manual rows may carry competition_id (was blocked before Stage C).
{
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  const { rows: comps } = await pool.query(
    `SELECT id FROM competitions ORDER BY id LIMIT 1`,
  );
  if (managers[0] && comps[0]) {
    const { rows: inserted } = await pool.query(
      `INSERT INTO entity_badges
        (entity_type, entity_id, label, source, season_year, competition_id)
       VALUES ('manager', $1, 'Smoke constraint probe', 'manual', 2095, $2)
       RETURNING id`,
      [managers[0].id, comps[0].id],
    );
    await pool.query(`DELETE FROM entity_badges WHERE id = $1`, [
      inserted[0].id,
    ]);
    console.log("OK manual badge with competition_id inserts cleanly");
  }
}

const createdIds = [];

try {
  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 1`,
  );
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  const { rows: comps } = await pool.query(
    `SELECT id, name FROM competitions ORDER BY id LIMIT 1`,
  );
  assert(players[0] && managers[0] && comps[0], "need player, manager, competition");
  const playerId = players[0].id;
  const managerId = managers[0].id;
  const comp = comps[0];

  // UI selector: manager profile shows only Campeão
  const managerUiOptions = MANAGER_TEMPLATES.map((t) => TEMPLATE_SELECT_LABELS[t]);
  assert(managerUiOptions.length === 1, "manager should have 1 template option");
  assert(
    managerUiOptions[0] === "Campeão",
    `manager option should be Campeão, got ${managerUiOptions[0]}`,
  );
  const playerOnly = PLAYER_TEMPLATES.filter((t) => !MANAGER_TEMPLATES.includes(t));
  assert(playerOnly.length === 4, "4 player-only templates");
  for (const t of playerOnly) {
    assert(
      !MANAGER_TEMPLATES.includes(t),
      `${t} must not appear for manager`,
    );
  }
  console.log(
    "OK manager template selector: only Campeão (not Cria/Garçom/Artilheiro/Artilheiro comp)",
  );

  const playerUiOptions = PLAYER_TEMPLATES.map((t) => TEMPLATE_SELECT_LABELS[t]);
  assert(playerUiOptions.length === 5, "player should have 5 template options");
  console.log("OK player template selector: 5 options");

  const cases = [
    {
      entity: "player",
      id: playerId,
      body: { template: "cria_do_mutange" },
      expectLabel: "Cria do Mutange",
    },
    {
      entity: "player",
      id: playerId,
      body: { template: "garcom", year: YEAR },
      expectLabel: `Garçom ${YEAR}`,
    },
    {
      entity: "player",
      id: playerId,
      body: { template: "artilheiro", year: YEAR },
      expectLabel: `Artilheiro ${YEAR}`,
    },
    {
      entity: "player",
      id: playerId,
      body: {
        template: "artilheiro_comp",
        year: YEAR,
        competitionId: comp.id,
      },
      expectLabel: `Artilheiro ${comp.name} ${YEAR}`,
    },
    {
      entity: "player",
      id: playerId,
      body: { template: "campeao", year: YEAR, competitionId: comp.id },
      expectLabel: `Campeão ${comp.name} ${YEAR}`,
    },
    {
      entity: "manager",
      id: managerId,
      body: { template: "campeao", year: YEAR, competitionId: comp.id },
      expectLabel: `Campeão ${comp.name} ${YEAR}`,
    },
  ];

  for (const c of cases) {
    const r = await api("POST", `/admin/badges/${c.entity}/${c.id}`, c.body);
    assert(
      r.status === 201,
      `${c.body.template} on ${c.entity}: ${r.status} ${JSON.stringify(r.data)}`,
    );
    assert(r.data.label === c.expectLabel, `label ${r.data.label} !== ${c.expectLabel}`);
    assert(r.data.source === "manual", "manual source");
    if (c.body.year != null) assert(r.data.seasonYear === c.body.year, "seasonYear");
    if (c.body.competitionId != null) {
      assert(r.data.competitionId === c.body.competitionId, "competitionId");
    }
    createdIds.push(r.data.id);
    console.log(`OK ${c.entity} ${c.body.template} → "${r.data.label}"`);
  }

  const rejected = await api("POST", `/admin/badges/manager/${managerId}`, {
    template: "cria_do_mutange",
  });
  assert(rejected.status === 400, "manager must reject player-only template");
  console.log("OK manager rejects cria_do_mutange");

  const rejectedGarcom = await api("POST", `/admin/badges/manager/${managerId}`, {
    template: "garcom",
    year: YEAR,
  });
  assert(rejectedGarcom.status === 400, "manager must reject garcom");
  console.log("OK manager rejects garcom");
} finally {
  if (createdIds.length) {
    await pool.query(`DELETE FROM entity_badges WHERE id = ANY($1::int[])`, [
      createdIds,
    ]);
    console.log("OK cleanup", createdIds.length, "badges");
  }
  await pool.end();
}

console.log("=== Stage C badges templates smoke PASSED ===");
