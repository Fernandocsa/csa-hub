/**
 * Split conflated #79 "Cassiano":
 * - #79 → Cassiano Dias Moreira (Ponta Direita, 1989-06-16) — season 2019
 * - new → Cassiano Juvêncio da Silva (Atacante, 1993-07-20) — season 2017
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const DIAS_ID = 79;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [DIAS_ID],
  );
  if (!before[0] || before[0].name !== "Cassiano") {
    throw new Error(`Expected Cassiano #79, got ${JSON.stringify(before[0])}`);
  }

  const { rows: pss } = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats
     WHERE player_id = $1 ORDER BY season`,
    [DIAS_ID],
  );
  const seasons = pss.map((r) => r.season).sort().join(",");
  if (seasons !== "2017,2019") {
    throw new Error(`Unexpected seasons on #79: ${seasons}`);
  }

  const { rows: fk } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE player_id = $1`,
    [DIAS_ID],
  );
  if (fk[0].n > 0) throw new Error(`Unexpected lineups on ${DIAS_ID}`);

  // 1) Create Cassiano Juvêncio da Silva (Atacante 2017)
  const { rows: juvencioRows } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, $4::text[], $5,
       $6, $7::date, $8, $9, $10,
       $11, $12, $13
     )
     RETURNING id, name, full_name, position, secondary_positions,
               birth_date, birth_year, birth_city, birth_state`,
    [
      "Cassiano",
      "Cassiano Juvêncio da Silva",
      "Atacante",
      ["Meia"],
      "Brasil",
      1993,
      "1993-07-20",
      "Maceió",
      "AL",
      "Brasil",
      null,
      null,
      null,
    ],
  );
  const juvencioId = juvencioRows[0].id;

  // 2) Move 2017 to Juvêncio
  const { rows: moved2017 } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2017'
     RETURNING id, season, appearances, goals`,
    [juvencioId, DIAS_ID],
  );
  if (moved2017.length !== 1) {
    throw new Error(`Expected one 2017 PSS row, got ${moved2017.length}`);
  }

  // 3) Fix #79 as Cassiano Dias Moreira (Ponta Direita 2019)
  const { rows: dias } = await client.query(
    `UPDATE players SET
       name = 'Cassiano',
       full_name = 'Cassiano Dias Moreira',
       position = 'Ponta Direita',
       secondary_positions = '{}'::text[],
       nationality = 'Brasil',
       birth_year = 1989,
       birth_date = '1989-06-16'::date,
       birth_city = 'Porto Alegre',
       birth_state = 'RS',
       birth_country = 'Brasil',
       preferred_foot = 'destro',
       height_cm = 184,
       weight_kg = 87
     WHERE id = $1
     RETURNING id, name, full_name, position, birth_date, birth_year,
               birth_city, birth_state, preferred_foot, height_cm, weight_kg`,
    [DIAS_ID],
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
    [DIAS_ID, juvencioId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        cassianoDias: dias[0],
        cassianoJuvencio: juvencioRows[0],
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
