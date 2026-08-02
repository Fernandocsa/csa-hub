/**
 * Create CSA away win vs Uberlândia-MG — Taça de Prata 1980,
 * 3ª Fase - Grupo C, 3ª rodada (1980-04-16).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Taça de Prata";
const SEASON = "1980";
const GAME = {
  date: "1980-04-16",
  opponent: "Uberlândia-MG",
  gf: 1,
  ga: 0,
  ha: "away",
  result: "win",
  phase: "3ª Fase - Grupo C",
  round: "3ª rodada",
  stadiumId: 32, // Estádio Parque do Sabiá
};

async function refreshSeasonCompStats(season, competitionId) {
  const { rows: agg } = await client.query(
    `SELECT
       count(*)::int AS games,
       coalesce(sum(case when result = 'win' then 1 else 0 end), 0)::int AS wins,
       coalesce(sum(case when result = 'draw' then 1 else 0 end), 0)::int AS draws,
       coalesce(sum(case when result = 'loss' then 1 else 0 end), 0)::int AS losses,
       coalesce(sum(goals_for), 0)::int AS goals_for,
       coalesce(sum(goals_against), 0)::int AS goals_against
     FROM matches
     WHERE season = $1
       AND competition_id = $2
       AND coalesce(is_friendly, false) = false
       AND coalesce(status, 'played') <> 'scheduled'
       AND result IN ('win', 'draw', 'loss')`,
    [season, competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season = $1 AND competition_id = $2`,
    [season, competitionId],
  );
  if (scs[0]) {
    await client.query(
      `UPDATE season_competition_stats
       SET games=$1, wins=$2, draws=$3, losses=$4, goals_for=$5, goals_against=$6,
           stats_source='calculated', stats_recalculated_at=now()
       WHERE id=$7`,
      [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, scs[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO season_competition_stats
         (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
          stats_source, stats_recalculated_at)
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

  const { rows: comps } = await client.query(`SELECT id, name FROM competitions WHERE name = $1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Competition not found: ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  const { rows: opps } = await client.query(`SELECT id, name FROM opponents WHERE name = $1`, [
    GAME.opponent,
  ]);
  if (!opps[0]) throw new Error(`Opponent not found: ${GAME.opponent}`);
  const opponentId = opps[0].id;

  const { rows: existing } = await client.query(
    `SELECT id FROM matches
     WHERE match_date=$1 AND season=$2 AND competition_id=$3
       AND opponent_id=$4 AND home_away=$5
     LIMIT 1`,
    [GAME.date, SEASON, competitionId, opponentId, GAME.ha],
  );
  if (existing[0]) {
    await client.query("ROLLBACK");
    console.log(JSON.stringify({ ok: true, skipped: true, id: existing[0].id }, null, 2));
    process.exit(0);
  }

  const { rows: ins } = await client.query(
    `INSERT INTO matches (
       match_date, season, opponent_id, goals_for, goals_against,
       result, home_away, competition_id, phase, round,
       stadium_id, referee_id, manager_id, attendance, scorers,
       is_walkover, is_friendly, status
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL,NULL,NULL,NULL,
       false, false, 'played'
     ) RETURNING id, match_date, goals_for, goals_against, result, home_away, phase, round`,
    [
      GAME.date,
      SEASON,
      opponentId,
      GAME.gf,
      GAME.ga,
      GAME.result,
      GAME.ha,
      competitionId,
      GAME.phase,
      GAME.round,
      GAME.stadiumId,
    ],
  );

  const stats = await refreshSeasonCompStats(SEASON, competitionId);
  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        match: {
          ...ins[0],
          opponent: GAME.opponent,
          competition: COMPETITION_NAME,
          score: `${GAME.gf}x${GAME.ga}`,
        },
        seasonStats: stats,
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
