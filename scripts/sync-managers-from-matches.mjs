/**
 * Rebuild all manager_season_stats + managers.stored_* from linked official matches.
 * Overwrites manual rows. Clears managers with no linked official matches.
 *
 * Usage: node scripts/sync-managers-from-matches.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

const OFFICIAL = `
  coalesce(is_friendly, false) = false
  AND coalesce(status, 'played') <> 'scheduled'
  AND coalesce(result, '') <> 'unknown'
`;

try {
  if (!DRY) await client.query("BEGIN");

  const { rows: managers } = await client.query(`
    SELECT m.id, m.name, m.stats_source, m.stored_games,
      (SELECT count(*)::int FROM matches mt
        WHERE mt.manager_id = m.id AND ${OFFICIAL}) AS linked
    FROM managers m
    ORDER BY m.id
  `);

  let upserted = 0;
  let removed = 0;
  let cleared = 0;
  let changed = 0;

  for (const m of managers) {
    const { rows: seasons } = await client.query(
      `
      SELECT
        season::text AS season,
        count(*)::int AS games,
        count(*) FILTER (WHERE result = 'win')::int AS wins,
        count(*) FILTER (WHERE result = 'draw')::int AS draws,
        count(*) FILTER (WHERE result = 'loss')::int AS losses,
        coalesce(sum(goals_for), 0)::int AS goals_for,
        coalesce(sum(goals_against), 0)::int AS goals_against
      FROM matches
      WHERE manager_id = $1 AND ${OFFICIAL}
      GROUP BY season
      ORDER BY season DESC
      `,
      [m.id],
    );
    const keys = seasons.map((s) => s.season);

    const { rows: existing } = await client.query(
      `SELECT id, season::text AS season, games, stats_source
       FROM manager_season_stats WHERE manager_id = $1`,
      [m.id],
    );
    const bySeason = new Map(existing.map((r) => [r.season, r]));

    for (const s of seasons) {
      const cur = bySeason.get(s.season);
      const same =
        cur &&
        cur.games === s.games &&
        cur.stats_source === "calculated";
      // always rewrite to wipe manual + align WDL/goals
      if (!DRY) {
        await client.query(
          `
          INSERT INTO manager_season_stats (
            manager_id, season, games, wins, draws, losses,
            goals_for, goals_against, stats_source, stats_recalculated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated', now())
          ON CONFLICT (manager_id, season) DO UPDATE SET
            games = EXCLUDED.games,
            wins = EXCLUDED.wins,
            draws = EXCLUDED.draws,
            losses = EXCLUDED.losses,
            goals_for = EXCLUDED.goals_for,
            goals_against = EXCLUDED.goals_against,
            stats_source = 'calculated',
            stats_recalculated_at = now()
          `,
          [
            m.id,
            s.season,
            s.games,
            s.wins,
            s.draws,
            s.losses,
            s.goals_for,
            s.goals_against,
          ],
        );
      }
      upserted += 1;
      if (!same) changed += 1;
    }

    const orphans = existing.filter((r) => !keys.includes(r.season));
    if (orphans.length) {
      if (!DRY) {
        await client.query(
          `DELETE FROM manager_season_stats WHERE id = ANY($1::int[])`,
          [orphans.map((r) => r.id)],
        );
      }
      removed += orphans.length;
    }

    const games = seasons.reduce((n, s) => n + s.games, 0);
    const wins = seasons.reduce((n, s) => n + s.wins, 0);
    const draws = seasons.reduce((n, s) => n + s.draws, 0);
    const losses = seasons.reduce((n, s) => n + s.losses, 0);
    const gf = seasons.reduce((n, s) => n + s.goals_for, 0);
    const ga = seasons.reduce((n, s) => n + s.goals_against, 0);

    if (seasons.length === 0) {
      if (
        m.stored_games != null ||
        m.stats_source != null ||
        existing.length > 0
      ) {
        if (!DRY) {
          await client.query(
            `DELETE FROM manager_season_stats WHERE manager_id = $1`,
            [m.id],
          );
          await client.query(
            `UPDATE managers SET
               stored_games=NULL, stored_wins=NULL, stored_draws=NULL,
               stored_losses=NULL, stored_goals_for=NULL, stored_goals_against=NULL,
               stats_source=NULL, stats_recalculated_at=NULL
             WHERE id=$1`,
            [m.id],
          );
        }
        cleared += 1;
      }
    } else if (!DRY) {
      await client.query(
        `UPDATE managers SET
           stored_games=$2, stored_wins=$3, stored_draws=$4, stored_losses=$5,
           stored_goals_for=$6, stored_goals_against=$7,
           stats_source='calculated', stats_recalculated_at=now()
         WHERE id=$1`,
        [m.id, games, wins, draws, losses, gf, ga],
      );
    }

    if (
      m.stats_source === "manual" ||
      (m.stored_games != null && m.stored_games !== m.linked)
    ) {
      console.log(
        `#${m.id} ${m.name}: was ${m.stats_source ?? "?"} stored=${m.stored_games} → linked=${games}`,
      );
    }
  }

  if (!DRY) await client.query("COMMIT");

  const { rows: summary } = await client.query(`
    SELECT
      count(*) FILTER (WHERE stats_source='manual')::int AS season_manual,
      count(*) FILTER (WHERE stats_source='calculated')::int AS season_calculated,
      (SELECT count(*)::int FROM managers WHERE stats_source='manual') AS managers_manual,
      (SELECT count(*)::int FROM managers WHERE stats_source='calculated') AS managers_calculated
    FROM manager_season_stats
  `);

  console.log(DRY ? "DRY OK" : "OK", {
    managers: managers.length,
    upserted,
    changed,
    removed,
    cleared,
    summary: summary[0],
  });
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
