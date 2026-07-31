import fs from "node:fs";
import path from "node:path";

const paste = fs.readFileSync(path.join("scripts/_tmp_2019_source.txt"), "utf8");

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
  return n
    .trim()
    .replace(/\bGerson Júnior\b/gi, "Gersinho")
    .replace(/\bNIlton\b/g, "Nilton")
    .replace(/\bBustamente\b/gi, "Bustamante");
}

function normalizeMonth(raw) {
  const monName = raw.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return MONTHS[monName] ?? MONTHS[monName === "marco" ? "marco" : monName];
}

function parseDateFromHeader(line) {
  const m = line.match(/(\d{1,2})º?\s+de\s+([\p{L}]+)(?:\s+de\s+(\d{4}))?/iu);
  if (!m) return null;
  const mon = normalizeMonth(m[2]);
  if (!mon) throw new Error(`bad month ${m[2]} in ${line}`);
  const year = m[3] ?? "2019";
  return `${year}-${mon}-${String(m[1]).padStart(2, "0")}`;
}

// Matches either a normal "N x N" score or a penalty-shootout header "N(N)x(N)N"
const SCORE_RE = /\d+\s*[×x]\s*\d+|\d+\(\d+\)\s*[×x]\s*\(\d+\)\d+/i;

function parsePenaltyHeader(line) {
  const m = line.match(/(\d+)\((\d+)\)\s*[×x]\s*\((\d+)\)(\d+)/i);
  if (!m) return null;
  const before = line.slice(0, m.index);
  const after = line.slice(m.index + m[0].length);
  const leftHasCsa = /\bCSA\b/i.test(before);
  const rightHasCsa = /\bCSA\b/i.test(after);
  if (rightHasCsa && !leftHasCsa) {
    return {
      gf: Number(m[4]),
      ga: Number(m[1]),
      pensFor: Number(m[3]),
      pensAgainst: Number(m[2]),
      ha: "away",
    };
  }
  if (leftHasCsa && !rightHasCsa) {
    return {
      gf: Number(m[1]),
      ga: Number(m[4]),
      pensFor: Number(m[2]),
      pensAgainst: Number(m[3]),
      ha: "home",
    };
  }
  throw new Error(`ambiguous penalty header: ${line}`);
}

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
  [/Sport Recife/i, "Sport Recife-PE"],
  [/\bCentral\b/i, "Central-PE"],
  [/Dimensão Capela/i, "Dimensão Capela"],
  [/Jaciobá/i, "Jaciobá"],
  [/Murici/i, "Murici"],
  [/\bCRB\b/i, "CRB"],
  [/\bCEO\b/i, "CEO"],
  [/\bASA\b/i, "ASA"],
  [/Coruripe/i, "Coruripe"],
  [/Vitória/i, "Vitória"],
  [/Fortaleza/i, "Fortaleza"],
  [/Sampaio Corrêa/i, "Sampaio Corrêa"],
  [/Salgueiro/i, "Salgueiro-PE"],
  [/Santa Cruz/i, "Santa Cruz"],
  [/Sergipe/i, "Sergipe"],
  [/Altos/i, "Altos-PI"],
  [/Botafogo-PB/i, "Botafogo-PB"],
  [/\bBotafogo\b/i, "Botafogo"],
  [/Mixto/i, "Mixto-MT"],
  [/Ceará/i, "Ceará"],
  [/Palmeiras/i, "Palmeiras"],
  [/\bSantos\b/i, "Santos"],
  [/Avaí/i, "Avaí"],
  [/Internacional/i, "Internacional"],
  [/Goiás/i, "Goiás"],
  [/Atlético-MG/i, "Atlético-MG"],
  [/Flamengo/i, "Flamengo"],
  [/Corinthians/i, "Corinthians"],
  [/Athletico-PR/i, "Athletico-PR"],
  [/Grêmio/i, "Grêmio"],
  [/Vasco/i, "Vasco"],
  [/Fluminense/i, "Fluminense"],
  [/Cruzeiro/i, "Cruzeiro-MG"],
  [/Bahia/i, "Bahia"],
  [/Chapecoense/i, "Chapecoense"],
  [/São Paulo/i, "São Paulo"],
];

