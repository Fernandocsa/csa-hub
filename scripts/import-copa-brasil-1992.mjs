/**
 * Import CSA — Copa do Brasil 1992.
 * - Skip if match already exists (date/season/comp/opponent/home_away)
 * - Goals from source (minute=0 when unknown — schema NOT NULL)
 * - Lineup only for 25/09 (Correio do Povo), confirmed by user
 * - No attendance/referee invented
 * - Player links confirmed by user
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  COMPETITION_NAME,
  SEASON,
  GAMES,
  PLAYERS,
} from "./data/season-1992-copa-brasil.mjs";

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

function playerId(name) {
  const id = PLAYERS[name] ?? PLAYERS[String(name).trim()];
  if (!id) throw new Error(`Unmapped player: ${name}`);
  return id;
}

async function playerRow(name) {
  const id = playerId(name);
  const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [id]);
  if (!rows[0]) throw new Error(`Player id ${id} missing for ${name}`);
  return rows[0];
}

async function ensureOpponent(name) {
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name = $1`, [name]);
  if (rows[0]) return rows[0];
  ({ rows } = await client.query(`SELECT id, name FROM opponents WHERE lower(name)=lower($1)`, [
    name,
  ]));
  if (rows[0]) return rows[0];
  throw new Error(`Opponent missing (do not invent): ${name}`);
}

async function ensureStadium(name, city, state) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM stadiums WHERE name = $1`, [name]);
  if (rows[0]) {
    if (city || state) {
      await client.query(
        `UPDATE stadiums SET
           city = coalesce(city, $2),
           state = coalesce(state, $3)
         WHERE id=$1`,
        [rows[0].id, city ?? null, state ?? null],
      );
    }
    return rows[0];
  }
  const { rows: all } = await client.query(`SELECT id, name FROM stadiums`);
  const hit = all.find((s) => norm(s.name) === norm(name));
  if (hit) return hit;
  // Rei Pelé soft-match
  const soft = all.find(
    (s) => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)),
  );
  if (soft && (norm(name).includes("rei pel") || soft.name.includes("Rei Pelé"))) return soft;

  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country)
     VALUES ($1, $2, $3, 'Brasil') RETURNING id, name`,
    [name, city ?? null, state ?? null],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
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

  const byKey = new Map();
  const inserted = [];
  const skipped = [];

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
      skipped.push({ id: existing[0].id, key: g.key });
      byKey.set(g.key, existing[0].id);
      continue;
    }

    const stadium = await ensureStadium(g.stadium, g.stadiumCity, g.stadiumState);
    const scorerNames = [...new Set(g.goals.map((n) => (n === "Chiquinho" ? "Chico" : n)))];

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         stadium_id, manager_id, attendance, scorers,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL,$13,
         false, false, 'played'
       ) RETURNING id`,
      [
        g.date,
        SEASON,
        opp.id,
        g.gf,
        g.ga,
        g.result,
        g.ha,
        competitionId,
        g.phase,
        g.round,
        stadium?.id ?? null,
        g.managerId ?? null,
        scorerNames.length ? scorerNames.join(", ") : null,
      ],
    );
    const matchId = ins[0].id;
    byKey.set(g.key, matchId);

    const csaLineup = new Map(); // playerId → lineupId
    let sort = 0;

    if (g.sheet) {
      for (const name of g.sheet.starters) {
        const p = await playerRow(name);
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [matchId, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      for (const sub of g.sheet.subs) {
        const inP = await playerRow(sub.in);
        if (csaLineup.has(inP.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [matchId, inP.id, inP.name, sort++],
        );
        csaLineup.set(inP.id, rows[0].id);
      }
      for (const sub of g.sheet.subs) {
        const outP = await playerRow(sub.out);
        const inP = await playerRow(sub.in);
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
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

    for (const rawName of g.goals) {
      const p = await playerRow(rawName);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'csa',$2,$3,$4,0,NULL,false,false)`,
        [matchId, csaLineup.get(p.id) ?? null, p.id, p.name],
      );
    }

    inserted.push({
      id: matchId,
      key: g.key,
      date: g.date,
      opponent: opp.name,
      score: `${g.gf}x${g.ga}`,
      stadium: stadium?.name ?? null,
      goals: g.goals.length,
      hasSheet: !!g.sheet,
    });
  }

  // Link ida ↔ volta
  const pairs = [
    ["tuna-ida", "tuna-volta"],
    ["vasco-ida", "vasco-volta"],
    ["sport-ida", "sport-volta"],
  ];
  for (const [a, b] of pairs) {
    const idA = byKey.get(a);
    const idB = byKey.get(b);
    if (!idA || !idB) continue;
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [idA, idB]);
    await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [idB, idA]);
  }

  const stats = await refreshSeasonCompStats(SEASON, competitionId);

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        inserted,
        skipped,
        seasonCompetitionStats: stats,
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
