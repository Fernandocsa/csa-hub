/**
 * Taça Brasil 1961 — completa Campinense (1ª Fase) + cria Bahia (2ª Fase) com súmulas CSA.
 *
 * Campinense foi desclassificado por escalação irregular de Ronaldo na ida;
 * CSA avançou administrativamente (placares de campo mantidos).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const SEASON = "1961";
const COMPETITION_NAME = "Taça Brasil";

const FORCE_ID = {
  lula: 972,
  "ze luiz i": 1181,
  "ze luiz": 1181,
  ba: 691,
  gernand: 870,
  boleado: 716,
  "paulo patriota": 1068,
  "haroldo castelo branco": 888,
  didi: 783,
  clovis: 526,
  machado: 976,
  cicero: 752,
  moacir: 1028,
  "roberto mendes": 1101,
  jeronimo: 915,
  italo: 903,
  "paulo santos": 1069,
};

/** @type {Array<{
 *  date: string;
 *  ha: 'home'|'away';
 *  gf: number;
 *  ga: number;
 *  phase: string;
 *  round: string;
 *  opponent: string;
 *  stadium: string|null;
 *  stadiumCity?: string;
 *  stadiumState?: string;
 *  starters: string[];
 *  entered?: string[];
 *  subbedOut?: string[];
 *  goals?: Array<{ name: string; minute?: number|null }>;
 *  shirts?: Record<string, number>;
 * }>} */
const SHEETS = [
  {
    date: "1961-07-23",
    ha: "home",
    gf: 2,
    ga: 3,
    phase: "1ª Fase",
    round: "Ida",
    opponent: "Campinense-PB",
    stadium: "Estádio do Mutange",
    starters: [
      "Lula",
      "Zé Luiz I",
      "Bá",
      "Gernand",
      "Boleado",
      "Paulo Patriota",
      "Haroldo Castelo Branco",
      "Didi",
      "Clóvis",
      "Machado",
      "Cícero",
    ],
    entered: ["Moacir"],
    subbedOut: ["Lula"],
    goals: [
      { name: "Cícero", minute: null },
      { name: "Cícero", minute: null },
    ],
    shirts: { Lula: 8, Moacir: 7 },
  },
  {
    date: "1961-07-30",
    ha: "away",
    gf: 1,
    ga: 2,
    phase: "1ª Fase",
    round: "Volta",
    opponent: "Campinense-PB",
    stadium: "Estádio Plínio Lemos",
    stadiumCity: "Campina Grande",
    stadiumState: "PB",
    starters: [
      "Lula",
      "Zé Luiz I",
      "Roberto Mendes",
      "Bá",
      "Boleado",
      "Paulo Patriota",
      "Gernand",
      "Haroldo Castelo Branco",
      "Cícero",
      "Clóvis",
      "Machado",
    ],
    goals: [{ name: "Paulo Patriota", minute: null }],
  },
  {
    date: "1961-09-24",
    ha: "home",
    gf: 0,
    ga: 3,
    phase: "2ª Fase",
    round: "Ida",
    opponent: "Bahia-BA",
    stadium: "Estádio do Mutange",
    starters: [
      "Lula",
      "Zé Luiz I",
      "Roberto Mendes",
      "Jerônimo",
      "Boleado",
      "Paulo Patriota",
      "Bá",
      "Italo",
      "Gernand",
      "Clóvis",
      "Machado",
    ],
    entered: ["Cícero"],
    subbedOut: ["Italo"],
    shirts: { Italo: 8, Cícero: 7 },
  },
  {
    date: "1961-09-29",
    ha: "away",
    gf: 0,
    ga: 1,
    phase: "2ª Fase",
    round: "Volta",
    opponent: "Bahia-BA",
    stadium: "Estádio da Fonte Nova",
    stadiumCity: "Salvador",
    stadiumState: "BA",
    starters: [
      "Lula",
      "Paulo Santos",
      "Zé Luiz I",
      "Roberto Mendes",
      "Boleado",
      "Paulo Patriota",
      "Bá",
      "Gernand",
      "Jerônimo",
      "Clóvis",
      "Machado",
    ],
  },
];

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

