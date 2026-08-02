/**
 * Import CSA matches — Campeonato Alagoano 1937.
 * Only CSA games. Opponents use -AL suffix. No invented fields.
 * W.O. entries without dates are skipped (match_date is required; do not invent dates).
 * No súmula/player data in source — no player inserts.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Campeonato Alagoano";
const SEASON = "1937";

/**
 * Field matches only. goalsFor/goalsAgainst from CSA perspective.
 * @type {{ date: string; opponent: string; goalsFor: number; goalsAgainst: number; homeAway: "home"|"away"; result: "win"|"draw"|"loss"; note?: string }[]}
 */
const MATCHES = [
  { date: "1937-06-20", opponent: "Santa Cruz-AL", goalsFor: 3, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1937-07-04", opponent: "Nordeste-AL", goalsFor: 0, goalsAgainst: 1, homeAway: "away", result: "loss" },
  {
    date: "1937-07-16",
    opponent: "CRB-AL",
    goalsFor: 1,
    goalsAgainst: 1,
    homeAway: "away",
    result: "draw",
    note: "CSA perdeu os pontos desta partida; resultado de campo foi 1x1.",
  },
  { date: "1937-08-22", opponent: "Alexandria-AL", goalsFor: 3, goalsAgainst: 1, homeAway: "home", result: "win" },
  { date: "1937-08-29", opponent: "Vasco da Gama-AL", goalsFor: 5, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1937-10-03", opponent: "Barroso-AL", goalsFor: 0, goalsAgainst: 0, homeAway: "home", result: "draw" },
  { date: "1937-10-30", opponent: "Barroso-AL", goalsFor: 2, goalsAgainst: 1, homeAway: "home", result: "win" },
  { date: "1937-11-02", opponent: "Santa Cruz-AL", goalsFor: 3, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1937-11-07", opponent: "Nordeste-AL", goalsFor: 2, goalsAgainst: 4, homeAway: "away", result: "loss" },
  { date: "1937-11-15", opponent: "CRB-AL", goalsFor: 0, goalsAgainst: 1, homeAway: "away", result: "loss" },
  { date: "1937-12-19", opponent: "Vasco da Gama-AL", goalsFor: 3, goalsAgainst: 2, homeAway: "home", result: "win" },
];

/** W.O. without dates — cannot insert without inventing match_date. */
const SKIPPED_WALKOVERS = [
  { opponent: "Uruguai-AL", reason: "W.O. sem data (match_date obrigatório)" },
  { opponent: "Uruguai-AL", reason: "W.O. sem data (match_date obrigatório)" },
  { opponent: "Alexandria-AL", reason: "W.O. sem data (match_date obrigatório)" },
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
    `INSERT INTO seasons (year) VALUES (1937) ON CONFLICT (year) DO NOTHING`,
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
  const notesNotPersisted = [];

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

    if (m.note) {
      notesNotPersisted.push({
        matchId: ins[0].id,
        date: m.date,
        opponent: opp.name,
        note: m.note,
        reason: "Tabela matches não possui coluna de observação/notas",
      });
    }

    inserted.push({
      id: ins[0].id,
      date: m.date,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
    });
  }

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

  // Arithmetic of the 11 field matches provided (GC soma = 17, não 18).
  const expected = {
    games: 11,
    wins: 6,
    draws: 2,
    losses: 3,
    goals_for: 22,
    goals_against: 17,
  };
  const userExpectedGoalsAgainst = 18;

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
          stats_source, stats_recalculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'calculated', now())`,
      [SEASON, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }

  const { rows: scsFinal } = await client.query(
    `SELECT games, wins, draws, losses, goals_for, goals_against, classification, stats_source
     FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [SEASON, competitionId],
  );

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
        skippedDuplicateCount: skipped.length,
        inserted,
        skippedDuplicates: skipped,
        skippedWalkovers: SKIPPED_WALKOVERS,
        notesNotPersisted,
        validation: {
          ...a,
          ok,
          userExpectedGoalsAgainst,
          note:
            userExpectedGoalsAgainst !== a.goals_against
              ? `Soma dos placares informados = GC ${a.goals_against} (lista do usuário pedia ${userExpectedGoalsAgainst}).`
              : undefined,
        },
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
