/**
 * Import CSA matches — Campeonato Alagoano 1941 (final) + Torneio Início 1941.
 * Uses competition "Torneio Início de Alagoas" (creates if missing). No invented fields.
 * Title note for Alagoano final cannot be stored (no notes column) — classification kept as 1º.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = "1941";

/**
 * @type {{
 *   competition: string;
 *   competitionType?: string;
 *   date: string;
 *   opponent: string;
 *   goalsFor: number;
 *   goalsAgainst: number;
 *   homeAway: "home"|"away"|"neutral";
 *   result: "win"|"draw"|"loss";
 *   phase?: string;
 * }[]}
 */
const MATCHES = [
  {
    competition: "Campeonato Alagoano",
    date: "1941-09-28",
    opponent: "CRB-AL",
    goalsFor: 1,
    goalsAgainst: 0,
    homeAway: "away",
    result: "win",
    phase: "Final do Returno",
  },
  {
    competition: "Torneio Início de Alagoas",
    competitionType: "state",
    date: "1941-05-18",
    opponent: "CRB-AL",
    goalsFor: 2,
    goalsAgainst: 0,
    homeAway: "home",
    result: "win",
    phase: "Semifinal",
  },
  {
    competition: "Torneio Início de Alagoas",
    competitionType: "state",
    date: "1941-05-18",
    opponent: "Vasco da Gama-AL",
    goalsFor: 2,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
    phase: "Final",
  },
];

async function ensureCompetition(name, type = "state") {
  const { rows } = await client.query(
    `SELECT id, name, type FROM competitions WHERE name = $1`,
    [name],
  );
  if (rows[0]) return { id: rows[0].id, name: rows[0].name, created: false };
  const ins = await client.query(
    `INSERT INTO competitions (name, type) VALUES ($1, $2) RETURNING id, name`,
    [name, type],
  );
  return { id: ins.rows[0].id, name: ins.rows[0].name, created: true };
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

async function refreshSeasonCompStats(season, competitionId, classification) {
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
           stats_recalculated_at = now(),
           classification = coalesce($7, classification)
       WHERE id = $8`,
      [
        a.games,
        a.wins,
        a.draws,
        a.losses,
        a.goals_for,
        a.goals_against,
        classification ?? null,
        scs[0].id,
      ],
    );
  } else {
    await client.query(
      `INSERT INTO season_competition_stats
         (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
          classification, stats_source, stats_recalculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'calculated', now())`,
      [
        season,
        competitionId,
        a.games,
        a.wins,
        a.draws,
        a.losses,
        a.goals_for,
        a.goals_against,
        classification ?? null,
      ],
    );
  }

  return a;
}

try {
  await client.query("BEGIN");

  await client.query(
    `INSERT INTO seasons (year) VALUES (1941) ON CONFLICT (year) DO NOTHING`,
  );

  const createdCompetitions = [];
  const createdOpponents = [];
  const inserted = [];
  const skipped = [];
  const notesNotPersisted = [];
  const competitionIds = new Map();

  for (const m of MATCHES) {
    if (!competitionIds.has(m.competition)) {
      const comp = await ensureCompetition(m.competition, m.competitionType ?? "state");
      competitionIds.set(m.competition, comp.id);
      if (comp.created) createdCompetitions.push(comp.name);
    }
    const competitionId = competitionIds.get(m.competition);

    const opp = await ensureOpponent(m.opponent);
    if (opp.created) createdOpponents.push(opp.name);

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
        date: m.date,
        competition: m.competition,
        opponent: opp.name,
        id: existing[0].id,
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
        m.phase ?? null,
      ],
    );

    if (m.competition === "Campeonato Alagoano" && m.date === "1941-09-28") {
      notesNotPersisted.push({
        matchId: ins[0].id,
        note: "Esta vitória garantiu o título alagoano de 1941 ao CSA.",
        reason: "Tabela matches não possui coluna de observação/notas",
      });
    }

    inserted.push({
      id: ins[0].id,
      date: m.date,
      competition: m.competition,
      opponent: opp.name,
      score: `${m.goalsFor}x${m.goalsAgainst}`,
      result: m.result,
      homeAway: m.homeAway,
      phase: m.phase ?? null,
    });
  }

  const alaId = competitionIds.get("Campeonato Alagoano");
  const torneioId = competitionIds.get("Torneio Início de Alagoas");

  const alaStats = alaId
    ? await refreshSeasonCompStats(SEASON, alaId, "1º")
    : null;
  const torneioStats = torneioId
    ? await refreshSeasonCompStats(SEASON, torneioId, "1º")
    : null;

  // Ensure Alagoano classification remains title
  if (alaId) {
    await client.query(
      `UPDATE season_competition_stats
       SET classification = '1º'
       WHERE season = $1 AND competition_id = $2
         AND (classification IS DISTINCT FROM '1º')`,
      [SEASON, alaId],
    );
  }

  await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        createdCompetitions,
        createdOpponents,
        insertedCount: inserted.length,
        skippedCount: skipped.length,
        inserted,
        skipped,
        notesNotPersisted,
        seasonCompetitionStats: {
          alagoano: alaStats,
          torneioInicio: torneioStats,
        },
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
