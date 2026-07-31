/**
 * Split conflated #229 "Marquinhos" into:
 * - #229 Marcos Antônio de Sousa Júnior (Volante, 1994) → 2020 + 2021 (12J/0G)
 * - new Marcos Antônio da Silva Gonçalves (Meia, 1989) → 2021 (4J/1G)
 *   (2024 Marquinhos is a different athlete — see fix-marquinhos-2024-vinicius.mjs)
 *
 * 2021 import had two Marquinhos (12/0 and 4/1) wrongly merged into 16/1.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SOUSA_ID = 229;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date
     FROM players WHERE id = $1`,
    [SOUSA_ID],
  );
  if (!before[0]) throw new Error(`player ${SOUSA_ID} missing`);
  if (before[0].name !== "Marquinhos") {
    throw new Error(`Expected Marquinhos, got ${before[0].name}`);
  }

  // 1) Create Gonçalves
  const { rows: goncalvesRows } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_city, birth_state, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, $4::text[], $5,
       $6, $7::date, $8, $9, $10,
       $11, $12, $13
     )
     RETURNING id, name, full_name, position, birth_date, birth_year`,
    [
      "Marquinhos",
      "Marcos Antônio da Silva Gonçalves",
      "Meia",
      ["Meia Ofensivo"],
      "Brasil",
      1989,
      "1989-10-19",
      "Prado",
      "BA",
      "Brasil",
      "destro",
      177,
      68,
    ],
  );
  const goncalvesId = goncalvesRows[0].id;

  // 2) Update #229 → Sousa Júnior
  const { rows: sousa } = await client.query(
    `UPDATE players SET
       name = 'Marquinhos',
       full_name = 'Marcos Antônio de Sousa Júnior',
       position = 'Volante',
       secondary_positions = '{}'::text[],
       nationality = 'Brasil',
       birth_country = 'Brasil',
       birth_city = 'Uberlândia',
       birth_state = 'MG',
       birth_year = 1994,
       birth_date = '1994-05-08'::date,
       preferred_foot = 'destro',
       height_cm = 175,
       weight_kg = 69
     WHERE id = $1
     RETURNING id, name, full_name, position, birth_date, birth_year`,
    [SOUSA_ID],
  );

  // 3) Split 2021 PSS
  const { rows: pss2021 } = await client.query(
    `SELECT id, appearances, goals, assists FROM player_season_stats
     WHERE player_id = $1 AND season = '2021'`,
    [SOUSA_ID],
  );
  if (!pss2021[0] || pss2021[0].appearances !== 16 || pss2021[0].goals !== 1) {
    throw new Error(`Unexpected 2021 PSS: ${JSON.stringify(pss2021[0])}`);
  }

  await client.query(
    `UPDATE player_season_stats
     SET appearances = 12, goals = 0, assists = 0
     WHERE id = $1`,
    [pss2021[0].id],
  );

  const { rows: goncalves2021 } = await client.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1, '2021', 4, 1, 0)
     RETURNING id, player_id, season, appearances, goals`,
    [goncalvesId],
  );

  // 4) Move 2024 PSS
  const { rows: moved2024 } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2024'
     RETURNING id, season, appearances, goals`,
    [goncalvesId, SOUSA_ID],
  );
  if (moved2024.length !== 1) {
    throw new Error(`Expected one 2024 PSS move, got ${moved2024.length}`);
  }

  // 5) Move 2024 match-sheet FKs only (2021 April lineup stays on Sousa)
  const matchIds2024 = await client.query(
    `SELECT id FROM matches WHERE season = '2024' OR EXTRACT(YEAR FROM match_date) = 2024`,
  );
  const ids = matchIds2024.rows.map((r) => r.id);
  if (ids.length === 0) throw new Error("No 2024 matches found");

  const fkMoves = {};

  const lu = await client.query(
    `UPDATE match_lineups SET player_id = $1
     WHERE player_id = $2 AND match_id = ANY($3::int[])
     RETURNING id`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.lineups = lu.rowCount;

  const gScorer = await client.query(
    `UPDATE match_goals SET scorer_player_id = $1
     WHERE scorer_player_id = $2 AND match_id = ANY($3::int[])`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.goals_scorer = gScorer.rowCount;

  const gAssist = await client.query(
    `UPDATE match_goals SET assist_player_id = $1
     WHERE assist_player_id = $2 AND match_id = ANY($3::int[])`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.goals_assist = gAssist.rowCount;

  const cards = await client.query(
    `UPDATE match_cards SET player_id = $1
     WHERE player_id = $2 AND match_id = ANY($3::int[])`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.cards = cards.rowCount;

  const subOut = await client.query(
    `UPDATE match_substitutions SET player_out_id = $1
     WHERE player_out_id = $2 AND match_id = ANY($3::int[])`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.subs_out = subOut.rowCount;

  const subIn = await client.query(
    `UPDATE match_substitutions SET player_in_id = $1
     WHERE player_in_id = $2 AND match_id = ANY($3::int[])`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.subs_in = subIn.rowCount;

  const cap = await client.query(
    `UPDATE matches SET captain_player_id = $1
     WHERE captain_player_id = $2 AND id = ANY($3::int[])`,
    [goncalvesId, SOUSA_ID, ids],
  );
  fkMoves.captain = cap.rowCount;

  // Remaining FKs on Sousa should only be 2021
  const { rows: remaining } = await client.query(
    `SELECT
       (SELECT count(*)::int FROM match_lineups WHERE player_id=$1) AS lineups,
       (SELECT count(*)::int FROM match_goals WHERE scorer_player_id=$1 OR assist_player_id=$1) AS goals
    `,
    [SOUSA_ID],
  );

  const { rows: rosterCheck } = await client.query(
    `SELECT pss.season, pss.player_id, p.full_name, p.position,
            pss.appearances, pss.goals,
            CASE
              WHEN p.birth_date IS NOT NULL THEN
                EXTRACT(YEAR FROM AGE(
                  make_date(pss.season::int, 12, 31), p.birth_date::date
                ))::int
              ELSE NULL
            END AS season_age
     FROM player_season_stats pss
     JOIN players p ON p.id = pss.player_id
     WHERE pss.player_id IN ($1, $2)
     ORDER BY pss.season, pss.player_id`,
    [SOUSA_ID, goncalvesId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        before: before[0],
        sousaJunior: sousa[0],
        goncalves: goncalvesRows[0],
        split2021: {
          sousa: { appearances: 12, goals: 0 },
          goncalves: goncalves2021[0],
        },
        moved2024: moved2024[0],
        fkMoves2024: fkMoves,
        remainingFksOnSousa: remaining[0],
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
