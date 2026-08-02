/**
 * 1) Add missing player_season_stats rows (lineup without PSS):
 *    Joelson 2019, Lucas Rafael 2019, Roger 2024,
 *    Wellington Nunes 2025, Caio Leandro 2026.
 * 2) Repoint wrong sheet links:
 *    Gustavinho #65 → Gustavo Cabral #399 (only seasons 2024–2025; keep 2017 Gustavinho)
 *    Jeffinho #510 → Jefferson Júnior #394 (all refs)
 * 3) Refresh target PSS floors from linked CSA sheet appearances/goals/assists.
 *
 * Usage: node scripts/fix-missing-roster-and-repoints.mjs [--dry-run]
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const dryRun = process.argv.includes("--dry-run");
loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

async function linkedSeasonStats(playerId, season) {
  const { rows } = await client.query(
    `
    SELECT
      (
        SELECT count(DISTINCT ml.match_id)::int
        FROM match_lineups ml
        JOIN matches m ON m.id = ml.match_id
        WHERE ml.player_id = $1 AND ml.side = 'csa' AND m.season = $2
          AND (
            ml.role = 'starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions s
              WHERE s.match_id = ml.match_id
                AND s.side = 'csa'
                AND s.player_in_id = ml.player_id
            )
          )
      ) AS appearances,
      (
        SELECT count(*)::int
        FROM match_goals g
        JOIN matches m ON m.id = g.match_id
        WHERE g.scorer_player_id = $1 AND g.side = 'csa'
          AND g.is_own_goal = false AND m.season = $2
      ) AS goals,
      (
        SELECT count(*)::int
        FROM match_goals g
        JOIN matches m ON m.id = g.match_id
        WHERE g.assist_player_id = $1 AND g.side = 'csa' AND m.season = $2
      ) AS assists,
      (
        SELECT mode() WITHIN GROUP (ORDER BY ml.shirt_number)
        FROM match_lineups ml
        JOIN matches m ON m.id = ml.match_id
        WHERE ml.player_id = $1 AND ml.side = 'csa' AND m.season = $2
          AND ml.shirt_number IS NOT NULL
      ) AS shirt_number
    `,
    [playerId, season],
  );
  return rows[0];
}

async function upsertPss(playerId, season, { appearances, goals, assists, shirt_number }) {
  const { rows: existing } = await client.query(
    `SELECT id, appearances, goals, assists, shirt_number
     FROM player_season_stats WHERE player_id=$1 AND season=$2`,
    [playerId, season],
  );
  if (!existing[0]) {
    if (dryRun) return { action: "would-insert", appearances, goals, assists, shirt_number };
    const { rows } = await client.query(
      `INSERT INTO player_season_stats
         (player_id, season, appearances, goals, assists, shirt_number)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, appearances, goals, assists, shirt_number`,
      [playerId, season, appearances, goals, assists, shirt_number],
    );
    return { action: "inserted", ...rows[0] };
  }

  const nextApps = Math.max(existing[0].appearances ?? 0, appearances ?? 0);
  const nextGoals = Math.max(existing[0].goals ?? 0, goals ?? 0);
  const nextAssists = Math.max(existing[0].assists ?? 0, assists ?? 0);
  const nextShirt = existing[0].shirt_number ?? shirt_number ?? null;
  const changed =
    nextApps !== existing[0].appearances ||
    nextGoals !== existing[0].goals ||
    nextAssists !== existing[0].assists ||
    nextShirt !== existing[0].shirt_number;

  if (!changed) return { action: "unchanged", ...existing[0] };
  if (dryRun) {
    return {
      action: "would-update",
      from: existing[0],
      to: { appearances: nextApps, goals: nextGoals, assists: nextAssists, shirt_number: nextShirt },
    };
  }
  const { rows } = await client.query(
    `UPDATE player_season_stats SET
       appearances=$2, goals=$3, assists=$4, shirt_number=$5
     WHERE id=$1
     RETURNING id, appearances, goals, assists, shirt_number`,
    [existing[0].id, nextApps, nextGoals, nextAssists, nextShirt],
  );
  return { action: "updated", ...rows[0] };
}

/** Repoint match FKs from→to, optionally limited to seasons. */
async function repointPlayer(fromId, toId, toName, { seasons = null } = {}) {
  // Lineup conflicts in scope
  const conflicts = await client.query(
    `
    SELECT a.id AS from_lineup_id, b.id AS to_lineup_id, a.match_id
    FROM match_lineups a
    JOIN match_lineups b
      ON a.match_id = b.match_id AND a.side = b.side AND b.player_id = $2
    JOIN matches m ON m.id = a.match_id
    WHERE a.player_id = $1
      ${seasons ? "AND m.season = ANY($3::text[])" : ""}
    `,
    seasons ? [fromId, toId, seasons] : [fromId, toId],
  );

  for (const c of conflicts.rows) {
    if (dryRun) continue;
    await client.query(
      `UPDATE match_goals SET scorer_lineup_id=$2 WHERE scorer_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(
      `UPDATE match_goals SET assist_lineup_id=$2 WHERE assist_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(`UPDATE match_cards SET lineup_id=$2 WHERE lineup_id=$1`, [
      c.from_lineup_id,
      c.to_lineup_id,
    ]);
    await client.query(
      `UPDATE match_substitutions SET player_out_lineup_id=$2 WHERE player_out_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(
      `UPDATE match_substitutions SET player_in_lineup_id=$2 WHERE player_in_lineup_id=$1`,
      [c.from_lineup_id, c.to_lineup_id],
    );
    await client.query(`DELETE FROM match_lineups WHERE id=$1`, [c.from_lineup_id]);
  }

  const counts = { conflictsRemoved: conflicts.rows.length, updates: {} };

  // Scoped lineup + dependent rows via match season
  if (seasons) {
    const lineupIds = (
      await client.query(
        `SELECT ml.id FROM match_lineups ml
         JOIN matches m ON m.id = ml.match_id
         WHERE ml.player_id=$1 AND m.season = ANY($2::text[])`,
        [fromId, seasons],
      )
    ).rows.map((r) => r.id);

    if (!dryRun && lineupIds.length) {
      const r = await client.query(
        `UPDATE match_lineups SET player_id=$2, player_name=$3
         WHERE id = ANY($1::int[])`,
        [lineupIds, toId, toName],
      );
      counts.updates["match_lineups.player_id"] = r.rowCount;
    } else {
      counts.updates["match_lineups.player_id"] = lineupIds.length;
    }

    const matchScoped = [
      ["match_goals", "scorer_player_id", "scorer_name"],
      ["match_goals", "assist_player_id", "assist_name"],
      ["match_cards", "player_id", "player_name"],
      ["match_substitutions", "player_out_id", "player_out_name"],
      ["match_substitutions", "player_in_id", "player_in_name"],
    ];
    for (const [table, idCol, nameCol] of matchScoped) {
      const sql = `
        UPDATE ${table} t SET ${idCol}=$2, ${nameCol}=$3
        FROM matches m
        WHERE t.match_id = m.id
          AND t.${idCol} = $1
          AND m.season = ANY($4::text[])
      `;
      if (dryRun) {
        const { rows } = await client.query(
          `SELECT count(*)::int AS n FROM ${table} t
           JOIN matches m ON m.id = t.match_id
           WHERE t.${idCol}=$1 AND m.season = ANY($2::text[])`,
          [fromId, seasons],
        );
        counts.updates[`${table}.${idCol}`] = rows[0].n;
      } else {
        const r = await client.query(sql, [fromId, toId, toName, seasons]);
        counts.updates[`${table}.${idCol}`] = r.rowCount;
      }
    }

    if (dryRun) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM matches
         WHERE captain_player_id=$1 AND season = ANY($2::text[])`,
        [fromId, seasons],
      );
      counts.updates["matches.captain_player_id"] = rows[0].n;
    } else {
      const r = await client.query(
        `UPDATE matches SET captain_player_id=$2
         WHERE captain_player_id=$1 AND season = ANY($3::text[])`,
        [fromId, toId, seasons],
      );
      counts.updates["matches.captain_player_id"] = r.rowCount;
    }
  } else {
    const tables = [
      ["match_lineups", "player_id", "player_name"],
      ["match_goals", "scorer_player_id", "scorer_name"],
      ["match_goals", "assist_player_id", "assist_name"],
      ["match_cards", "player_id", "player_name"],
      ["match_substitutions", "player_out_id", "player_out_name"],
      ["match_substitutions", "player_in_id", "player_in_name"],
    ];
    for (const [table, idCol, nameCol] of tables) {
      if (dryRun) {
        const { rows } = await client.query(
          `SELECT count(*)::int AS n FROM ${table} WHERE ${idCol}=$1`,
          [fromId],
        );
        counts.updates[`${table}.${idCol}`] = rows[0].n;
      } else {
        const r = await client.query(
          `UPDATE ${table} SET ${idCol}=$2, ${nameCol}=$3 WHERE ${idCol}=$1`,
          [fromId, toId, toName],
        );
        counts.updates[`${table}.${idCol}`] = r.rowCount;
      }
    }
    if (dryRun) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM matches WHERE captain_player_id=$1`,
        [fromId],
      );
      counts.updates["matches.captain_player_id"] = rows[0].n;
    } else {
      const r = await client.query(
        `UPDATE matches SET captain_player_id=$2 WHERE captain_player_id=$1`,
        [fromId, toId],
      );
      counts.updates["matches.captain_player_id"] = r.rowCount;
    }
  }

  return counts;
}

const MISSING = [
  { id: 641, name: "Joelson", season: "2019" },
  { id: 642, name: "Lucas Rafael", season: "2019" },
  { id: 146, name: "Roger", season: "2024" },
  { id: 1631, name: "Wellington Nunes", season: "2025" },
  { id: 1668, name: "Caio Leandro", season: "2026" },
];

try {
  if (!dryRun) await client.query("BEGIN");

  const rosterFixes = [];
  for (const p of MISSING) {
    const linked = await linkedSeasonStats(p.id, p.season);
    const result = await upsertPss(p.id, p.season, {
      appearances: linked.appearances ?? 0,
      goals: linked.goals ?? 0,
      assists: linked.assists ?? 0,
      shirt_number: linked.shirt_number ?? null,
    });
    rosterFixes.push({ ...p, linked, result });
  }

  const gustavo = await repointPlayer(65, 399, "Gustavo Cabral", {
    seasons: ["2024", "2025"],
  });
  const jeff = await repointPlayer(510, 394, "Jefferson Júnior");

  // Refresh targets after repoint
  const refresh = [];
  for (const [id, season] of [
    [399, "2024"],
    [399, "2025"],
    [394, "2024"],
  ]) {
    const linked = await linkedSeasonStats(id, season);
    const result = await upsertPss(id, season, {
      appearances: linked.appearances ?? 0,
      goals: linked.goals ?? 0,
      assists: linked.assists ?? 0,
      shirt_number: linked.shirt_number ?? null,
    });
    refresh.push({ id, season, linked, result });
  }

  // Leftover refs check
  const leftovers = {};
  for (const [label, id, seasons] of [
    ["gustavinho65_2024_2025", 65, ["2024", "2025"]],
    ["jeffinho510", 510, null],
  ]) {
    if (seasons) {
      const { rows } = await client.query(
        `SELECT
           (SELECT count(*)::int FROM match_lineups ml
            JOIN matches m ON m.id=ml.match_id
            WHERE ml.player_id=$1 AND m.season = ANY($2::text[])) AS lineups,
           (SELECT count(*)::int FROM match_goals g
            JOIN matches m ON m.id=g.match_id
            WHERE (g.scorer_player_id=$1 OR g.assist_player_id=$1)
              AND m.season = ANY($2::text[])) AS goals,
           (SELECT count(*)::int FROM match_substitutions s
            JOIN matches m ON m.id=s.match_id
            WHERE (s.player_out_id=$1 OR s.player_in_id=$1)
              AND m.season = ANY($2::text[])) AS subs`,
        [id, seasons],
      );
      leftovers[label] = rows[0];
    } else {
      const { rows } = await client.query(
        `SELECT
           (SELECT count(*)::int FROM match_lineups WHERE player_id=$1) AS lineups,
           (SELECT count(*)::int FROM match_goals
            WHERE scorer_player_id=$1 OR assist_player_id=$1) AS goals,
           (SELECT count(*)::int FROM match_substitutions
            WHERE player_out_id=$1 OR player_in_id=$1) AS subs,
           (SELECT count(*)::int FROM player_season_stats WHERE player_id=$1) AS pss`,
        [id],
      );
      leftovers[label] = rows[0];
    }
  }

  // Delete orphan Jeffinho if fully unlinked and no PSS
  let deletedJeffinho = false;
  if (
    !dryRun &&
    leftovers.jeffinho510.lineups === 0 &&
    leftovers.jeffinho510.goals === 0 &&
    leftovers.jeffinho510.subs === 0 &&
    leftovers.jeffinho510.pss === 0
  ) {
    // also cards/captain
    const { rows: more } = await client.query(
      `SELECT
         (SELECT count(*)::int FROM match_cards WHERE player_id=$1) AS cards,
         (SELECT count(*)::int FROM matches WHERE captain_player_id=$1) AS captain`,
      [510],
    );
    if (more[0].cards === 0 && more[0].captain === 0) {
      await client.query(`DELETE FROM players WHERE id=510`);
      deletedJeffinho = true;
    }
  }

  // Final audit: still missing PSS while in CSA lineups?
  const { rows: stillMissing } = await client.query(`
    WITH lineup_players AS (
      SELECT DISTINCT m.season, ml.player_id, p.name
      FROM match_lineups ml
      JOIN matches m ON m.id = ml.match_id
      JOIN players p ON p.id = ml.player_id
      WHERE ml.side = 'csa' AND ml.player_id IS NOT NULL
        AND m.season ~ '^[0-9]{4}$' AND m.season::int >= 2010
    )
    SELECT lp.season, lp.player_id, lp.name
    FROM lineup_players lp
    LEFT JOIN player_season_stats pss
      ON pss.player_id = lp.player_id AND pss.season = lp.season
    WHERE pss.id IS NULL
      AND lp.player_id <> 512  -- Clevinho intentionally removed
    ORDER BY lp.season DESC, lp.name
  `);

  if (!dryRun) await client.query("COMMIT");

  console.log(
    JSON.stringify(
      {
        dryRun,
        rosterFixes,
        repoint: { gustavoCabral: gustavo, jeffersonJunior: jeff, deletedJeffinho },
        refresh,
        leftovers,
        stillMissing,
      },
      null,
      2,
    ),
  );
} catch (e) {
  if (!dryRun) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
