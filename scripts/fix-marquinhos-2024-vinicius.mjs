/**
 * Reassign 2024 "Marquinhos" from Gonçalves (#600) to Marcos Vinícius da Silva.
 * Gonçalves keeps only 2021 (4J/1G).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const GONCALVES_ID = 600;

try {
  await client.query("BEGIN");

  const { rows: before } = await client.query(
    `SELECT id, name, full_name, position FROM players WHERE id = $1`,
    [GONCALVES_ID],
  );
  if (!before[0]) throw new Error(`player ${GONCALVES_ID} missing`);
  if (before[0].full_name !== "Marcos Antônio da Silva Gonçalves") {
    throw new Error(`Unexpected full_name: ${before[0].full_name}`);
  }

  // 1) Create 2024 Marquinhos = Marcos Vinícius da Silva
  const { rows: created } = await client.query(
    `INSERT INTO players (
       name, full_name, position, secondary_positions, nationality,
       birth_year, birth_date, birth_country,
       preferred_foot, height_cm, weight_kg
     ) VALUES (
       $1, $2, $3, '{}'::text[], $4,
       $5, $6::date, $7,
       $8, $9, $10
     )
     RETURNING id, name, full_name, position, birth_date, birth_year,
               preferred_foot, height_cm, weight_kg`,
    [
      "Marquinhos",
      "Marcos Vinícius da Silva",
      "Ponta Esquerda",
      "Brasil",
      1998,
      "1998-06-01",
      "Brasil",
      "destro",
      177,
      78,
    ],
  );
  const viniciusId = created[0].id;

  // 2) Move 2024 PSS
  const { rows: movedPss } = await client.query(
    `UPDATE player_season_stats
     SET player_id = $1
     WHERE player_id = $2 AND season = '2024'
     RETURNING id, season, appearances, goals`,
    [viniciusId, GONCALVES_ID],
  );
  if (movedPss.length !== 1 || movedPss[0].appearances !== 22) {
    throw new Error(`Unexpected 2024 PSS move: ${JSON.stringify(movedPss)}`);
  }

  // 3) Move 2024 match-sheet FKs
  const { rows: matchRows } = await client.query(
    `SELECT id FROM matches WHERE season = '2024' OR EXTRACT(YEAR FROM match_date) = 2024`,
  );
  const ids = matchRows.map((r) => r.id);

  const fkMoves = {};
  const lu = await client.query(
    `UPDATE match_lineups SET player_id = $1
     WHERE player_id = $2 AND match_id = ANY($3::int[]) RETURNING id`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.lineups = lu.rowCount;

  const gScorer = await client.query(
    `UPDATE match_goals SET scorer_player_id = $1
     WHERE scorer_player_id = $2 AND match_id = ANY($3::int[])`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.goals_scorer = gScorer.rowCount;

  const gAssist = await client.query(
    `UPDATE match_goals SET assist_player_id = $1
     WHERE assist_player_id = $2 AND match_id = ANY($3::int[])`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.goals_assist = gAssist.rowCount;

  const cards = await client.query(
    `UPDATE match_cards SET player_id = $1
     WHERE player_id = $2 AND match_id = ANY($3::int[])`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.cards = cards.rowCount;

  const subOut = await client.query(
    `UPDATE match_substitutions SET player_out_id = $1
     WHERE player_out_id = $2 AND match_id = ANY($3::int[])`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.subs_out = subOut.rowCount;

  const subIn = await client.query(
    `UPDATE match_substitutions SET player_in_id = $1
     WHERE player_in_id = $2 AND match_id = ANY($3::int[])`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.subs_in = subIn.rowCount;

  const cap = await client.query(
    `UPDATE matches SET captain_player_id = $1
     WHERE captain_player_id = $2 AND id = ANY($3::int[])`,
    [viniciusId, GONCALVES_ID, ids],
  );
  fkMoves.captain = cap.rowCount;

  const { rows: remainingOnGoncalves } = await client.query(
    `SELECT
       (SELECT count(*)::int FROM match_lineups WHERE player_id=$1) AS lineups,
       (SELECT count(*)::int FROM player_season_stats WHERE player_id=$1) AS seasons
    `,
    [GONCALVES_ID],
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
    [GONCALVES_ID, viniciusId],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        goncalvesKept: before[0],
        marquinhos2024: created[0],
        movedPss: movedPss[0],
        fkMoves2024: fkMoves,
        remainingOnGoncalves: remainingOnGoncalves[0],
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
