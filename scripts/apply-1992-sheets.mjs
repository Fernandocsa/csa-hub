/**
 * Ensure every CSA 1992 sheet player exists, then re-apply all sheets.
 * Reuses: Flávio#485, Wilson#539, Lino#540, Ivan#541, Peu#498.
 * Creates Rau (distinct from Raul#63) and any other missing names.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { SHEETS } from "./data/season-1992-sheets.mjs";

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

/** Known CSA players already in DB for this era. */
const FORCE_ID = {
  flavio: 485,
  wilson: 539,
  lino: 540,
  ivan: 541,
  peu: 498,
};

/** Canonical display names for CSA roster. */
const CANON = {
  edson: "Édson",
  "édson": "Édson",
  rau: "Rau",
  raul: "Rau", // source spelling variant → same 1992 player "Rau"
  cesar: "César",
  "césar": "César",
  edmilson: "Edmílson",
  "edmílson": "Edmílson",
  "mario xavier": "Mário Xavier",
  "mário xavier": "Mário Xavier",
  "claudio bocao": "Cláudio Bocão",
  "cláudio bocão": "Cláudio Bocão",
  claudio: "Cláudio",
  "cláudio": "Cláudio",
  delio: "Délio",
  "délio": "Délio",
  serjao: "Serjão",
  "serjão": "Serjão",
};

function canonName(raw) {
  const key = norm(raw);
  return CANON[key] ?? String(raw).trim();
}

