/**
 * Split bogus player #1199 "Sérgio" (1975/1977):
 * - 1975 Alagoano sheets named only "Sérgio" → #1117 Sérgio Galocha
 *   (Blog Sorrentino: early games list "Sérgio"; later the same season uses
 *   "Sérgio Galocha". Galocha left CSA after 1975.)
 * - 1977-07-31 Canavieiro: source "Almir (Sérgio)" → #1116 Serginho
 *   (same season consistently uses Serginho elsewhere; Galocha was gone.)
 *
 * Then delete #1199 and resync season stats for 1116/1117.
 *
 * Usage: node scripts/fix-split-sergio-1199.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

const TO_GALOCHA = [3087, 3088, 3090, 3104]; // 1975
const TO_SERGINHO = [3044]; // 1977

async function remapMatch(matchId, fromId, toId, toName) {
  const lineup = await c.query(
    `UPDATE match_lineups
     SET player_id = $2, player_name = $3
     WHERE match_id = $1 AND player_id = $4
     RETURNING id, role`,
    [matchId, toId, toName, fromId],
  );
  const goals = await c.query(
    `UPDATE match_goals
     SET scorer_player_id = $2, scorer_name = $3
     WHERE match_id = $1 AND scorer_player_id = $4
     RETURNING id, minute`,
    [matchId, toId, toName, fromId],
  );
  const assists = await c.query(
    `UPDATE match_goals
     SET assist_player_id = $2, assist_name = $3
     WHERE match_id = $1 AND assist_player_id = $4
     RETURNING id`,
    [matchId, toId, toName, fromId],
  );
  const cards = await c.query(
    `UPDATE match_cards
     SET player_id = $2, player_name = $3
     WHERE match_id = $1 AND player_id = $4
     RETURNING id`,
    [matchId, toId, toName, fromId],
  );
  const subIn = await c.query(
    `UPDATE match_substitutions
     SET player_in_id = $2, player_in_name = $3
     WHERE match_id = $1 AND player_in_id = $4
     RETURNING id, minute`,
    [matchId, toId, toName, fromId],
  );
  const subOut = await c.query(
    `UPDATE match_substitutions
     SET player_out_id = $2, player_out_name = $3
     WHERE match_id = $1 AND player_out_id = $4
     RETURNING id, minute`,
    [matchId, toId, toName, fromId],
  );
  try {
    await c.query(
      `UPDATE match_penalty_events
       SET player_id = $2, player_name = $3
       WHERE match_id = $1 AND player_id = $4`,
      [matchId, toId, toName, fromId],
    );
  } catch {
    /* table may lack player_name */
  }
  await c.query(
    `UPDATE matches SET captain_player_id = $2
     WHERE id = $1 AND captain_player_id = $3`,
    [matchId, toId, fromId],
  );
  return {
    matchId,
    lineups: lineup.rowCount,
    goals: goals.rowCount,
    assists: assists.rowCount,
    cards: cards.rowCount,
    subIn: subIn.rowCount,
    subOut: subOut.rowCount,
    detail: { lineup: lineup.rows, goals: goals.rows, subIn: subIn.rows },
  };
}

