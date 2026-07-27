/**
 * Smoke Stage 2: public season payload shape for a given year (DB + age helper).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const YEAR = process.argv[2] || "2025";
const seasonYear = parseInt(YEAR, 10);

function calcAgeInSeason(birthDate, birthYear, seasonYear) {
  if (!Number.isInteger(seasonYear) || seasonYear < 1900) return null;
  const ref = new Date(seasonYear, 11, 31, 12, 0, 0, 0);
  if (birthDate) {
    const d = new Date(String(birthDate).includes("T") ? birthDate : `${birthDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    let age = ref.getFullYear() - d.getFullYear();
    const m = ref.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age -= 1;
    return age >= 0 ? age : null;
  }
  if (birthYear != null && birthYear > 1900) return Math.max(0, seasonYear - birthYear);
  return null;
}

const { rows: comps } = await pool.query(
  `SELECT c.name, s.games, s.wins, s.draws, s.losses, s.goals_for, s.goals_against,
          s.classification, s.stats_source
   FROM season_competition_stats s
   JOIN competitions c ON c.id = s.competition_id
   WHERE s.season = $1 ORDER BY c.name`,
  [YEAR],
);

const totals = comps.reduce(
  (a, r) => ({
    matches: a.matches + r.games,
    wins: a.wins + r.wins,
    draws: a.draws + r.draws,
    losses: a.losses + r.losses,
    gf: a.gf + r.goals_for,
    ga: a.ga + r.goals_against,
  }),
  { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 },
);

const { rows: managers } = await pool.query(
  `SELECT m.id, m.name, mss.games, mss.wins, mss.draws, mss.losses
   FROM manager_season_stats mss
   JOIN managers m ON m.id = mss.manager_id
   WHERE mss.season = $1
   ORDER BY mss.games DESC, m.name`,
  [YEAR],
);

const { rows: players } = await pool.query(
  `SELECT p.id, p.name, p.position, p.birth_year, p.birth_date::text,
          pss.appearances, pss.goals, pss.assists
   FROM player_season_stats pss
   JOIN players p ON p.id = pss.player_id
   WHERE pss.season = $1
   ORDER BY pss.appearances DESC`,
  [YEAR],
);

const withAge = players.map((p) => ({
  id: p.id,
  name: p.name,
  appearances: p.appearances,
  goals: p.goals,
  assists: p.assists,
  birthYear: p.birth_year,
  birthDate: p.birth_date,
  seasonAge: calcAgeInSeason(p.birth_date, p.birth_year, seasonYear),
}));

const topAppearances = withAge.slice(0, 5).map((p) => ({
  id: p.id,
  name: p.name,
  value: p.appearances,
  seasonAge: p.seasonAge,
}));
const topGoals = [...withAge]
  .filter((p) => p.goals > 0)
  .sort((a, b) => b.goals - a.goals)
  .slice(0, 5)
  .map((p) => ({ id: p.id, name: p.name, value: p.goals, seasonAge: p.seasonAge }));
const topAssists = [...withAge]
  .filter((p) => (p.assists ?? 0) > 0)
  .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))
  .slice(0, 5)
  .map((p) => ({ id: p.id, name: p.name, value: p.assists, seasonAge: p.seasonAge }));

const withAgeSample = withAge.filter((p) => p.seasonAge != null).slice(0, 5);
const withoutAge = withAge.filter((p) => p.seasonAge == null).length;

// age consistency check: born 2000 → 25 in 2025
const ageCheck =
  calcAgeInSeason(null, 2000, 2025) === 25 &&
  calcAgeInSeason("2000-06-15", null, 2025) === 25 &&
  calcAgeInSeason(null, 2000, 2026) === 26;

console.log(
  JSON.stringify(
    {
      year: YEAR,
      totalsFromDual: totals,
      competitionStats: comps,
      managers,
      rosterCount: withAge.length,
      withoutAge,
      withAgeSample,
      topAppearances,
      topGoals,
      topAssists,
      ageHelperOk: ageCheck,
    },
    null,
    2,
  ),
);

await pool.end();
