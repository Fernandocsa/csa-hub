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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const u = new URL(url);
const ssl = /supabase|neon|railway|amazonaws/i.test(u.hostname)
  ? { rejectUnauthorized: false }
  : undefined;
const pool = new pg.Pool({ connectionString: url, ssl });

console.log("=== Apply create-entity-badges.sql ===");
const sql = readFileSync("lib/db/sql/create-entity-badges.sql", "utf8");
try {
  await pool.query(sql);

  const { rows: seasonCols } = await pool.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='seasons'
      AND column_name IN ('stats_fully_verified', 'stats_verified_at')
    ORDER BY column_name
  `);
  console.log("OK seasons columns:", seasonCols);
  assert(
    seasonCols.some((c) => c.column_name === "stats_fully_verified"),
    "stats_fully_verified missing",
  );
  assert(
    seasonCols.some((c) => c.column_name === "stats_verified_at"),
    "stats_verified_at missing",
  );

  const { rows: badgeCols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='entity_badges'
    ORDER BY column_name
  `);
  console.log(
    "OK entity_badges columns:",
    badgeCols.map((r) => r.column_name).join(", "),
  );
  assert(badgeCols.length === 8, "expected 8 columns on entity_badges");

  const { rows: players } = await pool.query(
    `SELECT id FROM players ORDER BY id LIMIT 2`,
  );
  assert(players.length >= 2, "need ≥2 players to test auto-badge ties");
  const a = players[0].id;
  const b = players[1].id;
  const year = 2099;

  await pool.query(
    `DELETE FROM entity_badges WHERE season_year = $1 AND source = 'auto'`,
    [year],
  );

  // Tie: two different players both get Artilheiro 2099
  await pool.query(
    `INSERT INTO entity_badges
      (entity_type, entity_id, label, source, auto_kind, season_year)
     VALUES
      ('player', $1, 'Artilheiro 2099', 'auto', 'top_scorer', $3),
      ('player', $2, 'Artilheiro 2099', 'auto', 'top_scorer', $3)`,
    [a, b, year],
  );
  console.log(`OK tie: players ${a} and ${b} both Artilheiro ${year}`);

  // Same player + kind + year must fail
  let dupFailed = false;
  try {
    await pool.query(
      `INSERT INTO entity_badges
        (entity_type, entity_id, label, source, auto_kind, season_year)
       VALUES ('player', $1, 'Artilheiro 2099', 'auto', 'top_scorer', $2)`,
      [a, year],
    );
  } catch (e) {
    dupFailed = e.code === "23505";
  }
  assert(dupFailed, "same player+kind+year should be unique");
  console.log("OK duplicate same player auto badge rejected");

  // Manual badge (free label)
  const { rows: managers } = await pool.query(
    `SELECT id FROM managers ORDER BY id LIMIT 1`,
  );
  if (managers[0]) {
    await pool.query(
      `INSERT INTO entity_badges (entity_type, entity_id, label, source)
       VALUES ('manager', $1, 'Campeão Alagoano 2099', 'manual')`,
      [managers[0].id],
    );
    console.log("OK manual manager badge");
  }

  // seasons flag toggle
  const { rows: seasons } = await pool.query(
    `SELECT year FROM seasons ORDER BY year DESC LIMIT 1`,
  );
  if (seasons[0]) {
    const y = seasons[0].year;
    await pool.query(
      `UPDATE seasons SET stats_fully_verified = true, stats_verified_at = now()
       WHERE year = $1`,
      [y],
    );
    const { rows: check } = await pool.query(
      `SELECT stats_fully_verified, stats_verified_at IS NOT NULL AS has_at
       FROM seasons WHERE year = $1`,
      [y],
    );
    assert(check[0].stats_fully_verified === true, "verified flag");
    assert(check[0].has_at === true, "verified_at set");
    await pool.query(
      `UPDATE seasons SET stats_fully_verified = false, stats_verified_at = NULL
       WHERE year = $1`,
      [y],
    );
    console.log(`OK seasons.stats_fully_verified toggle on ${y}`);
  } else {
    console.log("SKIP seasons toggle (no seasons rows)");
  }

  await pool.query(
    `DELETE FROM entity_badges WHERE season_year = $1 OR label LIKE '%2099%'`,
    [year],
  );
  console.log("OK cleanup");
} finally {
  await pool.end();
}

console.log("=== Stage 1 badges schema smoke PASSED ===");
