/**
 * Split conflated #61 "Walter":
 * - #61 → Walter Januário de Paula Júnior (Zagueiro, 1984-05-18) — season 2016
 * - new → Walter Henrique da Silva (Centroavante, 1989-07-22) — season 2018
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const ZAGUEIRO_ID = 61;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [ZAGUEIRO_ID],
  );
  if (!before[0] || before[0].name !== "Walter") {
    throw new Error(`Expected Walter #61, got ${JSON.stringify(before[0])}`);
  }

  const { rows: pss } = await client.query(
    `SELECT id, season, appearances, goals FROM player_season_stats
     WHERE player_id = $1 ORDER BY season`,
    [ZAGUEIRO_ID],
  );
  const seasons = pss.map((r) => r.season).sort().join(",");
  if (seasons !== "2016,2018") {
    throw new Error(`Unexpected seasons on #61: ${seasons}`);
  }

  const { rows: fk } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE player_id = $1`,
    [ZAGUEIRO_ID],
  );
  if (fk[0].n > 0) throw new Error(`Unexpected lineups on ${ZAGUEIRO_ID}`);

  // 1) Create Walter Henrique da Silva (Centroavante 2018)
  const { rows: caRows } = await client.query(
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
      "Walter",
      "Walter Henrique da Silva",
      "Centroavante",
      "Brasil",
      1989,
      "1989-07-22",
      "Recife",
      "PE",
      "Brasil",
      "destro",
      178,
      95,
    ],
  );
  const caId = caRows[0].id;

  // 2) Move 2018 season to Centroavante
  const { rows: moved2018 } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2018'
     RETURNING id, season, appearances, goals`,
    [caId, ZAGUEIRO_ID],
  );
  if (moved2018.length !== 1) {
    throw new Error(`Expected one 2018 PSS row, got ${moved2018.length}`);
  }

  // 3) Fix #61 as Walter Januário de Paula Júnior (Zagueiro 2016)
  const { rows: zagueiro } = await client.query(
    `UPDATE players SET
       name = 'Walter',
       full_name = 'Walter Januário de Paula Júnior',
       position = 'Zagueiro',
       secondary_positions = '{}'::text[],
       nationality = 'Brasil',
       birth_year = 1984,
       birth_date = '1984-05-18'::date,
       birth_city = 'São Paulo',
       birth_state = 'SP',
       birth_country = 'Brasil',
       preferred_foot = 'destro',
       height_cm = 190,
       weight_kg = 83
     WHERE id = $1
     RETURNING id, name, full_name, position, birth_date, birth_year,
               birth_city, birth_state, preferred_foot, height_cm, weight_kg`,
    [ZAGUEIRO_ID],
  );

  const { rows: rosterCheck } = await client.query(
    `SELECT pss.season, pss.player_id, p.name, p.full_name, p.position,
            p.birth_date, pss.appearances, pss.goals,
            EXTRACT(YEAR FROM AGE(
              make_date(pss.season::int, 12, 31), p.birth_date::date
            ))::int AS season_age
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.player_id IN ($1, $2)
     ORDER BY pss.season, pss.player_id`,
    [ZAGUEIRO_ID, caId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        walterJanuario: zagueiro[0],
        walterHenrique: caRows[0],
        moved2018: moved2018[0],
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
