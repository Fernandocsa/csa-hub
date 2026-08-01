/**
 * Apply manual season assist totals for 2012 (sheets had almost no assists).
 * Usage: node scripts/apply-2012-assists.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** [{ name aliases, assists }] */
const ENTRIES = [
  { names: ["Washington"], assists: 8 },
  { names: ["Júnior Paraíba", "Junior Paraiba"], assists: 3 },
  { names: ["Ronaldo Mendes", "Ronaldo"], assists: 2 },
  { names: ["Celico"], assists: 2 },
  { names: ["Leandrinho"], assists: 2 },
  { names: ["Claudinho"], assists: 2 },
  { names: ["Rafael Araújo", "Rafael Araujo"], assists: 2 },
  { names: ["Reinaldo Gaúcho", "Reinaldo Gaucho"], assists: 2 },
  { names: ["Wagnér", "Wagner"], assists: 2 },
  { names: ["Jackson"], assists: 2 },
  { names: ["Paulinho Macaíba", "Paulinho Macaiba"], assists: 1 },
  { names: ["Safira"], assists: 1 },
  { names: ["Jucemar Gaúcho", "Jucemar Gaucho"], assists: 1 },
  { names: ["Kel"], assists: 1 },
  { names: ["Leandro"], assists: 1 },
  { names: ["Camilo"], assists: 1 },
  { names: ["Alisson"], assists: 1 },
  { names: ["Wilson"], assists: 1 },
  { names: ["Fernandinho"], assists: 1 },
  { names: ["Rony"], assists: 1 },
];

try {
  if (!DRY) await client.query("BEGIN");

  const season = "2012";
  const { rows: roster } = await client.query(
    `SELECT p.id, p.name, pss.id AS pss_id, pss.assists
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.season = $1`,
    [season],
  );
  const byNorm = new Map();
  for (const r of roster) {
    const k = norm(r.name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(r);
  }

  if (!DRY) {
    await client.query(`UPDATE player_season_stats SET assists = 0 WHERE season = $1`, [
      season,
    ]);
  }

  let applied = 0;
  let sum = 0;
  for (const e of ENTRIES) {
    let hit = null;
    for (const alias of e.names) {
      const cands = byNorm.get(norm(alias)) ?? [];
      if (cands.length === 1) {
        hit = cands[0];
        break;
      }
      if (cands.length > 1) {
        throw new Error(
          `${season}: ambiguous ${alias} → ${cands.map((c) => `#${c.id} ${c.name}`).join(", ")}`,
        );
      }
    }
    if (!hit) {
      throw new Error(
        `${season}: player not found for ${e.names.join(" / ")} (roster has ${roster.length})`,
      );
    }
    if (!DRY) {
      await client.query(`UPDATE player_season_stats SET assists = $2 WHERE id = $1`, [
        hit.pss_id,
        e.assists,
      ]);
    }
    console.log(`* ${season} #${hit.id} ${hit.name}: ${hit.assists} → ${e.assists}A`);
    applied += 1;
    sum += e.assists;
  }

  if (!DRY) await client.query("COMMIT");
  console.log(
    `${DRY ? "DRY " : ""}done: ${applied} players, ${sum} assists total for ${season}`,
  );
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
