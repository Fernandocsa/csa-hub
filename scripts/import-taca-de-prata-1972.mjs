/**
 * Import CSA — Taça de Prata 1972 (14 jogos; 1ª e 2ª fases).
 * Equivalente histórico da 2ª divisão (não usar "Série B" moderno).
 * - Só placar + mando + fase; sem inventar gols/escalação/estádio
 * - Oficial: J14 V5 E2 D7 GP17 GC19
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1972-taca-de-prata.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

function stateFromOpponent(name) {
  const m = String(name).match(/-([A-Z]{2})$/);
  return m ? m[1] : null;
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name = $1`, [name]);
  if (rows[0]) return { ...rows[0], created: false };
  ({ rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]));
  if (rows[0]) return { ...rows[0], created: false };
  // Exact name only — never soft-match Ferroviário/América across UFs
  const state = stateFromOpponent(name);
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1, $2, 'Brasil') RETURNING id, name`,
    [name, state],
  );
  console.log("OPPONENT_CREATED", ins.rows[0]);
  return { ...ins.rows[0], created: true };
}

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

if (GAMES.length !== 14) {
  console.error("Expected 14 games, got", GAMES.length);
  process.exit(1);
}

let w = 0,
  d = 0,
  l = 0,
  gf = 0,
  ga = 0;
for (const g of GAMES) {
  gf += g.gf;
  ga += g.ga;
  if (g.result === "win") w++;
  else if (g.result === "draw") d++;
  else l++;
}
if (w !== 5 || d !== 2 || l !== 7 || gf !== 17 || ga !== 19) {
  console.error(`Stats mismatch: V${w} E${d} D${l} GP${gf} GC${ga}`);
  process.exit(1);
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

  const inserted = [];
  const skipped = [];
  const createdOpponents = [];

  for (const g of GAMES) {
    const opp = await ensureOpponent(g.opponent);
    if (opp.created) createdOpponents.push(opp.name);

    const { rows: existing } = await client.query(
      `SELECT id, result FROM matches
       WHERE match_date=$1 AND season=$2 AND competition_id=$3
         AND opponent_id=$4 AND home_away=$5
       LIMIT 1`,
      [g.date, SEASON, competitionId, opp.id, g.ha],
    );
    if (existing[0]) {
      skipped.push({
        id: existing[0].id,
        date: g.date,
        opponent: opp.name,
        result: existing[0].result,
      });
      continue;
    }

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,NULL,NULL,NULL,NULL,NULL,
         false, false, 'played'
       ) RETURNING id`,
      [
        g.date,
        SEASON,
        opp.id,
        g.gf,
        g.ga,
        g.result,
        g.ha,
        competitionId,
        g.phase,
      ],
    );

    inserted.push({
      id: ins[0].id,
      date: g.date,
      opponent: opp.name,
      score: `${g.gf}x${g.ga}`,
      result: g.result,
      homeAway: g.ha,
      phase: g.phase,
    });
  }

  const stats = await refreshSeasonCompStats(SEASON, competitionId);
  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        ok: true,
        competition: COMPETITION_NAME,
        inserted: inserted.length,
        skipped: skipped.length,
        createdOpponents,
        seasonStats: stats,
        oficial: "J14 V5 E2 D7 GP17 GC19",
        matches: inserted,
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
