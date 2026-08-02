/**
 * Import CSA walkovers — Campeonato Alagoano 1937 (year-only date).
 * Date convention for undated matches: YYYY-01-01 (year only; no day/month invented beyond DB date type).
 * No score. is_walkover = true. Does not alter field-match season stats.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Campeonato Alagoano";
const SEASON = "1937";
/** Year-only placeholder required by date column (same convention as historical W.O.). */
const YEAR_ONLY_DATE = "1937-01-01";

/** @type {{ opponent: string }[]} */
const WALKOVERS = [
  { opponent: "Uruguai-AL" },
  { opponent: "Uruguai-AL" },
  { opponent: "Alexandria-AL" },
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

  const { rows: comps } = await client.query(
    `SELECT id, name FROM competitions WHERE name = $1`,
    [COMPETITION_NAME],
  );
  if (!comps[0]) throw new Error(`Competition "${COMPETITION_NAME}" not found`);
  const competitionId = comps[0].id;

  const neededByOpponent = new Map();
  for (const w of WALKOVERS) {
    neededByOpponent.set(w.opponent, (neededByOpponent.get(w.opponent) ?? 0) + 1);
  }

  const createdOpponents = [];
  const inserted = [];
  const skipped = [];

  for (const [opponentName, needed] of neededByOpponent) {
    const opp = await ensureOpponent(opponentName);
    if (opp.created) createdOpponents.push(opp.name);

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date = $1
         AND season = $2
         AND competition_id = $3
         AND opponent_id = $4
         AND coalesce(is_walkover, false) = true
       ORDER BY id`,
      [YEAR_ONLY_DATE, SEASON, competitionId, opp.id],
    );

    const already = existing.length;
    const toInsert = Math.max(0, needed - already);

    for (let i = 0; i < already && i < needed; i++) {
      skipped.push({
        date: YEAR_ONLY_DATE,
        opponent: opp.name,
        id: existing[i].id,
        reason: "W.O. já existente (ano apenas)",
      });
    }

    for (let i = 0; i < toInsert; i++) {
      // Conventional official score for CSA W.O. wins: 1–0 (no player goals).
      const result = "win";
      const goalsFor = 1;
      const goalsAgainst = 0;
      const { rows: ins } = await client.query(
        `INSERT INTO matches (
           match_date, season, opponent_id, goals_for, goals_against,
           result, home_away, competition_id,
           is_walkover, is_friendly, status
         ) VALUES ($1, $2, $3, $4, $5, $6, 'neutral', $7, true, false, 'played')
         RETURNING id`,
        [YEAR_ONLY_DATE, SEASON, opp.id, goalsFor, goalsAgainst, result, competitionId],
      );
      inserted.push({
        id: ins[0].id,
        date: YEAR_ONLY_DATE,
        opponent: opp.name,
        isWalkover: true,
        goalsFor,
        goalsAgainst,
        result,
        homeAway: "neutral",
      });
    }
  }

  // Field-match aggregates must remain unchanged (W.O. excluded).
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
  const expected = {
    games: 11,
    wins: 6,
    draws: 2,
    losses: 3,
    goals_for: 22,
    goals_against: 17,
  };
  const fieldOk =
    a.games === expected.games &&
    a.wins === expected.wins &&
    a.draws === expected.draws &&
    a.losses === expected.losses &&
    a.goals_for === expected.goals_for &&
    a.goals_against === expected.goals_against;

  if (!fieldOk) {
    throw new Error(
      `Field validation failed. Got ${JSON.stringify(a)}, expected ${JSON.stringify(expected)}`,
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

  if (woCount[0].n !== 3) {
    throw new Error(`Expected 3 walkovers in 1937 Alagoano, got ${woCount[0].n}`);
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        competitionId,
        yearOnlyDate: YEAR_ONLY_DATE,
        createdOpponents,
        insertedCount: inserted.length,
        skippedCount: skipped.length,
        inserted,
        skipped,
        walkoverTotal: woCount[0].n,
        fieldValidation: { ...a, ok: fieldOk },
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
