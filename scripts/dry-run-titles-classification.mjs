/**
 * Dry-run: map championship years → season_competition_stats rows.
 * Does NOT write anything.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const TARGETS = [
  {
    label: "Campeonato Alagoano - Série A",
    years: [
      1928, 1929, 1933, 1935, 1936, 1941, 1942, 1944, 1949, 1952, 1955, 1956,
      1957, 1958, 1960, 1963, 1965, 1966, 1967, 1968, 1971, 1974, 1975, 1980,
      1981, 1982, 1984, 1985, 1988, 1990, 1991, 1994, 1996, 1997, 1998, 1999,
      2008, 2018, 2019, 2021,
    ],
    // candidate name patterns (case-insensitive)
    nameHints: [
      "campeonato alagoano",
      "alagoano",
      "série a",
      "serie a",
    ],
  },
  {
    label: "Copa Alagoas",
    years: [2024, 2026],
    nameHints: ["copa alagoas"],
  },
  {
    label: "Campeonato Alagoano - Série B",
    years: [2005, 2010],
    nameHints: ["série b", "serie b", "alagoano"],
  },
  {
    label: "Campeonato Brasileiro Série C",
    years: [2017],
    nameHints: ["série c", "serie c", "brasileiro"],
  },
];

const { rows: competitions } = await pool.query(
  `SELECT id, name FROM competitions ORDER BY name`,
);

function scoreCompetition(name, hints, label) {
  const n = name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const labelN = label.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  let score = 0;
  if (n === labelN) score += 100;
  if (n.includes("copa alagoas") && label.includes("Copa Alagoas")) score += 50;
  if (n.includes("serie c") || n.includes("série c")) {
    if (label.includes("Série C")) score += 40;
  }
  if ((n.includes("serie b") || n.includes("série b")) && label.includes("Série B"))
    score += 40;
  // Série A / main Alagoano: prefer names that look like the state championship
  // without série b / copa
  if (label.includes("Série A")) {
    if (n.includes("alagoano") && !n.includes("serie b") && !n.includes("série b") && !n.includes("copa")) {
      score += 30;
      if (n.includes("serie a") || n.includes("série a") || n === "campeonato alagoano")
        score += 15;
    }
  }
  for (const h of hints) {
    const hn = h.normalize("NFD").replace(/\p{M}/gu, "");
    if (n.includes(hn)) score += 5;
  }
  return score;
}

const report = [];
let existing = 0;
let toCreate = 0;
let unmatchedGroups = [];

for (const group of TARGETS) {
  const ranked = competitions
    .map((c) => ({
      ...c,
      score: scoreCompetition(c.name, group.nameHints, group.label),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0] ?? null;
  const groupResult = {
    label: group.label,
    years: group.years.length,
    matchedCompetition: best
      ? { id: best.id, name: best.name, score: best.score }
      : null,
    candidates: ranked.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      score: c.score,
    })),
    existing: [],
    missing: [],
    alreadyFirst: [],
    otherClassification: [],
  };

  if (!best || best.score < 20) {
    unmatchedGroups.push(group.label);
    report.push(groupResult);
    continue;
  }

  for (const year of group.years) {
    const season = String(year);
    const { rows } = await pool.query(
      `SELECT id, classification, games, wins, draws, losses, goals_for, goals_against, stats_source
       FROM season_competition_stats
       WHERE season = $1 AND competition_id = $2`,
      [season, best.id],
    );
    if (rows.length === 0) {
      groupResult.missing.push(season);
      toCreate++;
    } else {
      existing++;
      const row = rows[0];
      if (row.classification === "1º") {
        groupResult.alreadyFirst.push(season);
      } else if (row.classification) {
        groupResult.otherClassification.push({
          season,
          classification: row.classification,
        });
      } else {
        groupResult.existing.push(season);
      }
    }
  }

  report.push(groupResult);
}

const expected = TARGETS.reduce((s, g) => s + g.years.length, 0);

console.log(
  JSON.stringify(
    {
      expectedTitles: expected,
      rowsExisting: existing,
      rowsToCreate: toCreate,
      // existing here = has row but classification null/empty (will UPDATE to 1º)
      // alreadyFirst counted inside groups, also part of "existing" total above
      unmatchedGroups,
      allCompetitionsSample: competitions
        .filter((c) =>
          /alago|brasileir|s[eé]rie/i.test(c.name),
        )
        .map((c) => ({ id: c.id, name: c.name })),
      groups: report.map((g) => ({
        label: g.label,
        yearsRequested: g.years,
        match: g.matchedCompetition,
        topCandidates: g.candidates,
        willUpdateNullOrEmpty: g.existing.length,
        alreadyFirst: g.alreadyFirst.length,
        willOverwriteOtherClassif: g.otherClassification,
        willCreate: g.missing.length,
        missingYears: g.missing,
        alreadyFirstYears: g.alreadyFirst,
        updateYears: g.existing,
      })),
    },
    null,
    2,
  ),
);

await pool.end();
