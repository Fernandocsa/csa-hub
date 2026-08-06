/**
 * Audit 2025 sheet completeness, then verify players who appear on CSA
 * sheets ONLY in 2025, mark the season as stats_fully_verified, and
 * recalculate auto badges (Artilheiro / Garçom).
 *
 * Usage: node scripts/verify-season-2025-exclusive-players.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const YEAR = "2025";
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

try {
  console.log(DRY ? "DRY" : "APPLY");

  const { rows: matches } = await c.query(`
    SELECT
      m.id,
      m.match_date::date AS d,
      m.goals_for,
      m.is_walkover,
      coalesce(m.own_goals_for_count, 0)::int AS own_goals_for_count,
      o.name AS opponent,
      coalesce(sum(CASE WHEN l.role = 'starter' THEN 1 ELSE 0 END), 0)::int AS starters,
      coalesce(sum(CASE WHEN l.role = 'bench' THEN 1 ELSE 0 END), 0)::int AS bench
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    LEFT JOIN match_lineups l ON l.match_id = m.id AND l.side = 'csa'
    WHERE m.season = $1
      AND m.is_friendly = false
      AND m.status <> 'scheduled'
      AND m.result <> 'unknown'
    GROUP BY m.id, o.name
    ORDER BY m.match_date, m.id
  `, [YEAR]);

  const fieldMatches = matches.filter((m) => !m.is_walkover);
  const matchIds = fieldMatches.map((m) => m.id);
  const { rows: goalAgg } = await c.query(
    `
    SELECT
      match_id,
      cast(sum(CASE WHEN coalesce(is_own_goal,false)=false THEN 1 ELSE 0 END) as int) AS goal_count,
      cast(sum(CASE WHEN coalesce(is_own_goal,false)=false AND scorer_player_id IS NULL THEN 1 ELSE 0 END) as int) AS missing_player_id
    FROM match_goals
    WHERE match_id = ANY($1::int[]) AND side = 'csa'
    GROUP BY match_id
    `,
    [matchIds],
  );
  const goalsByMatch = new Map(goalAgg.map((g) => [g.match_id, g]));

  const startersBad = [];
  const goalsBad = [];
  for (const m of fieldMatches) {
    if (m.starters !== 11) startersBad.push(m);
    const agg = goalsByMatch.get(m.id) ?? { goal_count: 0, missing_player_id: 0 };
    if (!isGoalsComplete(m, Number(agg.goal_count), Number(agg.missing_player_id))) {
      goalsBad.push({
        ...m,
        goal_count: Number(agg.goal_count),
        missing_player_id: Number(agg.missing_player_id),
      });
    }
  }

  console.log(`field matches: ${fieldMatches.length} (+${matches.length - fieldMatches.length} W.O.)`);
  console.log(`11 titulares: ${fieldMatches.length - startersBad.length}`);
  console.log(`!=11 titulares: ${startersBad.length}`);
  console.log(`gols incompletos: ${goalsBad.length}`);
  for (const m of startersBad) {
    console.log(`  tit #${m.id} ${String(m.d).slice(0, 10)} × ${m.opponent} tit=${m.starters}`);
  }
  for (const m of goalsBad) {
    console.log(
      `  gol #${m.id} ${String(m.d).slice(0, 10)} × ${m.opponent}` +
        ` GF=${m.goals_for} rows=${m.goal_count} own=${m.own_goals_for_count} missing=${m.missing_player_id}`,
    );
  }

  const sheetsOk = startersBad.length === 0 && goalsBad.length === 0;
  console.log(`sheets OK: ${sheetsOk}`);

  // Same exclusivity rule as 2016: only CSA lineup seasons = [2025]
  const { rows: exclusive } = await c.query(
    `
    WITH seasons_by_player AS (
      SELECT l.player_id,
             array_agg(DISTINCT m.season ORDER BY m.season) AS seasons
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.side = 'csa' AND l.player_id IS NOT NULL
      GROUP BY l.player_id
    )
    SELECT p.id, p.name, p.position, p.verification_status
    FROM seasons_by_player s
    JOIN players p ON p.id = s.player_id
    WHERE s.seasons = ARRAY[$1]::text[]
    ORDER BY p.name
    `,
    [YEAR],
  );

  const toVerify = exclusive.filter((r) => r.verification_status !== "verified");
  const already = exclusive.filter((r) => r.verification_status === "verified");
  console.log(`\nexclusive ${YEAR} players: ${exclusive.length}`);
  console.log(`already verified: ${already.length}`);
  console.log(`to verify: ${toVerify.length}`);
  for (const r of toVerify) {
    console.log(`  #${r.id} ${r.name}${r.position ? ` (${r.position})` : ""}`);
  }

  if (!sheetsOk) {
    console.log("\nABORT — fichas incompletas; não verificando jogadores/temporada");
    process.exitCode = 1;
  } else {
    await c.query("BEGIN");
    let playerUpdated = 0;
    if (toVerify.length) {
      if (!DRY) {
        const upd = await c.query(
          `
          UPDATE players
          SET verification_status = 'verified',
              verified_at = now(),
              verified_by = $2
          WHERE id = ANY($1::int[])
            AND verification_status IS DISTINCT FROM 'verified'
          RETURNING id, name
          `,
          [toVerify.map((r) => r.id), VERIFIED_BY],
        );
        playerUpdated = upd.rowCount ?? 0;
        console.log(`players updated ${playerUpdated}`);
      } else {
        playerUpdated = toVerify.length;
        console.log(`would update players ${playerUpdated}`);
      }
    } else {
      console.log("players: nothing to update");
    }

    const seasonBefore = (
      await c.query(
        `SELECT year, stats_fully_verified, stats_verified_at FROM seasons WHERE year = $1`,
        [Number(YEAR)],
      )
    ).rows[0];
    console.log("season before", seasonBefore);
    if (!seasonBefore) throw new Error(`season ${YEAR} missing from seasons table`);

    if (!DRY) {
      await c.query(
        `
        UPDATE seasons
        SET stats_fully_verified = true,
            stats_verified_at = now()
        WHERE year = $1
        `,
        [Number(YEAR)],
      );
    }

    // Auto badges (same logic as recalculateSeasonAutoBadges)
    const { rows: goalRows } = await c.query(
      `SELECT player_id, goals FROM player_season_stats WHERE season::text=$1`,
      [YEAR],
    );
    const { rows: assistRows } = await c.query(
      `SELECT player_id, assists FROM player_season_stats WHERE season::text=$1`,
      [YEAR],
    );
    const maxGoals = goalRows.reduce((m, r) => Math.max(m, Number(r.goals) || 0), 0);
    const maxAssists = assistRows.reduce(
      (m, r) => Math.max(m, Number(r.assists) || 0),
      0,
    );
    const topScorerIds =
      maxGoals > 0
        ? [
            ...new Set(
              goalRows
                .filter((r) => (Number(r.goals) || 0) === maxGoals)
                .map((r) => r.player_id),
            ),
          ]
        : [];
    const topAssisterIds =
      maxAssists > 0
        ? [
            ...new Set(
              assistRows
                .filter((r) => (Number(r.assists) || 0) === maxAssists)
                .map((r) => r.player_id),
            ),
          ]
        : [];
    console.log(
      `badges: Artilheiro ${YEAR} (${maxGoals} gols) → [${topScorerIds.join(", ")}]`,
    );
    console.log(
      `badges: Garçom ${YEAR} (${maxAssists} assists) → [${topAssisterIds.join(", ")}]`,
    );

    if (!DRY) {
      await c.query(
        `DELETE FROM entity_badges WHERE source='auto' AND season_year=$1`,
        [Number(YEAR)],
      );
      for (const playerId of topScorerIds) {
        await c.query(
          `INSERT INTO entity_badges
             (entity_type, entity_id, label, source, auto_kind, season_year, competition_id)
           VALUES ('player', $1, $2, 'auto', 'top_scorer', $3, NULL)`,
          [playerId, `Artilheiro ${YEAR}`, Number(YEAR)],
        );
      }
      for (const playerId of topAssisterIds) {
        await c.query(
          `INSERT INTO entity_badges
             (entity_type, entity_id, label, source, auto_kind, season_year, competition_id)
           VALUES ('player', $1, $2, 'auto', 'top_assister', $3, NULL)`,
          [playerId, `Garçom ${YEAR}`, Number(YEAR)],
        );
      }
    }

    if (DRY) {
      await c.query("ROLLBACK");
      console.log("DRY — rolled back");
    } else {
      await c.query("COMMIT");
      console.log("COMMIT ok");
      console.log(
        "season after",
        (
          await c.query(
            `SELECT year, stats_fully_verified, stats_verified_at FROM seasons WHERE year = $1`,
            [Number(YEAR)],
          )
        ).rows[0],
      );
      console.log(
        "badges after",
        (
          await c.query(
            `SELECT b.entity_id, p.name, b.label, b.auto_kind
             FROM entity_badges b
             LEFT JOIN players p ON p.id = b.entity_id AND b.entity_type='player'
             WHERE b.season_year=$1 AND b.source='auto'
             ORDER BY b.auto_kind, p.name`,
            [Number(YEAR)],
          )
        ).rows,
      );
    }
  }
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
