/**
 * Import CSA — Campeonato Alagoano 1992.
 * - Skip if match already exists (same date/season/comp/opponent/home_away)
 * - Attendance only when CSA home AND informed
 * - 09/12 Capela: result=unknown, null score → /partidas/sem-resultado
 * - Does not invent scores; unknown excluded from official stats
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { COMPETITION_NAME, SEASON, GAMES } from "./data/season-1992-alagoano.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name = $1`, [name]);
  if (rows[0]) return { ...rows[0], created: false };
  ({ rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]));
  if (rows[0]) return { ...rows[0], created: false };
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1, 'AL', 'Brasil') RETURNING id, name`,
    [name],
  );
  return { ...ins.rows[0], created: true };
}

async function ensureStadium(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name = $1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  const soft = all.find(
    (s) => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)),
  );
  if (soft) return soft;
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1, NULL, 'AL', 'Brasil')
     RETURNING id, name`,
    [name],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name = $1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1, 'AL') RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name = $1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO managers (name, nationality, verification_status)
     VALUES ($1, 'Brasil', 'unverified') RETURNING id, name`,
    [name],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
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

// Pre-check counts
const known = GAMES.filter((g) => g.result !== "unknown");
const unknown = GAMES.filter((g) => g.result === "unknown");
if (GAMES.length !== 40 || known.length !== 39 || unknown.length !== 1) {
  console.error("Unexpected game counts", {
    total: GAMES.length,
    known: known.length,
    unknown: unknown.length,
  });
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
       WHERE match_date = $1
         AND season = $2
         AND competition_id = $3
         AND opponent_id = $4
         AND home_away = $5
       LIMIT 1`,
      [g.date, SEASON, competitionId, opp.id, g.ha],
    );
    if (existing[0]) {
      skipped.push({ id: existing[0].id, date: g.date, opponent: opp.name, result: existing[0].result });
      continue;
    }

    const stadium = await ensureStadium(g.stadium);
    const referee = await ensureReferee(g.referee);
    const manager = await ensureManager(g.manager);

    const attendance = g.ha === "home" && g.attendance != null ? g.attendance : null;

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
         false, false, 'played'
       ) RETURNING id, result, goals_for, goals_against`,
      [
        g.date,
        SEASON,
        opp.id,
        g.gf,
        g.ga,
        g.result,
        g.ha,
        competitionId,
        g.phase ?? null,
        g.round ?? null,
        stadium?.id ?? null,
        referee?.id ?? null,
        manager?.id ?? null,
        attendance,
        g.scorers ?? null,
      ],
    );

    inserted.push({
      id: ins[0].id,
      date: g.date,
      opponent: opp.name,
      score: g.result === "unknown" ? "?x?" : `${g.gf}x${g.ga}`,
      result: g.result,
      homeAway: g.ha,
      stadium: stadium?.name ?? null,
      attendance,
    });
  }

  const stats = await refreshSeasonCompStats(SEASON, competitionId);

  const { rows: unkCheck } = await client.query(
    `SELECT m.id, m.match_date::date AS d, o.name AS opponent, m.result, m.status,
            m.goals_for, m.goals_against, s.name AS stadium
     FROM matches m
     JOIN opponents o ON o.id=m.opponent_id
     LEFT JOIN stadiums s ON s.id=m.stadium_id
     WHERE m.season=$1 AND m.result='unknown' AND m.status<>'scheduled'
       AND coalesce(m.is_friendly,false)=false AND coalesce(m.is_walkover,false)=false
     ORDER BY m.match_date`,
    [SEASON],
  );

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        inserted: inserted.length,
        skipped: skipped.length,
        createdOpponents,
        seasonStats: stats,
        expectedOfficialGames: 39,
        unknownMatches: unkCheck,
        sampleInserted: inserted.filter((x) => x.result === "unknown").concat(inserted.slice(0, 3)),
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
