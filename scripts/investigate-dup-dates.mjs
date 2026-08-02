import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

try {
  const { rows: wesley } = await pool.query(
    `SELECT id, name, position FROM players WHERE name ILIKE '%wesley%' ORDER BY name`,
  );
  console.log("WESLEY", wesley);

  const { rows: dups } = await pool.query(`
    SELECT
      m.match_date::date AS d,
      count(*)::int AS n,
      json_agg(json_build_object(
        'id', m.id,
        'opponent', o.name,
        'competition', c.name,
        'season', m.season,
        'homeAway', m.home_away,
        'result', m.result,
        'score', coalesce(m.goals_for::text,'?') || '-' || coalesce(m.goals_against::text,'?'),
        'friendly', m.is_friendly,
        'phase', m.phase,
        'round', m.round
      ) ORDER BY m.id) AS matches
    FROM matches m
    JOIN opponents o ON o.id = m.opponent_id
    JOIN competitions c ON c.id = m.competition_id
    GROUP BY m.match_date::date
    HAVING count(*) > 1
    ORDER BY d DESC
  `);

  const non1920 = dups.filter((r) => {
    const y = Number(String(r.d).slice(0, 4));
    return !(y >= 1920 && y < 1930);
  });
  console.log("NON_1920S_DUP_COUNT", non1920.length);
  for (const r of non1920) {
    console.log("---", r.d, "n=" + r.n);
    for (const m of r.matches) {
      console.log(
        `  #${m.id} ${m.score} ${m.homeAway} vs ${m.opponent} | ${m.competition} | season=${m.season} friendly=${m.friendly} phase=${m.phase ?? "-"} round=${m.round ?? "-"}`,
      );
    }
  }

  const { rows: stadCols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='stadiums' ORDER BY ordinal_position
  `);
  console.log("STADIUM_COLS", stadCols.map((c) => c.column_name).join(","));
} finally {
  await pool.end();
}
