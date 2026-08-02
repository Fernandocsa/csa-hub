/**
 * Apply complementary Alagoano 1999 sheets (stadiums, refs, CSA/opp lineups, goals).
 * Also corrects stub dates/scores that diverge from the source text.
 * Técnico não informado — não grava manager.
 *
 * Usage: node scripts/apply-1999-alagoano-sheets.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  MATCH_FIXES,
  SHEETS,
} from "./data/season-1999-alagoano-sheets.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
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

function resultOf(gf, ga) {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

/** Known late-90s CSA players → id. */
const FORCE_ID = {
  fabinho: 828,
  givaldo: 882,
  mimi: 535,
  otavio: 1057,
  otávio: 1057,
  williams: 1164,
  willams: 1164,
  "willams souza": 1164,
  willian: 1165,
  wiliam: 1165,
  "luiz carlos": 962,
  "luis carlos": 962,
  "luís carlos": 962,
};

const CREATE_META = {
  wanderley: { name: "Wanderley", position: "Goleiro", forceNew: true },
  souza: { name: "Souza", position: "Lateral Direito", forceNew: true },
  jeferson: { name: "Jeferson", position: "Volante", forceNew: true },
  everaldo: { name: "Everaldo", position: "Meia", forceNew: true },
  nailson: { name: "Naílson", position: "Atacante", forceNew: true },
  naílson: { name: "Naílson", position: "Atacante", forceNew: true },
  leo: { name: "Léo", position: "Meia", forceNew: true },
  léo: { name: "Léo", position: "Meia", forceNew: true },
  erly: { name: "Erly", position: "Lateral", forceNew: true },
  andre: { name: "André", position: "Zagueiro", forceNew: true },
  andré: { name: "André", position: "Zagueiro", forceNew: true },
  leonardo: { name: "Leonardo", position: "Atacante", forceNew: true },
  pastor: { name: "Pastor", position: "Meia", forceNew: true },
  "fabinho goiano": { name: "Fabinho Goiano", position: "Meia", forceNew: true },
  genilson: { name: "Genílson", position: "Atacante", forceNew: true },
  genílson: { name: "Genílson", position: "Atacante", forceNew: true },
  reinaldo: { name: "Reinaldo", position: "Atacante", forceNew: true },
};

const STADIUM_META = {
  "estadio elisio da silva maia": {
    name: "Estádio Elísio da Silva Maia",
    city: "Pão de Açúcar",
  },
};

const playerCache = new Map();
const createdPlayers = [];

