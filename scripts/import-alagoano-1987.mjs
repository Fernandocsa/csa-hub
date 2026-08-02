/**
 * Import Campeonato Alagoano 1987 — 32 jogos listados (fonte incompleta).
 * Sem inventar estádio/árbitro/gols/público/técnico.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1987-alagoano.mjs";

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
    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,NULL,NULL,NULL,NULL,NULL,
         $10,false,'played'
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
        !!g.walkover,
      ],
    );
    inserted.push({
      id: ins[0].id,
      date: g.date,
      opp: opp.name,
      score: g.walkover ? `WO ${g.gf}x${g.ga}` : `${g.gf}x${g.ga}`,
      ha: g.ha,
      phase: g.phase,
    });
  }

  const seasonStats = await refreshSeasonCompStats(SEASON, competitionId);

  await client.query("COMMIT");

  console.log("inserted", inserted.length);
  console.log("skipped", skipped.length);
  console.log("seasonStats", seasonStats);
  console.log(
    "nota: fonte incompleta — classificação cita +1 jogo na 1ª fase do 1º turno e +1 no hexagonal",
  );
  console.log("OK Alagoano 1987");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
