/**
 * Fix player identity collisions across decades + orphan zero season rows.
 * Run: node scripts/fix-player-era-collisions.mjs
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();

async function ensurePlayer({ name, fullName = null, birthYear = null, position = null }) {
  const existing = await client.query(
    `SELECT id FROM players
     WHERE name = $1
       AND (($2::text IS NULL AND full_name IS NULL) OR full_name = $2)
       AND (($3::int IS NULL AND birth_year IS NULL) OR birth_year = $3)
     ORDER BY id LIMIT 1`,
    [name, fullName, birthYear]
  );
  if (existing.rowCount) return existing.rows[0].id;
  const ins = await client.query(
    `INSERT INTO players (name, full_name, birth_year, position, nationality, nationality_flag, verification_status)
     VALUES ($1, $2, $3, $4, 'Brasil', '🇧🇷', 'unverified')
     RETURNING id`,
    [name, fullName, birthYear, position]
  );
  console.log(`  + created player #${ins.rows[0].id} ${name}`);
  return ins.rows[0].id;
}

async function moveLinks({ fromId, toId, seasons, label }) {
  const seasonFilter = seasons?.length
    ? `AND m.season = ANY($3::text[])`
    : "";
  const params = seasons?.length ? [fromId, toId, seasons.map(String)] : [fromId, toId];

  const lu = await client.query(
    `UPDATE match_lineups ml
     SET player_id = $2
     FROM matches m
     WHERE ml.match_id = m.id AND ml.player_id = $1 ${seasonFilter}
     RETURNING ml.id`,
    params
  );
  const goals = await client.query(
    `UPDATE match_goals mg
     SET scorer_player_id = $2
     FROM matches m
     WHERE mg.match_id = m.id AND mg.scorer_player_id = $1 ${seasonFilter}
     RETURNING mg.id`,
    params
  );
  const assists = await client.query(
    `UPDATE match_goals mg
     SET assist_player_id = $2
     FROM matches m
     WHERE mg.match_id = m.id AND mg.assist_player_id = $1 ${seasonFilter}
     RETURNING mg.id`,
    params
  );
  // substitutions reference player ids
  const subIn = await client.query(
    `UPDATE match_substitutions ms
     SET player_in_id = $2
     FROM matches m
     WHERE ms.match_id = m.id AND ms.player_in_id = $1 ${seasonFilter}
     RETURNING ms.id`,
    params
  );
  // move season stats for those seasons
  if (seasons?.length) {
    for (const season of seasons.map(String)) {
      const src = await client.query(
        `SELECT * FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [fromId, season]
      );
      if (!src.rowCount) continue;
      const row = src.rows[0];
      const dst = await client.query(
        `SELECT id, appearances, goals, assists FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [toId, season]
      );
      if (dst.rowCount) {
        await client.query(
          `UPDATE player_season_stats
           SET appearances = GREATEST(appearances, $1),
               goals = GREATEST(goals, $2),
               assists = GREATEST(coalesce(assists,0), $3)
           WHERE id=$4`,
          [row.appearances, row.goals, row.assists ?? 0, dst.rows[0].id]
        );
        await client.query(`DELETE FROM player_season_stats WHERE id=$1`, [row.id]);
      } else {
        await client.query(
          `UPDATE player_season_stats SET player_id=$1 WHERE id=$2`,
          [toId, row.id]
        );
      }
    }
  }
  console.log(
    `  ${label}: lineups=${lu.rowCount} goals=${goals.rowCount} assists=${assists.rowCount} subIn=${subIn.rowCount}`
  );
}

async function deleteOrphanZeros(playerId, seasons) {
  const r = await client.query(
    `DELETE FROM player_season_stats
     WHERE player_id=$1
       AND season = ANY($2::text[])
       AND appearances=0 AND goals=0 AND coalesce(assists,0)=0
       AND NOT EXISTS (
         SELECT 1 FROM match_lineups ml JOIN matches m ON m.id=ml.match_id
         WHERE ml.player_id=$1 AND m.season::text = player_season_stats.season::text
       )
       AND NOT EXISTS (
         SELECT 1 FROM match_goals mg JOIN matches m ON m.id=mg.match_id
         WHERE (mg.scorer_player_id=$1 OR mg.assist_player_id=$1)
           AND m.season::text = player_season_stats.season::text
       )
     RETURNING season`,
    [playerId, seasons.map(String)]
  );
  if (r.rowCount) console.log(`  deleted orphan seasons for #${playerId}:`, r.rows.map((x) => x.season).join(", "));
}

async function recomputeSeasonStats(playerId) {
  // Rebuild from linked sheets for seasons that still have evidence; keep manual floors only if linked exists
  const linked = await client.query(
    `
    WITH apps AS (
      SELECT m.season::text season, count(DISTINCT ml.match_id)::int appearances
      FROM match_lineups ml JOIN matches m ON m.id=ml.match_id
      WHERE ml.player_id=$1 AND ml.side='csa'
      GROUP BY m.season
    ),
    goals AS (
      SELECT m.season::text season, count(*)::int goals
      FROM match_goals mg JOIN matches m ON m.id=mg.match_id
      WHERE mg.scorer_player_id=$1 AND mg.side='csa' AND coalesce(mg.is_own_goal,false)=false
      GROUP BY m.season
    ),
    assists AS (
      SELECT m.season::text season, count(*)::int assists
      FROM match_goals mg JOIN matches m ON m.id=mg.match_id
      WHERE mg.assist_player_id=$1 AND mg.side='csa'
      GROUP BY m.season
    )
    SELECT coalesce(a.season, g.season, s.season) season,
           coalesce(a.appearances,0) appearances,
           coalesce(g.goals,0) goals,
           coalesce(s.assists,0) assists
    FROM apps a
    FULL OUTER JOIN goals g ON g.season=a.season
    FULL OUTER JOIN assists s ON s.season=coalesce(a.season,g.season)
    `,
    [playerId]
  );

  for (const row of linked.rows) {
    const cur = await client.query(
      `SELECT id, appearances, goals, assists FROM player_season_stats WHERE player_id=$1 AND season=$2`,
      [playerId, row.season]
    );
    if (cur.rowCount) {
      await client.query(
        `UPDATE player_season_stats
         SET appearances = GREATEST(appearances, $1),
             goals = GREATEST(goals, $2),
             assists = GREATEST(coalesce(assists,0), $3)
         WHERE id=$4`,
        [row.appearances, row.goals, row.assists, cur.rows[0].id]
      );
    } else {
      await client.query(
        `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
         VALUES ($1,$2,$3,$4,$5)`,
        [playerId, row.season, row.appearances, row.goals, row.assists]
      );
    }
  }
}

try {
  await client.query("BEGIN");

  // --- Zezinho #536: remove ghost seasons (1964 age 6, empty 1977/1987/1992) ---
  console.log("\nZezinho #536");
  await deleteOrphanZeros(536, [1964, 1977, 1987, 1992]);

  // --- Dick #56 (b.1984) keep 2017; move 1981 → #781 (b.1955) ---
  console.log("\nDick #56 → #781 (1981)");
  await moveLinks({ fromId: 56, toId: 781, seasons: [1981], label: "Dick 1981" });
  await deleteOrphanZeros(56, [1981]);

  // --- Ronaldo Alves #193 (b.1990) keep 2019; move 1981 → #1110 (b.1948) ---
  console.log("\nRonaldo Alves #193 → #1110 (1981)");
  await moveLinks({ fromId: 193, toId: 1110, seasons: [1981], label: "Ronaldo Alves 1981" });
  await deleteOrphanZeros(193, [1981]);

  // --- Rogério #275 (b.1991) keep 2022; move 1975 → #1105 (b.1942) ---
  console.log("\nRogério #275 → #1105 (1975)");
  await moveLinks({ fromId: 275, toId: 1105, seasons: [1975], label: "Rogério 1975" });
  await deleteOrphanZeros(275, [1975]);

  // --- Wellington #258 (b.1992) keep 2021; move 1992 → #1684 ---
  console.log("\nWellington #258 → #1684 (1992)");
  await moveLinks({ fromId: 258, toId: 1684, seasons: [1992], label: "Wellington 1992" });
  await deleteOrphanZeros(258, [1992]);

  // --- Robério #1588 (b.1994) keep 2012-13; create historic for 1989 goal ---
  console.log("\nRobério #1588 → new (1989)");
  const roberio80 = await ensurePlayer({
    name: "Robério",
    fullName: null,
    birthYear: null,
    position: "Atacante",
  });
  // Avoid colliding with #1588: ensurePlayer may return 1588 if name-only match
  let roberioTarget = roberio80;
  if (roberioTarget === 1588) {
    const ins = await client.query(
      `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
       VALUES ('Robério', 'Atacante', 'Brasil', '🇧🇷', 'unverified')
       RETURNING id`
    );
    roberioTarget = ins.rows[0].id;
    console.log(`  + forced new Robério #${roberioTarget}`);
  }
  await moveLinks({ fromId: 1588, toId: roberioTarget, seasons: [1989], label: "Robério 1989" });
  await deleteOrphanZeros(1588, [1989]);

  // --- Sérgio #1199 keep 1975-77; move 2015 → new ---
  console.log("\nSérgio #1199 → new (2015)");
  const sergio2015 = await client.query(
    `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
     VALUES ('Sérgio', null, 'Brasil', '🇧🇷', 'unverified')
     RETURNING id`
  );
  await moveLinks({
    fromId: 1199,
    toId: sergio2015.rows[0].id,
    seasons: [2015],
    label: "Sérgio 2015",
  });
  await deleteOrphanZeros(1199, [2015]);

  // --- Ricardo #584 (b.1969) keep 1991; move 1974-78 → #1095 (b.1954) ---
  console.log("\nRicardo #584 → #1095 (1974-1978)");
  await moveLinks({
    fromId: 584,
    toId: 1095,
    seasons: [1974, 1975, 1978],
    label: "Ricardo 70s",
  });

  // --- César #557 (b.1973) keep 1991-92; move 1978 → new César ---
  console.log("\nCésar #557 → new (1978)");
  const cesar70 = await client.query(
    `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
     VALUES ('César', null, 'Brasil', '🇧🇷', 'unverified')
     RETURNING id`
  );
  await moveLinks({
    fromId: 557,
    toId: cesar70.rows[0].id,
    seasons: [1978],
    label: "César 1978",
  });

  // --- Dudu #796 (b.1968) keep 1986; move 1974 → #1777 ---
  console.log("\nDudu #796 → #1777 (1974)");
  await moveLinks({ fromId: 796, toId: 1777, seasons: [1974], label: "Dudu 1974" });

  // --- Mauro #1012 (b.1967): 1978/1981 too young — historic Mauro; keep 1989 ---
  console.log("\nMauro #1012 → new (1978+1981)");
  const mauro70 = await client.query(
    `INSERT INTO players (name, position, nationality, nationality_flag, verification_status)
     VALUES ('Mauro', null, 'Brasil', '🇧🇷', 'unverified')
     RETURNING id`
  );
  await moveLinks({
    fromId: 1012,
    toId: mauro70.rows[0].id,
    seasons: [1978, 1981],
    label: "Mauro 1978+1981",
  });

  // --- Rafael #630 (b.1984) only has 1979 — move to #1081 (b.1948) ---
  console.log("\nRafael #630 → #1081 (1979)");
  await moveLinks({ fromId: 630, toId: 1081, seasons: [1979], label: "Rafael 1979" });
  await deleteOrphanZeros(630, [1979]);

  // --- Batista #696 (b.1938 age 47 in 1985) → #697 (b.1959) more plausible ---
  console.log("\nBatista #696 → #697 (1985)");
  await moveLinks({ fromId: 696, toId: 697, seasons: [1985], label: "Batista 1985" });

  // --- orphan zero seasons that created fake decade spans ---
  console.log("\nOrphan cleanups");
  await deleteOrphanZeros(556, [1974, 1990, 1991, 1993, 1994, 1995]); // Beu
  await deleteOrphanZeros(752, [1961]); // Cícero
  await deleteOrphanZeros(1043, [1961]); // Ney
  await deleteOrphanZeros(485, [1990, 1993, 1994, 1995]); // Flávio Pantera empties

  // Recompute floors for touched players
  const touched = [
    56, 193, 275, 258, 536, 1588, 1199, 584, 557, 796, 1012, 630, 696,
    781, 1110, 1105, 1684, 1095, 697, 1777, 1081,
    roberioTarget, sergio2015.rows[0].id, cesar70.rows[0].id, mauro70.rows[0].id,
  ];
  for (const id of touched) await recomputeSeasonStats(id);

  // Drop leftover manual season rows with no sheet evidence (prevents fake decade spans)
  for (const pid of [275, 193, 630, 56, 796, 696, 584, 557, 1012, 258, 1588, 1199, 536]) {
    const gone = await client.query(
      `DELETE FROM player_season_stats pss
       WHERE pss.player_id=$1 AND pss.season ~ '^[0-9]{4}$'
         AND NOT EXISTS (
           SELECT 1 FROM match_lineups ml JOIN matches m ON m.id=ml.match_id
           WHERE ml.player_id=$1 AND m.season::text=pss.season::text)
         AND NOT EXISTS (
           SELECT 1 FROM match_goals mg JOIN matches m ON m.id=mg.match_id
           WHERE (mg.scorer_player_id=$1 OR mg.assist_player_id=$1)
             AND m.season::text=pss.season::text)
       RETURNING season`,
      [pid]
    );
    if (gone.rowCount) {
      console.log(`  stale stats #${pid}:`, gone.rows.map((r) => r.season).join(", "));
    }
  }

  await client.query("COMMIT");
  console.log("\nDONE");
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
