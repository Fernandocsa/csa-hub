/**
 * Import Campeonato Alagoano 1986 (23 jogos CSA) + ficha do jogo do título.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1986-alagoano.mjs";

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

const CANON = {
  "ze luis": "Zé Luís",
  "zé luis": "Zé Luís",
  "zé luís": "Zé Luís",
  "nei dias": "Nei Dias",
  cale: "Cale",
  edvaldo: "Edvaldo",
  zezinho: "Zezinho",
  veiga: "Veiga",
  betao: "Betão",
  betão: "Betão",
  dudu: "Dudu",
  paulinho: "Paulinho",
  carlinhos: "Carlinhos",
  borges: "Borges",
  dentinho: "Dentinho",
  ditinho: "Ditinho",
  "ditinho souza": "Ditinho",
  "walmir louruz": "Valmir Louruz",
  "valmir louruz": "Valmir Louruz",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  zezinho: 536,
  veiga: 1150,
  betao: 708,
  betão: 708,
  dudu: 796,
  borges: 717,
  dentinho: 778,
  ditinho: 789,
  edvaldo: 807,
  paulinho: 1061,
};

const CREATE_META = {
  "ze luis": { position: "Goleiro", birth_year: null },
  "zé luis": { position: "Goleiro", birth_year: null },
  "zé luís": { position: "Goleiro", birth_year: null },
  "nei dias": { position: "Lateral Direito", birth_year: null },
  cale: { position: "Zagueiro", birth_year: null },
  carlinhos: { position: "Atacante", birth_year: null },
};

const playerCache = new Map();
const createdPlayers = [];

async function ensurePlayer(raw) {
  const name = canonName(raw);
  const key = norm(name);
  if (playerCache.has(key)) return playerCache.get(key);

  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
    // Ditinho Souza → display Ditinho
    const display =
      key === "ditinho" ? "Ditinho" : rows[0].name === "Dudu" ? "Dudu" : rows[0].name;
    const mapped = { id: rows[0].id, name: display };
    playerCache.set(key, mapped);
    return mapped;
  }

  let { rows } = await client.query(
    `SELECT id, name, position, birth_year FROM players WHERE name=$1 ORDER BY id`,
    [name],
  );

  if (key === "carlinhos") {
    const era = rows.find(
      (r) =>
        r.position === "Atacante" &&
        r.birth_year &&
        r.birth_year >= 1950 &&
        r.birth_year <= 1970,
    );
    if (era) {
      playerCache.set(key, { id: era.id, name: era.name });
      return playerCache.get(key);
    }
  }

  if (!rows[0]) {
    const meta = CREATE_META[key] ?? { position: null, birth_year: null };
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, birth_year, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷',$3,'unverified') RETURNING id, name`,
      [name, meta.position, meta.birth_year],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
  }

  const display = key === "ditinho" ? "Ditinho" : rows[0].name;
  playerCache.set(key, { id: rows[0].id, name: display });
  return playerCache.get(key);
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(
    `SELECT id, name FROM opponents WHERE lower(name)=lower($1)`,
    [name],
  ));
  if (rows[0]) return rows[0];
  const all = await client.query(`SELECT id, name FROM opponents`);
  const hit = all.rows.find((o) => norm(o.name) === norm(name));
  if (hit) return hit;
  const state = name.match(/-([A-Z]{2})$/)?.[1] ?? "AL";
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1,$2,'Brasil') RETURNING id, name`,
    [name, state],
  );
  console.log("OPPONENT_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureStadium(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  const soft = all.find(
    (s) => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)),
  );
  if (soft) return soft;
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,NULL,'AL','Brasil')
     RETURNING id, name`,
    [name],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const soft = all.find(
    (r) =>
      norm(r.name).includes("wilson carlos") ||
      (norm(r.name).includes("wilson") && norm(r.name).includes("santos")),
  );
  if (soft && norm(name).includes("wilson")) return soft;
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,'RJ') RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  const canon = canonName(name);
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [canon]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(canon));
  if (hit) return hit;
  if (norm(canon).includes("louruz") || norm(canon).includes("valmir") || norm(canon).includes("walmir")) {
    const v = all.find((m) => norm(m.name).includes("louruz") || norm(m.name).includes("valmir"));
    if (v) return v;
  }
  const ins = await client.query(
    `INSERT INTO managers (name, nationality, verification_status)
     VALUES ($1,'Brasil','unverified') RETURNING id, name`,
    [canon],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
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
     WHERE season=$1 AND competition_id=$2
       AND coalesce(is_friendly,false)=false
       AND coalesce(status,'played')<>'scheduled'
       AND result IN ('win','draw','loss')`,
    [season, competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season=$1 AND competition_id=$2`,
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
         (season,competition_id,games,wins,draws,losses,goals_for,goals_against,stats_source,stats_recalculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
      [season, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }
  return a;
}

async function syncRosterFromSheets(season) {
  const { rows: stats } = await client.query(
    `
    WITH played AS (
      SELECT DISTINCT ml.match_id, ml.player_id
      FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id
      WHERE m.season=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
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
      WHERE m.season=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
        AND coalesce(mg.is_own_goal,false)=false
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
  for (const s of stats) {
    const ex = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [s.player_id, season],
    );
    if (ex.rows[0]) {
      await client.query(
        `UPDATE player_season_stats SET appearances=$1, goals=$2 WHERE id=$3`,
        [s.appearances, s.goals, ex.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id,season,appearances,goals,assists)
         VALUES ($1,$2,$3,$4,0)`,
        [s.player_id, season, s.appearances, s.goals],
      );
    }
  }
  return stats.length;
}

try {
  await client.query("BEGIN");

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Competition missing: ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  const inserted = [];
  const skipped = [];

  for (const g of GAMES) {
    const opp = await ensureOpponent(g.opponent);
    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date=$1 AND season=$2 AND competition_id=$3
         AND opponent_id=$4 AND home_away=$5
       LIMIT 1`,
      [g.date, SEASON, competitionId, opp.id, g.ha],
    );
    if (existing[0]) {
      skipped.push({ id: existing[0].id, date: g.date, opp: opp.name });
      continue;
    }

    const stadium = await ensureStadium(g.stadium ?? null);
    const referee = await ensureReferee(g.referee ?? null);
    const manager = await ensureManager(g.manager ?? null);
    const result = resultOf(g.gf, g.ga);
    const scorers =
      g.goals?.length
        ? [...new Set(g.goals.map((x) => canonName(x.name)))].join(", ")
        : null;

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance,
         gross_revenue, gross_revenue_text, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,$11,$12,$13,$14,$15,$16,
         false,false,'played'
       ) RETURNING id`,
      [
        g.date,
        SEASON,
        opp.id,
        g.gf,
        g.ga,
        result,
        g.ha,
        competitionId,
        g.phase,
        stadium?.id ?? null,
        referee?.id ?? null,
        manager?.id ?? null,
        g.attendance ?? null,
        g.revenue ?? null,
        g.revenueText ?? null,
        scorers,
      ],
    );
    const matchId = ins[0].id;

    const csaLineup = new Map();
    let sort = 0;
    if (g.starters?.length) {
      for (const n of g.starters) {
        const p = await ensurePlayer(n);
        if (csaLineup.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      for (const n of g.entered ?? []) {
        const p = await ensurePlayer(n);
        if (csaLineup.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      for (const s of g.subs ?? []) {
        const outP = await ensurePlayer(s.out);
        const inP = await ensurePlayer(s.in);
        await client.query(
          `INSERT INTO match_substitutions
             (match_id,side,player_out_lineup_id,player_out_id,player_out_name,
              player_in_lineup_id,player_in_id,player_in_name,minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8)`,
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
    }

    if (g.goals?.length) {
      for (const goal of g.goals) {
        const p = await ensurePlayer(goal.name);
        if (!csaLineup.has(p.id) && g.starters?.length) {
          const { rows } = await client.query(
            `INSERT INTO match_lineups
               (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
             VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
            [matchId, p.id, p.name, sort++],
          );
          csaLineup.set(p.id, rows[0].id);
        }
        await client.query(
          `INSERT INTO match_goals
             (match_id,side,scorer_lineup_id,scorer_player_id,scorer_name,
              minute,injury_time_minute,is_penalty,is_own_goal)
           VALUES ($1,'csa',$2,$3,$4,$5,NULL,false,false)`,
          [
            matchId,
            csaLineup.get(p.id) ?? null,
            p.id,
            p.name,
            goal.minute ?? 0,
          ],
        );
      }
    }

    inserted.push({
      id: matchId,
      date: g.date,
      opp: opp.name,
      score: `${g.gf}x${g.ga}`,
      sheet: !!g.starters?.length,
    });
  }

  // Ditinho Souza display name in goals/lineups already "Ditinho"; remap player name for sheet if id 789
  await client.query(
    `UPDATE match_lineups SET player_name='Ditinho'
     WHERE player_id=789 AND match_id IN (SELECT id FROM matches WHERE season=$1)`,
    [SEASON],
  );
  await client.query(
    `UPDATE match_goals SET scorer_name='Ditinho'
     WHERE scorer_player_id=789 AND match_id IN (SELECT id FROM matches WHERE season=$1)`,
    [SEASON],
  );

  const seasonStats = await refreshSeasonCompStats(SEASON, competitionId);
  const rosterN = await syncRosterFromSheets(SEASON);

  const { rows: mgrStats } = await client.query(
    `
    SELECT m.manager_id, mgr.name,
           count(*)::int AS games,
           count(*) FILTER (WHERE m.result='win')::int AS wins,
           count(*) FILTER (WHERE m.result='draw')::int AS draws,
           count(*) FILTER (WHERE m.result='loss')::int AS losses,
           coalesce(sum(m.goals_for),0)::int AS goals_for,
           coalesce(sum(m.goals_against),0)::int AS goals_against
    FROM matches m
    JOIN managers mgr ON mgr.id=m.manager_id
    WHERE m.season=$1 AND m.manager_id IS NOT NULL
      AND coalesce(m.is_friendly,false)=false
      AND m.result IN ('win','draw','loss')
    GROUP BY m.manager_id, mgr.name
    `,
    [SEASON],
  );
  for (const s of mgrStats) {
    const ex = await client.query(
      `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
      [s.manager_id, SEASON],
    );
    if (ex.rows[0]) {
      await client.query(
        `UPDATE manager_season_stats SET
           games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6
         WHERE id=$7`,
        [s.games, s.wins, s.draws, s.losses, s.goals_for, s.goals_against, ex.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO manager_season_stats
           (manager_id,season,games,wins,draws,losses,goals_for,goals_against)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          s.manager_id,
          SEASON,
          s.games,
          s.wins,
          s.draws,
          s.losses,
          s.goals_for,
          s.goals_against,
        ],
      );
    }
  }

  await client.query("COMMIT");

  console.log("inserted", inserted.length);
  console.log("skipped", skipped);
  console.log("createdPlayers", createdPlayers);
  console.log("seasonStats (Alagoano only)", seasonStats);
  console.log("rosterPlayers", rosterN);
  console.log("OK Alagoano 1986");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
