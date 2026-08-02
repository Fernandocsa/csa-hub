/**
 * Create Goleiro Filho (Manoel Filho) and add to season rosters 1992 + 1995–1998.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASONS = ["1992", "1995", "1996", "1997", "1998"];

try {
  await client.query("BEGIN");

  const existing = await client.query(
    `SELECT id, name FROM players WHERE name = 'Filho' OR full_name ILIKE 'Manoel Filho%'`,
  );
  if (existing.rows[0]) {
    throw new Error(`Player already exists: ${JSON.stringify(existing.rows[0])}`);
  }

  const { rows: created } = await client.query(
    `INSERT INTO players (
       name, full_name, position, nationality, nationality_flag,
       birth_date, birth_year, birth_city, birth_state, birth_country,
       verification_status
     ) VALUES (
       'Filho', 'Manoel Filho', 'Goleiro', 'Brasil', '🇧🇷',
       '1970-04-02', 1970, 'Chã Preta', 'AL', 'Brasil',
       'unverified'
     ) RETURNING id, name, full_name, position, birth_date, birth_city, birth_state`,
  );
  const player = created[0];

  const roster = [];
  for (const season of SEASONS) {
    await client.query(`INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`, [
      Number(season),
    ]);
    const { rows } = await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1, $2, 0, 0, 0)
       ON CONFLICT (player_id, season) DO NOTHING
       RETURNING id, season, appearances, goals`,
      [player.id, season],
    );
    if (rows[0]) {
      roster.push(rows[0]);
    } else {
      const ex = await client.query(
        `SELECT id, season, appearances, goals FROM player_season_stats
         WHERE player_id=$1 AND season=$2`,
        [player.id, season],
      );
      roster.push({ ...ex.rows[0], already: true });
    }
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, player, roster }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
