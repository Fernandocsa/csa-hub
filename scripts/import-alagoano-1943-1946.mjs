/**
 * Import CSA matches — Campeonato Alagoano 1943–1946.
 * - Only CSA field matches (no W.O.)
 * - Cross-year dates keep championship season (1945 games → season 1944; 1946 game → season 1945)
 * - No invented referee/stadium/attendance/players (none provided)
 * - Duplicate check before insert
 * - 1945 blocked if listed scores do not match the stated validation totals
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
 * }} MatchRow
 */

/** @type {MatchRow[]} */
const MATCHES = [
  // ---- 1943 ----
  {
    date: "1943-11-28",
    season: "1943",
    opponent: "Esporte-AL",
    goalsFor: 6,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
    phase: "1º Turno",
  },
  {
    date: "1943-12-12",
    season: "1943",
    opponent: "Andaraí-AL",
    goalsFor: 4,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
    phase: "1º Turno",
  },

  // ---- 1944 (incl. Jan/Mar 1945 calendar dates) ----
  {
    date: "1944-04-02",
    season: "1944",
    opponent: "Olavo Bilac-AL",
    goalsFor: 5,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-04-23",
    season: "1944",
    opponent: "Santa Cruz-AL",
    goalsFor: 3,
    goalsAgainst: 4,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1944-05-07",
    season: "1944",
    opponent: "América-AL",
    goalsFor: 2,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-05-28",
    season: "1944",
    opponent: "Comércio-AL",
    goalsFor: 5,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-06-18",
    season: "1944",
    opponent: "Esporte-AL",
    goalsFor: 7,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-10-15",
    season: "1944",
    opponent: "Olavo Bilac-AL",
    goalsFor: 3,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-11-12",
    season: "1944",
    opponent: "América-AL",
    goalsFor: 4,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-12-03",
    season: "1944",
    opponent: "Comércio-AL",
    goalsFor: 4,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1944-12-24",
    season: "1944",
    opponent: "Santa Cruz-AL",
    goalsFor: 3,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-01-28",
    season: "1944",
    opponent: "Esporte-AL",
    goalsFor: 22,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-03-04",
    season: "1944",
    opponent: "CRB-AL",
    goalsFor: 4,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },

  // ---- 1945 (incl. Jan 1946 calendar date) ----
  {
    date: "1945-04-22",
    season: "1945",
    opponent: "ADA-AL",
    goalsFor: 8,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-05-06",
    season: "1945",
    opponent: "Alexandria-AL",
    goalsFor: 6,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-06-03",
    season: "1945",
    opponent: "Barroso-AL",
    goalsFor: 4,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-06-24",
    season: "1945",
    opponent: "Olavo Bilac-AL",
    goalsFor: 4,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-07-08",
    season: "1945",
    opponent: "Esporte-AL",
    goalsFor: 12,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-08-05",
    season: "1945",
    opponent: "América-AL",
    goalsFor: 2,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-08-19",
    season: "1945",
    opponent: "Santa Cruz-AL",
    goalsFor: 3,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-09-23",
    season: "1945",
    opponent: "CRB-AL",
    goalsFor: 4,
    goalsAgainst: 3,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-11-04",
    season: "1945",
    opponent: "Alexandria-AL",
    goalsFor: 2,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-11-18",
    season: "1945",
    opponent: "Barroso-AL",
    goalsFor: 4,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1945-12-08",
    season: "1945",
    opponent: "América-AL",
    goalsFor: 2,
    goalsAgainst: 4,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1945-12-24",
    season: "1945",
    opponent: "Santa Cruz-AL",
    goalsFor: 2,
    goalsAgainst: 4,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1946-01-06",
    season: "1945",
    opponent: "Comércio-AL",
    goalsFor: 5,
    goalsAgainst: 2,
    homeAway: "home",
    result: "win",
  },

  // ---- 1946 ----
  {
    date: "1946-04-21",
    season: "1946",
    opponent: "América-AL",
    goalsFor: 0,
    goalsAgainst: 2,
    homeAway: "away",
    result: "loss",
  },
  {
    date: "1946-05-12",
    season: "1946",
    opponent: "Comércio-AL",
    goalsFor: 4,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
  },
  {
    date: "1946-06-23",
    season: "1946",
    opponent: "Santa Cruz-AL",
    goalsFor: 1,
    goalsAgainst: 1,
    homeAway: "home",
    result: "draw",
  },
  {
    date: "1946-07-07",
    season: "1946",
    opponent: "CRB-AL",
    goalsFor: 2,
    goalsAgainst: 3,
    homeAway: "away",
    result: "loss",
  },
];

/** Stated validation totals from the source list */
const EXPECTED = {
  "1943": { games: 2, wins: 2, draws: 0, losses: 0, goals_for: 10, goals_against: 1 },
  "1944": { games: 11, wins: 10, draws: 0, losses: 1, goals_for: 62, goals_against: 13 },
  "1945": { games: 13, wins: 11, draws: 0, losses: 2, goals_for: 58, goals_against: 23 },
  "1946": { games: 4, wins: 1, draws: 1, losses: 2, goals_for: 7, goals_against: 6 },
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
       AND coalesce(is_walkover, false) = false
       AND coalesce(status, 'played') = 'played'
       AND result IN ('win', 'draw', 'loss')`,
    [season, competitionId],
  );
  const a = agg[0];

  const { rows: scs } = await client.query(
    `SELECT id, classification FROM season_competition_stats
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

// Pre-validate listed scores vs stated totals (before any DB writes for bad seasons)
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

const seasonsToImport = seasonsInList.filter((s) => !blockedSeasons.includes(s));
const matchesToImport = MATCHES.filter((m) => seasonsToImport.includes(m.season));

try {
  await client.query("BEGIN");

  for (const year of seasonsToImport) {
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
  const opponentCache = new Map();

  for (const m of matchesToImport) {
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
      [m.date, m.season, competitionId, opp.id, m.homeAway],
    );

    if (existing[0]) {
      skipped.push({
        id: existing[0].id,
        date: m.date,
        season: m.season,
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
        m.season,
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
      season: m.season,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
      phase: m.phase ?? null,
    });
  }

  const seasonStats = {};
  const validation = {};

  for (const season of seasonsToImport) {
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

  // Preserve existing 1944 title classification if present
  if (seasonsToImport.includes("1944")) {
    await client.query(
      `UPDATE season_competition_stats
       SET classification = '1º'
       WHERE season = '1944' AND competition_id = $1
         AND (classification IS DISTINCT FROM '1º')`,
      [competitionId],
    );
  }

  // Cross-year season linkage checks
  const { rows: crossYear } = await client.query(
    `SELECT id, match_date::text AS match_date, season, goals_for, goals_against
     FROM matches
     WHERE competition_id = $1
       AND (
         (match_date = '1945-01-28' AND season = '1944')
         OR (match_date = '1945-03-04' AND season = '1944')
         OR (match_date = '1946-01-06' AND season = '1945')
       )
     ORDER BY match_date`,
    [competitionId],
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
        preValidation,
        blockedSeasons,
        blockedReason:
          blockedSeasons.length > 0
            ? "Soma dos placares listados não confere com a validação informada — temporada(s) não importada(s)."
            : null,
        seasonCompetitionStats: seasonStats,
        validation,
        crossYearSeasonLinks: crossYear,
        playerConflicts: [],
        note: "Nenhuma súmula/jogadores fornecidos — nenhum jogador criado.",
        observation1943NotPersisted:
          "Campeonato Alagoano de 1943 interrompido sem campeão (sem coluna de notas).",
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
