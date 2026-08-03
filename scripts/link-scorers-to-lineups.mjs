/**
 * Link CSA scorers into match_lineups when they have goals (or scorers text)
 * but are missing from the sheet — so /jogadores/:id/jogos matches career floors.
 *
 * - Official matches only (friendlies skipped for goals/apps)
 * - Adds missing scorers as starter (they played)
 * - Backfills match_goals from matches.scorers when CSA goal rows are empty
 *
 * Usage: node scripts/link-scorers-to-lineups.mjs [--dry] [--from=1974] [--to=1991]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const from =
  process.argv.find((a) => a.startsWith("--from="))?.slice(7) ?? "1974";
const to = process.argv.find((a) => a.startsWith("--to="))?.slice(5) ?? "1991";

const pool = createPgPool();
const client = await pool.connect();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parsePasteScorerNames(scorers) {
  if (!scorers) return [];
  const names = [];
  for (const part of String(scorers).split(/,\s*/)) {
    const p = part.trim();
    if (!p) continue;
    if (/\(contra\)|\(gc\)/i.test(p)) continue;
    const m = p.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      const n = Number(m[2]);
      for (let i = 0; i < n; i++) names.push(m[1].trim());
    } else names.push(p);
  }
  return names;
}

const ALIASES = {
  "jorge siri": ["Jorge Siri"],
  romel: ["Rommel"],
  rommel: ["Rommel"],
  "ze carlos": ["Zé Carlos"],
  jacozinho: ["Jacozinho"],
  dentinho: ["Dentinho"],
  adilton: ["Adílton"],
  gilmar: ["Gilmar"],
  freitas: ["Freitas"],
  serginho: ["Serginho"],
  rinaldo: ["Rinaldo Daniello", "Rinaldo"],
  euzebio: ["Euzébio", "Eusébio"],
};

const playerCache = new Map();

async function resolvePlayer(rawName, season) {
  const key = norm(rawName);
  const cacheKey = `${key}|${season}`;
  if (playerCache.has(cacheKey)) return playerCache.get(cacheKey);

  const candidates = ALIASES[key] ?? [rawName];
  for (const c of candidates) {
    const { rows } = await client.query(
      `SELECT p.id, p.name FROM players p
       JOIN player_season_stats pss ON pss.player_id=p.id
       WHERE lower(p.name)=lower($1) AND pss.season::text=$2
       ORDER BY p.id LIMIT 1`,
      [c, season],
    );
    if (rows[0]) {
      playerCache.set(cacheKey, rows[0]);
      return rows[0];
    }
  }
  for (const c of candidates) {
    const { rows } = await client.query(
      `SELECT id, name FROM players WHERE lower(name)=lower($1) ORDER BY id LIMIT 3`,
      [c],
    );
    if (rows.length === 1) {
      playerCache.set(cacheKey, rows[0]);
      return rows[0];
    }
  }
  // soft unique by norm among season-active players
  const { rows: seasonPlayers } = await client.query(
    `SELECT DISTINCT p.id, p.name FROM players p
     JOIN player_season_stats pss ON pss.player_id=p.id
     WHERE pss.season::text=$1`,
    [season],
  );
  const soft = seasonPlayers.filter(
    (p) => norm(p.name) === key || norm(p.name).includes(key) || key.includes(norm(p.name)),
  );
  if (soft.length === 1) {
    playerCache.set(cacheKey, soft[0]);
    return soft[0];
  }
  playerCache.set(cacheKey, null);
  return null;
}

async function ensureLineup(matchId, player, asStarter = true) {
  const { rows: ex } = await client.query(
    `SELECT id, role FROM match_lineups
     WHERE match_id=$1 AND side='csa' AND player_id=$2`,
    [matchId, player.id],
  );
  if (ex[0]) {
    // bench without sub-in doesn't count — promote to starter if we know they scored
    if (asStarter && ex[0].role === "bench") {
      if (!DRY) {
        await client.query(
          `UPDATE match_lineups SET role='starter' WHERE id=$1`,
          [ex[0].id],
        );
      }
      return { lineupId: ex[0].id, created: false, promoted: true };
    }
    return { lineupId: ex[0].id, created: false, promoted: false };
  }
  if (DRY) return { lineupId: -1, created: true, promoted: false };
  const { rows } = await client.query(
    `INSERT INTO match_lineups
       (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
     VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,
       (SELECT COALESCE(MAX(sort_order),0)+1 FROM match_lineups WHERE match_id=$1 AND side='csa'))
     RETURNING id`,
    [matchId, player.id, player.name],
  );
  return { lineupId: rows[0].id, created: true, promoted: false };
}

