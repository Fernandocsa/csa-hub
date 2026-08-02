/**
 * Import CSA matches — Campeonato Alagoano 1936 (edition season = 1936).
 * Reuses Associação Militar-AL for "Militar-AL". No W.O. No invented fields.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Campeonato Alagoano";
const SEASON = "1936";

/** @type {{ date: string; opponent: string; goalsFor: number; goalsAgainst: number; homeAway: "home"|"away"; result: "win"|"draw"|"loss" }[]} */
const MATCHES = [
  { date: "1936-06-14", opponent: "Associação Militar-AL", goalsFor: 6, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1936-07-05", opponent: "Barroso-AL", goalsFor: 4, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1936-07-19", opponent: "Nordeste-AL", goalsFor: 4, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1936-08-02", opponent: "CRB-AL", goalsFor: 1, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1936-09-20", opponent: "Vasco da Gama-AL", goalsFor: 2, goalsAgainst: 3, homeAway: "away", result: "loss" },
  { date: "1936-10-11", opponent: "Uruguai-AL", goalsFor: 5, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1936-11-22", opponent: "Barroso-AL", goalsFor: 4, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1936-12-06", opponent: "Nordeste-AL", goalsFor: 1, goalsAgainst: 4, homeAway: "away", result: "loss" },
  { date: "1937-03-28", opponent: "Vasco da Gama-AL", goalsFor: 3, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1937-04-11", opponent: "Uruguai-AL", goalsFor: 4, goalsAgainst: 1, homeAway: "home", result: "win" },
];

async function ensureOpponent(name) {
  const { rows } = await client.query(
    `SELECT id, name FROM opponents WHERE lower(name) = lower($1)`,
    [name],
  );
  if (rows[0]) return { id: rows[0].id, name: rows[0].name, created: false };
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1, 'AL', 'Brasil') RETURNING id, name`,
    [name],
  );
  return { id: ins.rows[0].id, name: ins.rows[0].name, created: true };
}

try {
  await client.query("BEGIN");

  await client.query(
    `INSERT INTO seasons (year) VALUES (1936) ON CONFLICT (year) DO NOTHING`,
  );

  const { rows: comps } = await client.query(
    `SELECT id, name FROM competitions WHERE name = $1`,
    [COMPETITION_NAME],
  );
  if (!comps[0]) throw new Error(`Competition "${COMPETITION_NAME}" not found`);
  const competitionId = comps[0].id;

  const opponentCache = new Map();
  const createdOpponents = [];
  const inserted = [];
  const skipped = [];

  for (const m of MATCHES) {
    if (!opponentCache.has(m.opponent)) {
      const opp = await ensureOpponent(m.opponent);
      opponentCache.set(m.opponent, opp);
      if (opp.created) createdOpponents.push(opp.name);
    }
    const opp = opponentCache.get(m.opponent);

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date = $1
         AND season = $2
         AND competition_id = $3
         AND opponent_id = $4
         AND home_away = $5
       LIMIT 1`,
      [m.date, SEASON, competitionId, opp.id, m.homeAway],
    );

    if (existing[0]) {
      skipped.push({ date: m.date, opponent: opp.name, id: existing[0].id });
      continue;
    }

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id,
         is_walkover, is_friendly, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, 'played')
       RETURNING id`,
      [
        m.date,
        SEASON,
        opp.id,
        m.goalsFor,
        m.goalsAgainst,
        m.result,
        m.homeAway,
        competitionId,
      ],
    );
    inserted.push({
      id: ins[0].id,
      date: m.date,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
    });
  }

  // Aggregate from matches and update season_competition_stats
  // (row may be stats_source=manual from titles seed — still refresh J/V/E/D/GP/GC)
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
       AND coalesce(is_walkover, false) = false
       AND coalesce(status, 'played') = 'played'
       AND result IN ('win', 'draw', 'loss')`,
    [SEASON, competitionId],
  );
  const a = agg[0];

  const { rows: scs } = await client.query(
    `SELECT id, classification, stats_source
     FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [SEASON, competitionId],
  );

  if (scs[0]) {
    await client.query(
      `UPDATE season_competition_stats
       SET games = $1, wins = $2, draws = $3, losses = $4,
           goals_for = $5, goals_against = $6,
           stats_source = 'calculated',
           stats_recalculated_at = now()
       WHERE id = $7`,
      [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, scs[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO season_competition_stats
         (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
          classification, stats_source, stats_recalculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '1º', 'calculated', now())`,
      [SEASON, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }

  // Keep classification = 1º (title year)
  await client.query(
    `UPDATE season_competition_stats
     SET classification = '1º'
     WHERE season = $1 AND competition_id = $2
       AND (classification IS DISTINCT FROM '1º')`,
    [SEASON, competitionId],
  );

  const { rows: scsFinal } = await client.query(
    `SELECT games, wins, draws, losses, goals_for, goals_against, classification, stats_source
     FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [SEASON, competitionId],
  );

  const expected = {
    games: 10,
    wins: 8,
    draws: 0,
    losses: 2,
    goals_for: 34,
    goals_against: 14,
  };
  const ok =
    a.games === expected.games &&
    a.wins === expected.wins &&
    a.draws === expected.draws &&
    a.losses === expected.losses &&
    a.goals_for === expected.goals_for &&
    a.goals_against === expected.goals_against;

  if (!ok) {
    throw new Error(
      `Validation failed. Got ${JSON.stringify(a)}, expected ${JSON.stringify(expected)}`,
    );
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        competitionId,
        createdOpponents,
        insertedCount: inserted.length,
        skippedCount: skipped.length,
        inserted,
        skipped,
        validation: { ...a, classification: scsFinal[0]?.classification, ok },
        seasonCompetitionStats: scsFinal[0],
      },
      null,
      2,
    ),
  );
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
