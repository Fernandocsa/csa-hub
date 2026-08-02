/**
 * Apply complementary Alagoano 1993 sheets (refs, managers, CSA/opp lineups, goals, cards).
 * Also fills phase/round for all 1993 Alagoano matches.
 * Managers: Roberto Brida until 1993-09-11; Valdemar Carabina from 1993-09-12.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  PHASE_BY_DATE,
  SHEETS,
} from "./data/season-1993-alagoano-sheets.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

const BRIDA_UNTIL = "1993-09-11"; // inclusive — Carabina from 1993-09-12
const BRIDA_NAME = "Roberto Brida";
const CARABINA_NAME = "Valdemar Carabina";

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Known CSA players → id (era-correct). */
const FORCE_ID = {
  flavio: 485,
  cesar: 557,
  rau: 572,
  talvanes: 549,
  chico: 551,
  lino: 540,
  wilson: 539,
  wilsons: 539,
  adalberon: 569,
  ivan: 541,
  delio: 564,
  beu: 556,
  catanha: 487,
  peu: 498,
  serjao: 571,
  junior: 593,
  claudio: 570,
  "claudio bocao": 570,
  josenilton: 942,
  // Oséias #1054 already has 1992–99 season rows (same as 1994 apply)
  oseas: 1054,
  oseias: 1054,
};

/**
 * Create or prefer namesake. forceNew = always insert a 1993-era shell
 * (avoid linking wrong-decade homonyms).
 */
