/**
 * Import CSA matches — Torneio Norte-Nordeste 1970 (III Copa / Grupo 5).
 * Creates the 5 group-stage games and applies complementary sheets from source.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  GAMES,
} from "./data/season-1970-torneio-norte-nordeste.mjs";

loadEnvFromDotenv(".env");
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

const FORCE_ID = {
  catatau: 1792,
  dida: 1793,
  ratinho: 1084,
  piranha: 1797,
  piranhas: 1797,
  sale: 1795,
  canhoteiro: 727,
  ricardo: 1780,
  "ze luiz": 1180, // goleiro 1970
  "ze luiz ii": 1179, // volante (cadastro Alagoano)
  givaldo: 1794,
  erivaldo: 815,
  tadeu: 1127,
  ciro: 757,
  duda: 795,
};

const CREATE_META = {
  holanda: { name: "Holanda", position: "Goleiro", forceNew: true },
  beto: { name: "Beto", position: "Zagueiro", forceNew: true },
  joaozinho: { name: "Joãozinho", position: "Lateral Esquerdo", forceNew: true },
  dudu: { name: "Dudu", position: "Volante", forceNew: true },
  "marcos antonio": { name: "Marcos Antônio", position: "Volante", forceNew: true },
  joaci: { name: "Joaci", position: "Atacante", forceNew: true },
  major: { name: "Major", position: "Lateral Direito", forceNew: true },
  bite: { name: "Bite", position: "Meia", forceNew: true },
  "jorge bassu": { name: "Jorge Bassu", position: "Atacante", forceNew: true },
  bassu: { name: "Jorge Bassu", position: "Atacante", forceNew: true },
};

const playerCache = new Map();
const createdPlayers = [];

async function ensureCsaPlayer(raw) {
  const key = norm(raw);
  if (playerCache.has(key)) return playerCache.get(key);

  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${raw} → ${FORCE_ID[key]}`);
    // Prefer source alias for Zé Luiz II volante display
    const mapped =
      key === "ze luiz ii"
        ? { id: rows[0].id, name: "Zé Luiz II" }
        : { id: rows[0].id, name: rows[0].name };
    playerCache.set(key, mapped);
    return mapped;
  }

  const meta = CREATE_META[key];
  if (!meta) throw new Error(`Unresolved CSA player: "${raw}" (${key})`);

  let { rows } = await client.query(
    `SELECT p.id, p.name
     FROM players p
     JOIN player_season_stats pss ON pss.player_id = p.id
     WHERE p.name = $1 AND pss.season::text = $2
     ORDER BY p.id LIMIT 1`,
    [meta.name, SEASON],
  );
  if (!rows[0] && !meta.forceNew) {
    ({ rows } = await client.query(`SELECT id, name FROM players WHERE name=$1 ORDER BY id LIMIT 1`, [
      meta.name,
    ]));
  }
  if (!rows[0]) {
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷','unverified') RETURNING id, name`,
      [meta.name, meta.position],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
    await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1,$2,0,0,0) ON CONFLICT DO NOTHING`,
      [rows[0].id, SEASON],
    );
  }
  playerCache.set(key, rows[0]);
  playerCache.set(norm(rows[0].name), rows[0]);
  return rows[0];
}

async function ensureCompetition() {
  const { rows } = await client.query(`SELECT id, name FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!rows[0]) throw new Error(`Missing competition ${COMPETITION_NAME}`);
  return rows[0];
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM opponents`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const stateMatch = name.match(/-([A-Z]{2})$/);
  const state = stateMatch ? stateMatch[1] : null;
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1,$2,'Brasil') RETURNING id, name`,
    [name, state],
  );
  console.log("OPP_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureStadium(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  throw new Error(`Stadium missing: ${name}`);
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO referees (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO managers (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function scorersText(csaGoals = []) {
  const counts = new Map();
  for (const g of csaGoals) {
    counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
  }
  const parts = [...counts.entries()].map(([n, c]) => (c > 1 ? `${n} (${c})` : n));
  return parts.length ? parts.join(", ") : null;
}

async function refreshSeasonCompStats(season, competitionId) {
  const { rows: agg } = await client.query(
    `SELECT
       count(*)::int AS games,
       coalesce(sum(case when result='win' then 1 else 0 end),0)::int AS wins,
       coalesce(sum(case when result='draw' then 1 else 0 end),0)::int AS draws,
       coalesce(sum(case when result='loss' then 1 else 0 end),0)::int AS losses,
       coalesce(sum(goals_for),0)::int AS goals_for,
       coalesce(sum(goals_against),0)::int AS goals_against
     FROM matches
     WHERE season::text=$1 AND competition_id=$2
       AND coalesce(is_friendly,false)=false
       AND coalesce(status,'played')<>'scheduled'
       AND result IN ('win','draw','loss')`,
    [season, competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season::text=$1 AND competition_id=$2`,
    [season, competitionId],
  );
  if (scs[0]) {
    await client.query(
      `UPDATE season_competition_stats
       SET games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6,
           stats_source='calculated', stats_recalculated_at=now()
       WHERE id=$7`,
      [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, scs[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO season_competition_stats
         (season,competition_id,games,wins,draws,losses,goals_for,goals_against,
          stats_source,stats_recalculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
      [season, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }
  return a;
}

async function syncSeasonAppsGoals(season) {
  const { rows: stats } = await client.query(
    `
    WITH played AS (
      SELECT DISTINCT ml.match_id, ml.player_id
      FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id
      WHERE m.season::text=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
        AND (
          ml.role='starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions ms
            WHERE ms.match_id=ml.match_id AND ms.side='csa' AND ms.player_in_id=ml.player_id
          )
        )
    ),
    apps AS (SELECT player_id, count(*)::int AS appearances FROM played GROUP BY player_id),
    goals AS (
      SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
      FROM match_goals mg JOIN matches m ON m.id=mg.match_id
      WHERE m.season::text=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
        AND coalesce(mg.is_own_goal,false)=false
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
      GROUP BY mg.scorer_player_id
    )
    SELECT coalesce(a.player_id,g.player_id) AS player_id,
           coalesce(a.appearances,0)::int AS appearances,
           coalesce(g.goals,0)::int AS goals
    FROM apps a
    FULL OUTER JOIN goals g ON g.player_id=a.player_id
    `,
    [season],
  );

  // Only bump rows for players touched by this import (additive with Alagoano 1970).
  // Full-season recompute from all 1970 sheets is safer:
  let updated = 0;
  let inserted = 0;
  for (const s of stats) {
    const { rows: cur } = await client.query(
      `SELECT id, appearances, goals FROM player_season_stats
       WHERE player_id=$1 AND season::text=$2`,
      [s.player_id, season],
    );
    if (cur[0]) {
      if (cur[0].appearances !== s.appearances || cur[0].goals !== s.goals) {
        await client.query(
          `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
          [cur[0].id, s.appearances, s.goals],
        );
        updated++;
      }
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,$4,0)`,
        [s.player_id, season, s.appearances, s.goals],
      );
      inserted++;
    }
  }
  return { players: stats.length, updated, inserted };
}

try {
  await client.query("BEGIN");

  const competition = await ensureCompetition();
  const applied = [];

  for (const g of GAMES) {
    const opp = await ensureOpponent(g.opponent);
    const stadium = await ensureStadium(g.stadium ?? null);
    const referee = await ensureReferee(g.referee ?? null);
    const manager = await ensureManager(g.manager ?? null);

    let { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE season::text=$1 AND competition_id=$2 AND match_date=$3 AND opponent_id=$4`,
      [SEASON, competition.id, g.date, opp.id],
    );

    let matchId;
    if (existing[0]) {
      matchId = existing[0].id;
      await client.query(
        `UPDATE matches SET
           goals_for=$2, goals_against=$3, result=$4, home_away=$5,
           stadium_id=COALESCE($6, stadium_id),
           referee_id=COALESCE($7, referee_id),
           manager_id=COALESCE($8, manager_id),
           attendance=COALESCE($9, attendance),
           gross_revenue=COALESCE($10, gross_revenue),
           gross_revenue_text=COALESCE($11, gross_revenue_text),
           scorers=$12, phase=$13, status='played', is_friendly=false
         WHERE id=$1`,
        [
          matchId,
          g.goalsFor,
          g.goalsAgainst,
          g.result,
          g.homeAway,
          stadium?.id ?? null,
          referee?.id ?? null,
          manager?.id ?? null,
          g.attendance ?? null,
          g.grossRevenue ?? null,
          g.grossRevenueText ?? null,
          scorersText(g.csaGoals),
          g.phase,
        ],
      );
    } else {
      const ins = await client.query(
        `INSERT INTO matches (
           match_date, season, opponent_id, goals_for, goals_against, result, home_away,
           competition_id, stadium_id, manager_id, referee_id,
           attendance, gross_revenue, gross_revenue_text, scorers, phase,
           is_walkover, is_friendly, status
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false,false,'played'
         ) RETURNING id`,
        [
          g.date,
          SEASON,
          opp.id,
          g.goalsFor,
          g.goalsAgainst,
          g.result,
          g.homeAway,
          competition.id,
          stadium?.id ?? null,
          manager?.id ?? null,
          referee?.id ?? null,
          g.attendance ?? null,
          g.grossRevenue ?? null,
          g.grossRevenueText ?? null,
          scorersText(g.csaGoals),
          g.phase,
        ],
      );
      matchId = ins.rows[0].id;
      console.log("MATCH_CREATED", { id: matchId, date: g.date, opponent: g.opponent });
    }

    const hasLineup = (g.starters?.length ?? 0) > 0;
    const hasGoals = (g.csaGoals?.length ?? 0) > 0 || (g.oppGoals?.length ?? 0) > 0;

    if (!hasLineup && !hasGoals) {
      applied.push({ id: matchId, date: g.date, note: "result-only" });
      continue;
    }

    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [matchId]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [matchId]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [matchId]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [matchId]);

    const csaLineup = new Map();
    const oppLineup = new Map();
    let sort = 0;

    for (const name of g.starters ?? []) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [matchId, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    const bench = [];
    for (const s of g.subs ?? []) {
      if (!bench.includes(s.in)) bench.push(s.in);
    }
    for (const name of bench) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [matchId, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const goal of g.csaGoals ?? []) {
      const p = await ensureCsaPlayer(goal.name);
      if (csaLineup.has(p.id)) continue;
      if (hasLineup) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
    }

    let oppSort = 0;
    for (const name of g.oppStarters ?? []) {
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'starter',NULL,NULL,$3) RETURNING id`,
        [matchId, name, oppSort++],
      );
      oppLineup.set(norm(name), rows[0].id);
    }
    for (const s of g.oppSubs ?? []) {
      if (oppLineup.has(norm(s.in))) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'bench',NULL,NULL,$3) RETURNING id`,
        [matchId, s.in, oppSort++],
      );
      oppLineup.set(norm(s.in), rows[0].id);
    }

    for (const s of g.subs ?? []) {
      const outP = await ensureCsaPlayer(s.out);
      const inP = await ensureCsaPlayer(s.in);
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
        [
          matchId,
          csaLineup.get(outP.id) ?? null,
          outP.id,
          outP.name,
          csaLineup.get(inP.id) ?? null,
          inP.id,
          inP.name,
          s.minute ?? 0,
        ],
      );
    }

    for (const s of g.oppSubs ?? []) {
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,$6,NULL)`,
        [
          matchId,
          oppLineup.get(norm(s.out)) ?? null,
          s.out,
          oppLineup.get(norm(s.in)) ?? null,
          s.in,
          s.minute ?? 0,
        ],
      );
    }

    for (const goal of g.csaGoals ?? []) {
      const p = await ensureCsaPlayer(goal.name);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
        [
          matchId,
          csaLineup.get(p.id) ?? null,
          p.id,
          p.name,
          goal.minute ?? 0,
          !!goal.penalty,
        ],
      );
    }

    for (const goal of g.oppGoals ?? []) {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,false)`,
        [
          matchId,
          oppLineup.get(norm(goal.name)) ?? null,
          goal.name,
          goal.minute ?? 0,
          !!goal.penalty,
        ],
      );
    }

    applied.push({
      id: matchId,
      date: g.date,
      starters: g.starters?.length ?? 0,
      csaGoals: g.csaGoals?.length ?? 0,
      oppGoals: g.oppGoals?.length ?? 0,
    });
  }

  const seasonStats = await refreshSeasonCompStats(SEASON, competition.id);
  const sync = await syncSeasonAppsGoals(SEASON);

  await client.query("COMMIT");
  console.log("OK");
  console.log("createdPlayers", createdPlayers);
  console.log("seasonStats", seasonStats);
  console.log("sync", sync);
  console.table(applied);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
