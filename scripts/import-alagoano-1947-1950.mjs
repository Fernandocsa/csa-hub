/**
 * Import CSA matches — Campeonato Alagoano 1947–1950.
 * - Field matches + W.O. (official 1x0 / 0x1, is_walkover=true, year-only date when undated)
 * - W.O. included in season_competition_stats (officialPlayedMatchConditions)
 * - Cross-year calendar dates keep championship season
 * - No invented referee/stadium/attendance/players
 * - Field scores kept even when points were later stripped (notes not persisted)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const COMPETITION_NAME = "Campeonato Alagoano";

/**
 * @typedef {{
 *   date: string;
 *   season: string;
 *   opponent: string;
 *   goalsFor: number;
 *   goalsAgainst: number;
 *   homeAway: "home"|"away"|"neutral";
 *   result: "win"|"draw"|"loss";
 *   phase?: string;
 *   isWalkover?: boolean;
 *   note?: string;
 * }} MatchRow
 */

/** @type {MatchRow[]} */
const MATCHES = [
  // ---- 1947 (incl. 29/02/1948) ----
  {
    date: "1947-04-20",
    season: "1947",
    opponent: "Alexandria-AL",
    goalsFor: 1,
    goalsAgainst: 2,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1947-05-11",
    season: "1947",
    opponent: "Esporte-AL",
    goalsFor: 5,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1947-06-08",
    season: "1947",
    opponent: "Comércio-AL",
    goalsFor: 6,
    goalsAgainst: 5,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1947-06-22",
    season: "1947",
    opponent: "Barroso-AL",
    goalsFor: 1,
    goalsAgainst: 1,
    homeAway: "home",
    result: "draw",
    note: "O Barroso perdeu os pontos da partida; placar de campo mantido.",
  },
  {
    date: "1947-07-20",
    season: "1947",
    opponent: "CRB-AL",
    goalsFor: 4,
    goalsAgainst: 4,
    homeAway: "home",
    result: "draw",
  },
  {
    date: "1947-08-03",
    season: "1947",
    opponent: "Alexandria-AL",
    goalsFor: 2,
    goalsAgainst: 2,
    homeAway: "home",
    result: "draw",
  },
  {
    date: "1947-09-21",
    season: "1947",
    opponent: "Esporte-AL",
    goalsFor: 11,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1947-10-19",
    season: "1947",
    opponent: "Comércio-AL",
    goalsFor: 2,
    goalsAgainst: 2,
    homeAway: "home",
    result: "draw",
  },
  {
    date: "1947-11-02",
    season: "1947",
    opponent: "Barroso-AL",
    goalsFor: 5,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1948-02-29",
    season: "1947",
    opponent: "CRB-AL",
    goalsFor: 2,
    goalsAgainst: 3,
    homeAway: "away",
    result: "loss",
  },

  // ---- 1948 ----
  {
    date: "1948-06-13",
    season: "1948",
    opponent: "Santa Cruz-AL",
    goalsFor: 4,
    goalsAgainst: 3,
    homeAway: "home",
    result: "win",
    note: "O CSA perdeu os pontos da partida; placar de campo mantido.",
  },
  {
    date: "1948-06-27",
    season: "1948",
    opponent: "Barroso-AL",
    goalsFor: 5,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1948-08-08",
    season: "1948",
    opponent: "América-AL",
    goalsFor: 1,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1948-08-22",
    season: "1948",
    opponent: "CRB-AL",
    goalsFor: 0,
    goalsAgainst: 1,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1948-09-12",
    season: "1948",
    opponent: "Comércio-AL",
    goalsFor: 6,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },

  // ---- 1949 ----
  {
    date: "1949-04-24",
    season: "1949",
    opponent: "Barroso-AL",
    goalsFor: 2,
    goalsAgainst: 4,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1949-05-29",
    season: "1949",
    opponent: "CRB-AL",
    goalsFor: 4,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1949-06-26",
    season: "1949",
    opponent: "América-AL",
    goalsFor: 2,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1949-07-10",
    season: "1949",
    opponent: "Comércio-AL",
    goalsFor: 5,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1949-07-31",
    season: "1949",
    opponent: "Barroso-AL",
    goalsFor: 6,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1949-08-21",
    season: "1949",
    opponent: "CRB-AL",
    goalsFor: 2,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1949-09-18",
    season: "1949",
    opponent: "América-AL",
    goalsFor: 10,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    // Undated in source ("após 18/09/1949") — year-only convention
    date: "1949-01-01",
    season: "1949",
    opponent: "Comércio-AL",
    goalsFor: 1,
    goalsAgainst: 0,
    homeAway: "neutral",
    result: "win",
    isWalkover: true,
  },

  // ---- 1950 (incl. 1951 calendar dates) ----
  {
    date: "1950-11-09",
    season: "1950",
    opponent: "Independente-AL",
    goalsFor: 8,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1950-11-15",
    season: "1950",
    opponent: "Comércio-AL",
    goalsFor: 6,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1950-12-21",
    season: "1950",
    opponent: "Barroso-AL",
    goalsFor: 4,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1951-01-28",
    season: "1950",
    opponent: "13 de Maio-AL",
    goalsFor: 5,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    // Undated in source — year-only convention for season 1950
    date: "1950-01-01",
    season: "1950",
    opponent: "Maguari-AL",
    goalsFor: 1,
    goalsAgainst: 0,
    homeAway: "neutral",
    result: "win",
    isWalkover: true,
  },
  {
    date: "1951-04-01",
    season: "1950",
    opponent: "CRB-AL",
    goalsFor: 1,
    goalsAgainst: 2,
    homeAway: "away",
    result: "loss",
    phase: "Final",
  },
  {
    date: "1951-04-08",
    season: "1950",
    opponent: "CRB-AL",
    goalsFor: 1,
    goalsAgainst: 1,
    homeAway: "away",
    result: "draw",
    phase: "Final",
  },
];

