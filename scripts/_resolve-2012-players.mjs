/**
 * Inspect 2012 matches + resolve sheet player names against DB (report only).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFromDotenv(".env");
const pool = createPgPool();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fixPlayerName(n) {
  return String(n)
    .trim()
    .replace(/\bPaulinho Marília\b/gi, "Paulinho Marilia")
    .replace(/\bRafael Araujo\b/gi, "Rafael Araújo")
    .replace(/\bAndré Luis\b/gi, "André Luiz")
    .replace(/\bWagner\b/gi, "Wagnér")
    .replace(/\bRafael\b(?!\s)/gi, (m, offset, str) => {
      // bare "Rafael" as goal → Rafael Araújo (handled in goals list separately)
      return m;
    });
}

function parseNestedSubs(inner) {
  inner = inner.trim();
  if (!inner) return [];
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

function parseLineupField(raw) {
  const starters = [];
  const subs = [];
  if (!raw?.trim()) return { starters, subs };
  for (const sec of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    if (sec.includes("(")) {
      const pairs = parseNestedSubs(sec);
      if (pairs[0]?.[0]) starters.push(pairs[0][0]);
      for (const [out, inn] of pairs) if (out && inn) subs.push([out, inn]);
    } else {
      starters.push(fixPlayerName(sec));
    }
  }
  return { starters, subs };
}

function parseGoalsCsa(raw) {
  const goals = [];
  if (!raw?.trim()) return goals;
  for (const part of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      const name = fixPlayerName(m[1].trim());
      for (let i = 0; i < Number(m[2]); i++) goals.push(name);
    } else {
      let name = fixPlayerName(part);
      if (norm(name) === "rafael") name = "Rafael Araújo";
      goals.push(name);
    }
  }
  return goals;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = cols[c] ?? "";
    rows.push(obj);
  }
  return rows;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const csv = readFileSync(
  join(__dirname, "data", "season-2012-sheets.csv"),
  "utf8",
);
const rows = parseCsv(csv);

const names = new Set();
const coaches = new Set();
for (const r of rows) {
  coaches.add(r.coach.trim());
  const { starters, subs } = parseLineupField(r.lineup);
  for (const s of starters) names.add(s);
  for (const [a, b] of subs) {
    names.add(a);
    names.add(b);
  }
  for (const g of parseGoalsCsa(r.goals_csa)) names.add(g);
}

const { rows: matches } = await pool.query(`
  SELECT m.id, m.match_date::text AS d, o.name AS opp, m.home_away,
         m.goals_for, m.goals_against, c.name AS competition,
         m.manager_id, (SELECT count(*)::int FROM match_lineups ml WHERE ml.match_id=m.id) AS lineup_n
  FROM matches m
  JOIN opponents o ON o.id = m.opponent_id
  JOIN competitions c ON c.id = m.competition_id
  WHERE m.season = '2012' AND m.is_friendly = false
  ORDER BY m.match_date
`);

const { rows: players } = await pool.query(`
  SELECT p.id, p.name, p.full_name,
         array_agg(DISTINCT pss.season ORDER BY pss.season) FILTER (WHERE pss.season IS NOT NULL) AS seasons
  FROM players p
  LEFT JOIN player_season_stats pss ON pss.player_id = p.id
  GROUP BY p.id
  ORDER BY p.id
`);

const { rows: managers } = await pool.query(
  `SELECT id, name FROM managers ORDER BY id`,
);

const byNorm = new Map();
for (const p of players) {
  const k = norm(p.name);
  if (!byNorm.has(k)) byNorm.set(k, []);
  byNorm.get(k).push(p);
}

function findHits(name) {
  const k = norm(name);
  const exact = byNorm.get(k) ?? [];
  if (exact.length) return { kind: "exact", hits: exact };
  // partial
  const partial = players.filter(
    (p) =>
      norm(p.name).includes(k) ||
      k.includes(norm(p.name)) ||
      (p.full_name && norm(p.full_name).includes(k)),
  );
  if (partial.length) return { kind: "partial", hits: partial.slice(0, 8) };
  return { kind: "none", hits: [] };
}

console.log(`CSV games: ${rows.length}`);
console.log(`DB 2012 official matches: ${matches.length}`);
console.log(
  matches
    .map(
      (m) =>
        `#${m.id} ${m.d.slice(0, 10)} ${m.home_away} ${m.opp} ${m.goals_for}-${m.goals_against} [${m.competition}] lineup=${m.lineup_n}`,
    )
    .join("\n"),
);

console.log(`\nCoaches (${coaches.size}):`);
for (const c of [...coaches].sort()) {
  const hits = managers.filter((m) => norm(m.name) === norm(c) || norm(m.name).includes(norm(c)) || norm(c).includes(norm(m.name)));
  console.log(
    `  ${c} → ${hits.map((h) => `#${h.id} ${h.name}`).join(" | ") || "NEW"}`,
  );
}

console.log(`\nPlayers (${names.size}):`);
const report = { exact_2013: [], exact_other: [], partial: [], none: [] };
for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
  const { kind, hits } = findHits(name);
  const with2013 = hits.filter((h) => (h.seasons ?? []).includes("2013"));
  const with2012 = hits.filter((h) => (h.seasons ?? []).includes("2012"));
  const line = `${name} → ${
    hits.length
      ? hits
          .map(
            (h) =>
              `#${h.id} ${h.name} [${(h.seasons ?? []).join(",")}]`,
          )
          .join(" | ")
      : "NEW"
  }`;
  if (kind === "exact" && (with2012.length || with2013.length))
    report.exact_2013.push(line);
  else if (kind === "exact") report.exact_other.push(line);
  else if (kind === "partial") report.partial.push(line);
  else report.none.push(line);
}

console.log("\n--- exact match (has 2012/2013 season) ---");
console.log(report.exact_2013.join("\n") || "(none)");
console.log("\n--- exact match (other seasons only) ---");
console.log(report.exact_other.join("\n") || "(none)");
console.log("\n--- partial / ambiguous ---");
console.log(report.partial.join("\n") || "(none)");
console.log("\n--- no match (create new) ---");
console.log(report.none.join("\n") || "(none)");

// Match CSV dates to DB
console.log("\n--- CSV ↔ DB date match ---");
for (const r of rows) {
  const d = r.date;
  const [gf, ga] = r.score.split(/[x×]/i).map((x) => Number(x.trim()));
  const same = matches.filter((m) => m.d.slice(0, 10) === d);
  const label = `${d} ${r.home_away} ${r.opponent} ${gf}-${ga}`;
  if (same.length === 1) console.log(`OK  ${label} → #${same[0].id}`);
  else if (same.length === 0) console.log(`MISS ${label}`);
  else
    console.log(
      `MULTI ${label} → ${same.map((m) => `#${m.id} ${m.opp}`).join(", ")}`,
    );
}

await pool.end();
