/**
 * Torneio Início de Alagoas is a friendly competition — exclude from official stats.
 * Sets matches.is_friendly = true, competitions.type = 'friendly', and recalculates
 * season_competition_stats for affected seasons (preserves manual champion rows).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const COMP_NAME = "Torneio Início de Alagoas";

try {
  console.log("=== mark-torneio-inicio-friendly ===");

  const { rows: comps } = await pool.query(
    `SELECT id, name, type FROM competitions WHERE name = $1`,
    [COMP_NAME],
  );
  if (comps.length === 0) throw new Error(`Competition not found: ${COMP_NAME}`);
  const compId = comps[0].id;
  console.log(`competition #${compId} type=${comps[0].type}`);

  await pool.query("BEGIN");

  const { rows: typeUpd } = await pool.query(
    `UPDATE competitions
     SET type = 'friendly'
     WHERE id = $1 AND type IS DISTINCT FROM 'friendly'
     RETURNING id, type`,
    [compId],
  );
  console.log("competition type updated:", typeUpd.length ? typeUpd[0] : "(already friendly)");

  const { rows: matchUpd } = await pool.query(
    `UPDATE matches
     SET is_friendly = true
     WHERE competition_id = $1 AND coalesce(is_friendly, false) = false
     RETURNING id, season`,
    [compId],
  );
  console.log(`matches marked friendly: ${matchUpd.length}`);

  // Champion seasons that were calculated from matches → keep as manual titles with 0 games
  const { rows: champCalc } = await pool.query(
    `UPDATE season_competition_stats
     SET games = 0,
         wins = 0,
         draws = 0,
         losses = 0,
         goals_for = 0,
         goals_against = 0,
         stats_source = 'manual',
         stats_recalculated_at = now()
     WHERE competition_id = $1
       AND is_champion = true
       AND stats_source = 'calculated'
     RETURNING season`,
    [compId],
  );
  console.log(
    "champion calculated→manual:",
    champCalc.map((r) => r.season).join(", ") || "(none)",
  );

  // Non-champion calculated rows for this competition no longer belong in official season stats
  const { rows: deleted } = await pool.query(
    `DELETE FROM season_competition_stats
     WHERE competition_id = $1
       AND stats_source = 'calculated'
       AND coalesce(is_champion, false) = false
     RETURNING season, games`,
    [compId],
  );
  console.log(
    "removed calculated non-champion rows:",
    deleted.map((r) => `${r.season}(${r.games}j)`).join(", ") || "(none)",
  );

  // Recalculate other competitions in touched seasons (Alagoano etc. unchanged by our deletes,
  // but keep season totals consistent if any mixed recalcs needed later).
  const seasons = [...new Set(matchUpd.map((r) => r.season))].sort();
  console.log("touched seasons:", seasons.join(", "));

  await pool.query("COMMIT");

  const verify = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM matches WHERE competition_id = $1 AND coalesce(is_friendly,false)=false) AS still_official,
       (SELECT count(*)::int FROM matches WHERE competition_id = $1 AND coalesce(is_friendly,false)=true) AS friendly_matches,
       (SELECT type FROM competitions WHERE id = $1) AS competition_type`,
    [compId],
  );
  console.log("verify", verify.rows[0]);
  if (verify.rows[0].still_official !== 0) {
    throw new Error("Some Torneio Início matches still marked official");
  }
  console.log("OK Torneio Início excluded from official match stats");
} catch (e) {
  try {
    await pool.query("ROLLBACK");
  } catch {
    /* ignore */
  }
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
