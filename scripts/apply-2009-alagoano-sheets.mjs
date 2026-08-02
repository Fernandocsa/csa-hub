/**
 * Apply complementary Alagoano 2009 sheets (CSA-only).
 * Usage: node scripts/apply-2009-alagoano-sheets.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  PHASE_BY_DATE,
  SHEETS,
} from "./data/season-2009-alagoano-sheets.mjs";

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
  gilberto: 875,
  marciano: 990,
  matteus: 1008,
  mateus: 1008,
  jean: 1996,
  "cristiano fernandes": 2007,
  "christiano fernandes": 2007,
  "carlos diogo": 742,
  "junior amorim": 948,
  esquerdinha: 819,
  junior: 947,
  "da silva": 1861,
  jeferson: 82,
  jefferson: 82,
};

const CREATE_META = {
  coelho: { name: "Coelho", position: "Lateral", forceNew: true },
  eridon: { name: "Eridon", position: "Zagueiro", forceNew: true },
  "ricardo miranda": { name: "Ricardo Miranda", position: "Volante", forceNew: true },
  magno: { name: "Magno", position: "Meia", forceNew: true },
  marcelinho: { name: "Marcelinho", position: "Meia", forceNew: true },
  "thiago potiguar": { name: "Thiago Potiguar", position: "Meia", forceNew: true },
  "tiago potiguar": { name: "Thiago Potiguar", position: "Meia", forceNew: true },
  kempes: { name: "Kempes", position: "Atacante", forceNew: true },
  "wander kempes": { name: "Kempes", position: "Atacante", forceNew: true },
  "diego silva": { name: "Diego Silva", position: "Atacante", forceNew: true },
  anderson: { name: "Ânderson", position: "Volante", forceNew: true },
  nilson: { name: "Nílson", position: "Meia", forceNew: true },
  "fabio lopes": { name: "Fábio Lopes", position: "Atacante", forceNew: true },
  augusto: { name: "Augusto", position: "Lateral", forceNew: true },
  fagner: { name: "Fagner", position: "Atacante", forceNew: true },
  "fabio lima": { name: "Fábio Lima", position: "Zagueiro", forceNew: true },
  braun: { name: "Braun", position: "Meia", forceNew: true },
  neto: { name: "Neto", position: "Atacante", forceNew: true },
  tiago: { name: "Tiago", position: "Goleiro", forceNew: true },
  eduardo: { name: "Eduardo", position: "Lateral", forceNew: true },
  "cleisson rato": { name: "Cleisson Rato", position: "Meia", forceNew: true },
  "claysson rato": { name: "Cleisson Rato", position: "Meia", forceNew: true },
  thiago: { name: "Thiago", position: "Goleiro", forceNew: true },
  brow: { name: "Brow", position: "Meia", forceNew: true },
  camilo: { name: "Camilo", position: "Meia", forceNew: true },
  rosinaldo: { name: "Rosinaldo", position: "Zagueiro", forceNew: true },
  valdiran: { name: "Valdiran", position: "Atacante", forceNew: true },
  "junior caicara": { name: "Júnior Caiçara", position: "Lateral", forceNew: true },
  "juninho caicara": { name: "Júnior Caiçara", position: "Lateral", forceNew: true },
  "thiago emilio": { name: "Thiago Emilio", position: "Meia", forceNew: true },
  "tiago emilio": { name: "Thiago Emilio", position: "Meia", forceNew: true },
  leandro: { name: "Leandro", position: "Volante", forceNew: true },
  "marco brito": { name: "Marco Brito", position: "Atacante", forceNew: true },
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
  if (!rows[0]) {
    ({ rows } = await client.query(
      `SELECT p.id, p.name
       FROM players p
       JOIN player_season_stats pss ON pss.player_id=p.id
       WHERE p.name=$1
         AND coalesce(p.position,'')=$2
         AND pss.season::text = ANY($3::text[])
       ORDER BY p.id LIMIT 1`,
      [meta.name, meta.position, ["2007", "2008", "2009", "2010"]],
    ));
  }
  if (!rows[0]) {
    if (DRY) {
      const stub = { id: -createdPlayers.length - 1, name: meta.name };
      createdPlayers.push(stub);
      console.log("PLAYER_WOULD_CREATE", stub);
      playerCache.set(key, stub);
      playerCache.set(norm(meta.name), stub);
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

async function ensureManager(name) {
  if (!name) return null;
  let { rows } = await client.query(`SELECT id, name FROM managers WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM managers`);
  const hit = all.find((m) => norm(m.name) === norm(name));
  if (hit) return hit;
  if (DRY) return { id: -1, name };
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

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Missing ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

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
    if (!DRY) {
      await client.query(`UPDATE matches SET phase=$2, round=$3 WHERE id=$1`, [
        m.id,
        ph.phase,
        ph.round,
      ]);
    }
    phaseUpdated++;
  }

  const sheetByDate = new Map(SHEETS.map((s) => [s.date, s]));
  const applied = [];

  for (const m of allMatches) {
    const sheet = sheetByDate.get(m.d);
    if (!sheet) continue;

    const referee = await ensureReferee(sheet.referee ?? null);
    const stadium = await ensureStadium(sheet.stadium ?? null);
    const manager = sheet.manager ? await ensureManager(sheet.manager) : null;

    const hasLineup = (sheet.starters?.length ?? 0) > 0;
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;
    const hasCards =
      (sheet.csaReds?.length ?? 0) > 0 || (sheet.oppReds?.length ?? 0) > 0;

    if (!DRY) {
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
          !!manager,
          manager?.id ?? null,
          sheet.attendance ?? null,
          sheet.grossRevenue ?? null,
          sheet.grossRevenueText ?? null,
          scorersText(sheet.csaGoals),
        ],
      );
    }

    if (!hasLineup && !hasGoals && !hasCards) {
      applied.push({ id: m.id, date: m.d, note: "meta-only", manager: sheet.manager ?? "" });
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
           VALUES ($1,'opponent',NULL,NULL,$2,$3,NULL,$4,false)`,
          [m.id, g.name, g.minute ?? 0, !!g.penalty],
        );
      }
    }

    for (const name of sheet.csaReds ?? []) {
      let p = null;
      try {
        p = await ensureCsaPlayer(name);
      } catch {
        p = null;
      }
      if (p && !csaLineup.has(p.id) && hasLineup && !DRY) {
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [m.id, p.id, p.name, sort++],
        );
        csaLineup.set(p.id, rows[0].id);
      }
      if (!DRY) {
        await client.query(
          `INSERT INTO match_cards
             (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
           VALUES ($1,'csa','red',$2,$3,$4,0,NULL)`,
          [
            m.id,
            p ? csaLineup.get(p.id) ?? null : null,
            p?.id ?? null,
            p?.name ?? name,
          ],
        );
      }
    }

    for (const name of sheet.oppReds ?? []) {
      if (!DRY) {
        await client.query(
          `INSERT INTO match_cards
             (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
           VALUES ($1,'opponent','red',NULL,NULL,$2,0,NULL)`,
          [m.id, name],
        );
      }
    }

    applied.push({
      id: m.id,
      date: m.d,
      starters: sheet.starters?.length ?? 0,
      csaGoals: sheet.csaGoals?.length ?? 0,
      oppGoals: sheet.oppGoals?.length ?? 0,
      reds: (sheet.csaReds?.length ?? 0) + (sheet.oppReds?.length ?? 0),
      manager: sheet.manager ?? "",
    });
  }

  const sync = await syncSeasonFromSheets(SEASON);

  if (!DRY) {
    const { rows: mgrRows } = await client.query(
      `SELECT manager_id, count(*)::int AS games,
              count(*) FILTER (WHERE result='win')::int AS wins,
              count(*) FILTER (WHERE result='draw')::int AS draws,
              count(*) FILTER (WHERE result='loss')::int AS losses,
              coalesce(sum(goals_for),0)::int AS goals_for,
              coalesce(sum(goals_against),0)::int AS goals_against
       FROM matches
       WHERE season=$1 AND manager_id IS NOT NULL
         AND coalesce(is_friendly,false)=false
         AND coalesce(status,'played')<>'scheduled'
       GROUP BY manager_id`,
      [SEASON],
    );
    for (const s of mgrRows) {
      const ex = await client.query(
        `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
        [s.manager_id, SEASON],
      );
      if (ex.rows[0]) {
        await client.query(
          `UPDATE manager_season_stats SET
             games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6
           WHERE id=$7`,
          [
            s.games,
            s.wins,
            s.draws,
            s.losses,
            s.goals_for,
            s.goals_against,
            ex.rows[0].id,
          ],
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
  }

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
