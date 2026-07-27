/**
 * Dry-run: competition type recategorization (READ-ONLY).
 * Shows current type → proposed new level for each competition.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const MIGRATION_MAP = {
  state: "Estadual",
  regional: "Regional",
  league: "Nacional",
  cup: "Nacional",
  friendly: "⚠️ REVISAR (friendly)",
};

function proposeNewType(current) {
  if (current == null || current === "") return "⚠️ REVISAR (sem tipo)";
  const key = String(current).toLowerCase();
  if (MIGRATION_MAP[key]) return MIGRATION_MAP[key];
  return `⚠️ REVISAR (tipo desconhecido: ${current})`;
}

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows: comps } = await pool.query(`
    SELECT c.id, c.name, c.type,
           COUNT(m.id)::int AS match_count,
           COUNT(m.id) FILTER (WHERE m.is_friendly = true)::int AS friendly_matches,
           COUNT(m.id) FILTER (WHERE m.is_friendly = false)::int AS official_matches
    FROM competitions c
    LEFT JOIN matches m ON m.competition_id = c.id
    GROUP BY c.id, c.name, c.type
    ORDER BY c.name
  `);

  console.log("=".repeat(80));
  console.log("DRY-RUN: recategorização competitions.type → 4 níveis");
  console.log("=".repeat(80));
  console.log(`Total de competições: ${comps.length}\n`);

  const byCurrent = {};
  const byProposed = {};
  const needsReview = [];

  for (const c of comps) {
    const proposed = proposeNewType(c.type);
    byCurrent[c.type ?? "(null)"] = (byCurrent[c.type ?? "(null)"] ?? 0) + 1;
    byProposed[proposed] = (byProposed[proposed] ?? 0) + 1;
    if (proposed.startsWith("⚠️")) needsReview.push(c);

    console.log(
      [
        `id=${String(c.id).padStart(3)}`,
        `type=${(c.type ?? "null").padEnd(10)}`,
        `→ ${proposed.padEnd(22)}`,
        `J=${String(c.match_count).padStart(4)}`,
        `(ofic=${c.official_matches}, amist=${c.friendly_matches})`,
        c.name,
      ].join(" | "),
    );
  }

  console.log("\n" + "-".repeat(80));
  console.log("Resumo por tipo ATUAL:");
  for (const [t, n] of Object.entries(byCurrent).sort()) {
    console.log(`  ${t}: ${n}`);
  }

  console.log("\nResumo por tipo PROPOSTO:");
  for (const [t, n] of Object.entries(byProposed).sort()) {
    console.log(`  ${t}: ${n}`);
  }

  if (needsReview.length) {
    console.log("\n⚠️  Casos que precisam decisão antes de migrar:");
    for (const c of needsReview) {
      console.log(`  - id=${c.id} "${c.name}" (type=${c.type ?? "null"}, ${c.match_count} jogos)`);
    }
  } else {
    console.log("\nNenhum caso ambíguo — todos mapeiam direto.");
  }

  const { rows: crossCheck } = await pool.query(`
    SELECT c.id, c.name, c.type,
           COUNT(*) FILTER (WHERE m.is_friendly = true)::int AS friendly_m,
           COUNT(*) FILTER (WHERE m.is_friendly = false)::int AS official_m
    FROM competitions c
    JOIN matches m ON m.competition_id = c.id
    WHERE LOWER(c.type) = 'friendly'
    GROUP BY c.id, c.name, c.type
  `);

  if (crossCheck.length) {
    console.log("\nCompetições com type='friendly' (revisar antes de migrar):");
    for (const r of crossCheck) {
      console.log(
        `  id=${r.id} "${r.name}" — oficiais=${r.official_m}, amistosos=${r.friendly_m}`,
      );
    }
  } else {
    console.log("\nNenhuma competição com type='friendly' no banco.");
  }

  const { rows: friendlyCompOfficialMatches } = await pool.query(`
    SELECT c.id, c.name, c.type, COUNT(*)::int AS cnt
    FROM competitions c
    JOIN matches m ON m.competition_id = c.id AND m.is_friendly = false
    WHERE LOWER(c.type) = 'friendly'
    GROUP BY c.id, c.name, c.type
  `);
  if (friendlyCompOfficialMatches.length) {
    console.log(
      "\n⚠️  Competições type=friendly com partidas OFICIAIS (is_friendly=false):",
    );
    for (const r of friendlyCompOfficialMatches) {
      console.log(`  id=${r.id} "${r.name}" — ${r.cnt} jogos oficiais`);
    }
  }

  const { rows: friendlyStats } = await pool.query(`
    SELECT COUNT(*)::int AS total_matches,
           COUNT(*) FILTER (WHERE is_friendly = true)::int AS friendly_matches
    FROM matches
  `);
  console.log(
    `\nPartidas no banco: ${friendlyStats[0].total_matches} total, ${friendlyStats[0].friendly_matches} amistosos (is_friendly=true)`,
  );

  const { rows: friendlyByComp } = await pool.query(`
    SELECT c.id, c.name, c.type, COUNT(*)::int AS friendly_count
    FROM matches m
    JOIN competitions c ON c.id = m.competition_id
    WHERE m.is_friendly = true
    GROUP BY c.id, c.name, c.type
    ORDER BY friendly_count DESC
  `);
  if (friendlyByComp.length) {
    console.log("Competições que abrigam amistosos (via is_friendly na partida, não via type):");
    for (const r of friendlyByComp) {
      console.log(`  id=${r.id} type=${r.type ?? "null"} — ${r.friendly_count} amist. — ${r.name}`);
    }
  }

  console.log("\n" + "=".repeat(80));
} finally {
  await pool.end();
}
