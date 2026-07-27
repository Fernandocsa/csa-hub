import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();
const YEAR = process.argv[2] || "2025";
const seasonYear = parseInt(YEAR, 10);

function calcAgeInSeason(birthDate, seasonYear) {
  if (!birthDate) return null;
  const ref = new Date(seasonYear, 11, 31, 12, 0, 0, 0);
  const d = new Date(String(birthDate).includes("T") ? birthDate : `${birthDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

const { rows } = await pool.query(
  `SELECT m.id, m.name, m.birth_date::text AS birth_date, mss.games
   FROM manager_season_stats mss
   JOIN managers m ON m.id = mss.manager_id
   WHERE mss.season = $1
   ORDER BY mss.games DESC, m.name`,
  [YEAR],
);

console.log(
  JSON.stringify(
    {
      year: YEAR,
      managers: rows.map((m) => ({
        id: m.id,
        name: m.name,
        birthDate: m.birth_date,
        games: m.games,
        seasonAge: calcAgeInSeason(m.birth_date, seasonYear),
      })),
    },
    null,
    2,
  ),
);
await pool.end();
