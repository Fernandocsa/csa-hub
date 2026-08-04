/**
 * Full resync of player_season_stats apps/goals/assists from CSA match sheets
 * (same rules as syncPlayerSeasonStatsFromSheets + unused-bench season rows).
 *
 * - Upserts seasons with actual play / goals / assists
 * - Ensures 0/0/0 rows for unused-bench seasons missing from stats
 * - Never deletes other seasons
 *
 * Usage:
 *   node scripts/resync-all-player-season-from-sheets.mjs [--dry]
 *   node scripts/resync-all-player-season-from-sheets.mjs [--dry] 2025 2026
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const seasonFilter = process.argv.slice(2).filter((a) => /^\d{4}$/.test(a));

const pool = createPgPool();
const client = await pool.connect();

try {
  const seasonClause =
    seasonFilter.length > 0
      ? `AND m.season::text = ANY($1::text[])`
      : "";
  const params = seasonFilter.length > 0 ? [seasonFilter] : [];

  const { rows: players } = await client.query(
    `
    SELECT DISTINCT l.player_id
    FROM match_lineups l
    JOIN matches m ON m.id = l.match_id
    WHERE l.side = 'csa' AND l.player_id IS NOT NULL
      ${seasonClause}
    ORDER BY l.player_id
    `,
    params,
  );

  console.log(
    `Players with CSA sheets${seasonFilter.length ? ` in ${seasonFilter.join(",")}` : ""}: ${players.length}`,
  );

  let updated = 0;
  let inserted = 0;
  let unchanged = 0;
  let benchEnsured = 0;
  const samples = [];

  if (!DRY) await client.query("BEGIN");

  for (const { player_id: playerId } of players) {
    const { rows: apps } = await client.query(
      `
      SELECT m.season::text AS season, COUNT(DISTINCT m.id)::int AS appearances
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.player_id = $1 AND l.side = 'csa'
        AND (
          l.role = 'starter'
          OR EXISTS (
            SELECT 1 FROM match_substitutions s
            WHERE s.match_id = m.id
              AND s.side = 'csa'
              AND s.player_in_id = l.player_id
          )
        )
      GROUP BY m.season
      `,
      [playerId],
    );

    const { rows: goals } = await client.query(
      `
      SELECT m.season::text AS season, COUNT(*)::int AS goals
      FROM match_goals g
      JOIN matches m ON m.id = g.match_id
      WHERE g.scorer_player_id = $1 AND g.side = 'csa'
        AND coalesce(g.is_own_goal, false) = false
      GROUP BY m.season
      `,
      [playerId],
    );

    const { rows: assists } = await client.query(
      `
      SELECT m.season::text AS season, COUNT(*)::int AS assists
      FROM match_goals g
      JOIN matches m ON m.id = g.match_id
      WHERE g.assist_player_id = $1 AND g.side = 'csa'
      GROUP BY m.season
      `,
      [playerId],
    );

    const { rows: lineupSeasons } = await client.query(
      `
      SELECT DISTINCT m.season::text AS season,
             MAX(l.shirt_number) FILTER (WHERE l.shirt_number IS NOT NULL) AS shirt_number
      FROM match_lineups l
      JOIN matches m ON m.id = l.match_id
      WHERE l.player_id = $1 AND l.side = 'csa'
      GROUP BY m.season
      `,
      [playerId],
    );

    const derived = new Map();
    for (const r of apps) {
      derived.set(r.season, {
        appearances: r.appearances,
        goals: 0,
        assists: 0,
      });
    }
    for (const r of goals) {
      const cur = derived.get(r.season) ?? {
        appearances: 0,
        goals: 0,
        assists: 0,
      };
      cur.goals = r.goals;
      derived.set(r.season, cur);
    }
    for (const r of assists) {
      const cur = derived.get(r.season) ?? {
        appearances: 0,
        goals: 0,
        assists: 0,
      };
      cur.assists = r.assists;
      derived.set(r.season, cur);
    }

    const { rows: existing } = await client.query(
      `SELECT id, season::text AS season, appearances, goals, assists
       FROM player_season_stats WHERE player_id = $1`,
      [playerId],
    );
    const bySeason = new Map(existing.map((r) => [r.season, r]));

    for (const [season, agg] of derived) {
      if (
        seasonFilter.length > 0 &&
        !seasonFilter.includes(season)
      ) {
        continue;
      }
      const cur = bySeason.get(season);
      if (cur) {
        if (
          cur.appearances === agg.appearances &&
          cur.goals === agg.goals &&
          cur.assists === agg.assists
        ) {
          unchanged += 1;
          continue;
        }
        if (
          samples.length < 25 &&
          (agg.appearances > cur.appearances || agg.goals > cur.goals)
        ) {
          samples.push({
            playerId,
            season,
            from: `${cur.appearances}a/${cur.goals}g`,
            to: `${agg.appearances}a/${agg.goals}g`,
          });
        }
        if (!DRY) {
          await client.query(
            `UPDATE player_season_stats
             SET appearances = $2, goals = $3, assists = $4
             WHERE id = $1`,
            [cur.id, agg.appearances, agg.goals, agg.assists],
          );
        }
        updated += 1;
      } else {
        if (!DRY) {
          await client.query(
            `INSERT INTO player_season_stats
               (player_id, season, appearances, goals, assists, shirt_number)
             VALUES ($1, $2, $3, $4, $5, NULL)`,
            [playerId, season, agg.appearances, agg.goals, agg.assists],
          );
        }
        inserted += 1;
        bySeason.set(season, { id: -1, season, ...agg });
      }
    }

    for (const ls of lineupSeasons) {
      if (
        seasonFilter.length > 0 &&
        !seasonFilter.includes(ls.season)
      ) {
        continue;
      }
      if (bySeason.has(ls.season)) continue;
      if (!DRY) {
        await client.query(
          `INSERT INTO player_season_stats
             (player_id, season, appearances, goals, assists, shirt_number)
           VALUES ($1, $2, 0, 0, 0, $3)`,
          [playerId, ls.season, ls.shirt_number ?? null],
        );
      }
      benchEnsured += 1;
      bySeason.set(ls.season, {
        id: -1,
        season: ls.season,
        appearances: 0,
        goals: 0,
        assists: 0,
      });
    }
  }

  if (!DRY) await client.query("COMMIT");

  console.log("\nSAMPLES (apps/goals bumps):");
  for (const s of samples) {
    console.log(`  #${s.playerId} ${s.season}: ${s.from} → ${s.to}`);
  }
  console.log(
    `\n${DRY ? "DRY " : ""}updated=${updated} inserted=${inserted} unchanged=${unchanged} benchEnsured=${benchEnsured}`,
  );
} catch (e) {
  if (!DRY) await client.query("ROLLBACK").catch(() => {});
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
