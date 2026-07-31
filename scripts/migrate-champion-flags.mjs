import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFromDotenv, createPgPool } from "../scripts/_load-env.mjs";

loadEnvFromDotenv();
const sql = readFileSync(
  resolve("lib/db/sql/alter-season-competition-champion.sql"),
  "utf8",
);
const pool = createPgPool();
const client = await pool.connect();
try {
  await client.query(sql);
  const r = await client.query(
    "select count(*)::int as n from season_competition_stats where is_champion",
  );
  console.log("migration ok, champions:", r.rows[0].n);
} finally {
  client.release();
  await pool.end();
}
