/**
 * Split conflated #70 "Edinho":
 * - #70 → Edimo Ferreira Campos (Volante, 1983-01-15) — season 2018
 * - new → Francisco Edson Moreira da Silva (Ponta Esquerda, 1994-08-08) — season 2017
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const EDIMO_ID = 70;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [EDIMO_ID],
  );
  if (!before[0] || before[0].name !== "Edinho") {
    throw new Error(`Expected Edinho #70, got ${JSON.stringify(before[0])}`);
  }

  const { rows: pss } = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats
     WHERE player_id = $1 ORDER BY season`,
    [EDIMO_ID],
  );
  const seasons = pss.map((r) => r.season).sort().join(",");
  if (seasons !== "2017,2018") {
    throw new Error(`Unexpected seasons on #70: ${seasons}`);
  }

  const { rows: fk } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE player_id = $1`,
    [EDIMO_ID],
  );
  if (fk[0].n > 0) throw new Error(`Unexpected lineups on ${EDIMO_ID}`);

  // 1) Create Francisco Edson Moreira da Silva (Meia 2017)
  const { rows: edsonRows } = await client.query(
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
      "Edinho",
      "Francisco Edson Moreira da Silva",
      "Ponta Esquerda",
      "Brasil",
      1994,
      "1994-08-08",
      "Baturité",
      "CE",
      "Brasil",
      "destro",
      158,
      60,
    ],
  );
  const edsonId = edsonRows[0].id;

  // 2) Move 2017 to Francisco Edson
  const { rows: moved2017 } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2017'
     RETURNING id, season, appearances, goals`,
    [edsonId, EDIMO_ID],
  );
  if (moved2017.length !== 1) {
    throw new Error(`Expected one 2017 PSS row, got ${moved2017.length}`);
  }

  // 3) Fix #70 as Edimo Ferreira Campos (Volante 2018)
  const { rows: edimo } = await client.query(
    `UPDATE players SET
       name = 'Edinho',
       full_name = 'Edimo Ferreira Campos',
       position = 'Volante',
       secondary_positions = ARRAY['Zagueiro']::text[],
       nationality = 'Brasil',
       birth_year = 1983,
       birth_date = '1983-01-15'::date,
       birth_city = 'Niterói',
       birth_state = 'RJ',
       birth_country = 'Brasil',
       preferred_foot = 'destro',
       height_cm = 183,
       weight_kg = 77
     WHERE id = $1
     RETURNING id, name, full_name, position, secondary_positions,
               birth_date, birth_year, birth_city, birth_state,
               preferred_foot, height_cm, weight_kg`,
    [EDIMO_ID],
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
    [EDIMO_ID, edsonId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        edimoCampos: edimo[0],
        franciscoEdson: edsonRows[0],
        moved2017: moved2017[0],
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
