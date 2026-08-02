import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

const { rows: dups } = await pool.query(`
  SELECT
    m.match_date::date AS d,
    EXTRACT(YEAR FROM m.match_date)::int AS y,
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
  GROUP BY m.match_date::date, EXTRACT(YEAR FROM m.match_date)
  HAVING count(*) > 1
  ORDER BY d DESC
`);

const placeholders1920s = dups.filter((r) => r.y >= 1920 && r.y < 1930);
const rest = dups.filter((r) => !(r.y >= 1920 && r.y < 1930));

function classify(row) {
  const comps = [...new Set(row.matches.map((m) => m.competition))];
  const opponents = [...new Set(row.matches.map((m) => m.opponent))];
  const jan1 = String(row.d).startsWith("01") || String(row.d).includes("-01-01") ||
    (row.d instanceof Date && row.d.getUTCMonth() === 0 && row.d.getUTCDate() === 1) ||
    (typeof row.d === "string" && row.d.includes("01-01"));

  // Normalize date string
  const iso = row.d instanceof Date
    ? row.d.toISOString().slice(0, 10)
    : String(row.d).slice(0, 10);
  const isJan1 = iso.endsWith("-01-01") || iso.startsWith("01/") /* unlikely */;

  // Exact duplicate: same opponent + competition + score + homeAway
  const signatures = row.matches.map(
    (m) => `${m.opponent}|${m.competition}|${m.score}|${m.homeAway}|${m.season}`,
  );
  const uniqueSigs = new Set(signatures);
  if (uniqueSigs.size < row.matches.length) {
    return {
      kind: "b",
      label: "Duplicata real de cadastro (mesmo adversário/competição/placar)",
      note: isJan1 ? "Também parece placeholder 01/01" : null,
    };
  }

  if (isJan1 && row.y < 2010) {
    return {
      kind: "a",
      label: "Placeholder parecido (01/01, temporada antiga)",
      note: null,
    };
  }

  if (comps.length > 1) {
    return {
      kind: "c",
      label: "Dois jogos no mesmo dia em campeonatos diferentes",
      note: comps.join(" + "),
    };
  }

  // Same competition, different opponents same day — physically impossible for CSA
  if (comps.length === 1 && opponents.length > 1) {
    return {
      kind: "b",
      label: "Datas suspeitas no mesmo campeonato (CSA não joga 2x no mesmo dia)",
      note: "Provável data errada / importação — investigar e corrigir",
    };
  }

  return { kind: "b", label: "Investigar", note: null };
}

console.log(JSON.stringify({
  totalDupGroups: dups.length,
  placeholders1920s: placeholders1920s.length,
  remaining: rest.length,
  groups: rest.map((r) => {
    const iso = r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10);
    const c = classify({ ...r, d: iso });
    return {
      date: iso,
      n: r.n,
      classification: c.kind,
      reason: c.label,
      note: c.note,
      matches: r.matches,
    };
  }),
}, null, 2));

await pool.end();
