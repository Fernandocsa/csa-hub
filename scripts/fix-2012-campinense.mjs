/**
 * Fix CSA 0x0 Campinense (2012-09-09) sheet: full XI, timed subs, yellow cards.
 * Usage: node scripts/fix-2012-campinense.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const MATCH_ID = 1447;
const SEASON = "2012";

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

/** sheet name → force player id (2012 roster) */
const FORCE = {
  flavio: 485,
  leandrinho: 1582,
  adalberto: 1584,
  leandro: 1583,
  "rafael araujo": 1648,
  celico: 1586,
  "jucemar gaucho": 1596,
  levi: 1593,
  washington: 1601,
  ronaldo: 468,
  "ronaldo mendes": 468,
  "paulinho macaiba": 491,
  cleberson: 1600,
  sinval: 1621,
  gueba: 1662,
  "anderson safira": 1634,
  safira: 1634,
  jonatas: 1663,
  roberio: 1588,
};

const STARTERS = [
  "Flávio",
  "Leandrinho",
  "Adalberto",
  "Leandro",
  "Rafael Araújo",
  "Celico",
  "Jucemar Gaúcho",
  "Levi",
  "Washington",
  "Ronaldo Mendes",
  "Paulinho Macaíba",
];

const BENCH = [
  "Anderson Paraíba",
  "Cléberson",
  "Sinval",
  "Guêba",
  "Anderson Safira",
  "Jônatas",
  "Robério",
];

const SUBS = [
  { out: "Leandrinho", in: "Guêba", minute: 53 },
  { out: "Rafael Araújo", in: "Jônatas", minute: 63 },
  { out: "Jucemar Gaúcho", in: "Robério", minute: 77 },
];

const YELLOWS = [{ name: "Leandrinho", minute: 24 }];