function parseOpponent(header) {
  const parts = header.split(/–/).map((s) => s.trim());
  const scorePart =
    parts.find((p) => SCORE_RE.test(p)) || parts[0] || header;
  const oppText = scorePart
    .replace(/\d+\(\d+\)\s*[×x]\s*\(\d+\)\d+/g, " ")
    .replace(/\d+\s*[×x]\s*\d+/g, " ")
    .replace(/\bCSA\b/gi, " ")
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
  if (/JOGO DE IDA/i.test(header)) round = "Jogo de ida";
  else if (/JOGO DE VOLTA/i.test(header)) round = "Jogo de volta";
  else if (/JOGO ÚNICO/i.test(header)) round = "Jogo único";
  else {
    const rm = header.match(/(\d+ª\s*RODADA)/i);
    if (rm) round = rm[1].replace(/RODADA/i, "rodada");
  }
  if (comp === "Copa do Brasil" && /1ª FASE/i.test(header)) phase = "1ª Fase";
  return { phase, round };
}

function parseRefStadium(block) {
  const refM = block.match(/Árbitro:\s*([^\n/–]+)/i);
  const ref = refM ? refM[1].trim() : "";

  const stadiumM = block.match(/(?:Estádio|Arena)\s+([^,\n]+),\s*([^/–\n]+)/i);
  let stadium = stadiumM ? stadiumM[1].trim() : "";
  if (/^do\s+/i.test(stadium)) stadium = stadium.replace(/^do\s+/i, "");
  else if (/^da\s+/i.test(stadium)) stadium = stadium.replace(/^da\s+/i, "");
  let cityUf = stadiumM ? stadiumM[2].trim() : "";
  cityUf = cityUf.replace(/\s+$/g, "");

  return { ref, stadium, cityUf };
}

function parseAttendance(block) {
  const attPM = block.match(/(?:P[úu]blico\s+)?[Pp]agante[s]?:\s*([\d.]+)/);
  const attM = block.match(/(?:P[úu]blico\s+)?[Pp]resente[s]?:\s*([\d.]+)/);
  const rendaM = block.match(/R\$\s*([\d.,]+)/);
  if (!attPM && !attM) return {};
  const parseNum = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
  const out = {};
  if (attPM) out.attP = parseNum(attPM[1]);
  if (attM) out.att = parseNum(attM[1]);
  if (rendaM) out.renda = Math.round(parseNum(rendaM[1]));
  return out;
}

// Splits a chunk of comma/"e"-separated player mentions into tokens,
// respecting parenthesis depth so "(16min 2T)" / "(2x)" stay intact.
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

function extractCsaGoalsFromText(text) {
  const goals = [];
  for (let tok of tokenizeNames(text)) {
    tok = tok.replace(/^e\s+/i, "").trim();
    if (!tok) continue;
    const twoXm = tok.match(/^(.+?)\s*\(\s*2x\s*\)$/i);
    if (twoXm) {
      const p = fixPlayerName(twoXm[1].trim());
      goals.push({ p, m: 0, h: 1 });
      goals.push({ p, m: 0, h: 1 });
      continue;
    }
    const minM = tok.match(/^(.+?)\s*\(\s*(\d+)\s*min(?:\s*(\d)\s*[ºo]?\s*T)?\s*\)$/i);
    if (minM) {
      const p = fixPlayerName(minM[1].trim());
      const min = Number(minM[2]);
      const h = minM[3] ? Number(minM[3]) : 1;
      goals.push({ p, m: min, h });
      continue;
    }
    const p = fixPlayerName(tok.trim());
    if (p) goals.push({ p, m: 0, h: 1 });
  }
  return goals;
}

