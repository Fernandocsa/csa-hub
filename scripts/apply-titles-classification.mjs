/**
 * Apply classification = '1º' for known CSA titles.
 * Preserves existing J/V/E/D/GP/GC; creates missing rows as manual zeros.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const GROUPS = [
  {
    competitionId: 5,
    name: "Campeonato Alagoano",
    years: [
      1928, 1929, 1933, 1935, 1936, 1941, 1942, 1944, 1949, 1952, 1955, 1956,
      1957, 1958, 1960, 1963, 1965, 1966, 1967, 1968, 1971, 1974, 1975, 1980,
      1981, 1982, 1984, 1985, 1988, 1990, 1991, 1994, 1996, 1997, 1998, 1999,
      2008, 2018, 2019, 2021,
    ],
  },
  {
    competitionId: 12,
    name: "Copa Alagoas",
    years: [2024, 2026],
  },
  {
    competitionId: 14,
    name: "Campeonato Alagoano 2ª Divisão",
    years: [2005, 2010],
  },
  {
    competitionId: 3,
    name: "Campeonato Brasileiro Série C",
    years: [2017],
  },
];

let updated = 0;
let inserted = 0;
let already = 0;

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const g of GROUPS) {
    const { rows: comp } = await client.query(
      `SELECT id, name FROM competitions WHERE id = $1`,
      [g.competitionId],
    );
    if (!comp[0]) throw new Error(`Competition ${g.competitionId} missing`);
    if (comp[0].name !== g.name) {
      throw new Error(
        `Competition ${g.competitionId} name mismatch: got "${comp[0].name}", expected "${g.name}"`,
      );
    }

    for (const year of g.years) {
      const season = String(year);
      const { rows } = await client.query(
        `SELECT id, classification FROM season_competition_stats
         WHERE season = $1 AND competition_id = $2`,
        [season, g.competitionId],
      );
      if (rows.length === 0) {
        await client.query(
          `INSERT INTO season_competition_stats
             (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
              classification, stats_source)
           VALUES ($1, $2, 0, 0, 0, 0, 0, 0, '1º', 'manual')`,
          [season, g.competitionId],
        );
        inserted++;
      } else if (rows[0].classification === "1º") {
        already++;
      } else {
        await client.query(
          `UPDATE season_competition_stats
           SET classification = '1º'
           WHERE id = $1`,
          [rows[0].id],
        );
        updated++;
      }
    }
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}

const { rows: verify } = await pool.query(`
  SELECT c.id, c.name, COUNT(*)::int AS count,
         array_agg(s.season ORDER BY s.season) AS seasons
  FROM season_competition_stats s
  JOIN competitions c ON c.id = s.competition_id
  WHERE s.classification = '1º'
    AND c.id IN (5, 12, 14, 3)
  GROUP BY c.id, c.name
  ORDER BY COUNT(*) DESC, c.name
`);

const { rows: totalRow } = await pool.query(`
  SELECT COUNT(*)::int AS total FROM season_competition_stats WHERE classification = '1º'
`);

console.log(
  JSON.stringify(
    {
      applied: { updated, inserted, already, sum: updated + inserted + already },
      expected: 45,
      verifyByCompetition: verify,
      totalFirstPlaceRows: totalRow[0].total,
      expectedBreakdown: {
        "Campeonato Alagoano": 40,
        "Copa Alagoas": 2,
        "Campeonato Alagoano 2ª Divisão": 2,
        "Campeonato Brasileiro Série C": 1,
      },
    },
    null,
    2,
  ),
);

await pool.end();