try {
  if (!DRY) await client.query("BEGIN");

  const { rows: matchRows } = await client.query(
    `SELECT m.id, m.match_date::text, o.name AS opp, m.goals_for, m.goals_against, m.manager_id
     FROM matches m JOIN opponents o ON o.id=m.opponent_id WHERE m.id=$1`,
    [MATCH_ID],
  );
  if (!matchRows[0]) throw new Error(`match ${MATCH_ID} not found`);
  console.log("match", matchRows[0]);

  const { rows: mgr } = await client.query(
    `SELECT id, name FROM managers WHERE id=21 OR lower(name) LIKE '%lorival%'`,
  );
  const lorival = mgr.find((m) => /lorival/i.test(m.name)) ?? mgr[0];
  if (!lorival) throw new Error("Lorival Santos not found");
  console.log("coach", lorival);

  const { rows: allPlayers } = await client.query(`SELECT id, name FROM players`);
  const byNorm = new Map();
  for (const p of allPlayers) {
    const k = norm(p.name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(p);
  }

  async function ensureSeason(playerId) {
    if (DRY) return;
    const { rows } = await client.query(
      `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [playerId, SEASON],
    );
    if (!rows[0]) {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,0,0,0)`,
        [playerId, SEASON],
      );
    }
  }

  async function resolve(name) {
    const key = norm(name);
    if (FORCE[key] != null) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE missing ${name}`);
      await ensureSeason(rows[0].id);
      return rows[0];
    }
    // prefer player already on 2012 roster
    const cands = byNorm.get(key) ?? [];
    for (const p of cands) {
      const { rows } = await client.query(
        `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [p.id, SEASON],
      );
      if (rows[0]) {
        await ensureSeason(p.id);
        return p;
      }
    }
    if (cands.length === 1) {
      await ensureSeason(cands[0].id);
      return cands[0];
    }
    // Anderson Paraíba — may exist from 2015
    if (key === "anderson paraiba") {
      const { rows } = await client.query(
        `SELECT id, name FROM players WHERE id=1206 OR lower(name)=lower($1)`,
        [name],
      );
      if (rows[0]) {
        await ensureSeason(rows[0].id);
        return rows[0];
      }
    }
    if (DRY) {
      console.log("would create", name);
      return { id: -1, name };
    }
    const ins = await client.query(
      `INSERT INTO players (name, nationality, verification_status)
       VALUES ($1,'Brasil','unverified') RETURNING id, name`,
      [name],
    );
    console.log("+ player", ins.rows[0]);
    await ensureSeason(ins.rows[0].id);
    return ins.rows[0];
  }

  // resolve all first
  const starterPs = [];
  for (const n of STARTERS) starterPs.push(await resolve(n));
  const benchPs = [];
  for (const n of BENCH) benchPs.push(await resolve(n));

  if (!DRY) {
    await client.query(`UPDATE matches SET manager_id=$2, scorers=NULL WHERE id=$1`, [
      MATCH_ID,
      lorival.id,
    ]);

    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [MATCH_ID]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [MATCH_ID]);
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [MATCH_ID]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [
      MATCH_ID,
    ]);

    const lineupIdByPlayer = new Map();
    let sort = 0;
    for (const p of starterPs) {
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
        [MATCH_ID, p.id, p.name, sort++],
      );
      lineupIdByPlayer.set(p.id, rows[0].id);
    }
    for (const p of benchPs) {
      if (lineupIdByPlayer.has(p.id)) continue;
      const { rows } = await client.query(
        `INSERT INTO match_lineups
           (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
         VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
        [MATCH_ID, p.id, p.name, sort++],
      );
      lineupIdByPlayer.set(p.id, rows[0].id);
    }

    for (const s of SUBS) {
      const outP = await resolve(s.out);
      const inP = await resolve(s.in);
      await client.query(
        `INSERT INTO match_substitutions
           (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
            player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,$8,NULL)`,
        [
          MATCH_ID,
          lineupIdByPlayer.get(outP.id) ?? null,
          outP.id,
          outP.name,
          lineupIdByPlayer.get(inP.id) ?? null,
          inP.id,
          inP.name,
          s.minute,
        ],
      );
    }

    for (const y of YELLOWS) {
      const p = await resolve(y.name);
      await client.query(
        `INSERT INTO match_cards
           (match_id, side, lineup_id, player_id, player_name, card_type, minute, injury_time_minute)
         VALUES ($1,'csa',$2,$3,$4,'yellow',$5,NULL)`,
        [MATCH_ID, lineupIdByPlayer.get(p.id) ?? null, p.id, p.name, y.minute],
      );
    }

    // Resync season apps/goals for involved players + full season (safe)
    const { rows: sheetStats } = await client.query(
      `
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id=ml.match_id
        WHERE m.season=$1 AND m.is_friendly=false AND ml.side='csa' AND ml.player_id IS NOT NULL
          AND (
            ml.role='starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions s
              WHERE s.match_id=ml.match_id AND s.side='csa'
                AND s.player_in_id=ml.player_id
            )
          )
        GROUP BY ml.player_id
      ),
      goals AS (
        SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
        FROM match_goals mg
        JOIN matches m ON m.id=mg.match_id
        WHERE m.season=$1 AND m.is_friendly=false AND mg.side='csa'
          AND coalesce(mg.is_own_goal,false)=false AND mg.scorer_player_id IS NOT NULL
        GROUP BY mg.scorer_player_id
      )
      SELECT a.player_id, a.appearances, coalesce(g.goals,0) AS goals
      FROM apps a
      LEFT JOIN goals g ON g.player_id=a.player_id
    `,
      [SEASON],
    );
    for (const s of sheetStats) {
      const { rows: cur } = await client.query(
        `SELECT id, assists FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [s.player_id, SEASON],
      );
      if (cur[0]) {
        await client.query(
          `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
          [cur[0].id, s.appearances, s.goals],
        );
      } else {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1,$2,$3,$4,0)`,
          [s.player_id, SEASON, s.appearances, s.goals],
        );
      }
    }
  }

  console.log({
    starters: starterPs.map((p) => `#${p.id} ${p.name}`),
    bench: benchPs.map((p) => `#${p.id} ${p.name}`),
    subs: SUBS,
    yellows: YELLOWS,
  });

  if (DRY) {
    console.log("DRY — no writes");
  } else {
    await client.query("COMMIT");
    console.log("COMMIT ok");
  }
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
