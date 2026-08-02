/**
 * End-to-end verification for manager redesign cutover.
 */
import { createHmac } from "node:crypto";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();

const DELETE_NAMES = [
  "Márcio Araújo",
  "Jonilson Veloso",
  "Léo Condé",
  "Evandro Guimarães",
  "Dado Cavalcanti",
  "Sérgio Soares",
  "Paulo César Carpegiani",
  "Daniel Paulista",
  "Luizinho Vieira",
  "Moisés Egert",
  "Felipe Surian",
  "Guto Ferreira",
];

const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:9910/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");
const auth = { Authorization: `Bearer ${token}` };

async function j(path, headers = {}) {
  const r = await fetch(base + path, { headers });
  const body = await r.json().catch(() => null);
  return { status: r.status, ok: r.ok, body };
}

const fails = [];
function check(cond, label, detail) {
  if (cond) console.log("OK ", label, detail ?? "");
  else {
    console.log("FAIL", label, detail ?? "");
    fails.push(label);
  }
}

console.log("=== DB ===");
const pool = createPgPool();
try {
  const { rows: gone } = await pool.query(
    `SELECT id, name FROM managers WHERE name = ANY($1::text[]) ORDER BY name`,
    [DELETE_NAMES],
  );
  check(gone.length === 0, "12 excluídos ausentes no DB", `found=${gone.length}`);

  const { rows: caboDb } = await pool.query(
    `SELECT season, games, stats_source FROM manager_season_stats WHERE manager_id = 3 ORDER BY season DESC`,
  );
  check(
    caboDb.length === 10 && caboDb.every((r) => r.stats_source === "calculated"),
    "Cabo DB: 10 temporadas calculated",
    caboDb.map((r) => `${r.season}:${r.games}:${r.stats_source}`).join(", "),
  );

  const { rows: lizDb } = await pool.query(
    `SELECT season, games, stats_source FROM manager_season_stats WHERE manager_id = 31 ORDER BY season`,
  );
  check(
    lizDb.length === 1 && lizDb[0].season === "2006" && lizDb[0].stats_source === "manual",
    "Liz DB: 1 temporada manual 2006",
    JSON.stringify(lizDb),
  );

  const { rows: mgrCount } = await pool.query(`SELECT count(*)::int AS n FROM managers`);
  console.log("managers_count", mgrCount[0].n);
} finally {
  await pool.end();
}

console.log("=== ADMIN ===");
const cabo = await j("/admin/managers/3", auth);
check(cabo.ok, "GET admin Cabo", cabo.status);
check(cabo.body?.name === "Marcelo Cabo", "Cabo nome", cabo.body?.name);
check(
  cabo.body?.startYear === 2017 && cabo.body?.endYear === 2026,
  "Cabo período derivado admin",
  `${cabo.body?.startYear}-${cabo.body?.endYear}`,
);
// profile fields exist (may be null)
check(
  Object.prototype.hasOwnProperty.call(cabo.body ?? {}, "fullName") &&
    Object.prototype.hasOwnProperty.call(cabo.body ?? {}, "birthDate") &&
    Object.prototype.hasOwnProperty.call(cabo.body ?? {}, "isDeceased"),
  "Cabo Perfil: campos fullName/birthDate/isDeceased",
  {
    fullName: cabo.body?.fullName,
    birthDate: cabo.body?.birthDate,
    isDeceased: cabo.body?.isDeceased,
  },
);

const caboStats = await j("/admin/managers/3/stats", auth);
check(caboStats.ok && caboStats.body?.length === 10, "Cabo Temporadas admin count=10", caboStats.body?.length);
check(
  Array.isArray(caboStats.body) &&
    caboStats.body.every((s) => s.statsSource === "calculated"),
  "Cabo Temporadas todas calculated",
  caboStats.body?.slice(0, 2),
);

const liz = await j("/admin/managers/31", auth);
const lizStats = await j("/admin/managers/31/stats", auth);
check(liz.ok && liz.body?.name?.includes("Agnaldo"), "Liz admin", liz.body?.name);
check(
  liz.body?.startYear === 2006 && liz.body?.endYear === 2006,
  "Liz período admin 2006-2006",
  `${liz.body?.startYear}-${liz.body?.endYear}`,
);
check(
  lizStats.ok &&
    lizStats.body?.length === 1 &&
    lizStats.body[0].season === "2006" &&
    lizStats.body[0].statsSource === "manual" &&
    lizStats.body[0].games === 16,
  "Liz Temporada única manual",
  lizStats.body?.[0],
);

const adminList = await j("/admin/managers", auth);
check(adminList.ok, "admin list", adminList.status);
const adminNames = new Set((adminList.body ?? []).map((m) => m.name));
const adminHits = DELETE_NAMES.filter((n) => adminNames.has(n));
check(adminHits.length === 0, "12 excluídos ausentes admin list", adminHits.join(", ") || "none");

console.log("=== PUBLIC ===");
const pubCabo = await j("/managers/3");
check(
  pubCabo.ok &&
    pubCabo.body?.startYear === 2017 &&
    pubCabo.body?.endYear === 2026 &&
    pubCabo.body?.seasonStats?.length === 10,
  "público detalhe Cabo período+história",
  {
    period: `${pubCabo.body?.startYear}-${pubCabo.body?.endYear}`,
    seasons: pubCabo.body?.seasonStats?.length,
  },
);

const pubLiz = await j("/managers/31");
check(
  pubLiz.ok &&
    pubLiz.body?.startYear === 2006 &&
    pubLiz.body?.endYear === 2006 &&
    pubLiz.body?.seasonStats?.length === 1,
  "público detalhe Liz período único",
  {
    period: `${pubLiz.body?.startYear}-${pubLiz.body?.endYear}`,
    seasons: pubLiz.body?.seasonStats?.map((s) => `${s.year}:${s.matches}`),
  },
);

const pubList = await j("/managers");
check(pubList.ok, "público /managers", pubList.status);
const listCabo = (pubList.body ?? []).find((m) => m.id === 3);
const listLiz = (pubList.body ?? []).find((m) => m.id === 31);
check(
  listCabo?.startYear === 2017 && listCabo?.endYear === 2026,
  "lista pública Cabo período",
  `${listCabo?.startYear}-${listCabo?.endYear}`,
);
check(
  listLiz?.startYear === 2006 && listLiz?.endYear === 2006,
  "lista pública Liz período",
  `${listLiz?.startYear}-${listLiz?.endYear}`,
);

const pubNames = new Set((pubList.body ?? []).map((m) => m.name));
const pubHits = DELETE_NAMES.filter((n) => pubNames.has(n));
check(pubHits.length === 0, "12 excluídos ausentes lista pública", pubHits.join(", ") || "none");

console.log(fails.length === 0 ? "VERIFY_MANAGERS_PASS" : `VERIFY_MANAGERS_FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);
