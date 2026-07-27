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

function bandIndex(average) {
  if (average < 1.5) return 0;
  if (average < 2.5) return 1;
  if (average < 3.5) return 2;
  if (average < 4.5) return 3;
  return 4;
}
const PLAYER = ["Esquecível", "Mediano", "Bom", "Craque", "Ídolo"];
const MANAGER = ["Esquecível", "Mediano", "Competente", "Mestre", "Ídolo"];
const MATCH = ["Fraquinho", "Morno", "Bom jogo", "Emocionante", "Jogo histórico"];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("=== Labels (mirror of rating-labels.ts) ===");
assert(PLAYER[bandIndex(1.4)] === "Esquecível", "player 1.4");
assert(PLAYER[bandIndex(1.5)] === "Mediano", "player 1.5");
assert(PLAYER[bandIndex(3.5)] === "Craque", "player 3.5");
assert(PLAYER[bandIndex(4.5)] === "Ídolo", "player 4.5");
assert(MANAGER[bandIndex(3.0)] === "Competente", "manager 3.0");
assert(MATCH[bandIndex(4.7)] === "Jogo histórico", "match 4.7");
assert(MATCH[bandIndex(2.0)] === "Morno", "match 2.0");
console.log("OK labels");

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });

console.log("=== Apply create-ratings.sql ===");
const sql = readFileSync("lib/db/sql/create-ratings.sql", "utf8");
try {
  await pool.query(sql);
  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ratings'
    ORDER BY column_name
  `);
  console.log(
    "OK columns:",
    rows.map((r) => r.column_name).join(", "),
  );
  assert(rows.length === 6, "expected 6 columns");

  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 1`,
  );
  assert(players[0], "need at least one player");
  const playerId = players[0].id;
  const token = `smoke-ratings-${Date.now()}`;

  await pool.query(
    `DELETE FROM ratings WHERE voter_token LIKE 'smoke-ratings-%'`,
  );

  await pool.query(
    `INSERT INTO ratings (entity_type, entity_id, stars, voter_token)
     VALUES ('player', $1, 5, $2)`,
    [playerId, token],
  );

  let dupFailed = false;
  try {
    await pool.query(
      `INSERT INTO ratings (entity_type, entity_id, stars, voter_token)
       VALUES ('player', $1, 1, $2)`,
      [playerId, token],
    );
  } catch (e) {
    dupFailed = e.code === "23505";
  }
  assert(dupFailed, "unique (entity, voter) should reject duplicate");

  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  if (managers[0]) {
    await pool.query(
      `INSERT INTO ratings (entity_type, entity_id, stars, voter_token)
       VALUES ('manager', $1, 4, $2)`,
      [managers[0].id, token],
    );
    console.log("OK same token rated player + manager");
  }

  const { rows: agg } = await pool.query(
    `SELECT ROUND(AVG(stars)::numeric, 1)::float AS average, COUNT(*)::int AS count
     FROM ratings WHERE entity_type='player' AND entity_id=$1`,
    [playerId],
  );
  console.log("OK aggregate sample:", agg[0]);

  await pool.query(`DELETE FROM ratings WHERE voter_token = $1`, [token]);
  console.log("OK cleanup");
} finally {
  await pool.end();
}

console.log("=== Stage 1 ratings smoke passed ===");
