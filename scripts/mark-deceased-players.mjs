/**
 * Mark confirmed deceased players (sources in comments).
 * Dry-run by default; pass --apply to write.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const apply = process.argv.includes("--apply");
const pool = createPgPool();

/** @type {{ id: number, note: string }[]} */
const updates = [
  {
    id: 328,
    note: "Vitão / João Victor da Silva Santos — morreu fev/2026 (GE/G1)",
  },
  {
    id: 812,
    note: "Ênio Oliveira — morreu 2022-10-11, 72 anos (Futebol Interior / FAF)",
  },
  {
    id: 494,
    note: "Ênio Oliveira (entrada histórico) — mesmo atleta do id 812",
  },
  {
    id: 1146,
    note: "Valmir Louruz — morreu 2015-04-29 (já falecido como técnico id 39)",
  },
];

const ids = updates.map((u) => u.id);
const { rows: before } = await pool.query(
  `SELECT id, name, full_name, birth_date::text, is_deceased
   FROM players WHERE id = ANY($1::int[])
   ORDER BY id`,
  [ids],
);
console.log("before", before);

if (!apply) {
  console.log("\nDry-run only. Re-run with --apply to update.");
  await pool.end();
  process.exit(0);
}

const { rows: updated } = await pool.query(
  `UPDATE players
   SET is_deceased = true
   WHERE id = ANY($1::int[]) AND is_deceased = false
   RETURNING id, name, full_name, is_deceased`,
  [ids],
);
console.log("updated", updated);

const { rows: summary } = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE is_deceased) AS deceased,
    COUNT(*) FILTER (WHERE NOT is_deceased) AS alive,
    COUNT(*) AS total
  FROM players
`);
console.log("summary", summary[0]);

await pool.end();