const EXPECTED = {
  "1947": { games: 10, wins: 4, draws: 4, losses: 2, goals_for: 39, goals_against: 19 },
  "1948": { games: 5, wins: 4, draws: 0, losses: 1, goals_for: 16, goals_against: 6 },
  "1949": { games: 8, wins: 7, draws: 0, losses: 1, goals_for: 32, goals_against: 7 },
  "1950": { games: 7, wins: 5, draws: 1, losses: 1, goals_for: 26, goals_against: 7 },
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

/** Official aggregates: includes W.O., excludes friendlies/scheduled. */
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

// Pre-validate listed scores vs stated totals
const seasonsInList = [...new Set(MATCHES.map((m) => m.season))].sort();
const preValidation = {};
const blockedSeasons = [];

for (const season of seasonsInList) {
  const rows = MATCHES.filter((m) => m.season === season);
  const got = aggregate(rows);
  const expected = EXPECTED[season];
  const ok = sameStats(got, expected);
  preValidation[season] = { got, expected, ok };
  if (!ok) blockedSeasons.push(season);
}

if (blockedSeasons.length > 0) {
  console.error(
    JSON.stringify({ error: "Pre-validation failed", blockedSeasons, preValidation }, null, 2),
  );
  client.release();
  await pool.end();
  process.exit(1);
}

try {
  await client.query("BEGIN");

  for (const year of seasonsInList) {
    await client.query(
      `INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`,
      [Number(year)],
    );
  }

  const { rows: comps } = await client.query(
    `SELECT id, name FROM competitions WHERE name = $1`,
    [COMPETITION_NAME],
  );
  if (!comps[0]) throw new Error(`Competition "${COMPETITION_NAME}" not found`);
  const competitionId = comps[0].id;

  const createdOpponents = [];
  const inserted = [];
  const skipped = [];
  const notesNotPersisted = [];
  const opponentCache = new Map();

  for (const m of MATCHES) {
    let opp = opponentCache.get(m.opponent);
    if (!opp) {
      opp = await ensureOpponent(m.opponent);
      opponentCache.set(m.opponent, opp);
      if (opp.created) createdOpponents.push(opp.name);
    }

    const isWo = Boolean(m.isWalkover);

    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date = $1
         AND season = $2
         AND competition_id = $3
         AND opponent_id = $4
         AND home_away = $5
         AND coalesce(is_walkover, false) = $6
       LIMIT 1`,
      [m.date, m.season, competitionId, opp.id, m.homeAway, isWo],
    );

    if (existing[0]) {
      skipped.push({
        id: existing[0].id,
        date: m.date,
        season: m.season,
        opponent: opp.name,
        homeAway: m.homeAway,
        isWalkover: isWo,
      });
      continue;
    }

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase,
         is_walkover, is_friendly, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, 'played')
       RETURNING id`,
      [
        m.date,
        m.season,
        opp.id,
        m.goalsFor,
        m.goalsAgainst,
        m.result,
        m.homeAway,
        competitionId,
        m.phase ?? null,
        isWo,
      ],
    );

    if (m.note) {
      notesNotPersisted.push({
        matchId: ins[0].id,
        date: m.date,
        season: m.season,
        opponent: opp.name,
        note: m.note,
        reason: "Tabela matches não possui coluna de observação/notas",
      });
    }

    inserted.push({
      id: ins[0].id,
      date: m.date,
      season: m.season,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
      phase: m.phase ?? null,
      isWalkover: isWo,
      walkoverType: isWo ? (m.result === "win" ? "W.O. (V)" : "W.O. (D)") : null,
    });
  }

  const seasonStats = {};
  const validation = {};

  for (const season of seasonsInList) {
    const a = await refreshSeasonCompStats(season, competitionId);
    const expected = EXPECTED[season];
    const ok = sameStats(a, expected);
    seasonStats[season] = a;
    validation[season] = { got: a, expected, ok };
    if (!ok) {
      throw new Error(
        `DB validation failed for ${season}: got ${JSON.stringify(a)}, expected ${JSON.stringify(expected)}`,
      );
    }
  }

  // Preserve existing 1949 title classification
  await client.query(
    `UPDATE season_competition_stats
     SET classification = '1º'
     WHERE season = '1949' AND competition_id = $1
       AND (classification IS DISTINCT FROM '1º')`,
    [competitionId],
  );

  const { rows: crossYear } = await client.query(
    `SELECT id, match_date::text AS match_date, season, goals_for, goals_against,
            coalesce(is_walkover, false) AS is_walkover, phase
     FROM matches
     WHERE competition_id = $1
       AND (
         (match_date = '1948-02-29' AND season = '1947')
         OR (match_date IN ('1951-01-28', '1951-04-01', '1951-04-08') AND season = '1950')
       )
     ORDER BY match_date, id`,
    [competitionId],
  );

  const { rows: walkovers } = await client.query(
    `SELECT m.id, m.match_date::text AS match_date, m.season, m.goals_for, m.goals_against,
            m.result, m.home_away, o.name AS opponent
     FROM matches m
     JOIN opponents o ON o.id = m.opponent_id
     WHERE m.competition_id = $1
       AND m.season = ANY($2)
       AND coalesce(m.is_walkover, false) = true
     ORDER BY m.season, m.id`,
    [competitionId, seasonsInList],
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
        walkovers,
        notesNotPersisted,
        preValidation,
        seasonCompetitionStats: seasonStats,
        validation,
        crossYearSeasonLinks: crossYear,
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
