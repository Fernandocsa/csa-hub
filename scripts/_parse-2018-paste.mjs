import fs from "node:fs";
import path from "node:path";

const paste = fs.readFileSync(path.join("scripts/_tmp_2018_source.txt"), "utf8");

const MONTHS = {
  janeiro: "01",
  fevereiro: "02",
  março: "03",
  marco: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

function fixPlayerName(n) {
  return n.trim();
}

function normalizeMonth(raw) {
  const monName = raw.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return MONTHS[monName];
}

function parseDateFromHeader(line) {
  const m = line.match(/(\d{1,2})º?\s+de\s+([\p{L}]+)(?:\s+de\s+(\d{4}))?/iu);
  if (!m) return null;
  const mon = normalizeMonth(m[2]);
  if (!mon) throw new Error(`bad month ${m[2]} in ${line}`);
  const year = m[3] ?? "2018";
  return `${year}-${mon}-${String(m[1]).padStart(2, "0")}`;
}

const SCORE_RE = /\d+\s*[×x]\s*\d+/i;

function parseScoreHeader(line) {
  const m = line.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (!m) return null;
  const leftHasCsa = /\bCSA\b/i.test(line.split(/[×x]/)[0]);
  const rightHasCsa = /\bCSA\b/i.test(line.split(/[×x]/)[1] || "");
  let gf, ga, ha;
  if (leftHasCsa && !rightHasCsa) {
    gf = Number(m[1]);
    ga = Number(m[2]);
    ha = "home";
  } else if (rightHasCsa && !leftHasCsa) {
    gf = Number(m[2]);
    ga = Number(m[1]);
    ha = "away";
  } else {
    const hm = line.match(/CSA\s+(\d+)\s*[×x]\s*(\d+)/i);
    if (hm) {
      gf = Number(hm[1]);
      ga = Number(hm[2]);
      ha = "home";
    } else {
      gf = Number(m[2]);
      ga = Number(m[1]);
      ha = "away";
    }
  }
  return { gf, ga, ha };
}

const OPP_MAP = [
  [/S\.?C\.?\s*Santa Rita/i, "Santa Rita-AL"],
  [/Dimensão Saúde/i, "Dimensão Saúde-AL"],
  [/Murici/i, "Murici-AL"],
  [/\bASA\b/i, "ASA-AL"],
  [/\bCSE\b/i, "CSE-AL"],
  [/\bCEO\b/i, "CEO-AL"],
  [/\bCRB\b/i, "CRB-AL"],
  [/Coruripe/i, "Coruripe-AL"],
  [/Sampaio Corrêa/i, "Sampaio Corrêa-MA"],
  [/Salgueiro/i, "Salgueiro-PE"],
  [/Ceará/i, "Ceará-CE"],
  [/Manaus/i, "Manaus-AM"],
  [/São Paulo/i, "São Paulo-SP"],
  [/São Bento/i, "São Bento-SP"],
  [/Goiás/i, "Goiás-GO"],
  [/Oeste/i, "Oeste-SP"],
  [/Criciúma/i, "Criciúma-SC"],
  [/Boa Esporte/i, "Boa Esporte-MG"],
  [/Londrina/i, "Londrina-PR"],
  [/Figueirense/i, "Figueirense-SC"],
  [/Vila Nova/i, "Vila Nova-GO"],
  [/Guarani/i, "Guarani-SP"],
  [/Paysandu/i, "Paysandu-PA"],
  [/Ponte Preta/i, "Ponte Preta-SP"],
  [/Coritiba/i, "Coritiba-SC"],
  [/Brasil de Pelotas/i, "Brasil de Pelotas-RS"],
  [/Fortaleza/i, "Fortaleza-CE"],
  [/Atlético-GO/i, "Atlético-GO"],
  [/Avaí/i, "Avaí-SC"],
  [/Juventude/i, "Juventude-RS"],
];

function parseOpponent(header) {
  const parts = header.split(/–/).map((s) => s.trim());
  const scorePart = parts.find((p) => SCORE_RE.test(p)) || parts[0] || header;
  const oppText = scorePart
    .replace(/\d+\s*[×x]\s*\d+/g, " ")
    .replace(/\bCSA\b/gi, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  for (const [re, name] of OPP_MAP) {
    if (re.test(oppText)) return name;
  }
  throw new Error(`opp not found: ${oppText} (${header})`);
}

function parseRoundPhase(header, comp, sectionPhase) {
  let phase = sectionPhase;
  let round;
  if (/1º\s*jogo/i.test(header)) round = "Jogo de ida";
  else if (/2º\s*jogo/i.test(header)) round = "Jogo de volta";
  else if (/Jogo único/i.test(header)) round = "Jogo único";
  else {
    const rm = header.match(/(\d+ª\s*rodada)/i);
    if (rm) round = rm[1];
  }
  if (comp === "Copa do Brasil") {
    if (/1ª FASE/i.test(header)) phase = "1ª Fase";
    else if (/2ª FASE/i.test(header)) phase = "2ª Fase";
  }
  return { phase, round };
}

function parseRefStadium(block) {
  const refM = block.match(/Árbitro:\s*([^\n/–]+)/i);
  const ref = refM ? refM[1].trim().replace(/\.$/, "") : "";

  const stadiumM = block.match(/(?:Estádio|Arena)\s+([^,\n]+),\s*([^/–.\n]+)/i);
  let stadium = stadiumM ? stadiumM[1].trim() : "";
  if (/^do\s+/i.test(stadium)) stadium = stadium.replace(/^do\s+/i, "");
  else if (/^da\s+/i.test(stadium)) stadium = stadium.replace(/^da\s+/i, "");
  let cityUf = stadiumM ? stadiumM[2].trim() : "";
  cityUf = cityUf.replace(/[.\s]+$/g, "");

  return { ref, stadium, cityUf };
}

function parseAttendance(block) {
  const pagMatches = [...block.matchAll(/(?:P[úu]blico\s+)?[Pp]agante[s]?:\s*([\d.]+)/g)];
  const preMatches = [
    ...block.matchAll(/(?:P[úu]blico\s+)?(?:[Pp]resente[s]?|[Tt]otal):\s*([\d.]+)/g),
  ];
  const rendaM = block.match(/R\$\s*([\d.,]+)/);
  const parseNum = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
  const out = {};
  if (pagMatches.length >= 2 && preMatches.length === 0) {
    out.attP = parseNum(pagMatches[0][1]);
    out.att = parseNum(pagMatches[1][1]);
  } else {
    if (pagMatches[0]) out.attP = parseNum(pagMatches[0][1]);
    if (preMatches[0]) out.att = parseNum(preMatches[0][1]);
  }
  if (rendaM) out.renda = Math.round(parseNum(rendaM[1]));
  return out;
}

// Splits a chunk of comma/"e"-separated player mentions into tokens,
// respecting parenthesis depth so "(2x)" / "(contra)" stay intact.
function tokenizeNames(text) {
  const tokens = [];
  for (const part of text.split(";")) {
    const cleaned = part.trim();
    if (!cleaned) continue;
    let depth = 0;
    let cur = "";
    let i = 0;
    while (i < cleaned.length) {
      const ch = cleaned[i];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth === 0 && ch === ",") {
        tokens.push(cur);
        cur = "";
        i++;
        continue;
      }
      if (depth === 0 && cleaned.slice(i, i + 3).toLowerCase() === " e ") {
        tokens.push(cur);
        cur = "";
        i += 3;
        continue;
      }
      cur += ch;
      i++;
    }
    if (cur.trim()) tokens.push(cur);
  }
  return tokens.map((t) => t.trim()).filter(Boolean);
}

// Returns { goals: [{p,m,h}], ownGoals: ["Nino", ...] } — own goals FOR CSA
// (scored by opponent players, e.g. "Nino (contra)") are tracked separately
// and NEVER resolved as CSA players / never counted as player goals.
function extractCsaGoalsFromText(text) {
  const goals = [];
  const ownGoals = [];
  for (let tok of tokenizeNames(text)) {
    tok = tok.replace(/^e\s+/i, "").trim();
    if (!tok) continue;

    const contraM = tok.match(/^(.+?)\s*\(\s*contra\s*\)\s*$/i);
    if (contraM) {
      ownGoals.push(contraM[1].trim());
      continue;
    }

    const parenXm = tok.match(/^(.+?)\s*\(\s*(\d+)\s*x\s*\)$/i);
    if (parenXm) {
      const p = fixPlayerName(parenXm[1]);
      const n = Number(parenXm[2]);
      for (let k = 0; k < n; k++) goals.push({ p, m: 0, h: 1 });
      continue;
    }

    const bareXm = tok.match(/^(.+?)\s+(\d+)\s*x$/i);
    if (bareXm) {
      const p = fixPlayerName(bareXm[1]);
      const n = Number(bareXm[2]);
      for (let k = 0; k < n; k++) goals.push({ p, m: 0, h: 1 });
      continue;
    }

    const p = fixPlayerName(tok);
    if (p) goals.push({ p, m: 0, h: 1 });
  }
  return { goals, ownGoals };
}

function parseGoals2018(block) {
  const lines = block.split("\n").map((l) => l.trim());
  const goalLines = lines.filter((l) => /^Gols?\b/i.test(l) && l.includes(":"));
  let csaText = "";
  for (const line of goalLines) {
    const m = line.match(/^Gols?\s*(?:CSA)?\s*:\s*(.*)$/i);
    if (m) csaText += (csaText ? "; " : "") + m[1].replace(/\.$/, "");
  }
  csaText = csaText.replace(/,\s*duas\s+vezes,?/gi, " 2x");
  if (!csaText) return { goals: [], ownGoals: [] };
  return extractCsaGoalsFromText(csaText);
}

function parseNestedSubs(inner) {
  inner = inner.trim();
  if (!inner || inner === "") return [];
  if (/\(\s*\)\s*$/.test(inner)) {
    return [[fixPlayerName(inner.replace(/\s*\(\s*\)\s*$/, "").trim()), null]];
  }
  if (!inner.includes("(")) return [[null, fixPlayerName(inner)]];
  const m = inner.match(/^(.+?)\s*\((.+)\)$/);
  if (!m) return [[null, fixPlayerName(inner)]];
  const starter = fixPlayerName(m[1].trim());
  const rest = m[2].trim();
  if (!rest) return [[starter, null]];
  if (rest.includes("(")) {
    const m2 = rest.match(/^(.+?)\s*\((.+)\)$/);
    if (m2) {
      return [
        [starter, fixPlayerName(m2[1].trim())],
        [fixPlayerName(m2[1].trim()), fixPlayerName(m2[2].trim())],
      ];
    }
  }
  return [[starter, fixPlayerName(rest)]];
}

function parseLineup(block) {
  const lineM = block.match(/^CSA:\s*(.+?)(?:\.\s*Técnico|\.\s*Treinador|$)/im);
  if (!lineM) throw new Error("no CSA lineup");
  let raw = lineM[1].trim();
  raw = raw.replace(/\s+Treinador:.*/i, "").replace(/\s+Técnico:.*/i, "");

  const subs = [];
  const allStarters = [];
  const sections = raw.split(";").map((s) => s.trim());
  for (const sec of sections) {
    const cleaned = sec.replace(/\s+e\s+/gi, ", ").replace(/\)\s*e\s+/gi, "), ");
    const tokens = [];
    let depth = 0;
    let cur = "";
    for (const c of cleaned) {
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (c === "," && depth === 0) {
        tokens.push(cur.trim());
        cur = "";
      } else cur += c;
    }
    if (cur.trim()) tokens.push(cur.trim());
    for (let tok of tokens) {
      tok = tok.replace(/^e\s+/i, "").trim();
      if (!tok) continue;
      if (/\(\s*\)\s*$/.test(tok)) {
        allStarters.push(fixPlayerName(tok.replace(/\s*\(\s*\)\s*$/, "").trim()));
        continue;
      }
      if (tok.includes("(")) {
        const pairs = parseNestedSubs(tok);
        const starter = pairs[0]?.[0];
        if (starter) allStarters.push(starter);
        for (const [out, inn] of pairs) {
          if (out && inn) subs.push([out, inn]);
        }
      } else {
        allStarters.push(fixPlayerName(tok));
      }
    }
  }

  const mgrM = block.match(/T(?:écnico|reinador):\s*([^\n(]+)/i);
  let mgr = mgrM ? mgrM[1].trim().replace(/\.$/, "") : "";

  return { starters: allStarters, subs, mgr };
}

const compOrder = ["Alagoano", "Nordeste", "Copa do Brasil", "Série B"];
let comp = "Alagoano";
let sectionPhase;
const rawGames = [];
const lines = paste.split(/\n/);
let i = 0;
outer: while (i < lines.length) {
  const line = lines[i].trim();
  if (/^RESUMO/i.test(line)) {
    break outer;
  } else if (/^CAMPEONATO ALAGOANO/i.test(line)) {
    comp = "Alagoano";
    sectionPhase = "1ª Fase";
  } else if (/^COPA DO NORDESTE/i.test(line)) {
    comp = "Nordeste";
    sectionPhase = "Fase de grupos";
  } else if (/^COPA DO BRASIL/i.test(line)) {
    comp = "Copa do Brasil";
    sectionPhase = undefined;
  } else if (/^CAMPEONATO BRASILEIRO/i.test(line)) {
    comp = "Série B";
    sectionPhase = undefined;
  } else if (/^SEMIFINAL\s*$/i.test(line)) {
    sectionPhase = "Semifinal";
  } else if (/^FINAL\s*$/i.test(line)) {
    sectionPhase = "Final";
  } else if (
    SCORE_RE.test(line) &&
    (/\bCSA\b/i.test(line) || /rodada|RODADA|FASE|JOGO|SEMIFINAL|FINAL|jogo/i.test(line))
  ) {
    const header = line;
    const blockLines = [line];
    i++;
    while (i < lines.length) {
      const nl = lines[i].trim();
      if (
        /^CAMPEONATO|^COPA |^SEMIFINAL\s*$|^FINAL\s*$|^RESUMO/i.test(nl) ||
        (SCORE_RE.test(nl) &&
          (/\bCSA\b/i.test(nl) || /rodada|RODADA|FASE|JOGO|jogo/i.test(nl)))
      ) {
        break;
      }
      blockLines.push(lines[i]);
      i++;
    }
    const block = blockLines.join("\n");
    try {
      const date = parseDateFromHeader(header);
      if (!date) {
        console.error("skip no date", header);
        continue;
      }
      const score = parseScoreHeader(header);
      if (!score) {
        console.error("skip no score", header);
        continue;
      }
      const opp = parseOpponent(header);
      const { ref, stadium, cityUf } = parseRefStadium(block);
      const { goals, ownGoals } = parseGoals2018(block);
      const { starters, subs, mgr } = parseLineup(block);
      const att = parseAttendance(block);
      const { phase, round } = parseRoundPhase(header, comp, sectionPhase);

      const expectedScorers = goals.length + ownGoals.length;
      if (expectedScorers !== score.gf) {
        console.warn(
          `  (goal count mismatch) ${header}: gf=${score.gf} but parsed ${goals.length} player goal(s) + ${ownGoals.length} own goal(s)`,
        );
      }

      const game = {
        date,
        ha: score.ha,
        opp,
        comp,
        gf: score.gf,
        ga: score.ga,
        mgr,
        ref,
        stadium: stadium || "",
        cityUf: cityUf || "",
        round: round || "",
        goals,
        ownGoalsFor: ownGoals,
        starters,
        subs,
      };
      if (phase) game.phase = phase;
      Object.assign(game, att);
      rawGames.push(game);
    } catch (e) {
      console.error("ERR", header, e.message);
    }
    continue;
  }
  i++;
}

const byComp = Object.fromEntries(compOrder.map((c) => [c, []]));
for (const g of rawGames) byComp[g.comp].push(g);
const ordered = compOrder.flatMap((c) => byComp[c]);
ordered.forEach((g, idx) => {
  g.n = idx + 1;
});

function esc(s) {
  return JSON.stringify(s);
}

const header = `/** Shared CSA 2018 sheet source data (${ordered.length} games). */
export function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function convertMinute(rawMin, half) {
  const X = Number(rawMin);
  if (!Number.isFinite(X) || (half !== 1 && half !== 2)) {
    return { error: \`bad minute \${rawMin} \${half}T\` };
  }
  if (half === 1) {
    if (X <= 45) return { minute: X, injuryTimeMinute: null };
    return { minute: 45, injuryTimeMinute: X - 45 };
  }
  const abs = 45 + X;
  if (abs <= 90) return { minute: abs, injuryTimeMinute: null };
  return { minute: 90, injuryTimeMinute: abs - 90 };
}

export const GAMES = [
`;

const body = ordered
  .map((g) => {
    const parts = [
      `n:${g.n}`,
      `date:${esc(g.date)}`,
      `ha:${esc(g.ha)}`,
      `opp:${esc(g.opp)}`,
      `comp:${esc(g.comp)}`,
      `gf:${g.gf}`,
      `ga:${g.ga}`,
      `mgr:${esc(g.mgr)}`,
      `ref:${esc(g.ref)}`,
      `stadium:${esc(g.stadium)}`,
      `cityUf:${esc(g.cityUf)}`,
    ];
    if (g.attP != null) parts.push(`attP:${g.attP}`);
    if (g.att != null) parts.push(`att:${g.att}`);
    if (g.renda != null) parts.push(`renda:${g.renda}`);
    if (g.phase) parts.push(`phase:${esc(g.phase)}`);
    parts.push(`round:${esc(g.round)}`);
    parts.push(`goals:${JSON.stringify(g.goals)}`);
    parts.push(`ownGoalsFor:${JSON.stringify(g.ownGoalsFor)}`);
    parts.push(`starters:${JSON.stringify(g.starters)}`);
    parts.push(`subs:${JSON.stringify(g.subs)}`);
    return `  { ${parts.join(", ")} }`;
  })
  .join(",\n");

const out = header + body + "\n];\n";
const outPath = path.join("scripts/data/season-2018-games.mjs");
fs.writeFileSync(outPath, out, "utf8");
console.log("Wrote", outPath, "games", ordered.length);
for (const c of compOrder) console.log(c, byComp[c].length);
