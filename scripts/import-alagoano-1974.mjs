/**
 * Import Campeonato Alagoano 1974 (32 jogos CSA; datas até 05/06/1975).
 * - CSA campeão (1º e 2º turnos + empate na decisão)
 * - Técnicos: Laerte Dória / Pinguela (só onde a fonte confirma)
 * - Soma: J32 V21 E10 D1 GP57 GC7
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1974-alagoano.mjs";

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
  "laerte doria": "Laerte Dória",
  "laerte dória": "Laerte Dória",
  "ze preta": "Zé Preta",
  "zé preta": "Zé Preta",
  "ze galego": "Zé Galego",
  "zé galego": "Zé Galego",
  "enio oliveira": "Ênio Oliveira",
  "ênio oliveira": "Ênio Oliveira",
  enio: "Ênio",
  ênio: "Ênio",
  "jorge siri": "Jorge Siri",
  "jorge nunes": "Jorge Nunes",
  "jorge timbo": "Timbó",
  "jorge timbó": "Timbó",
  timbo: "Timbó",
  timbó: "Timbó",
  espinoza: "Espinoza",
  espinosa: "Espinoza",
  mauricio: "Maurício",
  maurício: "Maurício",
  "luiz digerson": "Luiz Digerson",
  "luiz digérson": "Luiz Digerson",
  "edson amaro": "Edson Amaro",
  "édson amaro": "Edson Amaro",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  soareste: 537,
  "jorge siri": 931,
  ricardo: 1095,
  "ze preta": 1183,
  "zé preta": 1183,
  "enio oliveira": 494,
  "ênio oliveira": 494,
  enio: 494,
  ênio: 494,
  "jorge nunes": 929,
  timbo: 1133,
  timbó: 1133,
  "jorge timbo": 1133,
  "jorge timbó": 1133,
  espinoza: 1769,
  espinosa: 1769,
  mauricio: 1770,
  maurício: 1770,
  dida: 782,
  valdeci: 1142,
  tadeu: 1127,
  valmir: 1146,
  misso: 530,
  djair: 790,
  ademir: 650,
  mendes: 1016,
  "ze galego": 1176,
  "zé galego": 1176,
  didinho: 784,
  isauro: 902,
};

/** Display name in sheets when DB name differs. */
const DISPLAY_NAME = {
  1133: "Jorge Timbó",
  1769: "Espinoza",
  494: "Ênio Oliveira",
};

const CREATE_META = {
  milton: { position: "Atacante" },
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
    const mapped = {
      id: rows[0].id,
      name: DISPLAY_NAME[rows[0].id] ?? rows[0].name,
    };
    playerCache.set(key, mapped);
    return mapped;
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
  const mapped = {
    id: rows[0].id,
    name: DISPLAY_NAME[rows[0].id] ?? rows[0].name,
  };
  playerCache.set(key, mapped);
  return mapped;
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(
    `SELECT id, name FROM opponents WHERE lower(name)=lower($1)`,
    [name],
  ));
  if (rows[0]) return rows[0];
  // Exact-normalized only — never soft-match Ferroviário across UFs
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
  const aliases = {
    "rei pele": (s) => norm(s.name).includes("rei pele") || norm(s.name).includes("trapich"),
    "coaracy": (s) => norm(s.name).includes("coaracy") || norm(s.name).includes("fumeir"),
    "fumeirao": (s) => norm(s.name).includes("coaracy") || norm(s.name).includes("fumeir"),
    "manoel moreira": (s) => norm(s.name).includes("moreira"),
    "alfredo leahy": (s) => norm(s.name).includes("leahy"),
    "juca sampaio": (s) => norm(s.name).includes("juca"),
    "edson amaro": (s) => norm(s.name).includes("edson amaro"),
    "argemiro cavalcante": (s) => norm(s.name).includes("argemiro"),
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

function refKey(name) {
  return norm(name).replace(/\s+\(?\b(rj|pe|sp|fifa)\)?$/i, "").trim();
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name) || refKey(r.name) === refKey(name));
  if (hit) return hit;
  if (norm(name).includes("wilson carlos") || norm(name).includes("wilson")) {
    const w = all.find(
      (r) =>
        norm(r.name).includes("wilson carlos") ||
        (norm(r.name).includes("wilson") && norm(r.name).includes("santos")),
    );
    if (w) return w;
  }
  if (norm(name).includes("sebastiao rufino")) {
    const ruf = all.find((r) => norm(r.name).includes("sebastiao rufino"));
    if (ruf) return ruf;
  }
  if (norm(name).includes("digerson")) {
    const d = all.find((r) => norm(r.name).includes("digerson"));
    if (d) return d;
  }
  const soft = all.find(
    (r) => norm(r.name).includes(refKey(name)) || refKey(name).includes(norm(r.name)),
  );
  if (soft) return soft;
  const state =
    /\b(RJ|PE|SP|FIFA)\b/i.test(name) ||
    /wright|begralda|wilson|gilson|ara[uú]jo|arag[aã]o|airton|morais/i.test(name)
      ? name.match(/\b(RJ|PE|SP)\b/i)?.[1]?.toUpperCase() ??
        (/arag[aã]o|airton/i.test(name) ? "SP" : "AL")
      : "AL";
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [name, state],
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
  if (norm(canon).includes("paulistinha")) {
    const v = all.find((m) => norm(m.name).includes("paulistinha"));
    if (v) return v;
  }
  if (norm(canon).includes("wassil") || norm(canon).includes("vassil")) {
    const v = all.find(
      (m) => norm(m.name).includes("wassil") || norm(m.name).includes("vassil"),
    );
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

function resultOf(g) {
  if (g.officialResult) return g.officialResult;
  if (g.gf > g.ga) return "win";
  if (g.gf < g.ga) return "loss";
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
       AND result IN ('win','draw','loss')
       AND lower(coalesce(phase,'')) NOT LIKE '%anulad%'`,
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
        AND lower(coalesce(m.phase,'')) NOT LIKE '%anulad%'
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
    const result = resultOf(g);

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
      result,
      ha: g.ha,
      excluded: !!g.excludeFromStats,
    });
  }

  const seasonStats = await refreshSeasonCompStats(SEASON, competitionId);
  await client.query(
    `UPDATE season_competition_stats
     SET classification = '1º', is_champion = true
     WHERE season = $1 AND competition_id = $2`,
    [String(SEASON), competitionId],
  );
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
      AND lower(coalesce(m.phase,'')) NOT LIKE '%anulad%'
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

  const expected = { games: 32, wins: 21, draws: 10, losses: 1, goals_for: 57, goals_against: 7 };
  const ok =
    seasonStats.games === expected.games &&
    seasonStats.wins === expected.wins &&
    seasonStats.draws === expected.draws &&
    seasonStats.losses === expected.losses &&
    seasonStats.goals_for === expected.goals_for &&
    seasonStats.goals_against === expected.goals_against;

  console.log("inserted", inserted.length);
  console.log("skipped", skipped.length);
  console.log("createdPlayers", createdPlayers);
  console.log("seasonStats (Alagoano)", seasonStats);
  console.log("rosterPlayers", rosterN);
  console.log("soma placares: J32 V21 E10 D1 GP57 GC7 | CSA campeão 1974");
  if (!ok) {
    throw new Error(
      `Stats mismatch: got ${JSON.stringify(seasonStats)} expected ${JSON.stringify(expected)}`,
    );
  }
  console.log("OK Alagoano 1974");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
