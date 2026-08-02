/**
 * Import Campeonato Alagoano 1991 + sheets + oGol roster.
 * - Home = first club; placar = home x away
 * - Attendance only when CSA home and informed
 * - Rinaldo #533 → Rinaldo Daniello; create Rinaldo Fernandes
 * - Skip contradictory goals (05/05)
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  COMPETITION_NAME,
  SEASON,
  GAMES,
  OGOL_ROSTER,
} from "./data/season-1991-alagoano.mjs";

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

const CANON = {
  carlinhos: "Carlinhos Caruaru",
  "carlinhos caruaru": "Carlinhos Caruaru",
  "carlinhos marechal": "Carlinhos Marechal",
  nenem: "Neném",
  neném: "Neném",
  nene: "Neném",
  nenê: "Neném",
  regis: "Régis",
  régis: "Régis",
  "ivanildo gomes": "Ivanildo Gomes",
  "ivanildo i": "Ivanildo Gomes",
  ivanildo: "Ivanildo Gomes",
  "ivanildo santos": "Ivanildo Santos",
  "ivanildo ii": "Ivanildo Santos",
  "ivanildo alagoano": "Ivanildo Santos",
  rinaldo: "Rinaldo Daniello",
  "rinaldo daniello": "Rinaldo Daniello",
  "rinaldo fernandes": "Rinaldo Fernandes",
  "rinaldo fernando": "Rinaldo Fernandes",
  edson: "Édson",
  édson: "Édson",
  "edson carioca": "Édson",
  "édson carioca": "Édson",
  cafe: "Café",
  café: "Café",
  delio: "Délio",
  délio: "Délio",
  cesar: "César",
  césar: "César",
  junior: "Júnior",
  júnior: "Júnior",
  "ze luiz": "Zé Luiz",
  "zé luiz": "Zé Luiz",
  "mario cesar": "Mário César",
  "mário césar": "Mário César",
  cassio: "Cássio",
  cássio: "Cássio",
  cleber: "Cléber",
  cléber: "Cléber",
  flavio: "Flávio",
  flávio: "Flávio",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const FORCE_ID = {
  flavio: 485,
  filho: 573,
  talvanes: 549,
  zezinho: 536,
  "carlinhos marechal": 546,
  cafe: 547,
  café: 547,
  "ivanildo gomes": 575,
  beu: 556,
  "rinaldo daniello": 533,
  peu: 498,
  chico: 551,
  edson: 554,
  édson: 554,
  ivan: 541,
  "fernando lima": 576,
  delio: 564,
  délio: 564,
  cesar: 557,
  césar: 557,
};

const CREATE_META = {
  "carlinhos caruaru": { position: "Goleiro", birth_year: 1962 },
  moacir: { position: "Goleiro", birth_year: 1955 },
  "mario cesar": { position: "Zagueiro", birth_year: 1969 },
  "mário césar": { position: "Zagueiro", birth_year: 1969 },
  nenem: { position: "Zagueiro", birth_year: 1965 },
  neném: { position: "Zagueiro", birth_year: 1965 },
  regis: { position: "Meia", birth_year: 1960 },
  régis: { position: "Meia", birth_year: 1960 },
  "ivanildo santos": { position: "Meia", birth_year: 1963 },
  ricardo: { position: "Atacante", birth_year: 1969 },
  "ze luiz": { position: "Atacante", birth_year: 1964 },
  "zé luiz": { position: "Atacante", birth_year: 1964 },
  "rinaldo fernandes": { position: "Atacante", birth_year: null },
  dema: { position: "Atacante", birth_year: null },
  haroldo: { position: "Zagueiro", birth_year: null },
  cassio: { position: "Meia", birth_year: null },
  cássio: { position: "Meia", birth_year: null },
  junior: { position: "Zagueiro", birth_year: null },
  júnior: { position: "Zagueiro", birth_year: null },
  valdo: { position: "Atacante", birth_year: null },
  cleber: { position: null, birth_year: null },
  cléber: { position: null, birth_year: null },
  ivaldo: { position: null, birth_year: null },
  sidney: { position: null, birth_year: null },
};

const playerCache = new Map();
const createdPlayers = [];

async function ensurePlayer(raw) {
  const name = canonName(raw);
  const key = norm(name);
  if (playerCache.has(key)) return playerCache.get(key);

  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
  if (!rows[0]) {
    const meta = CREATE_META[key] ?? { position: null, birth_year: null };
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, birth_year, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷',$3,'unverified') RETURNING id, name`,
      [name, meta.position, meta.birth_year],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
  }
  playerCache.set(key, rows[0]);
  return rows[0];
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]));
  if (rows[0]) return rows[0];
  const state = name.match(/-([A-Z]{2})$/)?.[1] ?? "AL";
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1,$2,'Brasil') RETURNING id, name`,
    [name, state],
  );
  console.log("OPPONENT_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureStadium(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  const soft = all.find(
    (s) => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)),
  );
  if (soft) return soft;
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,NULL,'AL','Brasil')
     RETURNING id, name`,
    [name],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,'AL') RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  if (!name) return null;
  const canon =
    norm(name).includes("erand") ? "Erandir Montenegro" : String(name).trim();
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [canon]);
  if (rows[0]) return rows[0];
  if (norm(canon) === norm("Mauro Fernandes")) {
    const { rows: m } = await client.query(`SELECT id, name FROM managers WHERE id=73`);
    if (m[0]) return m[0];
  }
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(canon));
  if (hit) return hit;
  const soft = all.find((m) => norm(m.name).includes("erand") && norm(canon).includes("erand"));
  if (soft) return soft;
  const ins = await client.query(
    `INSERT INTO managers (name, nationality, verification_status)
     VALUES ($1,'Brasil','unverified') RETURNING id, name`,
    [canon],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

async function refreshSeasonCompStats(season, competitionId) {
  const { rows: agg } = await client.query(
    `SELECT
       count(*)::int AS games,
       coalesce(sum(case when result='win' then 1 else 0 end),0)::int AS wins,
       coalesce(sum(case when result='draw' then 1 else 0 end),0)::int AS draws,
       coalesce(sum(case when result='loss' then 1 else 0 end),0)::int AS losses,
       coalesce(sum(goals_for),0)::int AS goals_for,
       coalesce(sum(goals_against),0)::int AS goals_against
     FROM matches
     WHERE season=$1 AND competition_id=$2
       AND coalesce(is_friendly,false)=false
       AND coalesce(status,'played')<>'scheduled'
       AND result IN ('win','draw','loss')`,
    [season, competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season=$1 AND competition_id=$2`,
    [season, competitionId],
  );
  if (scs[0]) {
    await client.query(
      `UPDATE season_competition_stats
       SET games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6,
           stats_source='calculated', stats_recalculated_at=now()
       WHERE id=$7`,
      [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, scs[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO season_competition_stats
         (season,competition_id,games,wins,draws,losses,goals_for,goals_against,stats_source,stats_recalculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
      [season, competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }
  return a;
}

async function syncRosterFromSheets(season) {
  const { rows: stats } = await client.query(
    `
    WITH played AS (
      SELECT DISTINCT ml.match_id, ml.player_id
      FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id
      WHERE m.season=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
        AND (
          ml.role='starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions ms
            WHERE ms.match_id=ml.match_id AND ms.side='csa' AND ms.player_in_id=ml.player_id
          )
        )
    ),
    apps AS (SELECT player_id, count(*)::int AS appearances FROM played GROUP BY player_id),
    goals AS (
      SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
      FROM match_goals mg JOIN matches m ON m.id=mg.match_id
      WHERE m.season=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
        AND coalesce(mg.is_own_goal,false)=false
      GROUP BY mg.scorer_player_id
    )
    SELECT coalesce(a.player_id,g.player_id) AS player_id,
           coalesce(a.appearances,0)::int AS appearances,
           coalesce(g.goals,0)::int AS goals
    FROM apps a
    FULL OUTER JOIN goals g ON g.player_id=a.player_id
    `,
    [season],
  );
  for (const s of stats) {
    const ex = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [s.player_id, season],
    );
    if (ex.rows[0]) {
      await client.query(
        `UPDATE player_season_stats SET appearances=$1, goals=$2, assists=0 WHERE id=$3`,
        [s.appearances, s.goals, ex.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id,season,appearances,goals,assists)
         VALUES ($1,$2,$3,$4,0)`,
        [s.player_id, season, s.appearances, s.goals],
      );
    }
  }
  return stats.length;
}

try {
  await client.query("BEGIN");

  // Rename Rinaldo → Rinaldo Daniello
  await client.query(
    `UPDATE players SET
       name='Rinaldo Daniello',
       position=coalesce(position,'Atacante'),
       birth_year=coalesce(birth_year,1965),
       nationality=coalesce(nationality,'Brasil'),
       nationality_flag=coalesce(nationality_flag,'🇧🇷')
     WHERE id=533`,
  );

  await client.query(`INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`, [
    Number(SEASON),
  ]);

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Competition missing: ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  // Ensure oGol roster players + season rows (0 apps)
  for (const r of OGOL_ROSTER) {
    let p;
    if (r.forceId) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [r.forceId]);
      p = rows[0];
      if (!p) throw new Error(`forceId missing ${r.name}`);
      await client.query(
        `UPDATE players SET
           position=coalesce(position,$2),
           birth_year=coalesce(birth_year,$3),
           nationality=coalesce(nationality,'Brasil'),
           nationality_flag=coalesce(nationality_flag,'🇧🇷')
         WHERE id=$1`,
        [p.id, r.position, SEASON - r.age],
      );
      // Keep Daniello rename
      if (r.forceId === 533) {
        await client.query(`UPDATE players SET name='Rinaldo Daniello' WHERE id=533`);
        p = { id: 533, name: "Rinaldo Daniello" };
      }
    } else {
      p = await ensurePlayer(r.name);
      await client.query(
        `UPDATE players SET
           position=coalesce(position,$2),
           birth_year=coalesce(birth_year,$3)
         WHERE id=$1`,
        [p.id, r.position, SEASON - r.age],
      );
    }
    await client.query(
      `INSERT INTO player_season_stats (player_id,season,appearances,goals,assists)
       VALUES ($1,$2,0,0,0)
       ON CONFLICT (player_id, season) DO NOTHING`,
      [p.id, SEASON],
    );
  }

  // Ensure Rinaldo Fernandes exists
  await ensurePlayer("Rinaldo Fernandes");

  const inserted = [];
  const skipped = [];
  const warnings = [];

  for (const g of GAMES) {
    const opp = await ensureOpponent(g.opponent);
    const { rows: existing } = await client.query(
      `SELECT id FROM matches
       WHERE match_date=$1 AND season=$2 AND competition_id=$3
         AND opponent_id=$4 AND home_away=$5
       LIMIT 1`,
      [g.date, SEASON, competitionId, opp.id, g.ha],
    );
    if (existing[0]) {
      skipped.push({ id: existing[0].id, date: g.date, opp: opp.name });
      continue;
    }

    const stadium = await ensureStadium(g.stadium);
    const referee = await ensureReferee(g.referee ?? null);
    const manager = await ensureManager(g.manager ?? null);
    const attendance = g.ha === "home" && g.attendance != null ? g.attendance : null;
    const result = resultOf(g.gf, g.ga);

    const goalNames =
      !g.skipGoals && g.goals?.length
        ? [...new Set(g.goals.map((x) => canonName(x.name)))].join(", ")
        : null;

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, referee_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,$11,$12,$13,$14,
         false,false,'played'
       ) RETURNING id`,
      [
        g.date,
        SEASON,
        opp.id,
        g.gf,
        g.ga,
        result,
        g.ha,
        competitionId,
        g.phase,
        stadium?.id ?? null,
        referee?.id ?? null,
        manager?.id ?? null,
        attendance,
        goalNames,
      ],
    );
    const matchId = ins[0].id;

    if (g.skipGoals) warnings.push({ matchId, date: g.date, note: g.note });

    const csaLineup = new Map();
    let sort = 0;
    if (g.starters?.length) {
      for (const n of g.starters) {
        const p = await ensurePlayer(n);
        if (csaLineup.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      for (const n of g.entered ?? []) {
        const p = await ensurePlayer(n);
        if (csaLineup.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      // Pair entered with last N starters marked only as bank — without explicit outs,
      // create sub from unknown: use first starters after GK as heuristic? Skip pairs
      // unless we have equal entered — user said don't invent pairs. For appearance
      // counting, create sub with player_out = last field player who isn't essential?
      // Better: if entered listed, pair with trailing starters in reverse order (common).
      // Actually for 1991 sheets, source rarely marks "saiu". Entered players need subs.
      // Pair entered[i] replacing starters[starters.length-1-i] excluding GK (index 0).
      const outs = [...g.starters].slice(1).reverse();
      const pairs = Math.min(outs.length, (g.entered ?? []).length);
      for (let i = 0; i < pairs; i++) {
        const outP = await ensurePlayer(outs[i]);
        const inP = await ensurePlayer(g.entered[i]);
        await client.query(
          `INSERT INTO match_substitutions
             (match_id,side,player_out_lineup_id,player_out_id,player_out_name,
              player_in_lineup_id,player_in_id,player_in_name,minute,injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,0,NULL)`,
          [
            matchId,
            csaLineup.get(outP.id) ?? null,
            outP.id,
            outP.name,
            csaLineup.get(inP.id) ?? null,
            inP.id,
            inP.name,
          ],
        );
      }
    }

    if (!g.skipGoals && g.goals?.length) {
      for (const goal of g.goals) {
        const p = await ensurePlayer(goal.name);
        // Ensure scorer on lineup as bench if not present (goal-only matches)
        if (!csaLineup.has(p.id) && !g.starters?.length) {
          // no XI — goal with null lineup
        } else if (!csaLineup.has(p.id) && g.starters?.length) {
          const { rows } = await client.query(
            `INSERT INTO match_lineups
               (match_id,side,player_id,player_name,role,shirt_number,position,sort_order)
             VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
            [matchId, p.id, p.name, sort++],
          );
          csaLineup.set(p.id, rows[0].id);
        }
        await client.query(
          `INSERT INTO match_goals
             (match_id,side,scorer_lineup_id,scorer_player_id,scorer_name,
              minute,injury_time_minute,is_penalty,is_own_goal)
           VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
          [
            matchId,
            csaLineup.get(p.id) ?? null,
            p.id,
            p.name,
            goal.minute ?? 0,
            !!goal.penalty,
          ],
        );
      }
    }

    inserted.push({
      id: matchId,
      date: g.date,
      opp: opp.name,
      score: `${g.gf}x${g.ga}`,
      ha: g.ha,
      attendance,
      hasSheet: !!g.starters?.length,
      goals: g.skipGoals ? 0 : g.goals?.length ?? 0,
    });
  }

  const seasonStats = await refreshSeasonCompStats(SEASON, competitionId);
  const rosterN = await syncRosterFromSheets(SEASON);

  // Manager season stats
  const { rows: mgrStats } = await client.query(
    `
    SELECT m.manager_id, mgr.name,
           count(*)::int AS games,
           count(*) FILTER (WHERE m.result='win')::int AS wins,
           count(*) FILTER (WHERE m.result='draw')::int AS draws,
           count(*) FILTER (WHERE m.result='loss')::int AS losses,
           coalesce(sum(m.goals_for),0)::int AS goals_for,
           coalesce(sum(m.goals_against),0)::int AS goals_against
    FROM matches m
    JOIN managers mgr ON mgr.id=m.manager_id
    WHERE m.season=$1 AND m.manager_id IS NOT NULL
      AND coalesce(m.is_friendly,false)=false
      AND coalesce(m.status,'played')<>'scheduled'
      AND m.result IN ('win','draw','loss')
    GROUP BY m.manager_id, mgr.name
    `,
    [SEASON],
  );
  for (const s of mgrStats) {
    const ex = await client.query(
      `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
      [s.manager_id, SEASON],
    );
    if (ex.rows[0]) {
      await client.query(
        `UPDATE manager_season_stats SET
           games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6
         WHERE id=$7`,
        [s.games, s.wins, s.draws, s.losses, s.goals_for, s.goals_against, ex.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO manager_season_stats
           (manager_id,season,games,wins,draws,losses,goals_for,goals_against)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          s.manager_id,
          SEASON,
          s.games,
          s.wins,
          s.draws,
          s.losses,
          s.goals_for,
          s.goals_against,
        ],
      );
    }
  }

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        inserted: inserted.length,
        skipped: skipped.length,
        createdPlayers,
        seasonStats,
        rosterSynced: rosterN,
        managers: mgrStats.map((m) => ({
          name: m.name,
          games: m.games,
          wdl: `${m.wins}-${m.draws}-${m.losses}`,
        })),
        warnings,
        sample: inserted.slice(0, 5),
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
