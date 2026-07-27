/**
 * Dry-run: match crest list → opponents.name. Does NOT write anything.
 *
 * Usage: node scripts/dry-run-opponent-logos.mjs
 * Requires DATABASE_URL in .env
 */

import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();

/** @typedef {{ listName: string, uf: string | null, country: string | null, url: string | null, confidence: string, expectedNameHints: string[] }} CrestItem */

/** @type {CrestItem[]} */
const LIST = [
  {
    listName: "São Paulo",
    uf: "SP",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/São%20Paulo%20Futebol%20Clube%20logo%20(2022).svg",
    confidence: "alta",
    expectedNameHints: ["São Paulo-SP", "Sao Paulo-SP"],
  },
  {
    listName: "Fluminense",
    uf: "RJ",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Fluminense%20Football%20Club.svg",
    confidence: "alta",
    expectedNameHints: ["Fluminense-RJ"],
  },
  {
    listName: "Palmeiras",
    uf: "SP",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Palmeiras%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Palmeiras-SP"],
  },
  {
    listName: "Botafogo",
    uf: "RJ",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Botafogo%20de%20Futebol%20e%20Regatas%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Botafogo-RJ"],
  },
  {
    listName: "Flamengo",
    uf: "RJ",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20de%20Regatas%20do%20Flamengo%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Flamengo-RJ"],
  },
  {
    listName: "Atlético Mineiro",
    uf: "MG",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20Atlético%20Mineiro%20crest.svg",
    confidence: "alta",
    expectedNameHints: ["Atlético Mineiro-MG", "Atletico Mineiro-MG", "Atlético-MG", "Atletico-MG"],
  },
  {
    listName: "Cruzeiro",
    uf: "MG",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Cruzeiro%20Esporte%20Clube%20(logo).svg",
    confidence: "alta",
    expectedNameHints: ["Cruzeiro-MG"],
  },
  {
    listName: "Grêmio",
    uf: "RS",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Gremio%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Grêmio-RS", "Gremio-RS"],
  },
  {
    listName: "Internacional",
    uf: "RS",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20do%20Sport%20Club%20Internacional.svg",
    confidence: "alta",
    expectedNameHints: ["Internacional-RS"],
  },
  {
    listName: "Bahia",
    uf: "BA",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Esporte%20Clube%20Bahia%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Bahia-BA"],
  },
  {
    listName: "Vitória",
    uf: "BA",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Esporte%20Clube%20Vitória%20(2024).svg",
    confidence: "alta",
    expectedNameHints: ["Vitória-BA", "Vitoria-BA"],
  },
  {
    listName: "Náutico",
    uf: "PE",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20Náutico%20Capibaribe.svg",
    confidence: "alta",
    expectedNameHints: ["Náutico-PE", "Nautico-PE"],
  },
  {
    listName: "Santa Cruz",
    uf: "PE",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Santa%20Cruz%20FC%20(01)%20-%20PE.svg",
    confidence: "alta",
    expectedNameHints: ["Santa Cruz-PE"],
  },
  {
    listName: "Ceará",
    uf: "CE",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ceará%20Sporting%20Club%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Ceará-CE", "Ceara-CE"],
  },
  {
    listName: "Fortaleza",
    uf: "CE",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Fortaleza%20Esporte%20Clube%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["Fortaleza-CE"],
  },
  {
    listName: "América (Belo Horizonte)",
    uf: "MG",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20do%20America%20Futebol%20Clube.svg",
    confidence: "alta",
    expectedNameHints: ["América-MG", "America-MG", "América Mineiro-MG"],
  },
  {
    listName: "América (Natal)",
    uf: "RN",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/AmericaFC-RN.svg",
    confidence: "alta",
    expectedNameHints: ["América-RN", "America-RN"],
  },
  {
    listName: "ABC",
    uf: "RN",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/ABC%20FC%20-%20RN.svg",
    confidence: "alta",
    expectedNameHints: ["ABC-RN"],
  },
  {
    listName: "Sampaio Corrêa",
    uf: "MA",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Sampaio%20Corrêa%20FC.png",
    confidence: "alta",
    expectedNameHints: ["Sampaio Corrêa-MA", "Sampaio Correa-MA"],
  },
  {
    listName: "Confiança",
    uf: "SE",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/AD%20Confiança.svg",
    confidence: "alta",
    expectedNameHints: ["Confiança-SE", "Confianca-SE"],
  },
  {
    listName: "Sergipe",
    uf: "SE",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/EscudoCSSergipe.svg",
    confidence: "média",
    expectedNameHints: ["Sergipe-SE"],
  },
  {
    listName: "CSE",
    uf: "AL",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/CSE%20logo.svg",
    confidence: "alta",
    expectedNameHints: ["CSE-AL"],
  },
  {
    listName: "Corinthians-AL (Alagoano, Maceió)",
    uf: "AL",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/SC%20Corinthians%20Alagoano.svg",
    confidence: "alta",
    expectedNameHints: ["Corinthians-AL"],
  },
  {
    listName: "Coruripe",
    uf: "AL",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/EscudoAACoruripe.png",
    confidence: "média",
    expectedNameHints: ["Coruripe-AL"],
  },
  {
    listName: "Penedense",
    uf: "AL",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/EscudoPenedense.svg",
    confidence: "média",
    expectedNameHints: ["Penedense-AL"],
  },
  {
    listName: "Athletico Paranaense",
    uf: "PR",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Athletico%20Paranaense%20(Logo%202019).svg",
    confidence: "alta",
    expectedNameHints: ["Athletico Paranaense-PR", "Athletico-PR", "Atlético Paranaense-PR", "Atletico-PR"],
  },
  {
    listName: "Botafogo (João Pessoa)",
    uf: "PB",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Botafogo%20Futebol%20Clube%20(PB).png",
    confidence: "alta",
    expectedNameHints: ["Botafogo-PB"],
  },
  {
    listName: "Juazeirense",
    uf: "BA",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/SDJuazeirense.png",
    confidence: "média",
    expectedNameHints: ["Juazeirense-BA"],
  },
  {
    listName: "Jacuipense",
    uf: "BA",
    country: null,
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/ECJacuipense.png",
    confidence: "média",
    expectedNameHints: ["Jacuipense-BA"],
  },
  {
    listName: "Talleres",
    uf: null,
    country: "ARG",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo%20del%20Club%20Atlético%20Talleres.svg",
    confidence: "alta",
    expectedNameHints: ["Talleres", "Talleres-ARG", "Talleres (ARG)"],
  },
  {
    listName: "Estudiantes de Mérida",
    uf: null,
    country: "VEN",
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20de%20Estudiantes%20de%20Mérida.png",
    confidence: "alta",
    expectedNameHints: ["Estudiantes de Mérida", "Estudiantes de Merida", "Estudiantes-VEN"],
  },
];

