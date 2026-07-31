/**
 * 1) Jefferson 2016 → already #82 Jeferson (on 2016) — verify only
 * 2) Cassiano 2016 → link #611
 * 3) Merge Cristiano Fontes #634 into #80 (same athlete, different positions)
 * 4) Vitão — skip (no data)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const JEFERSON_ID = 82;
const CASSIANO_ID = 611;
const CRISTIANO_KEEP = 80;
const CRISTIANO_DROP = 634;

try {
  await client.query("BEGIN");

  // 1) Jefferson → #82
  const { rows: jef } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date FROM players WHERE id=$1`,
    [JEFERSON_ID],
  );
  if (!jef[0] || jef[0].name !== "Jeferson") {
    throw new Error(`Expected Jeferson #82, got ${JSON.stringify(jef[0])}`);
  }
  const { rows: jef2016 } = await client.query(
    `SELECT id, season, appearances FROM player_season_stats
     WHERE player_id=$1 AND season='2016'`,
    [JEFERSON_ID],
  );
  if (!jef2016[0]) {
    await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1, '2016', 0, 0, 0)`,
      [JEFERSON_ID],
    );
  }

  // 2) Cassiano #611 → 2016
  const { rows: cas } = await client.query(
    `SELECT id, name, full_name FROM players WHERE id=$1`,
    [CASSIANO_ID],
  );
  if (!cas[0] || cas[0].name !== "Cassiano") {
    throw new Error(`Expected Cassiano #611, got ${JSON.stringify(cas[0])}`);
  }
  const { rows: cas2016 } = await client.query(
    `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
     VALUES ($1, '2016', 0, 0, 0)
     ON CONFLICT (player_id, season) DO NOTHING
     RETURNING id, player_id, season, appearances`,
    [CASSIANO_ID],
  );

  // 3) Merge Cristiano Fontes #634 → #80
  const { rows: keepBefore } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date FROM players WHERE id=$1`,
    [CRISTIANO_KEEP],
  );
  const { rows: dropBefore } = await client.query(
    `SELECT id, name, full_name, position, birth_year, birth_date FROM players WHERE id=$1`,
    [CRISTIANO_DROP],
  );
  if (!keepBefore[0] || keepBefore[0].name !== "Cristiano") {
    throw new Error(`#80 not Cristiano: ${JSON.stringify(keepBefore[0])}`);
  }
  if (!dropBefore[0] || dropBefore[0].full_name !== "Cristiano Fontes") {
    throw new Error(`#634 not Fontes: ${JSON.stringify(dropBefore[0])}`);
  }

  // Move 2018 season from 634 → 80
  const { rows: moved2018 } = await client.query(
    `UPDATE player_season_stats SET player_id=$1
     WHERE player_id=$2 AND season='2018'
     RETURNING id, season, appearances, goals`,
    [CRISTIANO_KEEP, CRISTIANO_DROP],
  );

  // Any other seasons on 634?
  const { rows: leftover } = await client.query(
    `SELECT season FROM player_season_stats WHERE player_id=$1`,
    [CRISTIANO_DROP],
  );
  if (leftover.length) {
    throw new Error(`Unexpected leftover seasons on #634: ${JSON.stringify(leftover)}`);
  }

  // FK moves (if any)
  const fkTables = [
    ["match_lineups", "player_id"],
    ["match_cards", "player_id"],
    ["match_goals", "scorer_player_id"],
    ["match_goals", "assist_player_id"],
    ["matches", "captain_player_id"],
  ];
  const fkMoved = {};
  for (const [t, col] of fkTables) {
    const { rowCount } = await client.query(
      `UPDATE ${t} SET ${col}=$1 WHERE ${col}=$2`,
      [CRISTIANO_KEEP, CRISTIANO_DROP],
    );
    fkMoved[`${t}.${col}`] = rowCount;
  }

  // Update #80 profile: Fontes + keep Meia as secondary (played Meia 2017, Zag 2018)
  const { rows: merged } = await client.query(
    `UPDATE players SET
       name = 'Cristiano',
       full_name = 'Cristiano Fontes',
       position = 'Zagueiro',
       secondary_positions = ARRAY['Meia']::text[],
       nationality = 'Brasil',
       birth_year = 1988,
       birth_date = '1988-05-07'::date,
       birth_city = 'Maceió',
       birth_state = 'AL',
       birth_country = 'Brasil',
       preferred_foot = 'destro'
     WHERE id = $1
     RETURNING id, name, full_name, position, secondary_positions,
               birth_date, birth_year, birth_city, birth_state, preferred_foot`,
    [CRISTIANO_KEEP],
  );

  // Delete #634
  await client.query(`DELETE FROM players WHERE id=$1`, [CRISTIANO_DROP]);

  const { rows: cristianoSeasons } = await client.query(
    `SELECT season, appearances, goals FROM player_season_stats
     WHERE player_id=$1 ORDER BY season`,
    [CRISTIANO_KEEP],
  );

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        jefferson: {
          linkedTo: jef[0],
          season2016: jef2016[0] ?? "inserted 0J",
          note: "Lista Jefferson 23a tratada como Jeferson #82 (já no elenco 2016)",
        },
        cassiano2016: {
          player: cas[0],
          season: cas2016[0] ?? "already had 2016",
        },
        cristianoMerge: {
          beforeKeep: keepBefore[0],
          beforeDrop: dropBefore[0],
          after: merged[0],
          moved2018: moved2018[0],
          fkMoved,
          seasons: cristianoSeasons,
          deletedId: CRISTIANO_DROP,
        },
        vitao: "skipped — no data yet",
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
