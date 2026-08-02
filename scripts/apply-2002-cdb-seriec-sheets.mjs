/**
 * Apply complementary Copa do Brasil 2002 + Série C 2002 sheets (CSA-only).
 * Usage: node scripts/apply-2002-cdb-seriec-sheets.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  PHASE_BY_DATE,
  SHEETS,
  RELATED_PAIRS,
} from "./data/season-2002-cdb-seriec-sheets.mjs";

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

const FORCE_ID = {
  santos: 1925,
  "marcio pereira": 1874,
  "alex martins": 1937,
  ramon: 1862,
  barto: 1949,
  geninho: 1915,
  rubiano: 1946,
  "cleiton xavier": 1947,
  "cristiano alagoano": 488,
  toninho: 1909,
  lino: 540,
  "marco aurelio": 1944,
  "pedrinho maradona": 2132,
  pedrinho: 2132,
  "bruno alves": 1869,
  alexsandro: 489,
  souza: 1840,
  luciano: 1866,
  edmilson: 1920,
  "da silva": 1861,
  "carlos alberto": 1957,
  robson: 1917,
  sinval: 1918,
};

const CREATE_META = {
  "luciano paulista": {
    name: "Luciano Paulista",
    position: "Atacante",
    forceNew: true,
  },
  "rogerio gaucho": {
    name: "Rogério Gaúcho",
    position: "Zagueiro",
    forceNew: true,
  },
  betinho: { name: "Betinho", position: "Lateral", forceNew: true },
  jaelson: { name: "Jaelson", position: "Volante", forceNew: true },
  williams: { name: "Williams", position: "Meia", forceNew: true },
  moises: { name: "Moisés", position: "Atacante", forceNew: true },
  rogerio: { name: "Rogério", position: "Atacante", forceNew: true },
  "rogerio carioca": {
    name: "Rogério Carioca",
    position: "Atacante",
    forceNew: true,
  },
  vagner: { name: "Vagner", position: "Meia", forceNew: true },
  jackson: { name: "Jackson", position: "Meia", forceNew: true },
  // lateral/zaga da Série C (≠ Cristiano Alagoano)
  cristiano: { name: "Cristiano", position: "Zagueiro", forceNew: true },
};

const STADIUM_META = {
  "estadio presidente vargas campina grande": {
    name: "Estádio Presidente Vargas (Campina Grande)",
    city: "Campina Grande",
    state: "PB",
  },
};

const playerCache = new Map();
const createdPlayers = [];
const compCache = new Map();

async function competitionId(name) {
  if (compCache.has(name)) return compCache.get(name);
  const { rows } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [name]);
  if (!rows[0]) throw new Error(`Missing competition ${name}`);
  compCache.set(name, rows[0].id);
  return rows[0].id;
}

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
    ({ rows } = await client.query(
      `SELECT p.id, p.name FROM players p
       JOIN player_season_stats pss ON pss.player_id=p.id
       WHERE p.name=$1 AND pss.season::text = ANY($2::text[])
       ORDER BY p.id LIMIT 1`,
      [meta.name, ["1999", "2000", "2001", "2002", "2003"]],
    ));
  }
  if (!rows[0]) {
    ({ rows } = await client.query(
      `SELECT id, name FROM players
       WHERE name=$1 AND coalesce(position,'')=$2
       ORDER BY id DESC LIMIT 1`,
      [meta.name, meta.position],
    ));
  }
  if (!rows[0]) {
    if (DRY) {
      const stub = { id: -createdPlayers.length - 1, name: meta.name };
      createdPlayers.push(stub);
      console.log("PLAYER_WOULD_CREATE", stub);
      playerCache.set(key, stub);
      return stub;
    }
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
       VALUES ($1,$2,'Brasil','🇧🇷','unverified') RETURNING id, name`,
      [meta.name, meta.position],
    );
    rows = ins.rows;
    createdPlayers.push(rows[0]);
    console.log("PLAYER_CREATED", rows[0]);
  }
  if (!DRY) {
    await client.query(
      `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
       VALUES ($1,$2,0,0,0) ON CONFLICT DO NOTHING`,
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
  if (DRY) return { id: -1, name };
  const ins = await client.query(
    `INSERT INTO referees (name) VALUES ($1) RETURNING id, name`,
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

  const meta = STADIUM_META[norm(name)];
  if (meta) {
    if (DRY) return { id: -1, name: meta.name };
    const ins = await client.query(
      `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil')
       RETURNING id, name`,
      [meta.name, meta.city, meta.state],
    );
    console.log("STADIUM_CREATED", ins.rows[0]);
    return ins.rows[0];
  }

  const soft = all.find(
    (s) => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)),
  );
  if (soft) return soft;
  throw new Error(`Stadium missing: ${name}`);
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
  if (DRY) return { dry: true };
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
  if (!DRY) await client.query("BEGIN");

  const applied = [];
  let phaseUpdated = 0;

  for (const [date, ph] of Object.entries(PHASE_BY_DATE)) {
    const cid = await competitionId(ph.competition);
    const { rows } = await client.query(
      `SELECT id FROM matches
       WHERE season::text=$1 AND competition_id=$2 AND match_date::date::text=$3`,
      [SEASON, cid, date],
    );
    for (const m of rows) {
      if (!DRY) {
        await client.query(`UPDATE matches SET phase=$2, round=$3 WHERE id=$1`, [
          m.id,
          ph.phase,
          ph.round ?? null,
        ]);
      }
      phaseUpdated++;
    }
  }

  for (const sheet of SHEETS) {
    const cid = await competitionId(sheet.competition);
    const { rows: found } = await client.query(
      `SELECT id, match_date::date::text AS d FROM matches
       WHERE season::text=$1 AND competition_id=$2 AND match_date::date::text=$3
       ORDER BY id LIMIT 1`,
      [SEASON, cid, sheet.date],
    );
    const m = found[0];
    if (!m) throw new Error(`Sheet match missing ${sheet.competition} ${sheet.date}`);

    const referee = await ensureReferee(sheet.referee ?? null);
    const stadium = await ensureStadium(sheet.stadium ?? null);

    const hasLineup = (sheet.starters?.length ?? 0) > 0;
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;
    const hasMeta =
      !!sheet.referee ||
      !!sheet.stadium ||
      sheet.attendance != null ||
      sheet.grossRevenueText != null;

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           referee_id = COALESCE($2, referee_id),
           stadium_id = COALESCE($3, stadium_id),
           attendance = COALESCE($4, attendance),
           gross_revenue = COALESCE($5, gross_revenue),
           gross_revenue_text = COALESCE($6, gross_revenue_text),
           scorers = COALESCE($7, scorers)
         WHERE id=$1`,
        [
          m.id,
          referee?.id ?? null,
          stadium?.id ?? null,
          sheet.attendance ?? null,
          sheet.grossRevenue ?? null,
          sheet.grossRevenueText ?? null,
          scorersText(sheet.csaGoals),
        ],
      );
    }

    if (!hasLineup && !hasGoals) {
      applied.push({
        id: m.id,
        date: m.d,
        comp: sheet.competition.slice(0, 28),
        note: hasMeta ? "meta-only" : "phase-only",
      });
      continue;
    }

    if (!DRY) {
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [m.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [m.id]);
    }

    const csaLineup = new Map();
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
      } else csaLineup.set(p.id, sort++);
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
      } else csaLineup.set(p.id, sort++);
    }

    for (const g of sheet.csaGoals ?? []) {
      const p = await ensureCsaPlayer(g.name);
      if (csaLineup.has(p.id)) continue;
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

    for (const g of sheet.csaGoals ?? []) {
      const p = await ensureCsaPlayer(g.name);
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'csa',$2,$3,$4,$5,NULL,$6,false)`,
          [m.id, csaLineup.get(p.id) ?? null, p.id, p.name, g.minute ?? 0, !!g.penalty],
        );
      }
    }

    for (const g of sheet.oppGoals ?? []) {
      if (!DRY) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'opponent',NULL,NULL,$2,$3,NULL,$4,false)`,
          [m.id, g.name, g.minute ?? 0, !!g.penalty],
        );
      }
    }

    applied.push({
      id: m.id,
      date: m.d,
      comp: sheet.competition.slice(0, 28),
      starters: sheet.starters?.length ?? 0,
      csaGoals: sheet.csaGoals?.length ?? 0,
      oppGoals: sheet.oppGoals?.length ?? 0,
    });
  }

  if (!DRY) {
    for (const pair of RELATED_PAIRS) {
      const cid = await competitionId(pair.competition);
      const [a, b] = pair.dates;
      const { rows: ra } = await client.query(
        `SELECT id FROM matches
         WHERE season::text=$1 AND competition_id=$2 AND match_date::date::text=$3`,
        [SEASON, cid, a],
      );
      const { rows: rb } = await client.query(
        `SELECT id FROM matches
         WHERE season::text=$1 AND competition_id=$2 AND match_date::date::text=$3`,
        [SEASON, cid, b],
      );
      if (ra[0] && rb[0]) {
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
          ra[0].id,
          rb[0].id,
        ]);
        await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
          rb[0].id,
          ra[0].id,
        ]);
      }
    }
  }

  const sync = await syncSeasonFromSheets(SEASON);

  if (!DRY) await client.query("COMMIT");
  console.log(DRY ? "DRY OK" : "OK");
  console.log("phaseUpdated", phaseUpdated);
  console.log("createdPlayers", createdPlayers);
  console.log("sync", sync);
  console.table(applied);
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