const playerCache = new Map();

async function ensurePlayer(raw) {
  const key = norm(raw);
  if (playerCache.has(key)) return playerCache.get(key);
  const id = FORCE_ID[key];
  if (!id) throw new Error(`No FORCE_ID for "${raw}" (${key})`);
  const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [id]);
  if (!rows[0]) throw new Error(`Missing player #${id} for "${raw}"`);
  playerCache.set(key, rows[0]);
  return rows[0];
}

async function ensureOpponent(name) {
  const { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (!rows[0]) throw new Error(`Missing opponent ${name}`);
  return rows[0];
}

async function ensureStadium(name, city, state) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  if (norm(name).includes("mutange")) {
    const m = all.find((s) => norm(s.name).includes("mutange"));
    if (m) return m;
  }
  if (norm(name).includes("fonte nova") && !norm(name).includes("arena")) {
    const f = all.find(
      (s) => norm(s.name).includes("fonte nova") && !norm(s.name).includes("arena"),
    );
    if (f) return f;
  }
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil')
     RETURNING id, name`,
    [name, city ?? null, state ?? null],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
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
         (season,competition_id,games,wins,draws,losses,goals_for,goals_against,stats_source,stats_recalculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
      [season, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }
  return a;
}

async function syncPlayerAppsGoals(season, playerIds) {
  for (const pid of playerIds) {
    const { rows: apps } = await client.query(
      `SELECT count(DISTINCT ml.match_id)::int AS n
       FROM match_lineups ml
       JOIN matches m ON m.id=ml.match_id
       WHERE ml.player_id=$1 AND ml.side='csa' AND m.season::text=$2
         AND coalesce(m.is_friendly,false)=false
         AND coalesce(m.status,'played')<>'scheduled'
         AND (
           ml.role='starter'
           OR EXISTS (
             SELECT 1 FROM match_substitutions ms
             WHERE ms.match_id=ml.match_id AND ms.side='csa' AND ms.player_in_id=ml.player_id
           )
         )`,
      [pid, season],
    );
    const { rows: goals } = await client.query(
      `SELECT count(*)::int AS n
       FROM match_goals mg
       JOIN matches m ON m.id=mg.match_id
       WHERE mg.scorer_player_id=$1 AND mg.side='csa' AND m.season::text=$2
         AND coalesce(mg.is_own_goal,false)=false
         AND coalesce(m.is_friendly,false)=false
         AND coalesce(m.status,'played')<>'scheduled'`,
      [pid, season],
    );
    const nApps = apps[0]?.n ?? 0;
    const nGoals = goals[0]?.n ?? 0;
    const { rows: cur } = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season::text=$2`,
      [pid, season],
    );
    if (cur[0]) {
      await client.query(
        `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
        [cur[0].id, nApps, nGoals],
      );
    } else if (nApps > 0 || nGoals > 0) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,$4,0)`,
        [pid, season, nApps, nGoals],
      );
    }
  }
}