function fold(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function stripUfSuffix(name) {
  return fold(name).replace(/-[a-z]{2}$/i, "").trim();
}

function parseUfFromName(name) {
  const m = String(name).match(/-([A-Za-z]{2})$/);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Score a candidate opponent against a list item.
 * Higher = better. Exact name hint = 100.
 */
function scoreCandidate(item, opp) {
  const oppFold = fold(opp.name);
  const oppUf = (opp.state ? String(opp.state).toUpperCase() : null) || parseUfFromName(opp.name);
  const oppCountry = opp.country ? String(opp.country).toUpperCase() : null;

  for (const hint of item.expectedNameHints) {
    if (oppFold === fold(hint)) return { score: 100, kind: "exact_hint" };
  }

  // Exact listName-UF pattern
  if (item.uf) {
    const expected = fold(`${item.listName}-${item.uf}`);
    if (oppFold === expected) return { score: 95, kind: "exact_name_uf" };
  }

  const base = stripUfSuffix(opp.name);
  const listBase = fold(
    item.listName
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/-AL$/i, "")
      .trim(),
  );

  // Special aliases
  const aliases = {
    "atletico mineiro": ["atletico-mg", "atletico mineiro", "galo"],
    "america (belo horizonte)": ["america-mg", "america mineiro"],
    "america (natal)": ["america-rn"],
    "botafogo (joao pessoa)": ["botafogo-pb"],
    "corinthians-al (alagoano, maceio)": ["corinthians-al", "corinthians alagoano"],
    "athletico paranaense": ["athletico-pr", "atletico-pr", "atletico paranaense", "athletico paranaense"],
    "estudiantes de merida": ["estudiantes de merida", "estudiantes merida"],
  };

  let score = 0;
  let kind = "none";

  if (base === listBase) {
    score = 80;
    kind = "base_name";
  } else if (oppFold.includes(listBase) || listBase.includes(base)) {
    score = 50;
    kind = "partial";
  }

  const aliasKey = fold(item.listName);
  if (aliases[aliasKey]) {
    for (const a of aliases[aliasKey]) {
      if (oppFold === fold(a) || base === fold(a) || oppFold.includes(fold(a))) {
        score = Math.max(score, 85);
        kind = "alias";
      }
    }
  }

  // UF / country boost or penalty
  if (item.uf) {
    if (oppUf === item.uf) score += 15;
    else if (oppUf && oppUf !== item.uf) score -= 40;
  }
  if (item.country) {
    if (oppCountry === item.country) score += 15;
    else if (oppCountry && oppCountry !== item.country) score -= 20;
  }

  if (score >= 90) kind = kind === "none" ? "strong" : kind;
  else if (score >= 70) kind = kind.startsWith("exact") ? kind : "approx";
  else if (score >= 40) kind = "weak";
  else kind = "none";

  return { score, kind };
}

async function main() {
  const pool = createPgPool();

  try {
    const cols = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'opponents'
      ORDER BY ordinal_position
    `);
    const colNames = cols.rows.map((r) => r.column_name);
    const hasLogo = colNames.includes("logo_url");

    const { rows: opponents } = await pool.query(`
      SELECT id, name, city, state, country
             ${hasLogo ? ", logo_url" : ", NULL::text AS logo_url"}
      FROM opponents
      ORDER BY name
    `);

    const exact = [];
    const approx = [];
    const unmatched = [];
    const skippedNoUrl = [];

    for (const item of LIST) {
      if (!item.url || item.url === "—") {
        skippedNoUrl.push({ listName: item.listName, uf: item.uf, country: item.country });
        continue;
      }

      const ranked = opponents
        .map((opp) => ({ opp, ...scoreCandidate(item, opp) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score || a.opp.name.localeCompare(b.opp.name));

      const best = ranked[0];
      const runners = ranked.slice(1, 4).filter((r) => r.score >= 40);

      if (!best || best.score < 40) {
        // search loose ILIKE candidates for report
        const needle = fold(item.listName).split(/\s+/)[0];
        const loose = opponents
          .filter((o) => fold(o.name).includes(needle))
          .slice(0, 8)
          .map((o) => ({ id: o.id, name: o.name, state: o.state, country: o.country }));
        unmatched.push({
          listName: item.listName,
          uf: item.uf,
          country: item.country,
          confidence: item.confidence,
          url: item.url,
          hints: item.expectedNameHints,
          nearMisses: loose,
        });
        continue;
      }

      const entry = {
        listName: item.listName,
        uf: item.uf,
        country: item.country,
        confidence: item.confidence,
        matchKind: best.kind,
        score: best.score,
        opponentId: best.opp.id,
        opponentName: best.opp.name,
        opponentState: best.opp.state,
        opponentCountry: best.opp.country,
        currentLogoUrl: best.opp.logo_url ?? null,
        url: item.url,
        otherCandidates: runners.map((r) => ({
          id: r.opp.id,
          name: r.opp.name,
          state: r.opp.state,
          score: r.score,
          kind: r.kind,
        })),
      };

      if (best.score >= 90 || best.kind.startsWith("exact") || best.kind === "alias") {
        exact.push(entry);
      } else {
        approx.push(entry);
      }
    }

    const report = {
      dryRun: true,
      applied: false,
      schema: {
        hasLogoUrlColumn: hasLogo,
        opponentColumns: colNames,
        note: hasLogo
          ? "Column logo_url already exists."
          : "Column logo_url does NOT exist yet — apply step will need a migration before UPDATE.",
      },
      counts: {
        listTotal: LIST.length,
        skippedNoUrl: skippedNoUrl.length,
        exactOrStrong: exact.length,
        approximate: approx.length,
        unmatched: unmatched.length,
      },
      exactOrStrong: exact,
      approximate: approx,
      unmatched,
      skippedNoUrl,
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
