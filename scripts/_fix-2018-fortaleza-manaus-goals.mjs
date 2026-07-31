/**
 * Fix Fortaleza (Hugo Cabral 82') and Manaus (Giva 44', Leandro Souza 86') goals for 2018.
 * Does NOT change Manaus lineup — pasted "Manaus" sheet was a Fortaleza duplicate.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { convertMinute, norm } from "./data/season-2018-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const FORCE_ID = {
  giva: 515,
  michel: 55,
  "michel douglas": 55,
  rafinha: 23,
  walter: 605,
};

async function resolvePlayer(name) {
  const key = norm(name);
  if (FORCE_ID[key] != null) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`missing FORCE ${name}`);
    return rows[0];
  }
  const { rows: all } = await client.query(`SELECT id, name FROM players`);
  const exact = all.filter((p) => norm(p.name) === key);
  if (exact.length === 1) return exact[0];
  const soft = all.filter(
    (p) => norm(p.name).includes(key) || key.includes(norm(p.name)),
  );
  if (soft.length === 1) return soft[0];
  throw new Error(
    `unresolved ${name} (${[...exact, ...soft].map((p) => `#${p.id} ${p.name}`).join(", ")})`,
  );
}

async function findMatch(date, oppLike) {
  const { rows } = await client.query(
    `
    SELECT m.id, m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    WHERE m.season = '2018' AND m.match_date = $1::date
      AND lower(o.name) LIKE lower($2)
    `,
    [date, `%${oppLike}%`],
  );
  if (rows.length !== 1) throw new Error(`match ${date} ${oppLike}: ${rows.length}`);
  return rows[0];
}

async function setGoals(matchId, goals) {
  await client.query(`DELETE FROM match_goals WHERE match_id=$1 AND side='csa'`, [matchId]);

  const { rows: lineups } = await client.query(
    `SELECT id, player_id, player_name FROM match_lineups WHERE match_id=$1 AND side='csa'`,
    [matchId],
  );
  const byPlayer = new Map(lineups.map((l) => [l.player_id, l.id]));

  const names = [];
  for (const g of goals) {
    const conv = convertMinute(g.m, g.h);
    if (conv.error) throw new Error(conv.error);
    const p = await resolvePlayer(g.p);
    // ensure on sheet as bench if missing (scorer must link)
    let lineupId = byPlayer.get(p.id);
    if (!lineupId) {
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,
           (SELECT COALESCE(MAX(sort_order),0)+1 FROM match_lineups WHERE match_id=$1))
         RETURNING id`,
        [matchId, p.id, p.name],
      );
      lineupId = rows[0].id;
      byPlayer.set(p.id, lineupId);
      console.log(`+ bench link for scorer ${p.name}`);
    }
    await client.query(
      `INSERT INTO match_goals
         (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute)
       VALUES ($1,'csa',$2,$3,$4,$5,$6)`,
      [matchId, lineupId, p.id, p.name, conv.minute, conv.injuryTimeMinute],
    );
    names.push(p.name);
  }

  await client.query(`UPDATE matches SET scorers=$2 WHERE id=$1`, [
    matchId,
    names.join(", ") || null,
  ]);
  console.log(`#${matchId} scorers → ${names.join(", ")}`);
}

try {
  await client.query("BEGIN");

  const fortaleza = await findMatch("2018-11-06", "fortaleza");
  // 82' absolute = 37' 2T
  await setGoals(fortaleza.id, [{ p: "Hugo Cabral", m: 37, h: 2 }]);

  const manaus = await findMatch("2018-02-07", "manaus");
  await setGoals(manaus.id, [
    { p: "Giva", m: 44, h: 1 },
    { p: "Leandro Souza", m: 41, h: 2 }, // 86'
  ]);

  // sync season goals for affected scorers
  const ids = [];
  for (const name of ["Hugo Cabral", "Giva", "Leandro Souza"]) {
    const p = await resolvePlayer(name);
    ids.push(p.id);
  }
  for (const id of ids) {
    const { rows } = await client.query(
      `
      SELECT count(*)::int AS goals
      FROM match_goals mg
      JOIN matches m ON m.id = mg.match_id
      WHERE m.season = '2018' AND mg.side = 'csa' AND mg.scorer_player_id = $1
      `,
      [id],
    );
    await client.query(
      `
      UPDATE player_season_stats SET goals = $2
      WHERE player_id = $1 AND season = '2018'
      `,
      [id, rows[0].goals],
    );
    const { rows: nm } = await client.query(`SELECT name FROM players WHERE id=$1`, [id]);
    console.log(`pss goals ${nm[0].name} = ${rows[0].goals}`);
  }

  await client.query("COMMIT");
  console.log("done");
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
