/**
 * Q5: Iguatu 06/01/2024 — keep draw, set penalties 3×4, ensure Rogério Corrêa.
 */
import { readFileSync } from "node:fs";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const sql = readFileSync("lib/db/sql/alter-matches-penalties.sql", "utf8");
await pool.query(sql);

const mgr = await pool.query(`SELECT id FROM managers WHERE name = 'Rogério Corrêa' LIMIT 1`);
if (!mgr.rows[0]) throw new Error("Rogério Corrêa not found");

const upd = await pool.query(
  `UPDATE matches SET
     result = 'draw',
     manager_id = $1,
     penalties_for = 3,
     penalties_against = 4
   WHERE id = 1214
   RETURNING id, result, manager_id, penalties_for, penalties_against`,
  [mgr.rows[0].id],
);

console.log(JSON.stringify({ ok: true, match: upd.rows[0] }, null, 2));
await pool.end();
