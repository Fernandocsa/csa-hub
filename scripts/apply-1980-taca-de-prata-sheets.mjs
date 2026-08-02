/**
 * Apply complementary Taça de Prata 1980 sheets (CSA-only lineups).
 * Updates refs, managers, stadiums, attendance/revenue, goals, cards.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  MANAGER_NAME,
  SHEETS,
} from "./data/season-1980-taca-de-prata-sheets.mjs";

loadEnvFromDotenv(".env");
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

const FORCE_ID = {
  "ze luiz": 1689,
  "ze luis": 1689,
  beto: 712,
  paulinho: 1737, // Alagoano 1980 CB (unify vs final #1805)
  dick: 781,
  luizinho: 970,
  luisinho: 970,
  peu: 498,
  "ronaldo alves": 1110,
  ronaldo: 1110,
  "jorge siri": 931,
  dentinho: 778,
  silva: 1121,
  "luiz carlos": 960,
  "luis carlos": 960,
  alberto: 660,
  "jorge luiz": 1741,
  "jorge luis": 1741,
  gilmar: 876,
  jorginho: 1774,
  caneta: 1738,
  joca: 1734,
  "alberto leguele": 661,
  rogerio: 1736,
  "alberto carioca": 1735,
  "ze roberto": 1185,
  esquerdinha: 819,
};

const CREATE_META = {
  eli: { name: "Eli", position: "Zagueiro", forceNew: true },
  carlinhos: { name: "Carlinhos", position: "Lateral", forceNew: true },
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

  let { rows } = await client.query(
    `SELECT p.id, p.name
     FROM players p
     JOIN player_season_stats pss ON pss.player_id=p.id
     WHERE p.name=$1 AND pss.season::text=$2
     ORDER BY p.id LIMIT 1`,
    [meta.name, SEASON],
  );
  if (!rows[0] && !meta.forceNew) {
    ({ rows } = await client.query(`SELECT id, name FROM players WHERE name=$1 ORDER BY id LIMIT 1`, [
      meta.name,
    ]));
  }
  if (!rows[0]) {
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
       VALUES ($1,$2,0,0,0) ON CONFLICT DO NOTHING`,
      [rows[0].id, SEASON],
    );
  }
  playerCache.set(key, rows[0]);
  return rows[0];
}

async function ensureReferee(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM referees WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM referees`);
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO referees (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  const { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (!rows[0]) throw new Error(`Manager missing: ${name}`);
  return rows[0];
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
  // create missing (e.g. Teixeira de Castro)
  const ins = await client.query(
    `INSERT INTO stadiums (name, city, state, country) VALUES ($1,NULL,NULL,'Brasil')
     RETURNING id, name`,
    [name],
  );
  console.log("STADIUM_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function scorersText(csaGoals = []) {
  const counts = new Map();
  for (const g of csaGoals) {
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
        await client.query(
          `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
          [cur[0].id, s.appearances, s.goals],
        );
        updated++;
      }
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,$4,0)`,
        [s.player_id, season, s.appearances, s.goals],
      );
      inserted++;
    }
  }
  return { players: stats.length, updated, inserted };
}

try {
  await client.query("BEGIN");

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Missing ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;
  const manager = await ensureManager(MANAGER_NAME);

  const sheetByDate = new Map(SHEETS.map((s) => [s.date, s]));
  const dates = [...sheetByDate.keys()];

  const { rows: matches } = await client.query(
    `SELECT id, match_date::date::text AS d FROM matches
     WHERE season::text=$1 AND competition_id=$2
       AND match_date::date::text = ANY($3::text[])
     ORDER BY match_date, id`,
    [SEASON, competitionId, dates],
  );

  if (matches.length !== SHEETS.length) {
    throw new Error(
      `Expected ${SHEETS.length} matches, found ${matches.length}: ${matches.map((m) => m.d).join(",")}`,
    );
  }

  const applied = [];

  for (const m of matches) {
    const sheet = sheetByDate.get(m.d);
    const referee = await ensureReferee(sheet.referee ?? null);
    const stadium = await ensureStadium(sheet.stadium ?? null);

    await client.query(
      `UPDATE matches SET
         referee_id = COALESCE($2, referee_id),
         manager_id = CASE WHEN $3 THEN $4 ELSE manager_id END,
         stadium_id = COALESCE($5, stadium_id),
         attendance = COALESCE($6, attendance),
         gross_revenue = COALESCE($7, gross_revenue),
         gross_revenue_text = COALESCE($8, gross_revenue_text),
         scorers = $9,
         phase = COALESCE($10, phase),
         round = COALESCE($11, round)
       WHERE id=$1`,
      [
        m.id,
        referee?.id ?? null,
        !!sheet.manager,
        manager.id,
        stadium?.id ?? null,
        sheet.attendance ?? null,
        sheet.grossRevenue ?? null,
        sheet.grossRevenueText ?? null,
        scorersText(sheet.csaGoals),
        sheet.phase ?? null,
        sheet.round ?? null,
      ],
    );

    // Always replace CSA sheet data for these matches
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [m.id]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [m.id]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [m.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [m.id]);

    const csaLineup = new Map();
    let sort = 0;

    for (const name of sheet.starters ?? []) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [m.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    const bench = [];
    for (const s of sheet.subs ?? []) {
      if (!bench.includes(s.in)) bench.push(s.in);
    }
    for (const name of bench) {
      const p = await ensureCsaPlayer(name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [m.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const g of sheet.csaGoals ?? []) {
      const p = await ensureCsaPlayer(g.name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [m.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const s of sheet.subs ?? []) {
      const outP = await ensureCsaPlayer(s.out);
      const inP = await ensureCsaPlayer(s.in);
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

    for (const g of sheet.csaGoals ?? []) {
      const p = await ensureCsaPlayer(g.name);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
        [m.id, csaLineup.get(p.id) ?? null, p.id, p.name, g.minute ?? 0, !!g.penalty],
      );
    }

    for (const g of sheet.oppGoals ?? []) {
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'opponent',NULL,NULL,$2,$3,NULL,$4,false)`,
        [m.id, g.name, g.minute ?? 0, !!g.penalty],
      );
    }

    for (const name of sheet.oppReds ?? []) {
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
         VALUES ($1,'opponent','red',NULL,NULL,$2,0,NULL)`,
        [m.id, name],
      );
    }

    applied.push({
      id: m.id,
      date: m.d,
      starters: sheet.starters?.length ?? 0,
      csaGoals: sheet.csaGoals?.length ?? 0,
      oppGoals: sheet.oppGoals?.length ?? 0,
      reds: sheet.oppReds?.length ?? 0,
    });
  }

  const sync = await syncSeasonFromSheets(SEASON);

  await client.query("COMMIT");
  console.log("OK");
  console.log("createdPlayers", createdPlayers);
  console.log("sync", sync);
  console.table(applied);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
