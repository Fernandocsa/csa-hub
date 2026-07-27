/**
 * Dry-run: opponents with recognizable country suffix (not Brazilian UF).
 * READ-ONLY.
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

const BRAZIL_UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

/** ISO 3166-1 alpha-3 codes we recognize for opponent suffixes. */
const KNOWN_COUNTRY_CODES = new Set([
  "ARG", "BOL", "CHI", "CHL", "COL", "ECU", "PAR", "PRY", "PER", "URU", "URY", "VEN",
  "MEX", "USA", "CAN",
  "POR", "ESP", "FRA", "GER", "DEU", "ITA", "ENG", "GBR", "NED", "NLD", "BEL",
  "JPN", "KOR", "CHN", "AUS",
]);

const COUNTRY_DISPLAY = {
  ARG: "Argentina",
  BOL: "Bolívia",
  CHI: "Chile",
  CHL: "Chile",
  COL: "Colômbia",
  ECU: "Equador",
  PAR: "Paraguai",
  PRY: "Paraguai",
  PER: "Peru",
  URU: "Uruguai",
  URY: "Uruguai",
  VEN: "Venezuela",
  MEX: "México",
  USA: "Estados Unidos",
  CAN: "Canadá",
  POR: "Portugal",
  ESP: "Espanha",
  FRA: "França",
  GER: "Alemanha",
  DEU: "Alemanha",
  ITA: "Itália",
  ENG: "Inglaterra",
  GBR: "Reino Unido",
  NED: "Países Baixos",
  NLD: "Países Baixos",
  BEL: "Bélgica",
  JPN: "Japão",
  KOR: "Coreia do Sul",
  CHN: "China",
  AUS: "Austrália",
};

function detectSuffix(name) {
  const m = name.trim().match(/-\s*([A-Za-z]{2,3})\s*$/);
  if (!m) return null;
  const code = m[1].toUpperCase();
  if (BRAZIL_UFS.has(code)) return { kind: "uf", code };
  if (KNOWN_COUNTRY_CODES.has(code)) return { kind: "country", code };
  if (code.length === 3) return { kind: "unknown-3", code };
  if (code.length === 2 && !BRAZIL_UFS.has(code)) return { kind: "unknown-2", code };
  return null;
}

const require = createRequire(resolve("lib/db/package.json"));
const pg = require("pg");
const url = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("=".repeat(72));
  console.log("DRY-RUN: Adversários com sufixo de país (não UF brasileira)");
  console.log("=".repeat(72));

  const { rows } = await pool.query(`
    SELECT
      o.id, o.name, o.city, o.state,
      COUNT(m.id)::int AS matches,
      SUM(CASE WHEN m.result = 'win' THEN 1 ELSE 0 END)::int AS wins,
      SUM(CASE WHEN m.result = 'draw' THEN 1 ELSE 0 END)::int AS draws,
      SUM(CASE WHEN m.result = 'loss' THEN 1 ELSE 0 END)::int AS losses
    FROM opponents o
    LEFT JOIN matches m ON m.opponent_id = o.id AND m.is_friendly = false
    GROUP BY o.id, o.name, o.city, o.state
    ORDER BY o.name
  `);

  const recognized = [];
  const unknownSuffix = [];
  const noSuffix = [];

  for (const o of rows) {
    const s = detectSuffix(o.name);
    if (!s || s.kind === "uf") {
      if (!s) noSuffix.push(o);
      continue;
    }
    if (s.kind === "country") {
      recognized.push({ ...o, countryCode: s.code, countryName: COUNTRY_DISPLAY[s.code] ?? s.code });
    } else {
      unknownSuffix.push({ ...o, suffix: s.code, suffixKind: s.kind });
    }
  }

  console.log(`\nTotal adversários: ${rows.length}`);
  console.log(`Com sufixo de país reconhecível: ${recognized.length}`);
  console.log(`Com sufixo não-UF não reconhecido: ${unknownSuffix.length}`);
  console.log(`Sem sufixo detectável: ${noSuffix.length}`);

  if (recognized.length > 0) {
    console.log("\n--- Reconhecidos ---");
    for (const o of recognized) {
      console.log(
        `  id=${o.id}  "${o.name}"  → ${o.countryCode} (${o.countryName})  ` +
          `PJ=${o.matches} V=${o.wins} E=${o.draws} D=${o.losses}  state=${o.state ?? "(vazio)"}`,
      );
    }

    const byCountry = new Map();
    for (const o of recognized) {
      const key = o.countryCode;
      const agg = byCountry.get(key) ?? {
        code: key,
        name: o.countryName,
        opponents: 0,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      agg.opponents++;
      agg.matches += o.matches;
      agg.wins += o.wins;
      agg.draws += o.draws;
      agg.losses += o.losses;
      byCountry.set(key, agg);
    }
    console.log("\n--- Agregado por país ---");
    for (const agg of [...byCountry.values()].sort((a, b) => b.matches - a.matches)) {
      console.log(
        `  ${agg.code} (${agg.name}): ${agg.opponents} time(s), PJ=${agg.matches} V=${agg.wins} E=${agg.draws} D=${agg.losses}`,
      );
    }
    const totalMatches = recognized.reduce((s, o) => s + o.matches, 0);
    console.log(`\n  TOTAL estrangeiros reconhecidos: ${totalMatches} partidas oficiais`);
  }

  if (unknownSuffix.length > 0) {
    console.log("\n--- Sufixo não reconhecido (revisar manualmente) ---");
    for (const o of unknownSuffix) {
      console.log(`  id=${o.id}  "${o.name}"  suffix=${o.suffix} (${o.suffixKind})  PJ=${o.matches}`);
    }
  }

  // Opponents with matches but no BR state and no country suffix — potential gaps
  const gaps = rows.filter((o) => {
    const s = detectSuffix(o.name);
    return o.matches > 0 && !o.state && (!s || s.kind !== "country" && s.kind !== "uf");
  });
  if (gaps.length > 0) {
    console.log("\n--- Com partidas oficiais, sem state e sem país reconhecido ---");
    for (const o of gaps) {
      console.log(`  id=${o.id}  "${o.name}"  PJ=${o.matches}`);
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log("FIM DO DRY-RUN — nenhuma alteração aplicada.");
  console.log("=".repeat(72));
} finally {
  await pool.end();
}
