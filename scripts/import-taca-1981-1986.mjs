/**
 * Import Taça de Ouro / Taça de Prata — CSA 1981–1986 (Brasileiro A/B).
 * Completa stubs existentes (phase/gols/escalação) e insere o restante.
 *
 * Usage: node scripts/import-taca-1981-1986.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { BATCHES } from "./data/seasons-taca-1981-1986.mjs";

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
  romel: "Rômel",
  rômel: "Rômel",
  rommel: "Rômel",
  "luis paulo": "Luís Paulo",
  "luís paulo": "Luís Paulo",
  "luiz paulo": "Luís Paulo",
  adilton: "Adílton",
  adílton: "Adílton",
  "ze carlos": "Zé Carlos",
  "zé carlos": "Zé Carlos",
  flavio: "Flávio",
  flávio: "Flávio",
  americo: "Américo",
  américo: "Américo",
  josenilton: "Josenílton",
  josenílton: "Josenílton",
  adeildo: "Adeíldo",
  adeíldo: "Adeíldo",
  joseli: "Joseli",
  joceli: "Joseli",
  cafe: "Café",
  café: "Café",
  jeronimo: "Jerônimo",
  jerônimo: "Jerônimo",
  "jorge siri": "Jorge Siri",
  luisao: "Luizão",
  luizao: "Luizão",
  luizão: "Luizão",
  nivio: "Nívio",
  níveo: "Nívio",
  níviro: "Nívio",
  "mario tilico": "Mário Tilico",
  "mário tilico": "Mário Tilico",
  andre: "André",
  andré: "André",
  "ditinho souza": "Ditinho Souza",
  "carlos alberto": "Carlos Alberto",
  "carlinhos paulista": "Carlinhos Paulista",
  "carlinhos marechal": "Carlinhos Marechal",
  "jorge vasconcelos": "Jorge Vasconcelos",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  romel: 495,
  rômel: 495,
  rommel: 495,
  jacozinho: 907,
  dentinho: 778,
  "luis paulo": 967,
  "luís paulo": 967,
  "luiz paulo": 967,
  antunes: 682,
  adilton: 654,
  adílton: 654,
  jorginho: 931,
  "jorge siri": 931,
  "ze carlos": 1174,
  "zé carlos": 1174,
  flavio: 844,
  flávio: 844,
  americo: 672,
  américo: 672,
  // Volante da era 1982–83 (≠ Ademir atacante #650)
  ademir: 1704,
  freitas: 852,
  mug: 1031,
  veiga: 1150,
  cafe: 547,
  café: 547,
  fernando: 837,
  zezinho: 536,
  jeronimo: 916,
  jerônimo: 916,
  josenilton: 942,
  josenílton: 942,
  adeildo: 647,
  adeíldo: 647,
  joseli: 1724,
  joceli: 1724,
  humberto: 895,
  dequinha: 780,
  marciano: 989,
  frank: 850,
  luisao: 968,
  luizao: 968,
  luizão: 968,
  miguelzinho: 1019,
  ednaldo: 801,
  "carlos alberto": 1690,
  agnaldo: 658,
  nivio: 1045,
  níviro: 1045,
  borges: 717,
  "carlinhos paulista": 1682,
  "carlinhos marechal": 546,
  "mario tilico": 1002,
  "mário tilico": 1002,
  coca: 766,
  "ditinho souza": 789,
  ditinho: 789,
  mauro: 1012,
};

const DISPLAY_NAME = {
  495: "Rômel",
  967: "Luís Paulo",
  1724: "Joseli",
  789: "Ditinho Souza",
};

const CREATE_META = {
  andre: { position: "Atacante", forceCreate: true },
  andré: { position: "Atacante", forceCreate: true },
  helinho: { position: "Atacante", forceCreate: true },
  washington: { position: "Atacante", forceCreate: true },
};

const OPP_ALIAS = {
  "atletico pr": "Athletico-PR",
  "atlético-pr": "Athletico-PR",
  "caxias-rs": "Caxias do Sul-RS",
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

async function ensureOpponent(raw) {
  const aliased = OPP_ALIAS[norm(raw)] ?? raw;
  const name = aliased;
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]));
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
  const aliases = {
    "rei pele": (s) => norm(s.name).includes("rei pele") || norm(s.name).includes("trapich"),
    "fonte nova": (s) => norm(s.name).includes("fonte nova"),
    maracana: (s) => norm(s.name).includes("maracana"),
    almeidao: (s) => norm(s.name).includes("almeidao"),
    amigao: (s) => norm(s.name).includes("amigao"),
    mineirao: (s) => norm(s.name).includes("mineirao"),
    fragelli: (s) => norm(s.name).includes("fragelli"),
    "ilha do retiro": (s) => norm(s.name).includes("ilha"),
    "vivaldo lima": (s) => norm(s.name).includes("vivaldo"),
    "sao januario": (s) => norm(s.name).includes("januario"),
    "levy sobrinho": (s) => norm(s.name).includes("levy"),
    "lourival": (s) => norm(s.name).includes("lourival"),
    aflitos: (s) => norm(s.name).includes("aflitos"),
    morumbi: (s) => norm(s.name).includes("morumbi"),
    castelao: (s) => norm(s.name).includes("castelao"),
    albertao: (s) => norm(s.name).includes("albertao"),
    arruda: (s) => norm(s.name).includes("arruda"),
    "parque sao jorge": (s) => norm(s.name).includes("sao jorge"),
    "presidente vargas": (s) => norm(s.name).includes("vargas"),
    baenao: (s) => norm(s.name).includes("baenao"),
    "castelo branco": (s) => norm(s.name).includes("castelo branco"),
    alacir: (s) => norm(s.name).includes("alacir"),
    lucarelli: (s) => norm(s.name).includes("lucarelli"),
    "brinco de ouro": (s) => norm(s.name).includes("brinco"),
    morenao: (s) => norm(s.name).includes("morenao"),
    "palestra italia": (s) => norm(s.name).includes("palestra"),
    pinheirao: (s) => norm(s.name).includes("pinheirao"),
    "italo del cima": (s) => norm(s.name).includes("italo") || norm(s.name).includes("del cima"),
    schlemm: (s) => norm(s.name).includes("schlemm"),
    "marechal hermes": (s) => norm(s.name).includes("hermes"),
  };
  for (const [k, fn] of Object.entries(aliases)) {
    if (norm(name).includes(k) || k.includes(norm(name))) {
      const a = all.find(fn);
      if (a) return a;
    }
  }
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,NULL,NULL,'Brasil')
     RETURNING id, name`,
    [name],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
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
  if (norm(canon).includes("vasconcelos")) {
    const v = all.find((m) => norm(m.name).includes("vasconcelos"));
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
  if (g.gf > g.ga) return "win";
  if (g.gf < g.ga) return "loss";
  return "draw";
}

function scorersText(g) {
  const csaGoalNames =
    g.goals
      ?.filter((x) => (x.side ?? "csa") === "csa" && !x.ownGoal)
      .map((x) => canonName(x.name)) ?? [];
  const ownForNames =
    g.goals
      ?.filter((x) => x.ownGoal && (x.ownGoalDirection ?? "for") === "for")
      .map((x) => `${x.name} (gc)`) ?? [];
  if (!csaGoalNames.length && !ownForNames.length) return null;
  return [...csaGoalNames, ...ownForNames].join(", ");
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
       AND result IN ('win','draw','loss')
       AND lower(coalesce(phase,'')) NOT LIKE '%anulad%'`,
    [String(season), competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season::text=$1 AND competition_id=$2`,
    [String(season), competitionId],
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
      [String(season), competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
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
      WHERE m.season::text=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
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
        AND lower(coalesce(m.phase,'')) NOT LIKE '%anulad%'
      GROUP BY mg.scorer_player_id
    )
    SELECT coalesce(a.player_id,g.player_id) AS player_id,
           coalesce(a.appearances,0)::int AS appearances,
           coalesce(g.goals,0)::int AS goals
    FROM apps a
    FULL OUTER JOIN goals g ON g.player_id=a.player_id
    `,
    [String(season)],
  );
  for (const s of stats) {
    const ex = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season::text=$2`,
      [s.player_id, String(season)],
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
        [s.player_id, String(season), s.appearances, s.goals],
      );
    }
  }
  return stats.length;
}

async function writeLineupsAndGoals(matchId, g, { replaceGoals = false } = {}) {
  const csaLineup = new Map();
  let sort = 0;

  const { rows: existingLu } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE match_id=$1 AND side='csa'`,
    [matchId],
  );
  if (g.starters?.length && existingLu[0].n === 0) {
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
  } else if (existingLu[0].n > 0) {
    const { rows: lus } = await client.query(
      `SELECT id, player_id FROM match_lineups WHERE match_id=$1 AND side='csa'`,
      [matchId],
    );
    for (const lu of lus) if (lu.player_id) csaLineup.set(lu.player_id, lu.id);
  }

  const { rows: goalCount } = await client.query(
    `SELECT count(*)::int AS n FROM match_goals WHERE match_id=$1`,
    [matchId],
  );
  if (replaceGoals && goalCount[0].n > 0) {
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [matchId]);
  }
  const shouldWriteGoals = g.goals?.length && (replaceGoals || goalCount[0].n === 0);
  if (!shouldWriteGoals) return;

  for (const goal of g.goals) {
    const side = goal.side ?? "csa";
    if (goal.ownGoal) {
      const dir = goal.ownGoalDirection ?? "for";
      if (dir === "for") {
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
    await client.query(
      `INSERT INTO match_goals
         (match_id,side,scorer_lineup_id,scorer_player_id,scorer_name,
          minute,injury_time_minute,is_penalty,is_own_goal)
       VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
      [matchId, csaLineup.get(p.id) ?? null, p.id, p.name, goal.minute ?? 0, !!goal.penalty],
    );
  }
}

try {
  await client.query("BEGIN");

  const seasonsTouched = new Set();
  let inserted = 0;
  let enriched = 0;

  for (const batch of BATCHES) {
    const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
      batch.competition,
    ]);
    if (!comps[0]) throw new Error(`Competition missing: ${batch.competition}`);
    const competitionId = comps[0].id;
    seasonsTouched.add(batch.season);

    for (const g of batch.games) {
      const opp = await ensureOpponent(g.opponent);
      const { rows: existing } = await client.query(
        `SELECT id, phase, scorers FROM matches
         WHERE match_date=$1 AND season::text=$2 AND competition_id=$3
           AND opponent_id=$4 AND home_away=$5
         LIMIT 1`,
        [g.date, String(batch.season), competitionId, opp.id, g.ha],
      );

      const stadium = await ensureStadium(g.stadium ?? null);
      const manager = await ensureManager(g.manager ?? null);
      const result = resultOf(g);
      const scorers = scorersText(g);
      const ownGoalsFor = (g.goals ?? []).filter(
        (x) => x.ownGoal && (x.ownGoalDirection ?? "for") === "for",
      ).length;

      if (existing[0]) {
        await client.query(
          `UPDATE matches SET
             goals_for=$2, goals_against=$3, result=$4, phase=$5,
             stadium_id=coalesce($6, stadium_id),
             manager_id=coalesce($7, manager_id),
             scorers=coalesce($8, scorers),
             own_goals_for_count=$9
           WHERE id=$1`,
          [
            existing[0].id,
            g.gf,
            g.ga,
            result,
            g.phase,
            stadium?.id ?? null,
            manager?.id ?? null,
            scorers,
            ownGoalsFor,
          ],
        );
        await writeLineupsAndGoals(existing[0].id, g);
        enriched += 1;
        continue;
      }

      const { rows: ins } = await client.query(
        `INSERT INTO matches (
           match_date, season, opponent_id, goals_for, goals_against,
           result, home_away, competition_id, phase, round,
           stadium_id, referee_id, manager_id, attendance,
           gross_revenue, gross_revenue_text, scorers, own_goals_for_count,
           is_walkover, is_friendly, status
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,NULL,$11,NULL,NULL,NULL,$12,$13,
           false,false,'played'
         ) RETURNING id`,
        [
          g.date,
          String(batch.season),
          opp.id,
          g.gf,
          g.ga,
          result,
          g.ha,
          competitionId,
          g.phase,
          stadium?.id ?? null,
          manager?.id ?? null,
          scorers,
          ownGoalsFor,
        ],
      );
      await writeLineupsAndGoals(ins[0].id, g);
      inserted += 1;
    }

    const stats = await refreshSeasonCompStats(batch.season, competitionId);
    const exp = batch.expected;
    const ok =
      stats.games === exp.games &&
      stats.wins === exp.wins &&
      stats.draws === exp.draws &&
      stats.losses === exp.losses &&
      stats.goals_for === exp.goals_for &&
      stats.goals_against === exp.goals_against;
    console.log(
      `${batch.competition} ${batch.season}: ${JSON.stringify(stats)}${ok ? " OK" : " MISMATCH"}`,
    );
    if (!ok) {
      throw new Error(
        `Stats mismatch ${batch.competition} ${batch.season}: got ${JSON.stringify(stats)} expected ${JSON.stringify(exp)}`,
      );
    }
  }

  for (const season of seasonsTouched) {
    const n = await syncRosterFromSheets(season);
    console.log(`roster season ${season}: ${n} players`);
  }

  // manager season stats for touched seasons
  for (const season of seasonsTouched) {
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
      WHERE m.season::text=$1 AND m.manager_id IS NOT NULL
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
        AND m.result IN ('win','draw','loss')
      GROUP BY m.manager_id, mgr.name
      `,
      [String(season)],
    );
    for (const s of mgrStats) {
      const ex = await client.query(
        `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season::text=$2`,
        [s.manager_id, String(season)],
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
            String(season),
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
  }

  await client.query("COMMIT");
  console.log({ inserted, enriched, createdPlayers });
  console.log("OK Taça 1981–1986");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
