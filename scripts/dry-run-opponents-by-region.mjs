/**
 * Dry-run: CSA x Regiões — aggregate opponents/matches by Brazilian macro-region.
 * READ-ONLY. Derives region from opponents.state via fixed UF map.
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

const UF_TO_REGION = {
  AC: "Norte", AP: "Norte", AM: "Norte", PA: "Norte", RO: "Norte", RR: "Norte", TO: "Norte",
  AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste", PB: "Nordeste",
  PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
  DF: "Centro-Oeste", GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste",
  ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
  PR: "Sul", RS: "Sul", SC: "Sul",
};

const ALL_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function regionFromUf(uf) {
  return UF_TO_REGION[uf?.trim().toUpperCase()] ?? null;
}

try {
  console.log("=".repeat(72));
  console.log("DRY-RUN: CSA x Regiões (UF → Região)");
  console.log("=".repeat(72));

  const mapped = new Set(Object.keys(UF_TO_REGION));
  const missing = ALL_UFS.filter((uf) => !mapped.has(uf));
  const extra = [...mapped].filter((uf) => !ALL_UFS.includes(uf));
  const byRegion = {};
  for (const [uf, reg] of Object.entries(UF_TO_REGION)) {
    (byRegion[reg] ??= []).push(uf);
  }

  console.log(`\nUFs mapeadas: ${mapped.size}/27`);
  if (missing.length) console.log("  FALTANDO:", missing.join(", "));
  if (extra.length) console.log("  EXTRAS:", extra.join(", "));
  for (const reg of ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]) {
    console.log(`  ${reg}: ${byRegion[reg].sort().join(", ")} (${byRegion[reg].length} UFs)`);
  }

  const { rows } = await pool.query(`
    SELECT
      upper(trim(o.state)) AS uf,
      count(distinct o.id)::int AS opponents,
      count(m.id)::int AS matches,
      sum(case when m.result = 'win' then 1 else 0 end)::int AS wins,
      sum(case when m.result = 'draw' then 1 else 0 end)::int AS draws,
      sum(case when m.result = 'loss' then 1 else 0 end)::int AS losses
    FROM opponents o
    INNER JOIN matches m ON m.opponent_id = o.id AND m.is_friendly = false
    WHERE o.state IS NOT NULL AND trim(o.state) <> ''
    GROUP BY upper(trim(o.state))
    ORDER BY matches DESC
  `);

  const regionAgg = new Map();
  let unmappedUfs = [];

  for (const r of rows) {
    const reg = regionFromUf(r.uf);
    if (!reg) {
      unmappedUfs.push(r);
      continue;
    }
    const agg = regionAgg.get(reg) ?? {
      region: reg,
      states: new Set(),
      opponents: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };
    agg.states.add(r.uf);
    agg.opponents += r.opponents;
    agg.matches += r.matches;
    agg.wins += r.wins;
    agg.draws += r.draws;
    agg.losses += r.losses;
    regionAgg.set(reg, agg);
  }

  console.log("\n--- Agregado por região (partidas oficiais) ---");
  for (const reg of ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]) {
    const agg = regionAgg.get(reg);
    if (!agg) {
      console.log(`  ${reg}: (sem jogos ainda)`);
      continue;
    }
    console.log(
      `  ${reg}: ${agg.states.size} UFs, ${agg.opponents} times, ` +
        `PJ=${agg.matches} V=${agg.wins} E=${agg.draws} D=${agg.losses}`,
    );
  }

  if (unmappedUfs.length) {
    console.log("\n--- UFs com jogos mas sem região mapeada ---");
    for (const u of unmappedUfs) {
      console.log(`  ${u.uf}: ${u.matches} partidas`);
    }
  }

  const { rows: noState } = await pool.query(`
    SELECT count(distinct o.id)::int AS opponents, count(m.id)::int AS matches
    FROM opponents o
    INNER JOIN matches m ON m.opponent_id = o.id AND m.is_friendly = false
    WHERE o.state IS NULL OR trim(o.state) = ''
  `);
  if (noState[0]?.matches > 0) {
    console.log(
      `\nSem state (estrangeiros etc.): ${noState[0].opponents} times, ${noState[0].matches} partidas — fora do escopo`,
    );
  }

  console.log("\n" + "=".repeat(72));
  console.log("FIM DO DRY-RUN");
  console.log("=".repeat(72));
} finally {
  await pool.end();
}
