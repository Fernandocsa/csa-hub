/**
 * Mark season 2026 as stats_fully_verified + recalculate auto badges.
 * Usage: node scripts/verify-season-2026.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const YEAR = 2026;
const SEASON = String(YEAR);
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

try {
  console.log(DRY ? "DRY" : "APPLY");

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
    [SEASON],
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
  console.log(`field=${field.length} startersBad=${startersBad} goalsBad=${goalsBad}`);
  if (startersBad || goalsBad) {
    throw new Error("ABORT — fichas incompletas");
  }

  const { rows: goalRows } = await c.query(
    `SELECT player_id, goals FROM player_season_stats WHERE season::text=$1`,
    [SEASON],
  );
  const { rows: assistRows } = await c.query(
    `SELECT player_id, assists FROM player_season_stats WHERE season::text=$1`,
    [SEASON],
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
  console.log(`Artilheiro ${YEAR} (${maxGoals}): [${topScorerIds.join(", ")}]`);
  console.log(`Garçom ${YEAR} (${maxAssists}): [${topAssisterIds.join(", ")}]`);

  if (DRY) {
    console.log("DRY — no writes");
  } else {
    await c.query("BEGIN");
    await c.query(
      `UPDATE seasons
       SET stats_fully_verified = true, stats_verified_at = now()
       WHERE year = $1`,
      [YEAR],
    );
    await c.query(
      `DELETE FROM entity_badges WHERE source='auto' AND season_year=$1`,
      [YEAR],
    );
    for (const playerId of topScorerIds) {
      await c.query(
        `INSERT INTO entity_badges
           (entity_type, entity_id, label, source, auto_kind, season_year, competition_id)
         VALUES ('player', $1, $2, 'auto', 'top_scorer', $3, NULL)`,
        [playerId, `Artilheiro ${YEAR}`, YEAR],
      );
    }
    for (const playerId of topAssisterIds) {
      await c.query(
        `INSERT INTO entity_badges
           (entity_type, entity_id, label, source, auto_kind, season_year, competition_id)
         VALUES ('player', $1, $2, 'auto', 'top_assister', $3, NULL)`,
        [playerId, `Garçom ${YEAR}`, YEAR],
      );
    }
    await c.query("COMMIT");
    console.log("COMMIT ok");
    console.log(
      (
        await c.query(
          `SELECT year, stats_fully_verified, stats_verified_at FROM seasons WHERE year=$1`,
          [YEAR],
        )
      ).rows[0],
    );
    console.log(
      (
        await c.query(
          `SELECT b.entity_id, p.name, b.label
           FROM entity_badges b
           LEFT JOIN players p ON p.id=b.entity_id AND b.entity_type='player'
           WHERE b.season_year=$1 AND b.source='auto'
           ORDER BY b.auto_kind, p.name`,
          [YEAR],
        )
      ).rows,
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