function parseGoals2019(block, gf) {
  const lines = block.split("\n").map((l) => l.trim());
  const goalLines = lines.filter((l) => /^Gols?\b/i.test(l) && l.includes(":"));
  let csaText = "";
  for (const line of goalLines) {
    for (const seg of line.split("/").map((s) => s.trim())) {
      const csaLabelM = seg.match(/^Gols?\s*(?:do\s+|da\s+)?CSA\s*:\s*(.*)$/i);
      if (csaLabelM) {
        csaText += (csaText ? "; " : "") + csaLabelM[1].replace(/\.$/, "");
        continue;
      }
      const bareM = seg.match(/^Gols?\s*:\s*(.*)$/i);
      if (bareM) {
        if (/\(CSA\)/i.test(seg)) {
          const nameM = seg.match(/([A-Za-zÀ-ú][A-Za-zÀ-ú\s.'-]*?)\s*\(CSA\)/i);
          if (nameM) csaText += (csaText ? "; " : "") + nameM[1].trim();
          continue;
        }
        // bare "Gol:"/"Gols:" with no explicit team label -> assume CSA
        // (protected below: discarded entirely if gf === 0)
        csaText += (csaText ? "; " : "") + bareM[1].replace(/\.$/, "");
        continue;
      }
      // otherwise: explicit non-CSA team label (e.g. "Gol Central:", "Gol do Coruripe:") -> skip
    }
  }
  let goals = csaText ? extractCsaGoalsFromText(csaText) : [];
  if (gf === 0 && goals.length) {
    console.warn(`  (discarding ${goals.length} false CSA goal(s), gf=0): ${JSON.stringify(goals)}`);
    goals = [];
  }
  return goals;
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
  raw = raw.replace(/\s+Treinador:.*/i, "");

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

function parseYoutube(block) {
  const m = block.match(/https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^\s\n]+|https:\/\/youtu\.be\/[^\s\n]+/i);
  return m ? m[0] : undefined;
}

const compOrder = ["Amistoso", "Alagoano", "Nordeste", "Copa do Brasil", "Série A"];
let comp = "Amistoso";
let sectionPhase;
const rawGames = [];
const lines = paste.split(/\n/);
let i = 0;
while (i < lines.length) {
  const line = lines[i].trim();
  if (/^AMISTOSOS/i.test(line)) {
    comp = "Amistoso";
    sectionPhase = undefined;
  } else if (/^CAMPEONATO ALAGOANO/i.test(line)) {
    comp = "Alagoano";
    sectionPhase = undefined;
  } else if (/^COPA DO NORDESTE/i.test(line)) {
    comp = "Nordeste";
    sectionPhase = undefined;
  } else if (/^COPA DO BRASIL/i.test(line)) {
    comp = "Copa do Brasil";
    sectionPhase = undefined;
  } else if (/^CAMPEONATO BRASILEIRO/i.test(line)) {
    comp = "Série A";
    sectionPhase = undefined;
  } else if (/^SEMIFINAL\s*$/i.test(line)) {
    sectionPhase = "Semifinal";
  } else if (/^FINAL\s*$/i.test(line)) {
    sectionPhase = "Final";
  } else if (/^QUARTAS DE FINAL\s*$/i.test(line)) {
    sectionPhase = "Quartas de Final";
  } else if (
    SCORE_RE.test(line) &&
    (/\bCSA\b/i.test(line) || /rodada|RODADA|FASE|JOGO|SEMIFINAL|FINAL|Jogo de/i.test(line))
  ) {
    const header = line;
    const blockLines = [line];
    i++;
    while (i < lines.length) {
      const nl = lines[i].trim();
      if (
        /^AMISTOSOS|^CAMPEONATO|^COPA |^SEMIFINAL\s*$|^FINAL\s*$|^QUARTAS DE FINAL\s*$/i.test(nl) ||
        (SCORE_RE.test(nl) &&
          (/\bCSA\b/i.test(nl) || /rodada|RODADA|FASE|JOGO|Jogo de/i.test(nl)))
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
      const pens = parsePenaltyHeader(header);
      const score = pens ?? parseScoreHeader(header);
      if (!score) {
        console.error("skip no score", header);
        continue;
      }
      const opp = parseOpponent(header);
      const { ref, stadium, cityUf } = parseRefStadium(block);
      const goals = parseGoals2019(block, score.gf);
      const { starters, subs, mgr } = parseLineup(block);
      const att = parseAttendance(block);
      const { phase, round } = parseRoundPhase(header, comp, sectionPhase);
      const yt = parseYoutube(block);

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
        round: round || (comp === "Amistoso" ? "" : "1ª rodada"),
        goals,
        starters,
        subs,
      };
      if (phase) game.phase = phase;
      if (pens) {
        game.pensFor = pens.pensFor;
        game.pensAgainst = pens.pensAgainst;
      }
      Object.assign(game, att);
      if (yt) game.youtube = yt;
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
for (const c of compOrder) {
  // Preserve source order within each competition (do not sort by date,
  // since Alagoano/Nordeste rounds overlap in date range with each other).
}
const ordered = compOrder.flatMap((c) => byComp[c]);
ordered.forEach((g, idx) => {
  g.n = idx + 1;
});

function esc(s) {
  return JSON.stringify(s);
}

const header = `/** Shared CSA 2019 sheet source data (${ordered.length} games). */
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
    if (g.pensFor != null) parts.push(`pensFor:${g.pensFor}`);
    if (g.pensAgainst != null) parts.push(`pensAgainst:${g.pensAgainst}`);
    if (g.youtube) parts.push(`youtube:${esc(g.youtube)}`);
    parts.push(`goals:${JSON.stringify(g.goals)}`);
    parts.push(`starters:${JSON.stringify(g.starters)}`);
    parts.push(`subs:${JSON.stringify(g.subs)}`);
    return `  { ${parts.join(", ")} }`;
  })
  .join(",\n");

const out = header + body + "\n];\n";
const outPath = path.join("scripts/data/season-2019-games.mjs");
fs.writeFileSync(outPath, out, "utf8");
console.log("Wrote", outPath, "games", ordered.length);
for (const c of compOrder) console.log(c, byComp[c].length);
