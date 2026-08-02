/**
 * Rename "Torneio Início" → "Torneio Início de Alagoas" and mark CSA champion
 * seasons (is_champion, no final_match_id required). Player title credit comes
 * from existing campaign-lineup rules when sheets exist for those seasons.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const NEW_NAME = "Torneio Início de Alagoas";
const OLD_NAME = "Torneio Início";
const YEARS = [
  1927, 1928, 1929, 1930, 1933, 1935, 1940, 1942, 1946, 1949, 1957, 1961, 1965,
  1972,
];

const client = await pool.connect();
try {
  await client.query("BEGIN");

  const { rows: comps } = await client.query(
    `SELECT id, name FROM competitions
     WHERE name IN ($1, $2)
     ORDER BY name`,
    [OLD_NAME, NEW_NAME],
  );

  let comp = comps.find((c) => c.name === NEW_NAME);
  if (!comp) {
    const old = comps.find((c) => c.name === OLD_NAME);
    if (!old) {
      throw new Error(`Competition "${OLD_NAME}" not found`);
    }
    const { rows: renamed } = await client.query(
      `UPDATE competitions SET name = $1 WHERE id = $2 RETURNING id, name`,
      [NEW_NAME, old.id],
    );
    comp = renamed[0];
    console.log(`renamed competition #${comp.id}: ${OLD_NAME} → ${NEW_NAME}`);
  } else {
    console.log(`competition already named "${NEW_NAME}" (#${comp.id})`);
  }

  let inserted = 0;
  let updated = 0;
  let already = 0;

  for (const year of YEARS) {
    const season = String(year);
    const { rows } = await client.query(
      `SELECT id, is_champion, classification, final_match_id
       FROM season_competition_stats
       WHERE season = $1 AND competition_id = $2`,
      [season, comp.id],
    );

    if (rows.length === 0) {
      await client.query(
        `INSERT INTO season_competition_stats
           (season, competition_id, games, wins, draws, losses,
            goals_for, goals_against, classification, is_champion,
            final_match_id, stats_source)
         VALUES ($1, $2, 0, 0, 0, 0, 0, 0, '1º', true, NULL, 'manual')`,
        [season, comp.id],
      );
      inserted++;
    } else {
      const row = rows[0];
      if (row.is_champion && row.classification === "1º") {
        already++;
      } else {
        await client.query(
          `UPDATE season_competition_stats
           SET is_champion = true,
               classification = COALESCE(NULLIF(classification, ''), '1º')
           WHERE id = $1`,
          [row.id],
        );
        updated++;
      }
    }
  }

  await client.query("COMMIT");

  const { rows: verify } = await client.query(
    `SELECT season, is_champion, final_match_id, classification, games, wins
     FROM season_competition_stats
     WHERE competition_id = $1
     ORDER BY season`,
    [comp.id],
  );

  console.log(
    JSON.stringify(
      {
        competition: comp,
        inserted,
        updated,
        already,
        championSeasons: verify.filter((r) => r.is_champion).map((r) => r.season),
        rows: verify,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
