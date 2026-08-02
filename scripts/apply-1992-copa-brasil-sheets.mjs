/**
 * Apply CSA Copa do Brasil 1992 sheets (5 matches).
 * Skips 25/09 Vasco (keeps Correio do Povo lineup).
 * Willians → Williams #568; Marcelo → Marcelo Silva; Carlinhos → Marechal.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import {
  SEASON,
  COMPETITION_NAME,
  FORCE_ID,
  SHEETS,
} from "./data/season-1992-copa-brasil-sheets.mjs";

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
  carlinhos: "Carlinhos Marechal",
  "carlinhos marechal": "Carlinhos Marechal",
  cafe: "Café",
  café: "Café",
  oseias: "Oseas",
  oséias: "Oseas",
  edson: "Édson",
  édson: "Édson",
  "edson carioca": "Édson",
  "édson carioca": "Édson",
  marcelo: "Marcelo Silva",
  "marcelo silva": "Marcelo Silva",
  willians: "Williams",
  williams: "Williams",
  "mario xavier": "Mário Xavier",
  "mário xavier": "Mário Xavier",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

const playerCache = new Map();

async function ensurePlayer(raw) {
  const name = canonName(raw);
  const key = norm(name);
  if (playerCache.has(key)) return playerCache.get(key);

  if (FORCE_ID[key]) {
    const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
      FORCE_ID[key],
    ]);
    if (!rows[0]) throw new Error(`FORCE_ID missing ${name} → ${FORCE_ID[key]}`);
    playerCache.set(key, rows[0]);
    return rows[0];
  }

  let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
  if (!rows[0]) {
    throw new Error(
      `Player not found (ask before creating ambiguous names): ${name} (from "${raw}")`,
    );
  }
  playerCache.set(key, rows[0]);
  return rows[0];
}

try {
  await client.query("BEGIN");

  const { rows: comps } = await client.query(`SELECT id FROM competitions WHERE name=$1`, [
    COMPETITION_NAME,
  ]);
  if (!comps[0]) throw new Error(`Competition missing: ${COMPETITION_NAME}`);
  const competitionId = comps[0].id;

  const applied = [];

  for (const sheet of SHEETS) {
    const { rows: matches } = await client.query(
      `SELECT m.id, o.name AS opp
       FROM matches m
       JOIN opponents o ON o.id=m.opponent_id
       WHERE m.match_date=$1 AND m.season=$2 AND m.competition_id=$3
         AND m.home_away=$4
       LIMIT 1`,
      [sheet.date, SEASON, competitionId, sheet.ha],
    );
    if (!matches[0]) throw new Error(`Match not found ${sheet.date} ${sheet.opp}`);
    const match = matches[0];

    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1 AND side='csa'`, [
      match.id,
    ]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1 AND side='csa'`, [match.id]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1 AND side='csa'`, [match.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [match.id]);

    const csaLineup = new Map();
    let sort = 0;

    for (const n of sheet.starters) {
      const p = await ensurePlayer(n);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [match.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const n of sheet.entered ?? []) {
      const p = await ensurePlayer(n);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [match.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    const outs = sheet.subbedOut ?? [];
    const ins = sheet.entered ?? [];
    const pairs = Math.min(outs.length, ins.length);
    for (let i = 0; i < pairs; i++) {
      const outP = await ensurePlayer(outs[i]);
      const inP = await ensurePlayer(ins[i]);
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,0,NULL)`,
        [
          match.id,
          csaLineup.get(outP.id) ?? null,
          outP.id,
          outP.name,
          csaLineup.get(inP.id) ?? null,
          inP.id,
          inP.name,
        ],
      );
    }

    for (const g of sheet.goals ?? []) {
      const p = await ensurePlayer(g.name);
      await client.query(
        `INSERT INTO match_goals
           (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
            minute, injury_time_minute, is_penalty, is_own_goal)
         VALUES ($1,'csa',$2,$3,$4,$5,NULL,false,false)`,
        [match.id, csaLineup.get(p.id) ?? null, p.id, p.name, g.minute],
      );
    }

    const scorerNames = [...new Set((sheet.goals ?? []).map((g) => canonName(g.name)))];
    await client.query(`UPDATE matches SET scorers=$2 WHERE id=$1`, [
      match.id,
      scorerNames.length ? scorerNames.join(", ") : null,
    ]);

    applied.push({
      id: match.id,
      date: sheet.date,
      opp: match.opp,
      starters: sheet.starters.length,
      entered: (sheet.entered ?? []).length,
      subPairs: pairs,
      goals: (sheet.goals ?? []).length,
    });
  }

  // Confirm 25/09 untouched
  const vasco = await client.query(
    `SELECT count(*)::int AS xi FROM match_lineups WHERE match_id=2489 AND side='csa'`,
  );

  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        ok: true,
        applied,
        skippedVasco2489Xi: vasco.rows[0].xi,
        note: "25/09 kept Correio lineup; 07/07+04/08 are 1ª Fase Tuna (source mislabeled phase)",
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