const CREATE_META = {
  "ze ronaldo": { name: "Zé Ronaldo", position: "Zagueiro", forceNew: true },
  mirandinha: { name: "Mirandinha", position: "Atacante", forceNew: true },
  erivaldo: { name: "Erivaldo", position: "Lateral Direito", forceNew: true },
  sandro: { name: "Sandro", position: "Meia", forceNew: true },
  mailton: { name: "Maílton", position: "Lateral Direito", forceNew: true },
  "carlinhos itabera": {
    name: "Carlinhos Itaberá",
    position: "Lateral Direito",
    forceNew: true,
  },
  anderson: { name: "Ânderson", position: "Volante", forceNew: true },
  gersinho: { name: "Gersinho", position: "Atacante", forceNew: true },
  silas: { name: "Silas", position: "Meia", forceNew: true },
  tino: { name: "Tino", position: "Zagueiro", forceNew: true },
  ricardinho: { name: "Ricardinho", position: "Atacante", forceNew: true },
  jeronimo: { name: "Jerônimo", position: "Lateral Esquerdo", forceNew: true },
  dudu: { name: "Dudu", position: "Atacante", forceNew: true },
  // Red only on 30/05 (not in published XI) — separate from 1969 Catatau #1792
  catatau: { name: "Catatau", position: "Atacante", forceNew: true },
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
  if (meta) {
    let { rows } = await client.query(
      `SELECT p.id, p.name
       FROM players p
       JOIN player_season_stats pss ON pss.player_id = p.id
       WHERE p.name = $1 AND pss.season::text = $2
       ORDER BY p.id
       LIMIT 1`,
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
         VALUES ($1,$2,0,0,0)
         ON CONFLICT DO NOTHING`,
        [rows[0].id, SEASON],
      );
    }
    playerCache.set(key, rows[0]);
    playerCache.set(norm(rows[0].name), rows[0]);
    return rows[0];
  }

  throw new Error(`Unresolved CSA player: "${raw}" (${key})`);
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
  const hit = all.find((r) => norm(r.name) === norm(name));
  if (hit) return hit;
  const ins = await client.query(
    `INSERT INTO managers (name) VALUES ($1) RETURNING id, name`,
    [name],
  );
  console.log("MANAGER_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function managerForDate(d, brida, carabina) {
  return d <= BRIDA_UNTIL ? brida : carabina;
}

function scorersText(csaGoals = []) {
  const counts = new Map();
  for (const g of csaGoals) {
    if (g.ownGoalAgainst) continue; // CSA own goal — not a CSA scorer
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

  const brida = await ensureManager(BRIDA_NAME);
  const carabina = await ensureManager(CARABINA_NAME);

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
    const mgr = managerForDate(m.d, brida, carabina);
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
    const mgr = managerForDate(m.d, brida, carabina);

    await client.query(
      `UPDATE matches SET
         referee_id = COALESCE($2, referee_id),
         manager_id = CASE WHEN $3 THEN $4 ELSE manager_id END,
         scorers = $5
       WHERE id=$1`,
      [
        m.id,
        referee?.id ?? null,
        !!sheet.manager,
        mgr.id,
        scorersText(sheet.csaGoals),
      ],
    );

    const hasLineup = (sheet.starters?.length ?? 0) > 0;
    const hasGoals =
      (sheet.csaGoals?.length ?? 0) > 0 || (sheet.oppGoals?.length ?? 0) > 0;
    const hasCards =
      (sheet.csaReds?.length ?? 0) > 0 || (sheet.oppReds?.length ?? 0) > 0;

    if (!hasLineup && !hasGoals && !hasCards) {
      applied.push({ id: m.id, date: m.d, note: "meta-only" });
      continue;
    }

    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [m.id]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [m.id]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [m.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [m.id]);

    const csaLineup = new Map();
    const oppLineup = new Map();
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
      if (g.ownGoalFor) continue;
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

    let oppSort = 0;
    for (const name of sheet.oppStarters ?? []) {
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'starter',NULL,NULL,$3) RETURNING id`,
        [m.id, name, oppSort++],
      );
      oppLineup.set(norm(name), rows[0].id);
    }
    for (const s of sheet.oppSubs ?? []) {
      if (oppLineup.has(norm(s.in))) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'bench',NULL,NULL,$3) RETURNING id`,
        [m.id, s.in, oppSort++],
      );
      oppLineup.set(norm(s.in), rows[0].id);
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

    for (const s of sheet.oppSubs ?? []) {
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

    for (const g of sheet.csaGoals ?? []) {
      if (g.ownGoalFor) {
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal, own_goal_direction)
           VALUES ($1,'csa',NULL,NULL,$2,$3,NULL,false,true,'for')`,
          [m.id, g.name, g.minute ?? 0],
        );
        continue;
      }
      if (g.ownGoalAgainst) {
        const p = await ensureCsaPlayer(g.name);
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal, own_goal_direction)
           VALUES ($1,'csa',$2,$3,$4,$5,NULL,false,true,'against')`,
          [m.id, csaLineup.get(p.id) ?? null, p.id, p.name, g.minute ?? 0],
        );
        continue;
      }
      const p = await ensureCsaPlayer(g.name);
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

    for (const g of sheet.oppGoals ?? []) {
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

    for (const name of sheet.csaReds ?? []) {
      let p = null;
      try {
        p = await ensureCsaPlayer(name);
      } catch {
        p = null;
      }
      if (p && !csaLineup.has(p.id) && hasLineup) {
        // Red cited without published XI slot (e.g. Catatau 30/05) → bench shell
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
        [
          m.id,
          p ? csaLineup.get(p.id) ?? null : null,
          p?.id ?? null,
          p?.name ?? name,
        ],
      );
    }

    for (const name of sheet.oppReds ?? []) {
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
         VALUES ($1,'opponent','red',$2,NULL,$3,0,NULL)`,
        [m.id, oppLineup.get(norm(name)) ?? null, name],
      );
    }

    const ogFor = (sheet.csaGoals ?? []).filter((g) => g.ownGoalFor).length;
    if (ogFor) {
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
      reds: (sheet.csaReds?.length ?? 0) + (sheet.oppReds?.length ?? 0),
    });
  }

  const sync = await syncSeasonFromSheets(SEASON);

  await client.query("COMMIT");
  console.log("OK");
  console.log("managers", { brida, carabina });
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
