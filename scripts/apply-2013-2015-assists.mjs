/**
 * Apply manual season assist totals for 2013–2015 (CSV sheets had no assists).
 * Usage: node scripts/apply-2013-2015-assists.mjs [--dry]
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

/** season -> [{ name aliases, assists }] */
const DATA = {
  "2015": [
    { names: ["Rafael Granja"], assists: 5 },
    { names: ["Anderson Paraíba", "Anderson Paraiba"], assists: 3 },
    { names: ["Reinaldo Alagoano"], assists: 2 },
    { names: ["Marcos Antônio", "Marcos Antonio"], assists: 1 },
    { names: ["Elyeser"], assists: 1 },
    { names: ["Zé Paulo", "Ze Paulo"], assists: 1 },
    { names: ["Afonso"], assists: 1 },
    { names: ["Élvis", "Elvis"], assists: 1 },
  ],
  "2014": [
    { names: ["Daniel Costa", "Maikel Daniel Costa"], assists: 8 },
    { names: ["Jefferson Maranhense", "Jeferson Maranhense"], assists: 3 },
    { names: ["Pedro Silva"], assists: 3 },
    { names: ["Charles Vagner"], assists: 2 },
    { names: ["Santos"], assists: 2 },
    { names: ["Lucas"], assists: 1 },
    { names: ["Uéderson", "Uederson"], assists: 1 },
    { names: ["Tiago Garça", "Tiago Garca"], assists: 1 },
  ],
  "2013": [
    { names: ["Everaldo"], assists: 5 },
    { names: ["Alex Henrique"], assists: 3 },
    { names: ["Rodriguinho"], assists: 2 },
    { names: ["Adalberto"], assists: 2 },
    { names: ["Robério", "Roberio"], assists: 2 },
    { names: ["Rodolfo"], assists: 2 },
    { names: ["Alisson"], assists: 1 },
    { names: ["Sinval"], assists: 1 },
    { names: ["Cassiano"], assists: 1 },
    { names: ["Diego Clementino"], assists: 1 },
    { names: ["Leandrinho"], assists: 1 },
    { names: ["Marielson"], assists: 1 },
    { names: ["Elyeser"], assists: 1 },
    { names: ["Levi"], assists: 1 },
    { names: ["Mendes"], assists: 1 },
    { names: ["Jeferson Parrudo", "Parrudo"], assists: 1 },
    { names: ["Celico"], assists: 1 },
    { names: ["Felipe Garopaba"], assists: 1 },
    { names: ["Gilmar Couto"], assists: 1 },
  ],
};

try {
  if (!DRY) await client.query("BEGIN");

  for (const [season, entries] of Object.entries(DATA)) {
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

    // Reset all assists in season first (sheet sync left zeros / stale)
    if (!DRY) {
      await client.query(
        `UPDATE player_season_stats SET assists = 0 WHERE season = $1`,
        [season],
      );
    }

    let applied = 0;
    let sum = 0;
    for (const e of entries) {
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
        await client.query(
          `UPDATE player_season_stats SET assists = $2 WHERE id = $1`,
          [hit.pss_id, e.assists],
        );
      }
      console.log(
        `* ${season} #${hit.id} ${hit.name}: ${hit.assists} → ${e.assists}A`,
      );
      applied += 1;
      sum += e.assists;
    }
    console.log(`${season}: ${applied} players, ${sum} assists total\n`);
  }

  if (DRY) {
    console.log("DRY RUN — no writes");
  } else {
    await client.query("COMMIT");
    console.log("COMMIT ok");
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e.message ?? e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
