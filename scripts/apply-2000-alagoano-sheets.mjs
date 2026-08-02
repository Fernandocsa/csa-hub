/**
 * Apply complementary Alagoano 2000 sheets (CSA-only).
 * Managers: Otávio Oliveira until 2000-03-11; Pinho from 2000-03-12.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  PHASE_BY_DATE,
  SHEETS,
} from "./data/season-2000-alagoano-sheets.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const PINHO_FROM = "2000-03-12";
const OTAVIO_NAME = "Otávio Oliveira";
const PINHO_NAME = "Pinho";

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const FORCE_ID = {
  veloso: 1873,
  luciano: 1866,
  ramon: 1862,
  "da silva": 1861,
  souza: 1840,
  genilson: 1838,
  mimi: 535,
  otavio: 1057,
  "bruno alves": 1869,
  fabinho: 828,
  leo: 1844,
  wilson: 539,
  wilsons: 539,
};

const CREATE_META = {
  "adriano barata": { name: "Adriano Barata", position: "Zagueiro", forceNew: true },
  erivaldo: { name: "Erivaldo", position: "Zagueiro", forceNew: true },
  leandro: { name: "Leandro", position: "Zagueiro", forceNew: true },
  "fabinho silva": { name: "Fabinho Silva", position: "Meia", forceNew: true },
  evandro: { name: "Evandro", position: "Volante", forceNew: true },
  china: { name: "China", position: "Volante", forceNew: true },
  rodrigo: { name: "Rodrigo", position: "Atacante", forceNew: true },
  gerson: { name: "Gérson", position: "Atacante", forceNew: true },
  alessandro: { name: "Alessandro", position: "Atacante", forceNew: true },
  adriano: { name: "Adriano", position: "Lateral", forceNew: true },
  edilson: { name: "Edílson", position: "Meia", forceNew: true },
  "joao paulo": { name: "João Paulo", position: "Meia", forceNew: true },
  "cesar xavier": { name: "César Xavier", position: "Zagueiro", forceNew: true },
  "rodrigo paulista": { name: "Rodrigo Paulista", position: "Meia", forceNew: true },
  hilton: { name: "Hílton", position: "Zagueiro", forceNew: true },
  erisvaldo: { name: "Erisvaldo", position: "Zagueiro", forceNew: true },
  "rodrigo alagoano": { name: "Rodrigo Alagoano", position: "Atacante", forceNew: true },
  "ailton cruz": { name: "Aílton Cruz", position: "Goleiro", forceNew: true },
  ilton: { name: "Ílton", position: "Zagueiro", forceNew: true },
  silvio: { name: "Sílvio", position: "Atacante", forceNew: true },
  ayupe: { name: "Ayupe", position: "Lateral", forceNew: true },
  "edson baiano": { name: "Édson Baiano", position: "Volante", forceNew: true },
  "sandro oliveira": { name: "Sandro Oliveira", position: "Atacante", forceNew: true },
  renatinho: { name: "Renatinho", position: "Atacante", forceNew: true },
  vantuir: { name: "Vantuir", position: "Meia", forceNew: true },
  "bruno lopes": { name: "Bruno Lopes", position: "Meia", forceNew: true },
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
  const ins = await client.query(
    `INSERT INTO referees (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("REF_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureManager(name) {
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO managers (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
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

function resolveManagerKey(sheet, d, otavio, pinho) {
  if (sheet?.manager === "otavio") return otavio;
  if (sheet?.manager === "pinho") return pinho;
  if (sheet?.manager === true) return d < PINHO_FROM ? otavio : pinho;
  return d < PINHO_FROM ? otavio : pinho;
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

  const otavio = await ensureManager(OTAVIO_NAME);
  const pinho = await ensureManager(PINHO_NAME);

  const { rows: allMatches } = await client.query(
    `SELECT id, match_date::date::text AS d FROM matches
     WHERE season::text=$1 AND competition_id=$2
     ORDER BY match_date, id`,
    [SEASON, competitionId],
  );

  let phaseUpdated = 0;
  for (const m of allMatches) {
    const ph = PHASE_BY_DATE[m.d];
    if (!ph) continue;
    const mgr = m.d < PINHO_FROM ? otavio : pinho;
    await client.query(
      `UPDATE matches SET phase=$2, round=$3, manager_id=$4 WHERE id=$1`,
      [m.id, ph.phase, ph.round, mgr.id],
    );
    phaseUpdated++;
  }

  const sheetByDate = new Map(SHEETS.map((s) => [s.date, s]));
  const applied = [];

  for (const m of allMatches) {
    const sheet = sheetByDate.get(m.d);
    if (!sheet) continue;

    const referee = await ensureReferee(sheet.referee ?? null);
    const stadium = await ensureStadium(sheet.stadium ?? null);
    const mgr = resolveManagerKey(sheet, m.d, otavio, pinho);

    const hasLineup = (sheet.starters?.length ?? 0) > 0;
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;
    const hasCards =
      (sheet.csaReds?.length ?? 0) > 0 || (sheet.oppReds?.length ?? 0) > 0;
    const hasMeta =
      !!sheet.referee ||
      !!sheet.stadium ||
      sheet.attendance != null ||
      sheet.grossRevenueText != null ||
      !!sheet.manager;

    await client.query(
      `UPDATE matches SET
         referee_id = COALESCE($2, referee_id),
         stadium_id = COALESCE($3, stadium_id),
         manager_id = CASE WHEN $4 THEN $5 ELSE manager_id END,
         attendance = COALESCE($6, attendance),
         gross_revenue = COALESCE($7, gross_revenue),
         gross_revenue_text = COALESCE($8, gross_revenue_text),
         scorers = COALESCE($9, scorers)
       WHERE id=$1`,
      [
        m.id,
        referee?.id ?? null,
        stadium?.id ?? null,
        !!sheet.manager,
        mgr.id,
        sheet.attendance ?? null,
        sheet.grossRevenue ?? null,
        sheet.grossRevenueText ?? null,
        scorersText(sheet.csaGoals),
      ],
    );

    if (!hasLineup && !hasGoals && !hasCards) {
      applied.push({ id: m.id, date: m.d, note: hasMeta ? "meta-only" : "phase-only" });
      continue;
    }

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
      const role = hasLineup ? "bench" : "starter";
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,$4,NULL,NULL,$5) RETURNING id`,
        [m.id, p.id, p.name, role, sort++],
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

    for (const name of sheet.csaReds ?? []) {
      let p = null;
      try {
        p = await ensureCsaPlayer(name);
      } catch {
        p = null;
      }
      if (p && !csaLineup.has(p.id) && hasLineup) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [m.id, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
         VALUES ($1,'csa','red',$2,$3,$4,0,NULL)`,
        [m.id, p ? csaLineup.get(p.id) ?? null : null, p?.id ?? null, p?.name ?? name],
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
      reds: (sheet.csaReds?.length ?? 0) + (sheet.oppReds?.length ?? 0),
    });
  }

  const sync = await syncSeasonFromSheets(SEASON);

  await client.query("COMMIT");
  console.log("OK");
  console.log("managers", { otavio, pinho });
  console.log("phaseUpdated", phaseUpdated);
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