try {
  // Preflight: no co-presence
  const conflict = await c.query(
    `
    SELECT m.id, array_agg(l.player_id ORDER BY l.player_id) AS ids
    FROM match_lineups l
    JOIN matches m ON m.id = l.match_id
    WHERE l.player_id IN (1199, 1117, 1116) AND l.side = 'csa'
      AND m.id = ANY($1::int[])
    GROUP BY m.id
    HAVING COUNT(DISTINCT l.player_id) > 1
    `,
    [[...TO_GALOCHA, ...TO_SERGINHO]],
  );
  if (conflict.rows.length) {
    throw new Error(`co-presence conflict: ${JSON.stringify(conflict.rows)}`);
  }

  const remaining = await c.query(
    `SELECT match_id FROM match_lineups WHERE player_id = 1199 ORDER BY match_id`,
  );
  const remIds = remaining.rows.map((r) => r.match_id).sort((a, b) => a - b);
  const expected = [...TO_GALOCHA, ...TO_SERGINHO].sort((a, b) => a - b);
  if (JSON.stringify(remIds) !== JSON.stringify(expected)) {
    throw new Error(
      `unexpected 1199 matches: have=${remIds} expected=${expected}`,
    );
  }

  console.log(DRY ? "DRY RUN" : "APPLY");
  await c.query("BEGIN");

  const results = [];
  for (const mid of TO_GALOCHA) {
    const r = await remapMatch(mid, 1199, 1117, "Sérgio Galocha");
    results.push({ to: "Galocha#1117", ...r });
    console.log("→ Galocha", r);
  }
  for (const mid of TO_SERGINHO) {
    const r = await remapMatch(mid, 1199, 1116, "Serginho");
    results.push({ to: "Serginho#1116", ...r });
    console.log("→ Serginho", r);
  }

  // leftover refs?
  const left = await c.query(
    `
    SELECT 'lineups' AS t, COUNT(*)::int AS n FROM match_lineups WHERE player_id=1199
    UNION ALL SELECT 'goals_scorer', COUNT(*) FROM match_goals WHERE scorer_player_id=1199
    UNION ALL SELECT 'goals_assist', COUNT(*) FROM match_goals WHERE assist_player_id=1199
    UNION ALL SELECT 'cards', COUNT(*) FROM match_cards WHERE player_id=1199
    UNION ALL SELECT 'sub_in', COUNT(*) FROM match_substitutions WHERE player_in_id=1199
    UNION ALL SELECT 'sub_out', COUNT(*) FROM match_substitutions WHERE player_out_id=1199
    UNION ALL SELECT 'captain', COUNT(*) FROM matches WHERE captain_player_id=1199
    UNION ALL SELECT 'season_stats', COUNT(*) FROM player_season_stats WHERE player_id=1199
    `,
  );
  console.log("LEFTOVER before delete:", left.rows);

  // Clear season stats + aliases then delete player
  await c.query(`DELETE FROM player_season_stats WHERE player_id = 1199`);
  try {
    await c.query(`DELETE FROM player_season_name_aliases WHERE player_id = 1199`);
  } catch {
    /* optional table */
  }
  // Other possible FKs
  for (const sql of [
    `DELETE FROM entity_badges WHERE entity_type='player' AND entity_id=1199`,
    `DELETE FROM ratings WHERE entity_type='player' AND entity_id=1199`,
    `UPDATE managers SET player_id=NULL WHERE player_id=1199`,
    `UPDATE transfers SET player_id=NULL WHERE player_id=1199`,
  ]) {
    try {
      await c.query(sql);
    } catch (e) {
      console.log("skip", sql.slice(0, 40), e.message);
    }
  }

  const del = await c.query(`DELETE FROM players WHERE id = 1199 RETURNING id, name`);
  console.log("DELETED:", del.rows);

  // Resync season stats from sheets for keepers
  for (const pid of [1116, 1117]) {
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
      [pid],
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
      [pid],
    );
    const gMap = new Map(goals.rows.map((r) => [r.season, r.goals]));
    for (const a of apps.rows) {
      const g = gMap.get(a.season) ?? 0;
      const up = await c.query(
        `
        INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
        VALUES ($1, $2, $3, $4, 0)
        ON CONFLICT DO NOTHING
        `,
        [pid, a.season, a.appearances, g],
      );
      // Prefer update existing
      await c.query(
        `
        UPDATE player_season_stats
        SET appearances = $3, goals = $4
        WHERE player_id = $1 AND season = $2
        `,
        [pid, a.season, a.appearances, g],
      );
      console.log(`stats #${pid} ${a.season}: ${a.appearances}a/${g}g (insert=${up.rowCount})`);
    }
  }

  // Ensure unused-bench seasons still present
  for (const pid of [1116, 1117]) {
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
      [pid],
    );
  }

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
  }

  // Verify
  console.log(
    "\nVERIFY lineups 1199:",
    (await c.query(`SELECT COUNT(*)::int AS n FROM match_lineups WHERE player_id=1199`)).rows[0],
  );
  console.log(
    "Galocha 1975:",
    (
      await c.query(
        `SELECT season, appearances, goals FROM player_season_stats WHERE player_id=1117 ORDER BY season`,
      )
    ).rows,
  );
  console.log(
    "Serginho seasons:",
    (
      await c.query(
        `SELECT season, appearances, goals FROM player_season_stats WHERE player_id=1116 ORDER BY season`,
      )
    ).rows,
  );
  console.log(
    "Galocha 1975 matches:",
    (
      await c.query(
        `SELECT m.id, m.match_date::date AS d, o.name, l.role, l.player_name
         FROM match_lineups l
         JOIN matches m ON m.id=l.match_id
         JOIN opponents o ON o.id=m.opponent_id
         WHERE l.player_id=1117 AND m.season='1975'
         ORDER BY m.match_date`,
      )
    ).rows,
  );
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
