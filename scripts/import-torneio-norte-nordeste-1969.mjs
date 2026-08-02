/**
 * Import CSA matches — Torneio Norte-Nordeste 1969.
 * Creates competition if missing (type: regional). No invented fields / no súmula players.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Torneio Norte-Nordeste";
const COMPETITION_TYPE = "regional";
const SEASON = "1969";

/**
 * @typedef {{
 *   date: string;
 *   opponent: string;
 *   goalsFor: number;
 *   goalsAgainst: number;
 *   homeAway: "home"|"away"|"neutral";
 *   result: "win"|"draw"|"loss";
 *   phase: string;
 * }} MatchRow
 */

/** @type {MatchRow[]} */
const MATCHES = [
  // Primeira Fase
  { date: "1969-09-17", opponent: "Náutico-PE", goalsFor: 2, goalsAgainst: 3, homeAway: "home", result: "loss", phase: "Primeira Fase" },
  { date: "1969-09-21", opponent: "Sergipe-SE", goalsFor: 2, goalsAgainst: 1, homeAway: "home", result: "win", phase: "Primeira Fase" },
  { date: "1969-09-24", opponent: "Confiança-SE", goalsFor: 1, goalsAgainst: 1, homeAway: "away", result: "draw", phase: "Primeira Fase" },
  { date: "1969-09-28", opponent: "CRB-AL", goalsFor: 1, goalsAgainst: 0, homeAway: "home", result: "win", phase: "Primeira Fase" },
  { date: "1969-10-01", opponent: "Feira-BA", goalsFor: 3, goalsAgainst: 3, homeAway: "home", result: "draw", phase: "Primeira Fase" },
  { date: "1969-10-05", opponent: "Galícia-BA", goalsFor: 3, goalsAgainst: 2, homeAway: "home", result: "win", phase: "Primeira Fase" },
  { date: "1969-10-19", opponent: "CRB-AL", goalsFor: 2, goalsAgainst: 1, homeAway: "home", result: "win", phase: "Primeira Fase" },
  { date: "1969-10-22", opponent: "Confiança-SE", goalsFor: 5, goalsAgainst: 0, homeAway: "home", result: "win", phase: "Primeira Fase" },
  { date: "1969-10-26", opponent: "Feira-BA", goalsFor: 2, goalsAgainst: 0, homeAway: "home", result: "win", phase: "Primeira Fase" },
  { date: "1969-11-02", opponent: "Sergipe-SE", goalsFor: 0, goalsAgainst: 2, homeAway: "away", result: "loss", phase: "Primeira Fase" },
  { date: "1969-11-11", opponent: "Galícia-BA", goalsFor: 0, goalsAgainst: 1, homeAway: "away", result: "loss", phase: "Primeira Fase" },
  { date: "1969-11-15", opponent: "Náutico-PE", goalsFor: 1, goalsAgainst: 3, homeAway: "away", result: "loss", phase: "Primeira Fase" },
  // Fase Final
  { date: "1969-11-19", opponent: "Galícia-BA", goalsFor: 0, goalsAgainst: 0, homeAway: "home", result: "draw", phase: "Fase Final" },
  { date: "1969-11-23", opponent: "Ceará-CE", goalsFor: 0, goalsAgainst: 3, homeAway: "away", result: "loss", phase: "Fase Final" },
  { date: "1969-11-26", opponent: "Sport-PE", goalsFor: 2, goalsAgainst: 1, homeAway: "away", result: "win", phase: "Fase Final" },
  { date: "1969-11-30", opponent: "Galícia-BA", goalsFor: 0, goalsAgainst: 1, homeAway: "away", result: "loss", phase: "Fase Final" },
  { date: "1969-12-03", opponent: "Sport-PE", goalsFor: 1, goalsAgainst: 1, homeAway: "home", result: "draw", phase: "Fase Final" },
  { date: "1969-12-07", opponent: "Ceará-CE", goalsFor: 2, goalsAgainst: 0, homeAway: "home", result: "win", phase: "Fase Final" },
];

const EXPECTED = {
  games: 18,
  wins: 8,
  draws: 4,
  losses: 6,
  goals_for: 27,
  goals_against: 23,
};

