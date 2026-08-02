/**
 * Fix Taça de Prata 1982:
 * - Remove erroneous 1982 copies of 1980 matches (Caxias / Uberlândia / Comercial)
 *   that already exist correctly in Taça de Prata 1980.
 * - Insert missing 4ª fase vs Mixto-MT (14/03 and 20/03/1982).
 *
 * Usage: node scripts/fix-1982-prata-dates.mjs [--dry]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

async function refreshSeasonCompStats(season, competitionId) {
  const { rows: agg } = await client.query(
    `SELECT
       count(*)::int AS games,
       coalesce(sum(case when result='win' then 1 else 0 end),0)::int AS wins,
       coalesce(sum(case when result='draw' then 1 else 0 end),0)::int AS draws,
       coalesce(sum(case when result='loss' then 1 else 0 end),0)::int AS losses,
       coalesce(sum(goals_for),0)::int AS goals_for,
       coalesce(sum(goals_against),0)::int AS goals_against
     FROM matches
     WHERE season::text=$1 AND competition_id=$2
       AND coalesce(is_friendly,false)=false
       AND coalesce(status,'played')<>'scheduled'
       AND result IN ('win','draw','loss')
       AND lower(coalesce(phase,'')) NOT LIKE '%anulad%'`,
    [String(season), competitionId],
  );
  const a = agg[0];
  const { rows: scs } = await client.query(
    `SELECT id FROM season_competition_stats WHERE season::text=$1 AND competition_id=$2`,
    [String(season), competitionId],
  );
  if (scs[0]) {
    await client.query(
      `UPDATE season_competition_stats
       SET games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6,
           stats_source='calculated', stats_recalculated_at=now()
       WHERE id=$7`,
      [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, scs[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO season_competition_stats
         (season,competition_id,games,wins,draws,losses,goals_for,goals_against,stats_source,stats_recalculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
      [String(season), competitionId, a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against],
    );
  }
  return a;
}

try {
  if (!DRY) await client.query("BEGIN");

  const { rows: comps } = await client.query(
    `SELECT id, name FROM competitions WHERE name='Taça de Prata'`,
  );
  if (!comps[0]) throw new Error("Taça de Prata missing");
  const prataId = comps[0].id;

  // Confirm 1980 originals
  const { rows: y1980 } = await client.query(
    `
    SELECT m.id, m.match_date::date AS d, o.name AS opp, m.home_away,
           m.goals_for, m.goals_against, m.phase
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season::text='1980' AND m.competition_id=$1
      AND m.match_date::date IN ('1980-04-12','1980-04-16','1980-04-20')
      AND (
        o.name ILIKE '%Caxias%'
        OR o.name ILIKE '%Uberl%'
        OR o.name ILIKE '%Comercial%'
      )
    ORDER BY m.match_date
    `,
    [prataId],
  );
  console.log("1980 originals (keep):");
  for (const r of y1980) {
    console.log(
      `  #${r.id} ${String(r.d).slice(0, 10)} ${r.home_away} ${r.goals_for}x${r.goals_against} ${r.opp} [${r.phase}]`,
    );
  }
  if (y1980.length < 3) {
    throw new Error(`Expected 3 matches in 1980 Prata, found ${y1980.length}`);
  }

  // 1982 erroneous copies
  const { rows: bad1982 } = await client.query(
    `
    SELECT m.id, m.match_date::date AS d, o.name AS opp, m.home_away,
           m.goals_for, m.goals_against, m.phase,
           (SELECT count(*)::int FROM match_lineups ml WHERE ml.match_id=m.id) AS lineups,
           (SELECT count(*)::int FROM match_goals mg WHERE mg.match_id=m.id) AS goals
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season::text='1982' AND m.competition_id=$1
      AND m.match_date::date IN ('1982-04-12','1982-04-16','1982-04-20')
      AND (
        o.name ILIKE '%Caxias%'
        OR o.name ILIKE '%Uberl%'
        OR (o.name ILIKE '%Comercial%' AND m.home_away='home' AND m.goals_for=2 AND m.goals_against=1)
      )
    ORDER BY m.match_date
    `,
    [prataId],
  );
  console.log("1982 duplicates to remove from season (delete duplicate rows only):");
  for (const r of bad1982) {
    console.log(
      `  #${r.id} ${String(r.d).slice(0, 10)} ${r.home_away} ${r.goals_for}x${r.goals_against} ${r.opp} lu=${r.lineups} g=${r.goals}`,
    );
  }
  if (bad1982.length !== 3) {
    throw new Error(`Expected 3 bad 1982 rows, found ${bad1982.length}`);
  }

  // Don't touch the final on 1982-04-20 vs Campo Grande
  for (const r of bad1982) {
    if (/campo grande/i.test(r.opp)) {
      throw new Error(`Refusing to delete final match #${r.id}`);
    }
  }

  for (const r of bad1982) {
    if (DRY) continue;
    // Child rows first (safe even if empty)
    await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [r.id]);
    await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [r.id]);
    await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [r.id]);
    await client.query(`DELETE FROM match_lineups WHERE match_id=$1`, [r.id]);
    await client.query(`DELETE FROM matches WHERE id=$1`, [r.id]);
    console.log("DELETED_DUP", r.id);
  }

  // Ensure Mixto-MT opponent
  let { rows: mixto } = await client.query(`SELECT id, name FROM opponents WHERE name='Mixto-MT'`);
  if (!mixto[0]) {
    if (DRY) {
      console.log("would create Mixto-MT");
    } else {
      ({ rows: mixto } = await client.query(
        `INSERT INTO opponents (name, state, country) VALUES ('Mixto-MT','MT','Brasil')
         RETURNING id, name`,
      ));
      console.log("OPPONENT_CREATED", mixto[0]);
    }
  }
  const mixtoId = mixto[0]?.id;

  const newGames = [
    {
      date: "1982-03-14",
      ha: "home",
      gf: 3,
      ga: 1,
      phase: "4ª fase",
    },
    {
      date: "1982-03-20",
      ha: "away",
      gf: 2,
      ga: 1,
      phase: "4ª fase",
    },
  ];

  for (const g of newGames) {
    const { rows: ex } = await client.query(
      `SELECT id FROM matches
       WHERE match_date=$1 AND season::text='1982' AND competition_id=$2
         AND opponent_id=$3 AND home_away=$4`,
      [g.date, prataId, mixtoId, g.ha],
    );
    if (ex[0]) {
      console.log("Mixto already exists", ex[0].id, g.date);
      continue;
    }
    const result = g.gf > g.ga ? "win" : g.gf < g.ga ? "loss" : "draw";
    if (DRY) {
      console.log("would insert", g);
      continue;
    }
    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against,
         result, home_away, competition_id, phase, round,
         is_walkover, is_friendly, status
       ) VALUES (
         $1,'1982',$2,$3,$4,$5,$6,$7,$8,NULL,false,false,'played'
       ) RETURNING id`,
      [g.date, mixtoId, g.gf, g.ga, result, g.ha, prataId, g.phase],
    );
    console.log("INSERTED", ins[0].id, g);
  }

  const expected = {
    games: 9,
    wins: 5,
    draws: 1,
    losses: 3,
    goals_for: 16,
    goals_against: 14,
  };
  const stats = DRY
    ? { note: "dry" }
    : await refreshSeasonCompStats(1982, prataId);
  console.log("1982 Prata stats", stats);
  if (!DRY) {
    const ok =
      stats.games === expected.games &&
      stats.wins === expected.wins &&
      stats.draws === expected.draws &&
      stats.losses === expected.losses &&
      stats.goals_for === expected.goals_for &&
      stats.goals_against === expected.goals_against;
    if (!ok) {
      throw new Error(
        `Stats mismatch: got ${JSON.stringify(stats)} expected ${JSON.stringify(expected)}`,
      );
    }
  }

  // Reconfirm 1980 untouched
  const { rows: still1980 } = await client.query(
    `
    SELECT m.id, m.match_date::date AS d, o.name AS opp, m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    WHERE m.season::text='1980' AND m.competition_id=$1
      AND m.match_date::date IN ('1980-04-12','1980-04-16','1980-04-20')
      AND (o.name ILIKE '%Caxias%' OR o.name ILIKE '%Uberl%' OR o.name ILIKE '%Comercial%')
    ORDER BY m.match_date
    `,
    [prataId],
  );
  console.log("1980 still present:", still1980.length, still1980.map((r) => r.id));

  if (DRY) {
    console.log("DRY RUN — no writes");
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
