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

const YEAR = 2094;
const TAG = `smoke-badges-stage-d-${YEAR}`;
const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9888/api";

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

console.log("=== Apply alter-badges-stage-d.sql ===");
await pool.query(readFileSync("lib/db/sql/alter-badges-stage-d.sql", "utf8"));

await pool.query(`DELETE FROM entity_badges WHERE label LIKE $1`, [`%${TAG}%`]);
await pool.query(
  `DELETE FROM matches
   WHERE scorers = $1
      OR opponent_id IN (SELECT id FROM opponents WHERE name = $2)
      OR competition_id IN (SELECT id FROM competitions WHERE name IN ($3, $4))`,
  [TAG, `${TAG} Opponent`, `${TAG} Cup A`, `${TAG} Cup B`],
);
await pool.query(
  `DELETE FROM competitions WHERE name IN ($1, $2)`,
  [`${TAG} Cup A`, `${TAG} Cup B`],
);
await pool.query(`DELETE FROM opponents WHERE name = $1`, [`${TAG} Opponent`]);
await pool.query(`DELETE FROM seasons WHERE year = $1`, [YEAR]);

const createdBadgeIds = [];
let createdSeason = false;
let createdOpponentId = null;
const createdMatchIds = [];
const createdCompetitionIds = [];

try {
  const { rows: cols } = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='entity_badges'
      AND column_name IN ('template', 'match_id')
    ORDER BY column_name
  `);
  assert(cols.length === 2, "template/match_id columns missing");
  console.log("OK entity_badges has template + match_id");

  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 1`,
  );
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  assert(players[0] && managers[0], "need player and manager");
  const playerId = players[0].id;
  const managerId = managers[0].id;

  const seasonRes = await pool.query(
    `INSERT INTO seasons (year) VALUES ($1) ON CONFLICT DO NOTHING`,
    [YEAR],
  );
  createdSeason = seasonRes.rowCount > 0;

  const oppRes = await pool.query(
    `INSERT INTO opponents (name) VALUES ($1) RETURNING id`,
    [`${TAG} Opponent`],
  );
  createdOpponentId = oppRes.rows[0].id;

  const compA = await pool.query(
    `INSERT INTO competitions (name, type) VALUES ($1, 'cup') RETURNING id, name`,
    [`${TAG} Cup A`],
  );
  const compB = await pool.query(
    `INSERT INTO competitions (name, type) VALUES ($1, 'cup') RETURNING id, name`,
    [`${TAG} Cup B`],
  );
  createdCompetitionIds.push(compA.rows[0].id, compB.rows[0].id);

  const matchA = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away, competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2094-10-01', $1, $2, 2, 1, 'win', 'home', $3, false, false, 0, $4)
     RETURNING id`,
    [String(YEAR), createdOpponentId, compA.rows[0].id, TAG],
  );
  const matchB = await pool.query(
    `INSERT INTO matches
      (match_date, season, opponent_id, goals_for, goals_against, result, home_away, competition_id, is_walkover, is_friendly, own_goals_for_count, scorers)
     VALUES ('2094-11-01', $1, $2, 1, 0, 'win', 'away', $3, false, false, 0, $4)
     RETURNING id`,
    [String(YEAR), createdOpponentId, compB.rows[0].id, TAG],
  );
  createdMatchIds.push(matchA.rows[0].id, matchB.rows[0].id);

  const search = await api("GET", `/admin/matches/search?q=${encodeURIComponent(TAG)}`);
  assert(search.status === 200, `search status ${search.status}`);
  assert(
    Array.isArray(search.data) && search.data.some((m) => m.id === matchA.rows[0].id),
    "search should return tagged match",
  );
  console.log("OK GET /admin/matches/search");

  const playerChampionA = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "campeao",
    year: YEAR,
    competitionId: compA.rows[0].id,
  });
  assert(playerChampionA.status === 201, `player champion A ${playerChampionA.status}`);
  assert(playerChampionA.data.template === "campeao", `template A ${playerChampionA.data.template}`);
  assert(playerChampionA.data.seasonYear === YEAR, `season A ${playerChampionA.data.seasonYear}`);
  assert(playerChampionA.data.competitionId === compA.rows[0].id, `comp A ${playerChampionA.data.competitionId}`);
  createdBadgeIds.push(playerChampionA.data.id);

  const playerChampionB = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "campeao",
    year: YEAR,
    competitionId: compB.rows[0].id,
  });
  assert(playerChampionB.status === 201, `player champion B ${playerChampionB.status}`);
  assert(playerChampionB.data.template === "campeao", `template B ${playerChampionB.data.template}`);
  createdBadgeIds.push(playerChampionB.data.id);
  console.log("OK same person can have two Campeão badges in same year for different competitions");

  const playerChampionDup = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "campeao",
    year: YEAR,
    competitionId: compA.rows[0].id,
  });
  console.log("Duplicate Campeão response:", playerChampionDup.status, playerChampionDup.data);
  assert(playerChampionDup.status === 409, "duplicate champion should be rejected");
  console.log("OK duplicate exact Campeão blocked");

  const managerChampionA = await api("POST", `/admin/badges/manager/${managerId}`, {
    template: "campeao",
    year: YEAR,
    competitionId: compA.rows[0].id,
  });
  assert(managerChampionA.status === 201, `manager champion A ${managerChampionA.status}`);
  createdBadgeIds.push(managerChampionA.data.id);

  const managerChampionB = await api("POST", `/admin/badges/manager/${managerId}`, {
    template: "campeao",
    year: YEAR,
    competitionId: compB.rows[0].id,
  });
  assert(managerChampionB.status === 201, `manager champion B ${managerChampionB.status}`);
  createdBadgeIds.push(managerChampionB.data.id);
  console.log("OK manager also allows two Campeão badges in same year for different competitions");

  const cria1 = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "cria_do_mutange",
  });
  assert(cria1.status === 201, `cria first ${cria1.status}`);
  createdBadgeIds.push(cria1.data.id);
  const cria2 = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "cria_do_mutange",
  });
  assert(cria2.status === 409, "cria should be unique per person");
  console.log("OK Cria do Mutange is unique per person");

  const acesso = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "acesso",
    year: YEAR,
    competitionId: compA.rows[0].id,
  });
  assert(acesso.status === 201, `acesso ${acesso.status}`);
  assert(acesso.data.label === `Acesso ${compA.rows[0].name} ${YEAR}`, acesso.data.label);
  createdBadgeIds.push(acesso.data.id);
  console.log("OK Acesso label");

  const heroi = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "heroi_do_acesso",
    matchId: matchA.rows[0].id,
  });
  assert(heroi.status === 201, `heroi ${heroi.status}`);
  createdBadgeIds.push(heroi.data.id);
  assert(heroi.data.label === `Herói do Acesso ${compA.rows[0].name} ${YEAR}`, heroi.data.label);
  assert(heroi.data.matchId === matchA.rows[0].id, "heroi stores matchId");
  console.log("OK Herói do Acesso derives competition/year from match");

  const golTitulo = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "gol_do_titulo",
    matchId: matchA.rows[0].id,
  });
  assert(golTitulo.status === 201, `gol titulo ${golTitulo.status}`);
  createdBadgeIds.push(golTitulo.data.id);
  assert(golTitulo.data.label === `Gol do Título ${compA.rows[0].name} ${YEAR}`, golTitulo.data.label);

  const golHistorico = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "gol_historico",
    matchId: matchB.rows[0].id,
  });
  assert(golHistorico.status === 201, `gol historico ${golHistorico.status}`);
  createdBadgeIds.push(golHistorico.data.id);
  assert(golHistorico.data.label === `Gol Histórico ${compB.rows[0].name} ${YEAR}`, golHistorico.data.label);
  console.log("OK Gol do Título / Gol Histórico labels");

  const heroiDup = await api("POST", `/admin/badges/player/${playerId}`, {
    template: "heroi_do_acesso",
    matchId: matchA.rows[0].id,
  });
  assert(heroiDup.status === 409, "duplicate hero by match should be rejected");
  console.log("OK duplicate exact match-based badge blocked");

  const managerAccess = await api("POST", `/admin/badges/manager/${managerId}`, {
    template: "acesso",
    year: YEAR,
    competitionId: compA.rows[0].id,
  });
  assert(managerAccess.status === 400, "manager should reject acesso");

  const managerHero = await api("POST", `/admin/badges/manager/${managerId}`, {
    template: "heroi_do_acesso",
    matchId: matchA.rows[0].id,
  });
  assert(managerHero.status === 400, "manager should reject heroi_do_acesso");
  console.log("OK new templates remain player-only");
} finally {
  await pool.query(
    `DELETE FROM entity_badges
     WHERE id = ANY($1::int[])
        OR label LIKE $2
        OR (season_year = $3 AND competition_id = ANY($4::int[]))`,
    [createdBadgeIds, `%${TAG}%`, YEAR, createdCompetitionIds.length ? createdCompetitionIds : [0]],
  );
  if (createdMatchIds.length) {
    await pool.query(`DELETE FROM matches WHERE id = ANY($1::int[])`, [createdMatchIds]);
  }
  if (createdCompetitionIds.length) {
    await pool.query(`DELETE FROM competitions WHERE id = ANY($1::int[])`, [createdCompetitionIds]);
  }
  if (createdOpponentId != null) {
    await pool.query(`DELETE FROM opponents WHERE id = $1`, [createdOpponentId]);
  }
  if (createdSeason) {
    await pool.query(`DELETE FROM seasons WHERE year = $1`, [YEAR]);
  }
  await pool.end();
  console.log("OK cleanup");
}

console.log("=== Stage D badges smoke PASSED ===");
