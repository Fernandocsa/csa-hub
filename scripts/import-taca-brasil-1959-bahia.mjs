/**
 * Import Taça Brasil 1959 — CSA x Bahia-BA (1ª Fase ida/volta) + escalações CSA.
 * Placar da volta: Bahia 2x0 CSA (Fontes: Wikipedia / Bola n@ Área).
 * Valfredo → Bandeira #694; Mosa → Maso #1006.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const SEASON = "1959";
const COMPETITION_NAME = "Taça Brasil";
const COMPETITION_TYPE = "league";
const OPPONENT = "Bahia-BA";

const FORCE_ID = {
  calica: 726,
  "paulo santos": 1069,
  neu: 1042,
  neuu: 1042,
  nem: 1042,
  nazareno: 1035,
  deda: 775, // Alcidésio — meia; #774 José Soares é zagueiro só-1959
  italo: 903,
  nenem: 1039,
  milton: 1021,
  clovis: 526,
  juca: 946,
  santos: 1115, // José Cerqueira Santos (1959)
  valfredo: 694, // Bandeira
  bandeira: 694,
  mosa: 1006, // Maso
  maso: 1006,
  machado: 976,
};

const MATCHES = [
  {
    date: "1959-08-23",
    ha: "home",
    gf: 0,
    ga: 5,
    phase: "1ª Fase",
    round: "Ida",
    stadium: "Estádio do Mutange",
    stadiumCity: "Maceió",
    stadiumState: "AL",
    referee: "Cláudio Regis",
    starters: [
      "Caliça",
      "Paulo Santos",
      "Neu",
      "Nazareno",
      "Deda",
      "Italo",
      "Nenem",
      "Mílton",
      "Clóvis",
      "Juca",
      "Santos",
    ],
  },
  {
    date: "1959-08-30",
    ha: "away",
    gf: 0,
    ga: 2,
    phase: "1ª Fase",
    round: "Volta",
    stadium: "Estádio da Fonte Nova",
    stadiumCity: "Salvador",
    stadiumState: "BA",
    referee: "José Cavalcanti de Brito",
    starters: [
      "Valfredo",
      "Paulo Santos",
      "Neu",
      "Mosa",
      "Deda",
      "Italo",
      "Nenem",
      "Mílton",
      "Clóvis",
      "Juca",
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

async function ensureCompetition() {
  const { rows } = await client.query(`SELECT id, name FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (rows[0]) return { ...rows[0], created: false };
  const ins = await client.query(
    `INSERT INTO competitions (name, type) VALUES ($1,$2) RETURNING id, name`,
    [COMPETITION_NAME, COMPETITION_TYPE],
  );
  return { ...ins.rows[0], created: true };
}

async function ensureOpponent(name) {
  const { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const all = await client.query(`SELECT id, name FROM opponents`);
  const hit = all.rows.find((o) => norm(o.name) === norm(name));
  if (hit) return hit;
  throw new Error(`Opponent not found (no soft-create): ${name}`);
}

async function ensureStadium(name, city, state) {
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  // Never map historic Fonte Nova → Arena Fonte Nova
  if (norm(name).includes("fonte nova") && !norm(name).includes("arena")) {
    const historic = all.find(
      (s) => norm(s.name).includes("fonte nova") && !norm(s.name).includes("arena"),
    );
    if (historic) return historic;
  }
  if (norm(name).includes("mutange")) {
    const m = all.find((s) => norm(s.name).includes("mutange"));
    if (m) return m;
  }
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil')
     RETURNING id, name`,
    [name, city, state],
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
  const ins = await client.query(
    `INSERT INTO referees (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

const playerCache = new Map();

async function ensurePlayer(raw) {
  const key = norm(raw);
  if (playerCache.has(key)) return playerCache.get(key);
  const id = FORCE_ID[key];
  if (!id) throw new Error(`No FORCE_ID for "${raw}" (${key})`);
  const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [id]);
  if (!rows[0]) throw new Error(`Player id ${id} missing for "${raw}"`);
  playerCache.set(key, rows[0]);
  return rows[0];
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

try {
  await client.query("BEGIN");

  await client.query(`INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`, [
    Number(SEASON),
  ]);

  const comp = await ensureCompetition();
  const opp = await ensureOpponent(OPPONENT);
  console.log("competition", comp);
  console.log("opponent", opp);

  const created = [];
  const lineupSummary = [];

  for (const g of MATCHES) {
    const stadium = await ensureStadium(g.stadium, g.stadiumCity, g.stadiumState);
    const referee = await ensureReferee(g.referee);
    const result = resultOf(g.gf, g.ga);

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date=$1 AND season::text=$2 AND competition_id=$3
         AND opponent_id=$4 AND home_away=$5
       LIMIT 1`,
      [g.date, SEASON, comp.id, opp.id, g.ha],
    );

    let matchId;
    if (existing[0]) {
      matchId = existing[0].id;
      await client.query(
        `UPDATE matches SET
           goals_for=$2, goals_against=$3, result=$4, phase=$5, round=$6,
           stadium_id=$7, referee_id=$8, status='played', is_friendly=false
         WHERE id=$1`,
        [
          matchId,
          g.gf,
          g.ga,
          result,
          g.phase,
          g.round,
          stadium.id,
          referee?.id ?? null,
        ],
      );
      console.log("MATCH_UPDATED", matchId, g.date);
    } else {
      const { rows: ins } = await client.query(
        `INSERT INTO matches (
           match_date, season, opponent_id, goals_for, goals_against,
           result, home_away, competition_id, phase, round,
           stadium_id, referee_id, is_friendly, is_walkover, status
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,false,'played'
         ) RETURNING id`,
        [
          g.date,
          SEASON,
          opp.id,
          g.gf,
          g.ga,
          result,
          g.ha,
          comp.id,
          g.phase,
          g.round,
          stadium.id,
          referee?.id ?? null,
        ],
      );
      matchId = ins[0].id;
      created.push(matchId);
      console.log("MATCH_CREATED", matchId, g.date, g.ha, `${g.gf}x${g.ga}`);
    }

    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1 AND side='csa'`, [
      matchId,
    ]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1 AND side='csa'`, [matchId]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1 AND side='csa'`, [matchId]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [matchId]);

    let sort = 0;
    const names = [];
    for (const n of g.starters) {
      const p = await ensurePlayer(n);
      await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4)`,
        [matchId, p.id, p.name, sort++],
      );
      names.push(`${p.name}(#${p.id})`);
    }

    lineupSummary.push({ matchId, date: g.date, round: g.round, starters: names });
  }

  // Link ida ↔ volta
  if (lineupSummary.length === 2) {
    const [ida, volta] = lineupSummary;
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
      ida.matchId,
      volta.matchId,
    ]);
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
      volta.matchId,
      ida.matchId,
    ]);
  }

  // Rebuild 1959 apps for players involved from sheets only (these two matches + any others)
  const involvedIds = [...new Set(Object.values(FORCE_ID))];
  for (const pid of involvedIds) {
    const { rows: apps } = await client.query(
      `SELECT count(DISTINCT ml.match_id)::int AS n
       FROM match_lineups ml
       JOIN matches m ON m.id = ml.match_id
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
      [pid, SEASON],
    );
    const n = apps[0]?.n ?? 0;
    const { rows: cur } = await client.query(
      `SELECT id, appearances, goals FROM player_season_stats
       WHERE player_id=$1 AND season::text=$2`,
      [pid, SEASON],
    );
    if (cur[0]) {
      await client.query(
        `UPDATE player_season_stats SET appearances=$2 WHERE id=$1`,
        [cur[0].id, n],
      );
    } else if (n > 0) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,0,0)`,
        [pid, SEASON, n],
      );
    }
  }

  const stats = await refreshSeasonCompStats(SEASON, comp.id);

  await client.query("COMMIT");

  console.log("\nOK");
  console.log("created_match_ids", created);
  console.log("season_comp_stats", stats);
  for (const row of lineupSummary) {
    console.log(`\n${row.date} ${row.round} #${row.matchId}`);
    console.log(" ", row.starters.join(", "));
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
