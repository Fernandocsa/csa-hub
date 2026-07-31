/**
 * Split conflated #7 "João Paulo":
 * - #7 → João Paulo Ferreira Romão (Atacante, 2000-09-14) — seasons 2020, 2021
 * - new → João Paulo da Silva (Goleiro, 1989-01-20) — season 2016
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const ATACANTE_ID = 7;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [ATACANTE_ID],
  );
  if (!before[0] || before[0].name !== "João Paulo") {
    throw new Error(`Expected João Paulo #7, got ${JSON.stringify(before[0])}`);
  }

  const { rows: pss } = await client.query(
    `SELECT id, season, appearances, goals FROM player_season_stats
     WHERE player_id = $1 ORDER BY season`,
    [ATACANTE_ID],
  );
  const seasons = pss.map((r) => r.season).sort().join(",");
  if (seasons !== "2016,2020,2021") {
    throw new Error(`Unexpected seasons on #7: ${seasons}`);
  }

  const { rows: fk } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE player_id = $1`,
    [ATACANTE_ID],
  );
  if (fk[0].n > 0) throw new Error(`Unexpected lineups on ${ATACANTE_ID}`);

  // 1) Create João Paulo da Silva (GK 2016)
  const { rows: gkRows } = await client.query(
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
      "João Paulo",
      "João Paulo da Silva",
      "Goleiro",
      "Brasil",
      1989,
      "1989-01-20",
      "Aracaju",
      "SE",
      "Brasil",
      "destro",
      188,
      89,
    ],
  );
  const gkId = gkRows[0].id;

  // 2) Move 2016 season to GK
  const { rows: moved2016 } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2016'
     RETURNING id, season, appearances, goals`,
    [gkId, ATACANTE_ID],
  );
  if (moved2016.length !== 1) {
    throw new Error(`Expected one 2016 PSS row, got ${moved2016.length}`);
  }

  // 3) Fix #7 as João Paulo Ferreira Romão (Atacante 2020/2021)
  const { rows: atacante } = await client.query(
    `UPDATE players SET
       name = 'João Paulo',
       full_name = 'João Paulo Ferreira Romão',
       position = 'Atacante',
       secondary_positions = '{}'::text[],
       nationality = 'Brasil',
       birth_year = 2000,
       birth_date = '2000-09-14'::date,
       birth_city = 'Belo Horizonte',
       birth_state = 'MG',
       birth_country = 'Brasil',
       preferred_foot = NULL,
       height_cm = 177,
       weight_kg = NULL
     WHERE id = $1
     RETURNING id, name, full_name, position, birth_date, birth_year,
               birth_city, birth_state, height_cm`,
    [ATACANTE_ID],
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
    [ATACANTE_ID, gkId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        joaoPauloRomao: atacante[0],
        joaoPauloDaSilva: gkRows[0],
        moved2016: moved2016[0],
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