try {
  if (!DRY) await client.query("BEGIN");

  const stats = {
    goalsBackfilled: 0,
    lineupsCreated: 0,
    lineupsPromoted: 0,
    unresolved: [],
    goalLineupLinked: 0,
  };

  // 1) Backfill goals from scorers text when official match has gf>0 and zero CSA goal rows
  const { rows: needGoals } = await client.query(
    `SELECT m.id, m.season::text AS season, m.scorers, m.goals_for
     FROM matches m
     WHERE m.match_date >= $1::date AND m.match_date <= $2::date
       AND coalesce(m.is_friendly,false)=false
       AND coalesce(m.is_walkover,false)=false
       AND coalesce(m.status,'played')='played'
       AND coalesce(m.result,'')<>'unknown'
       AND coalesce(m.goals_for,0) > 0
       AND nullif(trim(m.scorers),'') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM match_goals g WHERE g.match_id=m.id AND g.side='csa'
       )
     ORDER BY m.match_date, m.id`,
    [`${from}-01-01`, `${to}-12-31`],
  );

  for (const m of needGoals) {
    const names = parsePasteScorerNames(m.scorers);
    if (!names.length) continue;
    for (const name of names) {
      const p = await resolvePlayer(name, m.season);
      if (!p) {
        stats.unresolved.push({ matchId: m.id, name, season: m.season });
        continue;
      }
      const lu = await ensureLineup(m.id, p, true);
      if (lu.created) stats.lineupsCreated++;
      if (lu.promoted) stats.lineupsPromoted++;
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'csa',$2,$3,$4,0,NULL,false,false)`,
          [m.id, lu.lineupId > 0 ? lu.lineupId : null, p.id, p.name],
        );
      }
      stats.goalsBackfilled++;
    }
  }

  // 2) Link existing CSA goals that have player_id but no lineup row
  const { rows: orphanGoals } = await client.query(
    `SELECT g.id AS goal_id, g.match_id, g.scorer_player_id, g.scorer_name,
            m.season::text AS season
     FROM match_goals g
     JOIN matches m ON m.id=g.match_id
     WHERE g.side='csa'
       AND g.scorer_player_id IS NOT NULL
       AND coalesce(g.is_own_goal,false)=false
       AND m.match_date >= $1::date AND m.match_date <= $2::date
       AND coalesce(m.is_friendly,false)=false
       AND NOT EXISTS (
         SELECT 1 FROM match_lineups ml
         WHERE ml.match_id=g.match_id AND ml.side='csa' AND ml.player_id=g.scorer_player_id
       )
     ORDER BY m.match_date, g.id`,
    [`${from}-01-01`, `${to}-12-31`],
  );

  for (const g of orphanGoals) {
    const p = { id: g.scorer_player_id, name: g.scorer_name };
    const lu = await ensureLineup(g.match_id, p, true);
    if (lu.created) stats.lineupsCreated++;
    if (lu.promoted) stats.lineupsPromoted++;
    if (!DRY && lu.lineupId > 0) {
      await client.query(
        `UPDATE match_goals SET scorer_lineup_id=$2 WHERE id=$1`,
        [g.goal_id, lu.lineupId],
      );
    }
    stats.goalLineupLinked++;
  }

  // 3) Also: goals with player but lineup is bench-only unused — promote (covered in ensureLineup when called)
  // Promote bench scorers who never came on
  const { rows: benchScorers } = await client.query(
    `SELECT DISTINCT ml.id AS lineup_id, ml.player_id, ml.player_name, ml.match_id
     FROM match_lineups ml
     JOIN match_goals g ON g.match_id=ml.match_id AND g.scorer_player_id=ml.player_id AND g.side='csa'
     JOIN matches m ON m.id=ml.match_id
     WHERE ml.side='csa' AND ml.role='bench'
       AND m.match_date >= $1::date AND m.match_date <= $2::date
       AND coalesce(m.is_friendly,false)=false
       AND NOT EXISTS (
         SELECT 1 FROM match_substitutions s
         WHERE s.match_id=ml.match_id AND s.side='csa' AND s.player_in_id=ml.player_id
       )`,
    [`${from}-01-01`, `${to}-12-31`],
  );
  for (const b of benchScorers) {
    if (!DRY) {
      await client.query(`UPDATE match_lineups SET role='starter' WHERE id=$1`, [
        b.lineup_id,
      ]);
    }
    stats.lineupsPromoted++;
  }

  if (!DRY) await client.query("COMMIT");
  console.log(DRY ? "DRY OK" : "OK", { from, to, ...stats });
  if (stats.unresolved.length) {
    const uniq = [...new Map(stats.unresolved.map((u) => [`${u.name}|${u.season}`, u])).values()];
    console.log("unresolved sample", uniq.slice(0, 30));
    console.log("unresolved total", stats.unresolved.length);
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
