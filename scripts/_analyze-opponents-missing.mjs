/**
 * Analyze opponents missing city/stadium; propose confirmed fills only.
 * Confidence from: well-known club map + CSA-away match stadium frequency.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const c = await pool.connect();

try {
  const { rows: stadiums } = await c.query(
    `SELECT id, name, city, state FROM stadiums ORDER BY name`,
  );
  console.log("stadiums", stadiums.length);

  const { rows: missing } = await c.query(
    `SELECT id, name, city, state, country, home_stadium_id
     FROM opponents
     WHERE city IS NULL OR btrim(coalesce(city,''))='' OR home_stadium_id IS NULL
     ORDER BY name`,
  );

  // Most common stadium when CSA played away vs this opponent
  const { rows: awayStads } = await c.query(
    `
    SELECT m.opponent_id, s.id AS stadium_id, s.name AS stadium_name, s.city AS stadium_city,
           s.state AS stadium_state, count(*)::int AS n
    FROM matches m
    JOIN stadiums s ON s.id = m.stadium_id
    WHERE m.home_away = 'away' AND m.stadium_id IS NOT NULL
    GROUP BY m.opponent_id, s.id, s.name, s.city, s.state
    ORDER BY m.opponent_id, n DESC
    `,
  );
  const byOpp = new Map();
  for (const r of awayStads) {
    if (!byOpp.has(r.opponent_id)) byOpp.set(r.opponent_id, []);
    byOpp.get(r.opponent_id).push(r);
  }

  const report = missing.map((o) => {
    const hist = byOpp.get(o.id) ?? [];
    const top = hist[0] ?? null;
    const dominant =
      top && (hist.length === 1 || top.n >= (hist[1]?.n ?? 0) * 2 || top.n >= 3)
        ? top
        : top && hist.length === 1
          ? top
          : null;
    return {
      id: o.id,
      name: o.name,
      city: o.city,
      state: o.state,
      home_stadium_id: o.home_stadium_id,
      histTop: top
        ? { stadium: top.stadium_name, city: top.stadium_city, n: top.n, totalAway: hist.reduce((a, x) => a + x.n, 0) }
        : null,
      histAll: hist.slice(0, 3).map((h) => `${h.stadium_name}(${h.n})`),
      dominantStadiumId: dominant?.stadium_id ?? null,
      dominantStadium: dominant?.stadium_name ?? null,
      dominantCity: dominant?.stadium_city ?? null,
    };
  });

  // Focus: have dominant stadium OR missing only one field
  const withEvidence = report.filter((r) => r.dominantStadiumId || r.city);
  console.log(
    JSON.stringify(
      {
        missing: missing.length,
        withDominantOrCity: withEvidence.length,
        sampleEvidence: withEvidence.slice(0, 40),
        noEvidence: report.filter((r) => !r.dominantStadiumId && !r.city).length,
      },
      null,
      2,
    ),
  );
} finally {
  c.release();
  await pool.end();
}
