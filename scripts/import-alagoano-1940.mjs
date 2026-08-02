/**
 * Import CSA matches — Campeonato Alagoano 1940.
 * Field matches + year-only W.O. No invented scores/fields. No súmula data.
 * Finals played in Jan/Feb 1941 belong to season 1940.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Campeonato Alagoano";
const SEASON = "1940";
const YEAR_ONLY_DATE = "1940-01-01";

/**
 * @type {{ date: string; opponent: string; goalsFor: number; goalsAgainst: number; homeAway: "home"|"away"; result: "win"|"draw"|"loss"; phase?: string }[]}
 */
const MATCHES = [
  { date: "1940-04-07", opponent: "Nordeste-AL", goalsFor: 5, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1940-05-12", opponent: "Barroso-AL", goalsFor: 2, goalsAgainst: 1, homeAway: "home", result: "win" },
  { date: "1940-05-26", opponent: "Santa Cruz-AL", goalsFor: 6, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1940-06-16", opponent: "CRB-AL", goalsFor: 1, goalsAgainst: 3, homeAway: "away", result: "loss" },
  { date: "1940-07-14", opponent: "Vasco da Gama-AL", goalsFor: 2, goalsAgainst: 3, homeAway: "away", result: "loss" },
  { date: "1940-09-01", opponent: "Nordeste-AL", goalsFor: 4, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1940-10-06", opponent: "Barroso-AL", goalsFor: 2, goalsAgainst: 0, homeAway: "home", result: "win" },
  { date: "1940-10-27", opponent: "Santa Cruz-AL", goalsFor: 6, goalsAgainst: 2, homeAway: "home", result: "win" },
  { date: "1940-11-10", opponent: "CRB-AL", goalsFor: 3, goalsAgainst: 2, homeAway: "home", result: "win" },
  {
    date: "1941-01-26",
    opponent: "CRB-AL",
    goalsFor: 2,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
    phase: "Final",
  },
  {
    date: "1941-02-02",
    opponent: "CRB-AL",
    goalsFor: 1,
    goalsAgainst: 2,
    homeAway: "away",
    result: "loss",
    phase: "Final",
  },
  {
    date: "1941-02-09",
    opponent: "CRB-AL",
    goalsFor: 2,
    goalsAgainst: 3,
    homeAway: "away",
    result: "loss",
    phase: "Final",
  },
];

/**
 * Year-only W.O. No placar.
 * result from CSA perspective: win = CSA W.O. sobre adversário; loss = adversário W.O. sobre CSA.
 * @type {{ opponent: string; result: "win"|"loss" }[]}
 */
const WALKOVERS = [
  { opponent: "Vasco da Gama-AL", result: "win" },
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
    `INSERT INTO seasons (year) VALUES (1940) ON CONFLICT (year) DO NOTHING`,
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
  const insertedWalkovers = [];
  const skippedWalkovers = [];

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
         AND coalesce(is_walkover, false) = false
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
        m.phase ?? null,
      ],
    );

    inserted.push({
      id: ins[0].id,
      date: m.date,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
      phase: m.phase ?? null,
    });
  }

  // W.O. keyed by opponent + result (CSA win vs CSA loss) for year-only duplicates
  const neededWo = new Map();
  for (const w of WALKOVERS) {
    const key = `${w.opponent}|${w.result}`;
    neededWo.set(key, (neededWo.get(key) ?? 0) + 1);
  }

  for (const [key, needed] of neededWo) {
    const [opponentName, result] = key.split("|");
    if (!opponentCache.has(opponentName)) {
      const opp = await ensureOpponent(opponentName);
      opponentCache.set(opponentName, opp);
      if (opp.created) createdOpponents.push(opp.name);
    }
    const opp = opponentCache.get(opponentName);

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date = $1
         AND season = $2
         AND competition_id = $3
         AND opponent_id = $4
         AND coalesce(is_walkover, false) = true
         AND result = $5
       ORDER BY id`,
      [YEAR_ONLY_DATE, SEASON, competitionId, opp.id, result],
    );

    const already = existing.length;
    const toInsert = Math.max(0, needed - already);

    for (let i = 0; i < already && i < needed; i++) {
      skippedWalkovers.push({
        date: YEAR_ONLY_DATE,
        opponent: opp.name,
        result,
        id: existing[i].id,
      });
    }

    for (let i = 0; i < toInsert; i++) {
      const { rows: ins } = await client.query(
        `INSERT INTO matches (
           match_date, season, opponent_id, goals_for, goals_against,
           result, home_away, competition_id,
           is_walkover, is_friendly, status
         ) VALUES ($1, $2, $3, NULL, NULL, $4, 'neutral', $5, true, false, 'played')
         RETURNING id`,
        [YEAR_ONLY_DATE, SEASON, opp.id, result, competitionId],
      );
      insertedWalkovers.push({
        id: ins[0].id,
        date: YEAR_ONLY_DATE,
        opponent: opp.name,
        result,
        isWalkover: true,
        goalsFor: null,
        goalsAgainst: null,
      });
    }
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

  // Gols contra = 17 (soma dos placares). Fonte listava 18; corrigido pela soma.
  const expected = {
    games: 12,
    wins: 8,
    draws: 0,
    losses: 4,
    goals_for: 36,
    goals_against: 17,
  };

  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats
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

  const { rows: woCount } = await client.query(
    `SELECT count(*)::int AS n
     FROM matches
     WHERE season = $1
       AND competition_id = $2
       AND coalesce(is_walkover, false) = true`,
    [SEASON, competitionId],
  );

  const { rows: finalsCheck } = await client.query(
    `SELECT id, match_date, phase FROM matches
     WHERE season = $1 AND competition_id = $2
       AND coalesce(is_walkover, false) = false
       AND phase = 'Final'
     ORDER BY match_date`,
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

  if (woCount[0].n !== 1) {
    throw new Error(`Expected 1 walkover, got ${woCount[0].n}`);
  }

  if (finalsCheck.length !== 3) {
    throw new Error(
      `Expected 3 Final matches, got ${finalsCheck.length}: ${JSON.stringify(finalsCheck)}`,
    );
  }

  const { rows: scsFinal } = await client.query(
    `SELECT games, wins, draws, losses, goals_for, goals_against, classification, stats_source
     FROM season_competition_stats
     WHERE season = $1 AND competition_id = $2`,
    [SEASON, competitionId],
  );

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
        insertedWalkovers,
        skippedWalkovers,
        walkoverTotal: woCount[0].n,
        finalsCheck,
        validation: { ...a, ok },
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
