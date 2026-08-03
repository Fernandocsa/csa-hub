/**
 * Import Campeonato Alagoano 1954 (11 jogos CSA — fase Campeonato de Maceió).
 * CSA não campeão (Ferroviário título capital + estadual).
 * Sem técnico. Oficial: J11 V5 E2 D4 GP20 GC17.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1954-alagoano.mjs";

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
  italo: "Ítalo",
  ítalo: "Ítalo",
  "silvio pirilo": "Sílvio Pirilo",
  "sílvio pirilo": "Sílvio Pirilo",
  silo: "Siló",
  siló: "Siló",
  silô: "Siló",
  cao: "Cão",
  cão: "Cão",
  cece: "Cecé",
  cecé: "Cecé",
  zanelio: "Zanélio",
  zanélio: "Zanélio",
  napoleao: "Napoleão",
  napoleão: "Napoleão",
  eugenio: "Eugênio",
  eugênio: "Eugênio",
  oscar: "Oscarzinho",
  oscarzinho: "Oscarzinho",
  "valdemiro breda": "Waldomiro Breda",
  "waldomiro breda": "Waldomiro Breda",
  "waldemiro breda": "Waldomiro Breda",
  "claudio regis": "Cláudio Régis",
  "cláudio régis": "Cláudio Régis",
  "cláudio regis": "Cláudio Régis",
  cortez: "Batista Cortez",
  "batista cortez": "Batista Cortez",
  "rosalvo peixoto": "Rosalvo Peixoto",
  "rosalvo peixoto duda": "Rosalvo Peixoto",
  "adalberto silva": "Adalberto Silva",
  "louvain aires": "Louvain Aires",
  "luiz medeiros": "Luiz Medeiros",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  italo: 903,
  ítalo: 903,
  neu: 1042,
  piolho: 1076,
  oscarzinho: 2213,
  davino: 2214,
  eugenio: 2216,
  eugênio: 2216,
  gedir: 2210,
  nivaldo: 2204, // zagueiro era 1959
};

/** Display name in sheets when DB name differs. */
const DISPLAY_NAME = {
  903: "Ítalo",
  2213: "Oscarzinho",
};

