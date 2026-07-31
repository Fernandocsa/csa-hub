/**
 * Split conflated #63 "Raul":
 * - #63 stays as 2017 lateral (Raul / Lateral Esquerdo); clear wrong 2021-derived birth
 * - new Raul Jonas Steffens (Goleiro, 1997) gets 2021 season (1J)
 *
 * Birth 1998 on #63 came from update-2021-roster-ages treating him as the GK.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const LATERAL_ID = 63;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [LATERAL_ID],
  );
  if (!before[0]) throw new Error(`player ${LATERAL_ID} missing`);
  if (before[0].name !== "Raul") {
    throw new Error(`Expected Raul, got ${before[0].name}`);
  }

  const { rows: pss } = await client.query(
    `SELECT id, season, appearances, goals FROM player_season_stats
     WHERE player_id = $1 ORDER BY season`,
    [LATERAL_ID],
  );
  const pss2017 = pss.find((r) => r.season === "2017");
  const pss2021 = pss.find((r) => r.season === "2021");
  if (!pss2017 || pss2017.appearances !== 14) {
    throw new Error(`Unexpected 2017 PSS: ${JSON.stringify(pss2017)}`);
  }
  if (!pss2021 || pss2021.appearances !== 1) {
    throw new Error(`Unexpected 2021 PSS: ${JSON.stringify(pss2021)}`);
  }

  // No match sheets expected
  const { rows: fk } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE player_id = $1`,
    [LATERAL_ID],
  );
  if (fk[0].n > 0) throw new Error(`Unexpected lineups on ${LATERAL_ID}`);

  // 1) Create Raul Jonas Steffens (GK 2021)
  const { rows: steffensRows } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, '{}'::text[], $4,
       $5, $6::date, $7, $8, $9,
       $10, $11, $12
     )
     RETURNING id, name, full_name, position, birth_date, birth_year,
               birth_city, birth_state, preferred_foot, height_cm, weight_kg`,
    [
      "Raul",
      "Raul Jonas Steffens",
      "Goleiro",
      "Brasil",
      1997,
      "1997-07-28",
      "Tapera",
      "RS",
      "Brasil",
      "destro",
      192,
      90,
    ],
  );
  const steffensId = steffensRows[0].id;

  // 2) Move 2021 season to Steffens
  const { rows: moved2021 } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2021'
     RETURNING id, season, appearances, goals`,
    [steffensId, LATERAL_ID],
  );

  // 3) Fix #63 as 2017 left-back; clear invented birth from GK age fill
  const { rows: lateral } = await client.query(
    `UPDATE players SET
       name = 'Raul',
       position = 'Lateral Esquerdo',
       secondary_positions = '{}'::text[],
       birth_year = NULL,
       birth_date = NULL,
       birth_city = NULL,
       birth_state = NULL,
       birth_country = NULL,
       preferred_foot = NULL,
       height_cm = NULL,
       weight_kg = NULL
     WHERE id = $1
     RETURNING id, name, full_name, position, birth_year, birth_date`,
    [LATERAL_ID],
  );

  const { rows: rosterCheck } = await client.query(
    `SELECT pss.season, pss.player_id, p.name, p.full_name, p.position,
            p.birth_date, pss.appearances, pss.goals,
            CASE
              WHEN p.birth_date IS NOT NULL THEN
                EXTRACT(YEAR FROM AGE(
                  make_date(pss.season::int, 12, 31), p.birth_date::date
                ))::int
              WHEN p.birth_year IS NOT NULL THEN pss.season::int - p.birth_year
              ELSE NULL
            END AS season_age
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.player_id IN ($1, $2)
     ORDER BY pss.season, pss.player_id`,
    [LATERAL_ID, steffensId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        lateral2017: lateral[0],
        steffens: steffensRows[0],
        moved2021: moved2021[0],
        rosterCheck,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
