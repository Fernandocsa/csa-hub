/**
 * Import Taça Brasil 1961 — CSA x Campinense-PB (1ª Fase ida/volta).
 * Sem escalações (vêm depois).
 *
 * Nota: 24 e 29/09/1961 Bahia 3-0 / 1-0 foram Campinense x Bahia (final do grupo),
 * não CSA — não importados aqui.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const SEASON = "1961";
const COMPETITION_NAME = "Taça Brasil";

const MATCHES = [
  {
    date: "1961-07-23",
    ha: "home",
    gf: 2,
    ga: 3,
    phase: "1ª Fase",
    round: "Ida",
    opponent: "Campinense-PB",
    stadium: "Estádio do Mutange",
  },
  {
    date: "1961-07-30",
    ha: "away",
    gf: 1,
    ga: 2,
    phase: "1ª Fase",
    round: "Volta",
    opponent: "Campinense-PB",
    stadium: null,
  },
];

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

async function ensureStadium(name) {
  if (!name) return null;
  const { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const n = name.toLowerCase();
  const hit = all.find((s) => s.name.toLowerCase() === n);
  if (hit) return hit;
  if (n.includes("mutange")) {
    const m = all.find((s) => s.name.toLowerCase().includes("mutange"));
    if (m) return m;
  }
  return null;
}

try {
  await client.query("BEGIN");

  await client.query(`INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`, [
    Number(SEASON),
  ]);

  const { rows: comps } = await client.query(`SELECT id, name FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Missing competition: ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  const created = [];
  const updated = [];
  const ids = [];

  for (const g of MATCHES) {
    const { rows: opps } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [
      g.opponent,
    ]);
    if (!opps[0]) throw new Error(`Missing opponent: ${g.opponent}`);
    const opp = opps[0];
    const stadium = await ensureStadium(g.stadium);
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
           stadium_id=$7, status='played', is_friendly=false
         WHERE id=$1`,
        [matchId, g.gf, g.ga, result, g.phase, g.round, stadium?.id ?? null],
      );
      updated.push(matchId);
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
      created.push(matchId);
    }
    ids.push({ matchId, date: g.date, round: g.round, ha: g.ha, score: `${g.gf}x${g.ga}`, opp: opp.name });
  }

  if (ids.length === 2) {
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
      ids[0].matchId,
      ids[1].matchId,
    ]);
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
      ids[1].matchId,
      ids[0].matchId,
    ]);
  }

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
    [SEASON, competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season::text=$1 AND competition_id=$2`,
    [SEASON, competitionId],
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
      [SEASON, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }

  await client.query("COMMIT");
  console.log("OK created", created, "updated", updated);
  console.log("stats", a);
  console.table(ids);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