const CREATE_META = {
  "silvio pirilo": { name: "Sílvio Pirilo", position: "Goleiro", forceCreate: true },
  "sílvio pirilo": { name: "Sílvio Pirilo", position: "Goleiro", forceCreate: true },
  arestides: { name: "Arestides", position: "Zagueiro", forceCreate: true },
  zanelio: { name: "Zanélio", position: "Zagueiro", forceCreate: true },
  zanélio: { name: "Zanélio", position: "Zagueiro", forceCreate: true },
  napoleao: { name: "Napoleão", position: "Meia", forceCreate: true },
  napoleão: { name: "Napoleão", position: "Meia", forceCreate: true },
  // Valfredo #1145 é b1946 — outro atleta
  valfredo: { name: "Valfredo", position: "Atacante", forceCreate: true },
  edgar: { name: "Edgar", position: "Atacante", forceCreate: true },
  silo: { name: "Siló", position: "Atacante", forceCreate: true },
  siló: { name: "Siló", position: "Atacante", forceCreate: true },
  // Cao #730 é goleiro b1945 — Cão aqui é atacante
  cao: { name: "Cão", position: "Atacante", forceCreate: true },
  cão: { name: "Cão", position: "Atacante", forceCreate: true },
  sued: { name: "Sued", position: "Atacante", forceCreate: true },
  nildo: { name: "Nildo", position: "Zagueiro", forceCreate: true },
  cece: { name: "Cecé", position: "Atacante", forceCreate: true },
  cecé: { name: "Cecé", position: "Atacante", forceCreate: true },
  // Walfrido #621 é b1994
  walfrido: { name: "Walfrido", position: "Atacante", forceCreate: true },
  // Zagueiro 1954 — não reutilizar Paulo atacante #2212 / Paulo Santos
  paulo: { name: "Paulo", position: "Zagueiro", forceCreate: true },
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
    const sheetName =
      key === "deda i" ? "Deda I" : key === "deda ii" ? "Deda II" : null;
    const mapped = {
      id: rows[0].id,
      name: sheetName ?? DISPLAY_NAME[rows[0].id] ?? rows[0].name,
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
      [meta?.name ?? name, meta?.position ?? null],
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
    mutange: (s) => norm(s.name).includes("mutange"),
    pajucara: (s) => norm(s.name).includes("pajucara"),
    capela: (s) => norm(s.name).includes("capela"),
    "edson amaro": (s) =>
      norm(s.name).includes("edson amaro") || norm(s.name).includes("édson amaro"),
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
  const canon = canonName(name);
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [canon]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(canon));
  if (hit) return hit;
  if (norm(canon).includes("louvain") || norm(canon).includes("aires")) {
    const l = all.find(
      (r) => norm(r.name).includes("louvain") || norm(r.name) === "louvain aires",
    );
    if (l) return l;
  }
  if (norm(canon).includes("sarmento")) {
    const s = all.find((r) => norm(r.name).includes("sarmento"));
    if (s) return s;
  }
  if (norm(canon).includes("ferrapeira") || norm(canon).includes("farrapeira")) {
    const f = all.find(
      (r) =>
        norm(r.name).includes("ferrapeira") || norm(r.name).includes("farrapeira"),
    );
    if (f) return f;
  }
  if (norm(canon).includes("santa rit")) {
    const s = all.find((r) => norm(r.name).includes("santa rit"));
    if (s) return s;
  }
  if (norm(canon).includes("walfrido") || norm(canon).includes("valfrido")) {
    const w = all.find(
      (r) => norm(r.name).includes("walfrido") || norm(r.name).includes("valfrido"),
    );
    if (w) return w;
  }
  if (norm(canon).includes("breda")) {
    const b = all.find((r) => norm(r.name).includes("breda"));
    if (b) return b;
  }
  if (norm(canon).includes("peixoto") && norm(canon).includes("rosalvo")) {
    const p = all.find(
      (r) => norm(r.name).includes("rosalvo") && norm(r.name).includes("peixoto"),
    );
    if (p) return p;
  }
  if (norm(canon).includes("adalberto")) {
    const a = all.find((r) => norm(r.name).includes("adalberto"));
    if (a) return a;
  }
  if (norm(canon).includes("glenio")) {
    const g = all.find((r) => norm(r.name).includes("glenio"));
    if (g) return g;
  }
  if (norm(canon).includes("louraber")) {
    const l = all.find((r) => norm(r.name).includes("louraber"));
    if (l) return l;
  }
  if (norm(canon).includes("osman")) {
    const o = all.find((r) => norm(r.name).includes("osman"));
    if (o) return o;
  }
  if (norm(canon).includes("bernardes torres")) {
    const b = all.find((r) => norm(r.name).includes("bernardes"));
    if (b) return b;
  }
  if (norm(canon).includes("claudio regis") || norm(canon).includes("cláudio régis")) {
    const c = all.find((r) => norm(r.name).includes("claudio regis") || norm(r.name).includes("regis"));
    if (c && norm(c.name).includes("regis")) return c;
  }
  if (norm(canon).includes("correia lima")) {
    const m = all.find((r) => norm(r.name).includes("correia lima"));
    if (m) return m;
  }
  if (norm(canon).includes("olten")) {
    const o = all.find((r) => norm(r.name).includes("olten"));
    if (o) return o;
  }
  if (norm(canon).includes("santa rit")) {
    const s = all.find((r) => norm(r.name).includes("santa rit"));
    if (s) return s;
  }
  if (norm(canon).includes("zacarias")) {
    const z = all.find((r) => norm(r.name).includes("zacarias"));
    if (z) return z;
  }
  if (norm(canon).includes("batista cortez")) {
    const b = all.find((r) => norm(r.name).includes("batista cortez"));
    if (b) return b;
  }
  if (norm(canon).includes("rufino")) {
    const r = all.find(
      (x) =>
        norm(x.name) === "sebastiao rufino pe" ||
        norm(x.name).includes("sebastiao rufino"),
    );
    if (r) return r;
  }
  if (norm(canon).includes("nilson")) {
    const n = all.find(
      (r) =>
        norm(r.name) === "nilson silva" ||
        norm(r.name).includes("nilson ferreira") ||
        (norm(r.name).includes("nilson") && norm(r.name).includes("silva")),
    );
    if (n) return n;
  }
  if (norm(canon).includes("edson")) {
    const e = all.find(
      (r) =>
        norm(r.name).includes("edson tavares") ||
        norm(r.name) === "edson matos" ||
        norm(r.name).includes("edson matos"),
    );
    if (e) return e;
  }
  if (norm(name).includes("wilson carlos") || norm(name).includes("wilson")) {
    const w = all.find(
      (r) =>
        norm(r.name).includes("wilson carlos") ||
        (norm(r.name).includes("wilson") && norm(r.name).includes("santos")),
    );
    if (w) return w;
  }
  const soft = all.find((r) => norm(r.name).includes(norm(canon)));
  if (soft) return soft;
  const state =
    /\b(RJ|PE|FIFA)\b/i.test(canon) || /wright|begralda|wilson|gilson|ara[uú]jo/i.test(canon)
      ? canon.match(/\b(RJ|PE)\b/i)?.[1]?.toUpperCase() ?? "AL"
      : "AL";
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,$2) RETURNING id, name`,
    [canon, state],
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
  if (norm(canon) === "eduardo montenegro" || norm(canon).includes("eduardo montenegro")) {
    const v = all.find((m) => norm(m.name) === "eduardo montenegro");
    if (v) return v;
  }
  if (norm(canon).includes("ivon cordeiro")) {
    const v = all.find((m) => norm(m.name).includes("ivon cordeiro"));
    if (v) return v;
  }
  if (norm(canon).includes("pinguela")) {
    const v = all.find((m) => norm(m.name).includes("pinguela"));
    if (v) return v;
  }
  if (norm(canon).includes("wassil")) {
    const v = all.find((m) => norm(m.name).includes("wassil"));
    if (v) return v;
  }
  if (norm(canon).includes("helio miranda")) {
    const v = all.find((m) => norm(m.name).includes("helio miranda"));
    if (v) return v;
  }
  if (norm(canon).includes("roberto mendes")) {
    const v = all.find((m) => norm(m.name) === "roberto mendes");
    if (v) return v;
  }
  if (norm(canon).includes("maglione")) {
    const v = all.find((m) => norm(m.name).includes("maglione"));
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
  if (g.unknownResult || g.gf == null || g.ga == null) return "unknown";
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
         $18,false,'played'
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
        g.phase ?? null,
        stadium?.id ?? null,
        referee?.id ?? null,
        manager?.id ?? null,
        g.attendance ?? null,
        null,
        g.revenueText ?? null,
        scorers,
        ownGoalsFor,
        !!g.walkover,
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

    if (g.reds?.length) {
      for (const n of g.reds) {
        const p = await ensurePlayer(n);
        await client.query(
          `INSERT INTO match_cards
             (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
           VALUES ($1,'csa','red',$2,$3,$4,0,NULL)`,
          [matchId, csaLineup.get(p.id) ?? null, p.id, p.name],
        );
      }
    }

    inserted.push({
      id: matchId,
      date: g.date,
      opp: opp.name,
      score: g.unknownResult ? "?" : `${g.gf}x${g.ga}`,
      result,
      ha: g.ha,
      excluded: !!g.excludeFromStats,
    });
  }

  const seasonStats = await refreshSeasonCompStats(SEASON, competitionId);
  const rosterN = await syncRosterFromSheets(SEASON);

  await client.query(
    `UPDATE season_competition_stats
     SET classification=NULL, is_champion=false, stats_recalculated_at=now()
     WHERE season::text=$1 AND competition_id=$2`,
    [String(SEASON), competitionId],
  );

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

  console.log("inserted", inserted.length);
  console.log("skipped", skipped.length);
  console.log("createdPlayers", createdPlayers);
  console.log("seasonStats (Alagoano)", seasonStats);
  console.log("rosterPlayers", rosterN);
  console.log("oficial esperado: J11 V5 E2 D4 GP20 GC17 (não campeão)");
  console.log("OK Alagoano 1954");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