function collectCsaNames() {
  const set = new Set();
  for (const s of SHEETS) {
    for (const n of s.starters ?? []) set.add(canonName(n));
    for (const sub of s.subs ?? []) {
      set.add(canonName(sub.out));
      set.add(canonName(sub.in));
    }
    for (const g of s.goals ?? []) {
      if ((g.side ?? "csa") === "csa") set.add(canonName(g.name));
    }
    for (const c of s.cards ?? []) {
      if ((c.side ?? "csa") === "csa") set.add(canonName(c.name));
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

const playerCache = new Map(); // norm → {id,name}

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

  // Exact name only (do not fuzzy-match other eras)
  let { rows } = await client.query(`SELECT id, name FROM players WHERE name=$1`, [name]);
  if (!rows[0]) {
    const ins = await client.query(
      `INSERT INTO players (name, nationality, verification_status)
       VALUES ($1, 'Brasil', 'unverified') RETURNING id, name`,
      [name],
    );
    rows = ins.rows;
    console.log("PLAYER_CREATED", rows[0]);
  }
  playerCache.set(key, rows[0]);
  return rows[0];
}

function findMatch(dbMatches, sheet) {
  const sameDate = dbMatches.filter((m) => m.d === sheet.date && m.home_away === sheet.homeAway);
  if (sameDate.length === 1) return sameDate[0];
  const hint = norm(sheet.opponentHint);
  const hit = sameDate.filter(
    (m) => norm(m.opp).includes(hint) || hint.includes(norm(m.opp).split("-")[0]),
  );
  if (hit.length === 1) return hit[0];
  const byDate = dbMatches.filter((m) => m.d === sheet.date);
  if (byDate.length === 1) return byDate[0];
  throw new Error(`match not found ${sheet.date} ${sheet.opponentHint}`);
}

try {
  await client.query("BEGIN");

  const roster = collectCsaNames();
  console.log("ROSTER_SIZE", roster.length);
  for (const name of roster) {
    await ensurePlayer(name);
  }

  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.match_date::text AS d, m.home_away, o.name AS opp
    FROM matches m JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season='1992'
  `);

  const applied = [];

  for (const sheet of SHEETS) {
    const match = findMatch(dbMatches, sheet);

    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [match.id]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [match.id]);
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [match.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [match.id]);

    const csaLineup = new Map();
    const oppLineupByName = new Map();
    let sort = 0;

    for (const name of sheet.starters ?? []) {
      const p = await ensurePlayer(name);
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [match.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    for (const s of sheet.subs ?? []) {
      const p = await ensurePlayer(s.in);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [match.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    // Scorers/cards on CSA when no XI still need a lineup row
    for (const g of sheet.goals ?? []) {
      if ((g.side ?? "csa") !== "csa") continue;
      const p = await ensurePlayer(g.name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [match.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }
    for (const c of sheet.cards ?? []) {
      if ((c.side ?? "csa") !== "csa") continue;
      const p = await ensurePlayer(c.name);
      if (csaLineup.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [match.id, p.id, p.name, sort++],
      );
      csaLineup.set(p.id, rows[0].id);
    }

    let oppSort = 0;
    async function ensureOpp(name) {
      const k = norm(name);
      if (oppLineupByName.has(k)) return oppLineupByName.get(k);
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'opponent',NULL,$2,'starter',NULL,NULL,$3) RETURNING id`,
        [match.id, name, oppSort++],
      );
      oppLineupByName.set(k, rows[0].id);
      return rows[0].id;
    }

    for (const g of sheet.goals ?? []) {
      const side = g.side ?? "csa";
      const minute = Number.isFinite(g.minute) ? g.minute : 0;
      const injury = g.injury ?? null;
      if (side === "csa") {
        const p = await ensurePlayer(g.name);
        const isOg = !!g.ownGoal;
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal, own_goal_direction)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            match.id,
            csaLineup.get(p.id) ?? null,
            p.id,
            p.name,
            minute,
            injury,
            !!g.penalty,
            isOg,
            isOg ? "against" : null,
          ],
        );
      } else {
        const lid = await ensureOpp(g.name);
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
              minute, injury_time_minute, is_penalty, is_own_goal)
           VALUES ($1,'opponent',$2,NULL,$3,$4,$5,$6,false)`,
          [match.id, lid, g.name, minute, injury, !!g.penalty],
        );
      }
    }

    for (const c of sheet.cards ?? []) {
      const side = c.side ?? "csa";
      const minute = c.minute != null && Number.isFinite(c.minute) ? c.minute : 0;
      if (side === "csa") {
        const p = await ensurePlayer(c.name);
        await client.query(
          `INSERT INTO match_cards
             (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,NULL)`,
          [match.id, c.type, csaLineup.get(p.id) ?? null, p.id, p.name, minute],
        );
      } else {
        const lid = await ensureOpp(c.name);
        await client.query(
          `INSERT INTO match_cards
             (match_id, side, card_type, lineup_id, player_id, player_name, minute, injury_time_minute)
           VALUES ($1,'opponent',$2,$3,NULL,$4,$5,NULL)`,
          [match.id, c.type, lid, c.name, minute],
        );
      }
    }

    for (const s of sheet.subs ?? []) {
      const outP = await ensurePlayer(s.out);
      const inP = await ensurePlayer(s.in);
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
        [
          match.id,
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

    const csaScorerNames = (sheet.goals ?? [])
      .filter((g) => (g.side ?? "csa") === "csa" && !g.ownGoal)
      .map((g) => canonName(g.name));
    if (csaScorerNames.length) {
      await client.query(`UPDATE matches SET scorers=$2 WHERE id=$1`, [
        match.id,
        [...new Set(csaScorerNames)].join(", "),
      ]);
    }

    applied.push({
      id: match.id,
      date: sheet.date,
      starters: (sheet.starters ?? []).length,
    });
  }

  await client.query("COMMIT");

  const { rows: xi } = await client.query(`
    SELECT count(*)::int AS matches_with_xi FROM (
      SELECT m.id FROM matches m
      JOIN match_lineups ml ON ml.match_id=m.id AND ml.side='csa' AND ml.role='starter'
      WHERE m.season='1992'
      GROUP BY m.id HAVING count(*) >= 10
    ) t
  `);

  const { rows: rosterRows } = await client.query(`
    SELECT DISTINCT p.id, p.name
    FROM match_lineups ml
    JOIN players p ON p.id=ml.player_id
    JOIN matches m ON m.id=ml.match_id
    WHERE m.season='1992' AND ml.side='csa'
    ORDER BY p.name
  `);

  console.log(
    JSON.stringify(
      {
        ok: true,
        applied: applied.length,
        matchesWithXi: xi[0].matches_with_xi,
        roster: rosterRows,
        sample: applied.filter((a) => a.starters > 0).slice(0, 5),
        sep13: applied.find((a) => a.date === "1992-09-13"),
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
