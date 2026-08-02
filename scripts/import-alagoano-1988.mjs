/**
 * Import Campeonato Alagoano 1988 (48 jogos) — fonte enxuta.
 * - Sem estádio/árbitro/público/escalação/técnico
 * - C/F/N → home/away/neutral; phase/round da estrutura do campeonato
 * - Gols do CSA quando nomes foram informados (+ match_goals / roster)
 * - Oficial: J48 V22 E11 D15 GP67 GC49; CSA campeão
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1988-alagoano.mjs";

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
  "ze pedro": "Zé Pedro",
  "zé pedro": "Zé Pedro",
  cafe: "Café",
  café: "Café",
  "carlinhos paulista": "Carlinhos Paulista",
  "carlos silva": "Carlos Silva",
  "paulo marcos": "Paulo Marcos",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  chico: 551,
  "ze pedro": 1182,
  "zé pedro": 1182,
  maurinho: 1011,
  jairo: 911,
  borges: 717,
  ricardo: 1676,
  ivan: 541,
  zezinho: 536,
  "carlos silva": 1671,
  cafe: 547,
  café: 547,
  "carlinhos paulista": 1682,
  "paulo marcos": 1066,
};

const CREATE_META = {
  naldo: { position: "Atacante", forceCreate: true },
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

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(
    `SELECT id, name FROM opponents WHERE lower(name)=lower($1)`,
    [name],
  ));
  if (rows[0]) return rows[0];
  const soft = await client.query(`SELECT id, name FROM opponents`);
  const hit = soft.rows.find((o) => norm(o.name) === norm(name));
  if (hit) return hit;
  const state = name.match(/-([A-Z]{2})$/)?.[1] ?? "AL";
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1,$2,'Brasil') RETURNING id, name`,
    [name, state],
  );
  console.log("OPPONENT_CREATED", ins.rows[0]);
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

async function syncGoalsRoster(season) {
  const { rows: stats } = await client.query(
    `
    SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
    FROM match_goals mg
    JOIN matches m ON m.id=mg.match_id
    WHERE m.season=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
      AND coalesce(mg.is_own_goal,false)=false
    GROUP BY mg.scorer_player_id
    `,
    [season],
  );
  for (const s of stats) {
    const ex = await client.query(
      `SELECT id, appearances FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [s.player_id, season],
    );
    if (ex.rows[0]) {
      await client.query(`UPDATE player_season_stats SET goals=$1 WHERE id=$2`, [
        s.goals,
        ex.rows[0].id,
      ]);
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id,season,appearances,goals,assists)
         VALUES ($1,$2,0,$3,0)`,
        [s.player_id, season, s.goals],
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

    const result = resultOf(g.gf, g.ga);
    const scorers =
      g.goals?.length ? g.goals.map((x) => canonName(x.name)).join(", ") : null;

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL,NULL,NULL,NULL,$11,
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
        g.phase ?? null,
        g.round ?? null,
        scorers,
      ],
    );
    const matchId = ins[0].id;

    if (g.goals?.length) {
      for (const goal of g.goals) {
        const p = await ensurePlayer(goal.name);
        await client.query(
          `INSERT INTO match_goals
             (match_id,side,scorer_lineup_id,scorer_player_id,scorer_name,
              minute,injury_time_minute,is_penalty,is_own_goal)
           VALUES ($1,'csa',NULL,$2,$3,0,NULL,false,false)`,
          [matchId, p.id, p.name],
        );
      }
    }

    inserted.push({
      id: matchId,
      sheetId: g.sheetId,
      date: g.date,
      opp: opp.name,
      score: `${g.gf}x${g.ga}`,
      ha: g.ha,
    });
  }

  const seasonStats = await refreshSeasonCompStats(SEASON, competitionId);
  const rosterN = await syncGoalsRoster(SEASON);

  await client.query("COMMIT");

  console.log("inserted", inserted.length);
  console.log("skipped", skipped.length);
  console.log("createdPlayers", createdPlayers);
  console.log("seasonStats", seasonStats);
  console.log("goalScorersTracked", rosterN);
  console.log("fonte: J48 V22 E11 D15 | C/F/N→home/away/neutral | gols parciais");
  console.log("OK Alagoano 1988");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