try {
  await client.query("BEGIN");

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Missing ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  const summary = [];
  const matchIdsByKey = new Map();

  for (const g of SHEETS) {
    const opp = await ensureOpponent(g.opponent);
    const stadium = await ensureStadium(g.stadium, g.stadiumCity, g.stadiumState);
    const result = resultOf(g.gf, g.ga);

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date=$1 AND season::text=$2 AND competition_id=$3
         AND opponent_id=$4 AND home_away=$5
       LIMIT 1`,
      [g.date, SEASON, competitionId, opp.id, g.ha],
    );

    let matchId;
    if (existing[0]) {
      matchId = existing[0].id;
      await client.query(
        `UPDATE matches SET
           goals_for=$2, goals_against=$3, result=$4, phase=$5, round=$6,
           stadium_id=$7, status='played', is_friendly=false, is_walkover=false
         WHERE id=$1`,
        [matchId, g.gf, g.ga, result, g.phase, g.round, stadium?.id ?? null],
      );
    } else {
      const { rows: ins } = await client.query(
        `INSERT INTO matches (
           match_date, season, opponent_id, goals_for, goals_against,
           result, home_away, competition_id, phase, round,
           stadium_id, is_friendly, is_walkover, status
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,false,'played'
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
          g.round,
          stadium?.id ?? null,
        ],
      );
      matchId = ins[0].id;
    }

    matchIdsByKey.set(`${g.phase}|${g.round}|${g.opponent}`, matchId);

    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1 AND side='csa'`, [
      matchId,
    ]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1 AND side='csa'`, [matchId]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1 AND side='csa'`, [matchId]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [matchId]);

    const csaLineup = new Map();
    let sort = 0;

    for (const n of g.starters) {
      const p = await ensurePlayer(n);
      if (csaLineup.has(p.id)) continue;
      const shirt = g.shirts?.[n] ?? null;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',$4,NULL,$5) RETURNING id`,
        [matchId, p.id, p.name, shirt, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const n of g.entered ?? []) {
      const p = await ensurePlayer(n);
      if (csaLineup.has(p.id)) continue;
      const shirt = g.shirts?.[n] ?? null;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',$4,NULL,$5) RETURNING id`,
        [matchId, p.id, p.name, shirt, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    const outs = g.subbedOut ?? [];
    const ins = g.entered ?? [];
    const pairs = Math.min(outs.length, ins.length);
    for (let i = 0; i < pairs; i++) {
      const outP = await ensurePlayer(outs[i]);
      const inP = await ensurePlayer(ins[i]);
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,0,NULL)`,
        [
          matchId,
          csaLineup.get(outP.id) ?? null,
          outP.id,
          outP.name,
          csaLineup.get(inP.id) ?? null,
          inP.id,
          inP.name,
        ],
      );
    }

    for (const goal of g.goals ?? []) {
      const p = await ensurePlayer(goal.name);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
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

    const scorerNames = [];
    for (const goal of g.goals ?? []) {
      const p = await ensurePlayer(goal.name);
      scorerNames.push(p.name);
    }
    // collapse duplicates as "Cícero, Cícero" or "Cícero (2)"?
    const counts = new Map();
    for (const n of scorerNames) counts.set(n, (counts.get(n) ?? 0) + 1);
    const scorersText =
      [...counts.entries()]
        .map(([n, c]) => (c > 1 ? `${n} (${c})` : n))
        .join(", ") || null;

    await client.query(`UPDATE matches SET scorers=$2 WHERE id=$1`, [matchId, scorersText]);

    summary.push({
      id: matchId,
      date: g.date,
      phase: g.phase,
      round: g.round,
      opp: opp.name,
      score: `${g.gf}x${g.ga}`,
      stadium: stadium?.name ?? null,
      starters: g.starters.length,
      subs: pairs,
      goals: (g.goals ?? []).length,
    });
  }

  // Link legs
  const campIda = matchIdsByKey.get("1ª Fase|Ida|Campinense-PB");
  const campVolta = matchIdsByKey.get("1ª Fase|Volta|Campinense-PB");
  const bahiaIda = matchIdsByKey.get("2ª Fase|Ida|Bahia-BA");
  const bahiaVolta = matchIdsByKey.get("2ª Fase|Volta|Bahia-BA");
  if (campIda && campVolta) {
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [campIda, campVolta]);
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [campVolta, campIda]);
  }
  if (bahiaIda && bahiaVolta) {
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [bahiaIda, bahiaVolta]);
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
      bahiaVolta,
      bahiaIda,
    ]);
  }

  await syncPlayerAppsGoals(SEASON, [...new Set(Object.values(FORCE_ID))]);
  const stats = await refreshSeasonCompStats(SEASON, competitionId);

  await client.query("COMMIT");
  console.log("OK");
  console.log(
    "NOTE: Campinense desclassificado (Ronaldo irregular na ida) — CSA avançou; placares de campo mantidos.",
  );
  console.log("season_comp_stats", stats);
  console.table(summary);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
