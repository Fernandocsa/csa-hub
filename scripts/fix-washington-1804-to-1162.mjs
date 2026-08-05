/**
 * Move 1986 sheets from #1804 → #1162 Washington Luiz Alves da Silva.
 * Usage: node scripts/fix-washington-1804-to-1162.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

const FROM = 1804;
const TO = 1162;
const TO_NAME = "Washington";

async function remapPlayerOnMatch(matchId, fromId, toId, toName) {
  const lineup = await c.query(
    `UPDATE match_lineups SET player_id=$2, player_name=$3
     WHERE match_id=$1 AND player_id=$4 RETURNING id, role`,
    [matchId, toId, toName, fromId],
  );
  await c.query(
    `UPDATE match_goals SET scorer_player_id=$2, scorer_name=$3
     WHERE match_id=$1 AND scorer_player_id=$4`,
    [matchId, toId, toName, fromId],
  );
  await c.query(
    `UPDATE match_goals SET assist_player_id=$2, assist_name=$3
     WHERE match_id=$1 AND assist_player_id=$4`,
    [matchId, toId, toName, fromId],
  );
  await c.query(
    `UPDATE match_cards SET player_id=$2, player_name=$3
     WHERE match_id=$1 AND player_id=$4`,
    [matchId, toId, toName, fromId],
  );
  await c.query(
    `UPDATE match_substitutions SET player_in_id=$2, player_in_name=$3
     WHERE match_id=$1 AND player_in_id=$4`,
    [matchId, toId, toName, fromId],
  );
  await c.query(
    `UPDATE match_substitutions SET player_out_id=$2, player_out_name=$3
     WHERE match_id=$1 AND player_out_id=$4`,
    [matchId, toId, toName, fromId],
  );
  try {
    await c.query(
      `UPDATE match_penalty_events SET player_id=$2, player_name=$3
       WHERE match_id=$1 AND player_id=$4`,
      [matchId, toId, toName, fromId],
    );
  } catch {
    /* optional */
  }
  await c.query(
    `UPDATE matches SET captain_player_id=$2 WHERE id=$1 AND captain_player_id=$3`,
    [matchId, toId, fromId],
  );
  return lineup.rowCount ?? 0;
}

async function syncPlayerStats(playerId) {
  const apps = await c.query(
    `
    SELECT m.season::text AS season, COUNT(DISTINCT m.id)::int AS appearances
    FROM match_lineups l
    JOIN matches m ON m.id = l.match_id
    WHERE l.player_id = $1 AND l.side = 'csa'
      AND (
        l.role = 'starter'
        OR EXISTS (
          SELECT 1 FROM match_substitutions s
          WHERE s.match_id = m.id AND s.side = 'csa' AND s.player_in_id = l.player_id
        )
      )
    GROUP BY m.season
    `,
    [playerId],
  );
  const goals = await c.query(
    `
    SELECT m.season::text AS season, COUNT(*)::int AS goals
    FROM match_goals g
    JOIN matches m ON m.id = g.match_id
    WHERE g.scorer_player_id = $1 AND g.side = 'csa'
      AND coalesce(g.is_own_goal, false) = false
    GROUP BY m.season
    `,
    [playerId],
  );
  const gMap = new Map(goals.rows.map((r) => [r.season, r.goals]));

  await c.query(
    `
    DELETE FROM player_season_stats pss
    WHERE pss.player_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM match_lineups l
        JOIN matches m ON m.id = l.match_id
        WHERE l.player_id = pss.player_id AND l.side = 'csa'
          AND m.season::text = pss.season::text
      )
      AND coalesce(pss.assists,0)=0
    `,
    [playerId],
  );

  for (const a of apps.rows) {
    const g = gMap.get(a.season) ?? 0;
    await c.query(
      `
      INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT DO NOTHING
      `,
      [playerId, a.season, a.appearances, g],
    );
    await c.query(
      `
      UPDATE player_season_stats
      SET appearances = $3, goals = $4
      WHERE player_id = $1 AND season = $2
      `,
      [playerId, a.season, a.appearances, g],
    );
  }

  await c.query(
    `
    INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
    SELECT $1, m.season::text, 0, 0, 0
    FROM match_lineups l
    JOIN matches m ON m.id = l.match_id
    WHERE l.player_id = $1 AND l.side = 'csa'
    GROUP BY m.season
    ON CONFLICT DO NOTHING
    `,
    [playerId],
  );
}

try {
  const matches = (
    await c.query(
      `
      SELECT m.id
      FROM match_lineups l JOIN matches m ON m.id = l.match_id
      WHERE l.player_id = $1 AND m.season = '1986'
      ORDER BY m.match_date
      `,
      [FROM],
    )
  ).rows.map((r) => r.id);

  console.log(`${DRY ? "DRY" : "APPLY"} 1804→1162 1986:`, matches);

  for (const mid of matches) {
    const hit = await c.query(
      `SELECT 1 FROM match_lineups WHERE match_id=$1 AND side='csa' AND player_id=$2`,
      [mid, TO],
    );
    if (hit.rowCount) throw new Error(`conflict on match ${mid}`);
  }

  await c.query("BEGIN");
  let n = 0;
  for (const mid of matches) {
    n += await remapPlayerOnMatch(mid, FROM, TO, TO_NAME);
  }
  console.log(`remapped lineups: ${n}`);

  await syncPlayerStats(FROM);
  await syncPlayerStats(TO);

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
    for (const id of [FROM, TO]) {
      console.log(
        `#${id}`,
        (
          await c.query(
            `SELECT season, appearances, goals FROM player_season_stats WHERE player_id=$1 ORDER BY season`,
            [id],
          )
        ).rows,
      );
    }
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
