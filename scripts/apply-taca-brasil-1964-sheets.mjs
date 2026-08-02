/**
 * Taça Brasil 1964 — 1ª Fase CSA × Confiança (Ida, Volta, Mão 3).
 * Cria/atualiza os 3 jogos e aplica súmulas só do CSA (+ gols adversário por nome).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const SEASON = "1964";
const COMPETITION_NAME = "Taça Brasil";

const FORCE_ID = {
  batista: 696, // Goleiro
  flavio: 843,
  sinval: 1124,
  "roberto mendes": 1101,
  marinho: 997,
  bernardo: 707,
  "silvio mario": 1123,
  "tonho lima": 528,
  deda: 775,
  pinga: 1075,
  canhoteiro: 727,
  gerson: 871, // Goleiro
  rogerio: 1105,
  venancio: 1152,
  charuto: 747,
  jair: 909,
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
 *  bench?: string[];
 *  entered?: string[];
 *  subbedOut?: string[];
 *  goals?: Array<{ name: string; minute?: number|null }>;
 *  oppGoals?: Array<{ name: string; minute?: number|null }>;
 * }>} */
const SHEETS = [
  {
    date: "1964-07-26",
    ha: "away",
    gf: 0,
    ga: 4,
    phase: "1ª Fase",
    round: "Ida",
    opponent: "Confiança-SE",
    stadium: "Estádio Lourival Baptista",
    stadiumCity: "Aracaju",
    stadiumState: "SE",
    starters: [
      "Batista",
      "Flávio",
      "Sinval",
      "Roberto Mendes",
      "Marinho",
      "Bernardo",
      "Silvio Mário",
      "Tonho Lima",
      "Deda",
      "Pinga",
      "Canhoteiro",
    ],
    // Sofascore: 8 = saiu, 7 = entrou (minuto n/d)
    entered: ["Gerson", "Rogério"],
    subbedOut: ["Batista", "Sinval"],
    oppGoals: [
      { name: "Beto", minute: 18 },
      { name: "Sebastos", minute: 30 },
      { name: "Ruiter", minute: 85 },
      { name: "Ruiter", minute: 88 },
    ],
  },
  {
    date: "1964-08-02",
    ha: "home",
    gf: 1,
    ga: 0,
    phase: "1ª Fase",
    round: "Volta",
    opponent: "Confiança-SE",
    stadium: "Estádio do Mutange",
    starters: [
      "Gerson",
      "Venâncio",
      "Sinval",
      "Roberto Mendes",
      "Marinho",
      "Bernardo",
      "Charuto",
      "Silvio Mário",
      "Deda",
      "Jair",
      "Canhoteiro",
    ],
    goals: [{ name: "Canhoteiro", minute: 0 }],
  },
  {
    date: "1964-08-04",
    ha: "home",
    gf: 1,
    ga: 3,
    phase: "1ª Fase",
    round: "Mão 3",
    opponent: "Confiança-SE",
    stadium: "Estádio do Mutange",
    starters: [
      "Gerson",
      "Venâncio",
      "Sinval",
      "Roberto Mendes",
      "Marinho",
      "Charuto",
      "Silvio Mário",
      "Bernardo",
      "Deda",
      "Jair",
      "Canhoteiro",
    ],
    goals: [{ name: "Deda", minute: 77 }],
    oppGoals: [
      { name: "Ruiter", minute: 55 },
      { name: "Ruiter", minute: 60 },
      { name: "Ruiter", minute: 85 },
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
  if (norm(name).includes("lourival")) {
    const b = all.find(
      (s) =>
        norm(s.name).includes("lourival") &&
        (norm(s.name).includes("baptista") || norm(s.name).includes("batista")),
    );
    if (b) return b;
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
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [matchId]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [matchId]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [matchId]);

    const csaLineup = new Map();
    let sort = 0;

    for (const n of g.starters) {
      const p = await ensurePlayer(n);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [matchId, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const n of [...(g.bench ?? []), ...(g.entered ?? [])]) {
      const p = await ensurePlayer(n);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [matchId, p.id, p.name, sort++],
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
        [matchId, csaLineup.get(p.id) ?? null, p.id, p.name, goal.minute ?? 0],
      );
    }

    for (const goal of g.oppGoals ?? []) {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'opponent',NULL,NULL,$2,$3,NULL,false,false)`,
        [matchId, goal.name, goal.minute ?? 0],
      );
    }

    const counts = new Map();
    for (const goal of g.goals ?? []) {
      const p = await ensurePlayer(goal.name);
      counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
    }
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
      bench: (g.bench ?? []).length,
      goals: (g.goals ?? []).length,
      oppGoals: (g.oppGoals ?? []).length,
    });
  }

  const ida = matchIdsByKey.get("1ª Fase|Ida|Confiança-SE");
  const volta = matchIdsByKey.get("1ª Fase|Volta|Confiança-SE");
  const mao3 = matchIdsByKey.get("1ª Fase|Mão 3|Confiança-SE");
  if (ida && volta) {
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [ida, volta]);
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [volta, ida]);
  }
  // Mão 3 fica ligada à volta (desempate da série)
  if (volta && mao3) {
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [mao3, volta]);
  }

  await syncPlayerAppsGoals(SEASON, [...new Set(Object.values(FORCE_ID))]);
  const stats = await refreshSeasonCompStats(SEASON, competitionId);

  await client.query("COMMIT");
  console.table(summary);
  console.log("season_competition_stats", stats);
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
