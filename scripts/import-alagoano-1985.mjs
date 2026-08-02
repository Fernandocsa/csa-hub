/**
 * Import Campeonato Alagoano 1985 (29 jogos) + fichas/gols quando informados.
 * - CSA campeão (3 turnos + superturno)
 * - Técnicos: Fidélis → Ronaldo Alves → Velha
 * - Gols contra: ownGoalDirection for|against + own_goals_for_count
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1985-alagoano.mjs";

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
  cafe: "Café",
  café: "Café",
  luizao: "Luizão",
  luisao: "Luizão",
  luizão: "Luizão",
  luisão: "Luizão",
  josenilton: "Josenílton",
  josenílton: "Josenílton",
  gilson: "Gílson",
  gílson: "Gílson",
  carlinho: "Carlinhos",
  carlinhos: "Carlinhos",
  joao: "João Neto",
  joão: "João Neto",
  "joao neto": "João Neto",
  "joão neto": "João Neto",
  "ze luiz": "Zé Luiz",
  "zé luiz": "Zé Luiz",
  "ze carlos": "Zé Carlos",
  "zé carlos": "Zé Carlos",
  "ze carlos ii": "Zé Carlos II",
  "zé carlos ii": "Zé Carlos II",
  sidao: "Sidão",
  sidão: "Sidão",
  "mario tilico": "Mário Tilico",
  "mário tilico": "Mário Tilico",
  betao: "Betão",
  betão: "Betão",
  "julio cesar": "Júlio César",
  "júlio césar": "Júlio César",
  fidelis: "Fidélis",
  fidélis: "Fidélis",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  cafe: 547,
  café: 547,
  zezinho: 536,
  veiga: 1150,
  frank: 850,
  jacozinho: 907,
  luizao: 968,
  luisao: 968,
  luizão: 968,
  luisão: 968,
  josenilton: 942,
  josenílton: 942,
  batista: 697,
  bel: 701,
  betao: 708,
  betão: 708,
  borges: 717,
  "mario tilico": 1002,
  "mário tilico": 1002,
  miro: 1026,
  "toninho vanusa": 1136,
  josival: 943,
  "joao neto": 922,
  "joão neto": 922,
  joao: 922,
  joão: 922,
  miguelzinho: 1019,
  vino: 1157,
  "ze carlos": 1174,
  "zé carlos": 1174,
};

/** forceCreate evita homônimos de outras épocas. */
const CREATE_META = {
  "ze luiz": { position: "Goleiro", forceCreate: true },
  "zé luiz": { position: "Goleiro", forceCreate: true },
  "carlos alberto": { position: "Lateral", forceCreate: true },
  "ze carlos ii": { position: "Lateral", forceCreate: true },
  "zé carlos ii": { position: "Lateral", forceCreate: true },
  gilson: { position: "Atacante", forceCreate: true },
  gílson: { position: "Atacante", forceCreate: true },
  sidao: { position: "Meia", forceCreate: true },
  sidão: { position: "Meia", forceCreate: true },
  doia: { position: "Atacante", forceCreate: true },
  ditinho: { position: "Atacante", forceCreate: true },
  vininho: { position: "Zagueiro", forceCreate: true },
  joel: { position: "Goleiro", forceCreate: true },
  "julio cesar": { position: "Atacante", forceCreate: true },
  "júlio césar": { position: "Atacante", forceCreate: true },
  dorval: { position: "Lateral", forceCreate: true },
  carlinhos: { position: "Meia", forceCreate: true },
  carlinho: { position: "Meia", forceCreate: true },
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
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  const meta = CREATE_META[key] ?? null;
  let rows = [];
  if (!meta?.forceCreate) {
    ({ rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]));
  }
  if (!rows[0]) {
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, birth_year, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷',NULL,'unverified') RETURNING id, name`,
      [name, meta?.position ?? null],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
  }
  playerCache.set(key, rows[0]);
  return rows[0];
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(
    `SELECT id, name FROM opponents WHERE lower(name)=lower($1)`,
    [name],
  ));
  if (rows[0]) return rows[0];
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
  const aliases = {
    nivaldao: (s) => norm(s.name).includes("nival"),
    "arnon de mello": (s) => norm(s.name).includes("arnon"),
    "arnon de melo": (s) => norm(s.name).includes("arnon"),
  };
  for (const [k, fn] of Object.entries(aliases)) {
    if (norm(name).includes(k) || k.includes(norm(name))) {
      const a = all.find(fn);
      if (a) return a;
    }
  }
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
  const soft = all.find((r) => norm(r.name).includes(norm(name)));
  if (soft) return soft;
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,'AL') RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  const canon = String(name).trim();
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [canon]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(canon));
  if (hit) return hit;
  if (norm(canon).includes("givanildo")) {
    const g = all.find((m) => norm(m.name).includes("givanildo"));
    if (g) return g;
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

    const stadium = await ensureStadium(g.stadium);
    const referee = await ensureReferee(g.referee ?? null);
    const manager = await ensureManager(g.manager ?? null);
    const result = resultOf(g.gf, g.ga);

    const csaGoalNames =
      g.goals
        ?.filter((x) => (x.side ?? "csa") === "csa" && !x.ownGoal)
        .map((x) => canonName(x.name)) ?? [];
    const ownForNames =
      g.goals
        ?.filter((x) => x.ownGoal && (x.ownGoalDirection ?? "for") === "for")
        .map((x) => `${x.name} (gc)`) ?? [];
    const scorers =
      csaGoalNames.length || ownForNames.length
        ? [...csaGoalNames, ...ownForNames].join(", ")
        : null;

    const ownGoalsFor = (g.goals ?? []).filter(
      (x) => x.ownGoal && (x.ownGoalDirection ?? "for") === "for",
    ).length;

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance,
         gross_revenue, gross_revenue_text, scorers, own_goals_for_count,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,$11,$12,$13,$14,$15,$16,$17,
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
        ownGoalsFor,
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
      if (g.subs?.length) {
        for (const s of g.subs) {
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
    }

    if (g.goals?.length) {
      for (const goal of g.goals) {
        const side = goal.side ?? "csa";
        if (goal.ownGoal) {
          const dir = goal.ownGoalDirection ?? "for";
          if (dir === "against") {
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
                  minute,injury_time_minute,is_penalty,is_own_goal,own_goal_direction)
               VALUES ($1,'csa',$2,$3,$4,$5,NULL,false,true,'against')`,
              [
                matchId,
                csaLineup.get(p.id) ?? null,
                p.id,
                p.name,
                goal.minute ?? 0,
              ],
            );
          } else {
            await client.query(
              `INSERT INTO match_goals
                 (match_id,side,scorer_lineup_id,scorer_player_id,scorer_name,
                  minute,injury_time_minute,is_penalty,is_own_goal,own_goal_direction)
               VALUES ($1,'csa',NULL,NULL,$2,$3,NULL,false,true,'for')`,
              [matchId, goal.name, goal.minute ?? 0],
            );
          }
          continue;
        }
        if (side !== "csa") continue;
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
    }

    inserted.push({
      id: matchId,
      date: g.date,
      opp: opp.name,
      score: `${g.gf}x${g.ga}`,
      ha: g.ha,
    });
  }

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
      AND coalesce(m.status,'played')<>'scheduled'
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
  console.log("skipped", skipped.length);
  console.log("createdPlayers", createdPlayers);
  console.log("seasonStats", seasonStats);
  console.log("rosterPlayers", rosterN);
  console.log(
    "fonte: J29 V20 E08 D01 GP66 GC15 | PG54 (c/ bônus dos turnos não está em matches)",
  );
  console.log("OK Alagoano 1985");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
