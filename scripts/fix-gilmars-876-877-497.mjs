/**
 * Fix Gilmars:
 * - #876 Barcelos did not play 1977 → remove/remap those sheets to #877
 * - #497 stub does not exist → Alagoano 1979 → #877; Taça de Ouro Cruzeiro → #876
 * - delete #497
 *
 * Usage: node scripts/fix-gilmars-876-877-497.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const c = await pool.connect();

const BARCELOS = 876;
const PEREIRA = 877;
const STUB = 497;

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

async function deletePlayerRefsOnMatch(matchId, playerId) {
  // Drop duplicate lineup when target already present
  const del = await c.query(
    `DELETE FROM match_lineups WHERE match_id=$1 AND player_id=$2 RETURNING id, role`,
    [matchId, playerId],
  );
  // Move events that still point at from-id onto... nothing if target already scored?
  // Prefer remapping goals/subs to PEREIRA when deleting BARCELOS dupes
  return del.rowCount ?? 0;
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

async function deletePlayerIfOrphan(playerId) {
  const left = await c.query(
    `
    SELECT
      (SELECT count(*) FROM match_lineups WHERE player_id=$1) +
      (SELECT count(*) FROM match_goals WHERE scorer_player_id=$1 OR assist_player_id=$1) +
      (SELECT count(*) FROM match_cards WHERE player_id=$1) +
      (SELECT count(*) FROM match_substitutions WHERE player_in_id=$1 OR player_out_id=$1) +
      (SELECT count(*) FROM match_penalty_events WHERE player_id=$1) +
      (SELECT count(*) FROM matches WHERE captain_player_id=$1)
      AS n
    `,
    [playerId],
  );
  if (Number(left.rows[0].n) > 0) {
    throw new Error(`player #${playerId} still has ${left.rows[0].n} match refs`);
  }

  await c.query(`DELETE FROM player_season_stats WHERE player_id=$1`, [playerId]);
  await c.query(`DELETE FROM player_season_name_aliases WHERE player_id=$1`, [playerId]);
  await c.query(`DELETE FROM daily_player WHERE player_id=$1`, [playerId]);
  await c.query(`DELETE FROM daily_player_blocks WHERE player_id=$1`, [playerId]);
  await c.query(`DELETE FROM transfers WHERE player_id=$1`, [playerId]);
  await c.query(`UPDATE managers SET player_id=NULL WHERE player_id=$1`, [playerId]);
  await c.query(`UPDATE presidents SET linked_player_id=NULL WHERE linked_player_id=$1`, [
    playerId,
  ]);
  await c.query(`DELETE FROM players WHERE id=$1`, [playerId]);
}

try {
  console.log(DRY ? "DRY" : "APPLY");

  const from876_1977 = (
    await c.query(
      `
      SELECT m.id
      FROM match_lineups l JOIN matches m ON m.id=l.match_id
      WHERE l.player_id=$1 AND m.season='1977'
      ORDER BY m.match_date
      `,
      [BARCELOS],
    )
  ).rows.map((r) => r.id);

  const stubMatches = (
    await c.query(
      `
      SELECT m.id, c.name AS comp
      FROM match_lineups l
      JOIN matches m ON m.id=l.match_id
      JOIN competitions c ON c.id=m.competition_id
      WHERE l.player_id=$1
      ORDER BY m.match_date
      `,
      [STUB],
    )
  ).rows;

  console.log("876 1977 matches:", from876_1977);
  console.log("497 matches:", stubMatches);

  await c.query("BEGIN");

  // --- 1977: remove Barcelos duplicates / remap unique ---
  let deletedDupes = 0;
  let remapped77 = 0;
  for (const mid of from876_1977) {
    const hasPereira = await c.query(
      `SELECT 1 FROM match_lineups WHERE match_id=$1 AND side='csa' AND player_id=$2`,
      [mid, PEREIRA],
    );
    if (hasPereira.rowCount) {
      // Pereira already on sheet: drop Barcelos duplicate lineup + orphan events
      await c.query(
        `DELETE FROM match_goals WHERE match_id=$1 AND (scorer_player_id=$2 OR assist_player_id=$2)`,
        [mid, BARCELOS],
      );
      await c.query(
        `DELETE FROM match_cards WHERE match_id=$1 AND player_id=$2`,
        [mid, BARCELOS],
      );
      await c.query(
        `DELETE FROM match_substitutions
         WHERE match_id=$1 AND (player_in_id=$2 OR player_out_id=$2)`,
        [mid, BARCELOS],
      );
      try {
        await c.query(
          `DELETE FROM match_penalty_events WHERE match_id=$1 AND player_id=$2`,
          [mid, BARCELOS],
        );
      } catch {
        /* optional */
      }
      await c.query(
        `UPDATE matches SET captain_player_id=NULL
         WHERE id=$1 AND captain_player_id=$2`,
        [mid, BARCELOS],
      );
      deletedDupes += await deletePlayerRefsOnMatch(mid, BARCELOS);
      console.log(`  match ${mid}: deleted duplicate Barcelos lineup (Pereira already there)`);
    } else {
      remapped77 += await remapPlayerOnMatch(mid, BARCELOS, PEREIRA, "Gilmar");
      console.log(`  match ${mid}: remapped Barcelos → Pereira`);
    }
  }

  // --- 497 merge ---
  let toPereira = 0;
  let toBarcelos = 0;
  for (const row of stubMatches) {
    const mid = row.id;
    const toId = row.comp === "Taça de Ouro" ? BARCELOS : PEREIRA;
    const toName = "Gilmar";
    const hit = await c.query(
      `SELECT 1 FROM match_lineups WHERE match_id=$1 AND side='csa' AND player_id=$2`,
      [mid, toId],
    );
    if (hit.rowCount) throw new Error(`conflict merging 497→${toId} on match ${mid}`);
    const n = await remapPlayerOnMatch(mid, STUB, toId, toName);
    if (toId === PEREIRA) toPereira += n;
    else toBarcelos += n;
    console.log(`  match ${mid} (${row.comp}): 497 → #${toId}`);
  }

  await deletePlayerIfOrphan(STUB);
  console.log("deleted player #497");

  await syncPlayerStats(BARCELOS);
  await syncPlayerStats(PEREIRA);

  console.log({ deletedDupes, remapped77, toPereira, toBarcelos });

  if (DRY) {
    await c.query("ROLLBACK");
    console.log("DRY — rolled back");
  } else {
    await c.query("COMMIT");
    console.log("COMMIT ok");
    for (const [label, id] of [
      ["#876 Barcelos", BARCELOS],
      ["#877 Pereira", PEREIRA],
    ]) {
      console.log(
        label,
        "stats",
        (
          await c.query(
            `SELECT season, appearances, goals FROM player_season_stats WHERE player_id=$1 ORDER BY season`,
            [id],
          )
        ).rows,
      );
      console.log(
        label,
        "sheets",
        (
          await c.query(
            `SELECT m.season, COUNT(*)::int n FROM match_lineups l JOIN matches m ON m.id=l.match_id
             WHERE l.player_id=$1 GROUP BY m.season ORDER BY 1`,
            [id],
          )
        ).rows,
      );
    }
    console.log(
      "497 exists?",
      (await c.query(`SELECT id FROM players WHERE id=497`)).rows,
    );
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
