/**
 * Import CSA Taça de Ouro 1977–1979 + Taça de Prata 1980.
 * - Série A histórica → Taça de Ouro; Série B 1980 → Taça de Prata
 * - Sergipe 1978: data 23/04 (não 20/04)
 * - Partidas já existentes (ex.: Uberlândia/Londrina 1980): enriquece súmula se vazia
 *
 * Run: node scripts/import-taca-brasileiro-1977-1980.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  COMPETITION_NAME as C77,
  SEASON as S77,
  GAMES as G77,
} from "./data/season-1977-taca-de-ouro.mjs";
import {
  COMPETITION_NAME as C78,
  SEASON as S78,
  GAMES as G78,
} from "./data/season-1978-taca-de-ouro.mjs";
import {
  COMPETITION_NAME as C79,
  SEASON as S79,
  GAMES as G79,
} from "./data/season-1979-taca-de-ouro.mjs";
import {
  COMPETITION_NAME as C80,
  SEASON as S80,
  GAMES as G80,
} from "./data/season-1980-taca-de-prata.mjs";

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
  enio: "Ênio",
  ênio: "Ênio",
  elcio: "Élcio",
  élcio: "Élcio",
  helio: "Hélio",
  hélio: "Hélio",
  ailton: "Aílton",
  aílton: "Aílton",
  "ze luiz": "Zé Luiz",
  "zé luiz": "Zé Luiz",
  "ze luis": "Zé Luiz",
  "zé luis": "Zé Luiz",
  "jorge luis": "Jorge Luis",
  "jorge luiz": "Jorge Luis",
  "alberto carioca": "Alberto Carioca",
  "alberto leguele": "Alberto Leguelé",
  "alberto leguelé": "Alberto Leguelé",
  "ronaldo alves": "Ronaldo Alves",
  "jorge siri": "Jorge Siri",
  "jorge bonga": "Jorge Bonga",
  "ze roberto": "Zé Roberto",
  "zé roberto": "Zé Roberto",
  "laerte doria": "Laerte Dória",
  "laerte dória": "Laerte Dória",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  // Scorers / roster of the era (align with Alagoano imports)
  enio: 494, // Ênio Oliveira
  ênio: 494,
  gilmar: 876,
  helio: 531,
  hélio: 531,
  elcio: 1757,
  élcio: 1757,
  almir: 668,
  ailton: 659,
  aílton: 659,
  "jorge siri": 931,
  "jorge bonga": 926,
  reinaldo: 1089,
  reginaldo: 1087,
  alberto: 660,
  odilon: 1046,
  betinho: 709,
  dentinho: 778,
  peu: 498,
  "alberto carioca": 1735,
  "alberto leguele": 661,
  "alberto leguelé": 661,
  joca: 1734,
  jorginho: 1774,
  rogerio: 1736,
  rogério: 1736,
  "ze luiz": 1689,
  "zé luiz": 1689,
  "ze roberto": 1185,
  "zé roberto": 1185,
  "ronaldo alves": 1110,
  dick: 781,
  beto: 712,
  luisinho: 970,
  luizinho: 970,
};

const CREATE_META = {
  "jorge luis": { position: "Meia", forceCreate: true },
  paulinho: { position: "Zagueiro", forceCreate: true },
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
    if (!rows[0]) throw new Error(`FORCE_ID missing ${name} (#${FORCE_ID[key]})`);
    const mapped = { id: rows[0].id, name: rows[0].name };
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
  const mapped = { id: rows[0].id, name: rows[0].name };
  playerCache.set(key, mapped);
  return mapped;
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]));
  if (rows[0]) return rows[0];
  const state = name.match(/-([A-Z]{2})$/)?.[1] ?? "BR";
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
    pacaembu: (s) => norm(s.name).includes("pacaembu"),
    amigao: (s) => norm(s.name).includes("amigao"),
    "ilha do retiro": (s) => norm(s.name).includes("ilha do retiro"),
    maracana: (s) => norm(s.name).includes("maracana"),
    "sao januario": (s) => norm(s.name).includes("januario"),
    raulino: (s) => norm(s.name).includes("raulino"),
    "brinco de ouro": (s) => norm(s.name).includes("brinco de ouro"),
    "fonte nova": (s) => norm(s.name).includes("fonte nova"),
    "presidente vargas": (s) => norm(s.name).includes("presidente vargas"),
    cafe: (s) => norm(s.name).includes("cafe") && !norm(s.name).includes("fonte"),
    sabia: (s) => norm(s.name).includes("sabia"),
  };
  for (const [k, fn] of Object.entries(aliases)) {
    if (norm(name).includes(k)) {
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
  if (norm(canon).includes("laerte")) {
    const v = all.find((m) => norm(m.name).includes("laerte"));
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

async function applySheet(matchId, g) {
  const { rows: existingGoals } = await client.query(
    `SELECT count(*)::int AS n FROM match_goals WHERE match_id=$1`,
    [matchId],
  );
  const { rows: existingLineups } = await client.query(
    `SELECT count(*)::int AS n FROM match_lineups WHERE match_id=$1`,
    [matchId],
  );

  const csaLineup = new Map();
  let sort = 0;

  if (g.starters?.length && existingLineups[0].n === 0) {
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
  } else if (existingLineups[0].n > 0) {
    const { rows: lus } = await client.query(
      `SELECT id, player_id FROM match_lineups WHERE match_id=$1 AND side='csa'`,
      [matchId],
    );
    for (const lu of lus) if (lu.player_id) csaLineup.set(lu.player_id, lu.id);
  }

  if (g.goals?.length && existingGoals[0].n === 0) {
    for (const goal of g.goals) {
      const p = await ensurePlayer(goal.name);
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

  const scorers =
    g.goals?.map((x) => canonName(x.name)).join(", ") ?? null;
  const stadium = await ensureStadium(g.stadium ?? null);
  const manager = await ensureManager(g.manager ?? null);

  await client.query(
    `UPDATE matches SET
       stadium_id = coalesce(stadium_id, $2),
       manager_id = coalesce(manager_id, $3),
       scorers = coalesce(scorers, $4),
       phase = coalesce(phase, $5)
     WHERE id=$1`,
    [matchId, stadium?.id ?? null, manager?.id ?? null, scorers, g.phase],
  );
}

async function importSeason({ competitionName, season, games, expected }) {
  await client.query(`INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`, [
    Number(season),
  ]);

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    competitionName,
  ]);
  if (!comps[0]) throw new Error(`Competition missing: ${competitionName}`);
  const competitionId = comps[0].id;

  let w = 0,
    d = 0,
    l = 0,
    gf = 0,
    ga = 0;
  for (const g of games) {
    gf += g.gf;
    ga += g.ga;
    const r = resultOf(g);
    if (r === "win") w++;
    else if (r === "draw") d++;
    else l++;
  }
  if (
    expected &&
    (games.length !== expected.j ||
      w !== expected.v ||
      d !== expected.e ||
      l !== expected.d ||
      gf !== expected.gp ||
      ga !== expected.gc)
  ) {
    throw new Error(
      `${season} ${competitionName}: got J${games.length} V${w} E${d} D${l} GP${gf} GC${ga}, expected J${expected.j} V${expected.v} E${expected.e} D${expected.d} GP${expected.gp} GC${expected.gc}`,
    );
  }

  const inserted = [];
  const enriched = [];
  const skipped = [];

  for (const g of games) {
    const opp = await ensureOpponent(g.opponent);
    const result = resultOf(g);
    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date=$1 AND season=$2 AND competition_id=$3
         AND opponent_id=$4 AND home_away=$5
       LIMIT 1`,
      [g.date, season, competitionId, opp.id, g.ha],
    );

    if (existing[0]) {
      const matchId = existing[0].id;
      const hadSheet = g.goals?.length || g.starters?.length || g.manager || g.stadium;
      if (hadSheet) {
        await applySheet(matchId, g);
        enriched.push({ id: matchId, date: g.date, opp: opp.name });
      } else {
        skipped.push({ id: matchId, date: g.date, opp: opp.name });
      }
      continue;
    }

    const stadium = await ensureStadium(g.stadium ?? null);
    const manager = await ensureManager(g.manager ?? null);
    const scorers = g.goals?.map((x) => canonName(x.name)).join(", ") ?? null;

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,NULL,$11,NULL,$12,
         false,false,'played'
       ) RETURNING id`,
      [
        g.date,
        season,
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
      ],
    );
    const matchId = ins[0].id;
    await applySheet(matchId, g);
    inserted.push({
      id: matchId,
      date: g.date,
      opp: opp.name,
      score: `${g.gf}x${g.ga}`,
      result,
    });
  }

  const seasonStats = await refreshSeasonCompStats(season, competitionId);
  return { competitionName, season, inserted, enriched, skipped, seasonStats };
}

const SEASONS = [
  { competitionName: C77, season: S77, games: G77, expected: { j: 13, v: 3, e: 4, d: 6, gp: 12, gc: 16 } },
  { competitionName: C78, season: S78, games: G78, expected: { j: 16, v: 5, e: 4, d: 7, gp: 18, gc: 24 } },
  { competitionName: C79, season: S79, games: G79, expected: { j: 16, v: 8, e: 3, d: 5, gp: 19, gc: 14 } },
  { competitionName: C80, season: S80, games: G80, expected: { j: 15, v: 9, e: 3, d: 3, gp: 21, gc: 15 } },
];

try {
  await client.query("BEGIN");
  const reports = [];
  for (const s of SEASONS) {
    reports.push(await importSeason(s));
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ ok: true, createdPlayers, reports }, null, 2));
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
