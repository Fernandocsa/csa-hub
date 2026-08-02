/**
 * Sync player_season_stats for 1992 from match sheets.
 * Appearances: starter OR bench who entered (match_substitutions.player_in).
 * Goals: CSA non-own-goal scorers (own goals against do not count as player goals).
 * Assists: from match_goals.assist_player_id when set.
 *
 * Season page /temporadas/:year reads player_season_stats — without this row,
 * players never appear in the roster.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

const SEASON = "1992";

try {
  await client.query("BEGIN");

  const { rows: stats } = await client.query(
    `
    WITH played AS (
      SELECT DISTINCT ml.match_id, ml.player_id
      FROM match_lineups ml
      JOIN matches m ON m.id = ml.match_id
      WHERE m.season = $1
        AND ml.side = 'csa'
        AND ml.player_id IS NOT NULL
        AND (
          ml.role = 'starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions ms
            WHERE ms.match_id = ml.match_id
              AND ms.side = 'csa'
              AND ms.player_in_id = ml.player_id
          )
        )
    ),
    apps AS (
      SELECT player_id, count(*)::int AS appearances
      FROM played
      GROUP BY player_id
    ),
    goals AS (
      SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
      FROM match_goals mg
      JOIN matches m ON m.id = mg.match_id
      WHERE m.season = $1
        AND mg.side = 'csa'
        AND mg.scorer_player_id IS NOT NULL
        AND coalesce(mg.is_own_goal, false) = false
      GROUP BY mg.scorer_player_id
    ),
    assists AS (
      SELECT mg.assist_player_id AS player_id, count(*)::int AS assists
      FROM match_goals mg
      JOIN matches m ON m.id = mg.match_id
      WHERE m.season = $1
        AND mg.side = 'csa'
        AND mg.assist_player_id IS NOT NULL
      GROUP BY mg.assist_player_id
    ),
    all_players AS (
      SELECT player_id FROM apps
      UNION
      SELECT player_id FROM goals
      UNION
      SELECT player_id FROM assists
    )
    SELECT
      ap.player_id,
      p.name,
      coalesce(a.appearances, 0)::int AS appearances,
      coalesce(g.goals, 0)::int AS goals,
      coalesce(as_.assists, 0)::int AS assists
    FROM all_players ap
    JOIN players p ON p.id = ap.player_id
    LEFT JOIN apps a ON a.player_id = ap.player_id
    LEFT JOIN goals g ON g.player_id = ap.player_id
    LEFT JOIN assists as_ ON as_.player_id = ap.player_id
    ORDER BY coalesce(a.appearances, 0) DESC, p.name
    `,
    [SEASON],
  );

  if (stats.length === 0) {
    throw new Error("No sheet-derived players for 1992 — lineups missing?");
  }

  const upserted = [];
  for (const s of stats) {
    const existing = await client.query(
      `SELECT id, appearances, goals, assists FROM player_season_stats
       WHERE player_id=$1 AND season=$2`,
      [s.player_id, SEASON],
    );
    if (existing.rows[0]) {
      await client.query(
        `UPDATE player_season_stats
         SET appearances=$1, goals=$2, assists=$3
         WHERE id=$4`,
        [s.appearances, s.goals, s.assists, existing.rows[0].id],
      );
      upserted.push({
        id: s.player_id,
        name: s.name,
        appearances: s.appearances,
        goals: s.goals,
        assists: s.assists,
        action: "updated",
        before: existing.rows[0],
      });
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1, $2, $3, $4, $5)`,
        [s.player_id, SEASON, s.appearances, s.goals, s.assists],
      );
      upserted.push({
        id: s.player_id,
        name: s.name,
        appearances: s.appearances,
        goals: s.goals,
        assists: s.assists,
        action: "inserted",
      });
    }
  }

  // Also sync manager_season_stats from matches.manager_id for 1992
  const { rows: mgrStats } = await client.query(
    `
    SELECT
      m.manager_id,
      mgr.name,
      count(*)::int AS games,
      count(*) FILTER (WHERE m.result = 'win')::int AS wins,
      count(*) FILTER (WHERE m.result = 'draw')::int AS draws,
      count(*) FILTER (WHERE m.result = 'loss')::int AS losses,
      coalesce(sum(m.goals_for), 0)::int AS goals_for,
      coalesce(sum(m.goals_against), 0)::int AS goals_against
    FROM matches m
    JOIN managers mgr ON mgr.id = m.manager_id
    WHERE m.season = $1
      AND m.manager_id IS NOT NULL
      AND coalesce(m.is_friendly, false) = false
      AND coalesce(m.status, 'played') <> 'scheduled'
      AND m.result IN ('win', 'draw', 'loss')
    GROUP BY m.manager_id, mgr.name
    ORDER BY games DESC
    `,
    [SEASON],
  );

  const mgrUpserted = [];
  for (const s of mgrStats) {
    const ex = await client.query(
      `SELECT id FROM manager_season_stats WHERE manager_id=$1 AND season=$2`,
      [s.manager_id, SEASON],
    );
    if (ex.rows[0]) {
      await client.query(
        `UPDATE manager_season_stats SET
           games=$1, wins=$2, draws=$3, losses=$4,
           goals_for=$5, goals_against=$6
         WHERE id=$7`,
        [s.games, s.wins, s.draws, s.losses, s.goals_for, s.goals_against, ex.rows[0].id],
      );
      mgrUpserted.push({ name: s.name, ...s, action: "updated" });
    } else {
      // Check columns for manager_season_stats
      await client.query(
        `INSERT INTO manager_season_stats
           (manager_id, season, games, wins, draws, losses, goals_for, goals_against)
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
      mgrUpserted.push({ name: s.name, ...s, action: "inserted" });
    }
  }

  await client.query("COMMIT");

  const { rows: check } = await client.query(
    `SELECT count(*)::int AS n FROM player_season_stats WHERE season=$1`,
    [SEASON],
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        season: SEASON,
        playerSeasonStatsCount: check[0].n,
        players: upserted.map((u) => ({
          name: u.name,
          appearances: u.appearances,
          goals: u.goals,
          action: u.action,
        })),
        managers: mgrUpserted.map((m) => ({
          name: m.name,
          games: m.games,
          wdl: `${m.wins}-${m.draws}-${m.losses}`,
          action: m.action,
        })),
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
