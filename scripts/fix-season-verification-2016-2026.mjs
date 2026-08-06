/**
 * Correct season verification:
 * - 2016 finished → stats_fully_verified + auto badges
 * - 2026 in progress → clear verification + auto badges
 * Then sync player seals to seasons ⊆ verified set.
 *
 * Usage: node scripts/fix-season-verification-2016-2026.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const VERIFIED_BY = "Portal Marujo";
const pool = createPgPool();
const c = await pool.connect();

function isGoalsComplete(m, goalCount, missingPlayerId) {
  if (m.goals_for == null) return false;
  const own = m.own_goals_for_count ?? 0;
  if (own < 0) return false;
  if (goalCount + own !== m.goals_for) return false;
  if (missingPlayerId > 0) return false;
  return true;
}

async function auditSheets(year) {
  const season = String(year);
  const { rows: matches } = await c.query(
    `
    SELECT
      m.id, m.goals_for, m.is_walkover,
      coalesce(m.own_goals_for_count, 0)::int AS own_goals_for_count,
      coalesce(sum(CASE WHEN l.role = 'starter' THEN 1 ELSE 0 END), 0)::int AS starters
    FROM matches m
    LEFT JOIN match_lineups l ON l.match_id = m.id AND l.side = 'csa'
    WHERE m.season = $1
      AND m.is_friendly = false
      AND m.status <> 'scheduled'
      AND m.result <> 'unknown'
    GROUP BY m.id
    `,
    [season],
  );
  const field = matches.filter((m) => !m.is_walkover);
  const { rows: goalAgg } = await c.query(
    `
    SELECT match_id,
      cast(sum(CASE WHEN coalesce(is_own_goal,false)=false THEN 1 ELSE 0 END) as int) AS goal_count,
      cast(sum(CASE WHEN coalesce(is_own_goal,false)=false AND scorer_player_id IS NULL THEN 1 ELSE 0 END) as int) AS missing_player_id
    FROM match_goals
    WHERE match_id = ANY($1::int[]) AND side = 'csa'
    GROUP BY match_id
    `,
    [field.map((m) => m.id)],
  );
  const by = new Map(goalAgg.map((g) => [g.match_id, g]));
  let startersBad = 0;
  let goalsBad = 0;
  for (const m of field) {
    if (m.starters !== 11) startersBad++;
    const agg = by.get(m.id) ?? { goal_count: 0, missing_player_id: 0 };
    if (!isGoalsComplete(m, Number(agg.goal_count), Number(agg.missing_player_id))) {
      goalsBad++;
    }
  }
  return { field: field.length, startersBad, goalsBad, ok: startersBad === 0 && goalsBad === 0 };
}

async function seasonLeaders(year) {
  const season = String(year);
  const { rows: goalRows } = await c.query(
    `SELECT player_id, goals FROM player_season_stats WHERE season::text=$1`,
    [season],
  );
  const { rows: assistRows } = await c.query(
    `SELECT player_id, assists FROM player_season_stats WHERE season::text=$1`,
    [season],
  );
  const maxGoals = goalRows.reduce((m, r) => Math.max(m, Number(r.goals) || 0), 0);
  const maxAssists = assistRows.reduce(
    (m, r) => Math.max(m, Number(r.assists) || 0),
    0,
  );
  const topScorerIds =
    maxGoals > 0
      ? [...new Set(goalRows.filter((r) => (Number(r.goals) || 0) === maxGoals).map((r) => r.player_id))]
      : [];
  const topAssisterIds =
    maxAssists > 0
      ? [...new Set(assistRows.filter((r) => (Number(r.assists) || 0) === maxAssists).map((r) => r.player_id))]
      : [];
  return { maxGoals, maxAssists, topScorerIds, topAssisterIds };
}

async function setSeasonVerified(year, leaders) {
  await c.query(
    `UPDATE seasons
     SET stats_fully_verified = true, stats_verified_at = now()
     WHERE year = $1`,
    [year],
  );
  await c.query(
    `DELETE FROM entity_badges WHERE source='auto' AND season_year=$1`,
    [year],
  );
  for (const playerId of leaders.topScorerIds) {
    await c.query(
      `INSERT INTO entity_badges
         (entity_type, entity_id, label, source, auto_kind, season_year, competition_id)
       VALUES ('player', $1, $2, 'auto', 'top_scorer', $3, NULL)`,
      [playerId, `Artilheiro ${year}`, year],
    );
  }
  for (const playerId of leaders.topAssisterIds) {
    await c.query(
      `INSERT INTO entity_badges
         (entity_type, entity_id, label, source, auto_kind, season_year, competition_id)
       VALUES ('player', $1, $2, 'auto', 'top_assister', $3, NULL)`,
      [playerId, `Garçom ${year}`, year],
    );
  }
}

async function clearSeasonVerified(year) {
  await c.query(
    `UPDATE seasons
     SET stats_fully_verified = false, stats_verified_at = NULL
     WHERE year = $1`,
    [year],
  );
  const del = await c.query(
    `DELETE FROM entity_badges WHERE source='auto' AND season_year=$1 RETURNING id`,
    [year],
  );
  return del.rowCount ?? 0;
}

async function syncPlayerSeals() {
  const { rows: verifiedSeasons } = await c.query(`
    SELECT year FROM seasons WHERE stats_fully_verified = true ORDER BY year
  `);
  const yearTexts = verifiedSeasons.map((r) => String(r.year));
  console.log("verified seasons for seals:", yearTexts.join(", ") || "(none)");

  const { rows: players } = await c.query(
    `
    WITH seasons_by_player AS (
      SELECT l.player_id,
             array_agg(DISTINCT m.season ORDER BY m.season) AS seasons
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.side = 'csa' AND l.player_id IS NOT NULL
      GROUP BY l.player_id
    )
    SELECT p.id, p.name, p.verification_status, s.seasons,
           (s.seasons <@ $1::text[]) AS all_verified
    FROM seasons_by_player s
    JOIN players p ON p.id = s.player_id
    `,
    [yearTexts],
  );

  const toVerify = players.filter(
    (p) => p.all_verified && p.verification_status !== "verified",
  );
  const toUnverify = players.filter(
    (p) => !p.all_verified && p.verification_status === "verified",
  );

  console.log(`eligible: ${players.filter((p) => p.all_verified).length}`);
  console.log(`to verify: ${toVerify.length}`);
  console.log(`to unverify: ${toUnverify.length}`);

  let verified = 0;
  let unverified = 0;
  if (toUnverify.length) {
    const upd = await c.query(
      `
      UPDATE players
      SET verification_status = 'unverified',
          verified_at = NULL,
          verified_by = NULL
      WHERE id = ANY($1::int[])
        AND verification_status = 'verified'
      RETURNING id
      `,
      [toUnverify.map((p) => p.id)],
    );
    unverified = upd.rowCount ?? 0;
  }
  if (toVerify.length) {
    const upd = await c.query(
      `
      UPDATE players
      SET verification_status = 'verified',
          verified_at = now(),
          verified_by = $2
      WHERE id = ANY($1::int[])
        AND verification_status IS DISTINCT FROM 'verified'
      RETURNING id
      `,
      [toVerify.map((p) => p.id), VERIFIED_BY],
    );
    verified = upd.rowCount ?? 0;
  }
  return { verified, unverified, yearTexts };
}

try {
  console.log(DRY ? "DRY" : "APPLY");

  const a2016 = await auditSheets(2016);
  console.log("2016 sheets", a2016);
  if (!a2016.ok) throw new Error("2016 sheets incomplete — abort");

  const leaders2016 = await seasonLeaders(2016);
  console.log(
    `2016 leaders: Artilheiro(${leaders2016.maxGoals})=[${leaders2016.topScorerIds}] Garçom(${leaders2016.maxAssists})=[${leaders2016.topAssisterIds}]`,
  );

  const before = await c.query(
    `SELECT year, stats_fully_verified FROM seasons WHERE year = ANY(ARRAY[2016,2025,2026]) ORDER BY year`,
  );
  console.log("seasons before", before.rows);

  if (DRY) {
    console.log("DRY — would verify 2016, unverify 2026, then sync seals");
  } else {
    await c.query("BEGIN");
    await setSeasonVerified(2016, leaders2016);
    const cleared2026 = await clearSeasonVerified(2026);
    console.log(`2026 cleared auto badges: ${cleared2026}`);
    // Keep 2025 as-is (already verified)
    const sync = await syncPlayerSeals();
    await c.query("COMMIT");
    console.log(`COMMIT ok — seals +${sync.verified} / -${sync.unverified}`);

    console.log(
      "seasons after",
      (
        await c.query(
          `SELECT year, stats_fully_verified, stats_verified_at
           FROM seasons WHERE year = ANY(ARRAY[2016,2025,2026]) ORDER BY year`,
        )
      ).rows,
    );
    console.log(
      "2016 badges",
      (
        await c.query(
          `SELECT b.entity_id, p.name, b.label
           FROM entity_badges b
           LEFT JOIN players p ON p.id=b.entity_id AND b.entity_type='player'
           WHERE b.season_year=2016 AND b.source='auto'
           ORDER BY b.auto_kind, p.name`,
        )
      ).rows,
    );
    console.log(
      "2026 badges left",
      (
        await c.query(
          `SELECT count(*)::int AS n FROM entity_badges
           WHERE season_year=2026 AND source='auto'`,
        )
      ).rows[0],
    );
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