async function ensureCsaPlayer(raw) {
  const key = norm(raw);
  if (playerCache.has(key)) return playerCache.get(key);

  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${raw} → ${FORCE_ID[key]}`);
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  const meta = CREATE_META[key];
  if (!meta) throw new Error(`Unresolved CSA player: "${raw}" (${key})`);

  let rows = [];
  if (!meta.forceNew) {
    ({ rows } = await client.query(
      `SELECT p.id, p.name
       FROM players p
       JOIN player_season_stats pss ON pss.player_id = p.id
       WHERE p.name = $1 AND pss.season::text = $2
       ORDER BY p.id LIMIT 1`,
      [meta.name, SEASON],
    ));
    if (!rows[0]) {
      ({ rows } = await client.query(
        `SELECT id, name FROM players WHERE name=$1 ORDER BY id LIMIT 1`,
        [meta.name],
      ));
    }
  } else {
    ({ rows } = await client.query(
      `SELECT p.id, p.name
       FROM players p
       JOIN player_season_stats pss ON pss.player_id = p.id
       WHERE p.name = $1 AND pss.season::text = $2
       ORDER BY p.id LIMIT 1`,
      [meta.name, SEASON],
    ));
  }

  if (!rows[0]) {
    if (DRY) {
      const fake = { id: -createdPlayers.length - 1, name: meta.name };
      createdPlayers.push(fake);
      playerCache.set(key, fake);
      playerCache.set(norm(fake.name), fake);
      return fake;
    }
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷','unverified') RETURNING id, name`,
      [meta.name, meta.position],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
    await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1,$2,0,0,0)
       ON CONFLICT DO NOTHING`,
      [rows[0].id, SEASON],
    );
  }

  playerCache.set(key, rows[0]);
  playerCache.set(norm(rows[0].name), rows[0]);
  return rows[0];
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  if (DRY) return { id: null, name };
  const ins = await client.query(
    `INSERT INTO referees (name, state) VALUES ($1,'AL') RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
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
  const meta = STADIUM_META[norm(name)];
  if (DRY) return { id: null, name: meta?.name ?? name };
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,'AL','Brasil')
     RETURNING id, name`,
    [meta?.name ?? name, meta?.city ?? null],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function scorersText(csaGoals = []) {
  const counts = new Map();
  for (const g of csaGoals) {
    if (g.ownGoalFor) {
      const label = `${g.name} (gc)`;
      counts.set(label, (counts.get(label) ?? 0) + 1);
      continue;
    }
    counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
  }
  const parts = [...counts.entries()].map(([n, c]) => (c > 1 ? `${n} (${c})` : n));
  return parts.length ? parts.join(", ") : null;
}

async function syncSeasonFromSheets(season) {
  const { rows: stats } = await client.query(
    `
    WITH played AS (
      SELECT DISTINCT ml.match_id, ml.player_id
      FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id
      WHERE m.season::text=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
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
      WHERE m.season::text=$1 AND mg.side='csa' AND mg.scorer_player_id IS NOT NULL
        AND coalesce(mg.is_own_goal,false)=false
        AND coalesce(m.is_friendly,false)=false
        AND coalesce(m.status,'played')<>'scheduled'
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

  let updated = 0;
  let inserted = 0;
  for (const s of stats) {
    const { rows: cur } = await client.query(
      `SELECT id, appearances, goals FROM player_season_stats
       WHERE player_id=$1 AND season::text=$2`,
      [s.player_id, season],
    );
    if (cur[0]) {
      if (cur[0].appearances !== s.appearances || cur[0].goals !== s.goals) {
        if (!DRY) {
          await client.query(
            `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
            [cur[0].id, s.appearances, s.goals],
          );
        }
        updated++;
      }
    } else if (!DRY) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,$4,0)`,
        [s.player_id, season, s.appearances, s.goals],
      );
      inserted++;
    } else {
      inserted++;
    }
  }
  return { players: stats.length, updated, inserted };
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
     WHERE season::text=$1 AND competition_id=$2
       AND coalesce(is_friendly,false)=false
       AND coalesce(status,'played')<>'scheduled'
       AND result IN ('win','draw','loss')`,
    [season, competitionId],
  );
  const a = agg[0];
  if (!DRY) {
    await client.query(
      `UPDATE season_competition_stats
       SET games=$1, wins=$2, draws=$3, losses=$4, goals_for=$5, goals_against=$6,
           classification='1º', is_champion=true,
           stats_source='calculated', stats_recalculated_at=now()
       WHERE season::text=$7 AND competition_id=$8`,
      [
        a.games,
        a.wins,
        a.draws,
        a.losses,
        a.goals_for,
        a.goals_against,
        season,
        competitionId,
      ],
    );
  }
  return a;
}

try {
  if (!DRY) await client.query("BEGIN");

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Missing ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  const { rows: allMatches } = await client.query(
    `SELECT id, match_date::date::text AS d, goals_for, goals_against, result,
            stadium_id, attendance, gross_revenue_text, phase, round
     FROM matches
     WHERE season::text=$1 AND competition_id=$2
     ORDER BY match_date, id`,
    [SEASON, competitionId],
  );

  const fixes = [];
  for (const m of allMatches) {
    const fix = MATCH_FIXES[m.d];
    if (!fix) continue;

    const stadium = fix.stadium ? await ensureStadium(fix.stadium) : null;
    const gf = fix.goalsFor ?? m.goals_for;
    const ga = fix.goalsAgainst ?? m.goals_against;
    const result = resultOf(gf, ga);
    const newDate = fix.newDate ?? m.d;

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           match_date = $2,
           phase = COALESCE($3, phase),
           round = COALESCE($4, round),
           stadium_id = COALESCE($5, stadium_id),
           goals_for = $6,
           goals_against = $7,
           result = $8,
           attendance = COALESCE($9, attendance),
           gross_revenue_text = COALESCE($10, gross_revenue_text)
         WHERE id=$1`,
        [
          m.id,
          newDate,
          fix.phase ?? null,
          fix.round ?? null,
          stadium?.id ?? null,
          gf,
          ga,
          result,
          fix.attendance ?? null,
          fix.revenueText ?? null,
        ],
      );
    }
    fixes.push({
      id: m.id,
      from: m.d,
      to: newDate,
      score: `${gf}x${ga}`,
      phase: fix.phase,
      stadium: stadium?.name ?? null,
    });
  }

  const { rows: matchesAfter } = await client.query(
    `SELECT id, match_date::date::text AS d FROM matches
     WHERE season::text=$1 AND competition_id=$2
     ORDER BY match_date, id`,
    [SEASON, competitionId],
  );

  const sheetByDate = new Map(SHEETS.map((s) => [s.date, s]));
  const applied = [];

  for (const m of matchesAfter) {
    const sheet = sheetByDate.get(m.d);
    if (!sheet) continue;

    const referee = await ensureReferee(sheet.referee ?? null);
    const scorers = scorersText(sheet.csaGoals);

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           referee_id = COALESCE($2, referee_id),
           scorers = COALESCE($3, scorers)
         WHERE id=$1`,
        [m.id, referee?.id ?? null, scorers],
      );
    }

    const hasLineup = (sheet.starters?.length ?? 0) > 0;
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;

    if (!hasLineup && !hasGoals) {
      applied.push({ id: m.id, date: m.d, note: "meta-only" });
      continue;
    }

    if (!DRY) {
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [m.id]);
    }

    const csaLineup = new Map();
    const oppLineup = new Map();
    let sort = 0;

    for (const name of sheet.starters ?? []) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [m.id, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      } else {
        csaLineup.set(p.id, sort++);
      }
    }

    const bench = [];
    for (const s of sheet.subs ?? []) {
      if (!bench.includes(s.in)) bench.push(s.in);
    }
    for (const name of bench) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [m.id, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      } else {
        csaLineup.set(p.id, sort++);
      }
    }

    for (const g of sheet.csaGoals ?? []) {
      if (g.ownGoalFor) continue;
      const p = await ensureCsaPlayer(g.name);
      if (csaLineup.has(p.id)) continue;
      // Full XI: scorer on bench. Goals-only: starter so profile/apps count the match.
      const role = hasLineup ? "bench" : "starter";
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,$4,NULL,NULL,$5) RETURNING id`,
          [m.id, p.id, p.name, role, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      } else csaLineup.set(p.id, sort++);
    }

    let oppSort = 0;
    for (const name of sheet.oppStarters ?? []) {
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'opponent',NULL,$2,'starter',NULL,NULL,$3) RETURNING id`,
          [m.id, name, oppSort++],
        );
        oppLineup.set(norm(name), rows[0].id);
      } else {
        oppLineup.set(norm(name), oppSort++);
      }
    }
    for (const s of sheet.oppSubs ?? []) {
      if (oppLineup.has(norm(s.in))) continue;
      if (!DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'opponent',NULL,$2,'bench',NULL,NULL,$3) RETURNING id`,
          [m.id, s.in, oppSort++],
        );
        oppLineup.set(norm(s.in), rows[0].id);
      } else {
        oppLineup.set(norm(s.in), oppSort++);
      }
    }

    for (const s of sheet.subs ?? []) {
      const outP = await ensureCsaPlayer(s.out);
      const inP = await ensureCsaPlayer(s.in);
      if (!DRY) {
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
          [
            m.id,
            csaLineup.get(outP.id) ?? null,
            outP.id,
            outP.name,
            csaLineup.get(inP.id) ?? null,
            inP.id,
            inP.name,
            s.minute ?? 0,
          ],
        );
      }
    }

    for (const s of sheet.oppSubs ?? []) {
      if (!DRY) {
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
           VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,$6,NULL)`,
          [
            m.id,
            oppLineup.get(norm(s.out)) ?? null,
            s.out,
            oppLineup.get(norm(s.in)) ?? null,
            s.in,
            s.minute ?? 0,
          ],
        );
      }
    }

    for (const g of sheet.csaGoals ?? []) {
      if (g.ownGoalFor) {
        if (!DRY) {
          await client.query(
            `INSERT INTO match_goals
               (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
                minute, injury_time_minute, is_penalty, is_own_goal, own_goal_direction)
             VALUES ($1,'csa',NULL,NULL,$2,$3,NULL,false,true,'for')`,
            [m.id, g.name, g.minute ?? 0],
          );
        }
        continue;
      }
      const p = await ensureCsaPlayer(g.name);
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
          [
            m.id,
            csaLineup.get(p.id) ?? null,
            p.id,
            p.name,
            g.minute ?? 0,
            !!g.penalty,
          ],
        );
      }
    }

    for (const g of sheet.oppGoals ?? []) {
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'opponent',$2,NULL,$3,$4,NULL,$5,false)`,
          [
            m.id,
            oppLineup.get(norm(g.name)) ?? null,
            g.name,
            g.minute ?? 0,
            !!g.penalty,
          ],
        );
      }
    }

    const ogFor = (sheet.csaGoals ?? []).filter((g) => g.ownGoalFor).length;
    if (ogFor && !DRY) {
      await client.query(`UPDATE matches SET own_goals_for_count=$2 WHERE id=$1`, [
        m.id,
        ogFor,
      ]);
    }

    applied.push({
      id: m.id,
      date: m.d,
      starters: sheet.starters?.length ?? 0,
      csaGoals: sheet.csaGoals?.length ?? 0,
      oppGoals: sheet.oppGoals?.length ?? 0,
    });
  }

  // Link knockout legs
  const byDate = new Map(matchesAfter.map((m) => [m.d, m.id]));
  const pairs = [
    ["1999-07-15", "1999-07-17"],
    ["1999-07-24", "1999-07-27"],
  ];
  if (!DRY) {
    for (const [a, b] of pairs) {
      const idA = byDate.get(a);
      const idB = byDate.get(b);
      if (idA && idB) {
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [idA, idB]);
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [idB, idA]);
      }
    }
    // 3º jogo da final ↔ 2º jogo
    const id2 = byDate.get("1999-07-27");
    const id3 = byDate.get("1999-07-31");
    if (id2 && id3) {
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [id3, id2]);
    }
  }

  const sync = await syncSeasonFromSheets(SEASON);
  const seasonAgg = await refreshSeasonCompStats(SEASON, competitionId);

  if (DRY) {
    console.log("DRY RUN — no writes");
  } else {
    await client.query("COMMIT");
    console.log("COMMIT ok");
  }
  console.log("fixes", fixes.length);
  console.table(fixes);
  console.log("createdPlayers", createdPlayers);
  console.log("sync", sync);
  console.log("seasonAgg", seasonAgg);
  console.table(applied);
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