function aggregate(rows) {
  return {
    games: rows.length,
    wins: rows.filter((r) => r.result === "win").length,
    draws: rows.filter((r) => r.result === "draw").length,
    losses: rows.filter((r) => r.result === "loss").length,
    goals_for: rows.reduce((s, r) => s + r.goalsFor, 0),
    goals_against: rows.reduce((s, r) => s + r.goalsAgainst, 0),
  };
}

function sameStats(a, b) {
  return (
    a.games === b.games &&
    a.wins === b.wins &&
    a.draws === b.draws &&
    a.losses === b.losses &&
    a.goals_for === b.goals_for &&
    a.goals_against === b.goals_against
  );
}

async function ensureCompetition(name, type) {
  const { rows } = await client.query(
    `SELECT id, name, type FROM competitions WHERE name = $1`,
    [name],
  );
  if (rows[0]) return { id: rows[0].id, name: rows[0].name, type: rows[0].type, created: false };
  const ins = await client.query(
    `INSERT INTO competitions (name, type) VALUES ($1, $2) RETURNING id, name, type`,
    [name, type],
  );
  return { id: ins.rows[0].id, name: ins.rows[0].name, type: ins.rows[0].type, created: true };
}

async function ensureOpponent(name) {
  const { rows } = await client.query(
    `SELECT id, name FROM opponents WHERE lower(name) = lower($1)`,
    [name],
  );
  if (rows[0]) return { id: rows[0].id, name: rows[0].name, created: false };
  // Infer state from -XX suffix when present
  const stateMatch = name.match(/-([A-Z]{2})$/);
  const state = stateMatch ? stateMatch[1] : null;
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1, $2, 'Brasil') RETURNING id, name`,
    [name, state],
  );
  return { id: ins.rows[0].id, name: ins.rows[0].name, created: true };
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
    `SELECT id FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [season, competitionId],
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
          stats_source, stats_recalculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'calculated', now())`,
      [
        season,
        competitionId,
        a.games,
        a.wins,
        a.draws,
        a.losses,
        a.goals_for,
        a.goals_against,
      ],
    );
  }

  return a;
}

const got = aggregate(MATCHES);
const preOk = sameStats(got, EXPECTED);

if (!preOk) {
  console.error(
    JSON.stringify(
      {
        error: "Pre-validation failed — soma dos placares ≠ validação informada",
        got,
        expected: EXPECTED,
      },
      null,
      2,
    ),
  );
  client.release();
  await pool.end();
  process.exit(1);
}

try {
  await client.query("BEGIN");

  await client.query(
    `INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`,
    [Number(SEASON)],
  );

  const comp = await ensureCompetition(COMPETITION_NAME, COMPETITION_TYPE);
  const competitionId = comp.id;

  const createdOpponents = [];
  const inserted = [];
  const skipped = [];
  const opponentCache = new Map();

  for (const m of MATCHES) {
    let opp = opponentCache.get(m.opponent);
    if (!opp) {
      opp = await ensureOpponent(m.opponent);
      opponentCache.set(m.opponent, opp);
      if (opp.created) createdOpponents.push(opp.name);
    }

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date = $1
         AND season = $2
         AND competition_id = $3
         AND opponent_id = $4
         AND home_away = $5
         AND coalesce(is_walkover, false) = false
       LIMIT 1`,
      [m.date, SEASON, competitionId, opp.id, m.homeAway],
    );

    if (existing[0]) {
      skipped.push({
        id: existing[0].id,
        date: m.date,
        opponent: opp.name,
        homeAway: m.homeAway,
      });
      continue;
    }

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase,
         is_walkover, is_friendly, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, 'played')
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
        m.phase,
      ],
    );

    inserted.push({
      id: ins[0].id,
      date: m.date,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
      phase: m.phase,
    });
  }

  const stats = await refreshSeasonCompStats(SEASON, competitionId);
  if (!sameStats(stats, EXPECTED)) {
    throw new Error(
      `DB validation failed: got ${JSON.stringify(stats)}, expected ${JSON.stringify(EXPECTED)}`,
    );
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        competition: {
          id: competitionId,
          name: comp.name,
          type: comp.type,
          created: comp.created,
        },
        createdOpponents,
        insertedCount: inserted.length,
        skippedDuplicateCount: skipped.length,
        inserted,
        skippedDuplicates: skipped,
        seasonCompetitionStats: stats,
        validation: { got: stats, expected: EXPECTED, ok: true },
        playerConflicts: [],
        note: "Nenhuma súmula/jogadores fornecidos — nenhum jogador criado.",
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
