/**
 * Smoke: foreign flag resolution + API nationality on tops / estrangeiros.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv();
const pool = createPgPool();

const FLAG = {
  brasil: "/flags/br.svg",
  brazil: "/flags/br.svg",
  argentina: "/flags/ar.svg",
  paraguai: "/flags/py.svg",
  paraguay: "/flags/py.svg",
  colombia: "/flags/co.svg",
  "colômbia": "/flags/co.svg",
  chile: "/flags/cl.svg",
  equador: "/flags/ec.svg",
  ecuador: "/flags/ec.svg",
};

function flagSrc(nationality) {
  const key = String(nationality ?? "").trim().toLowerCase();
  return FLAG[key] ?? null;
}

const foreign = await pool.query(
  `SELECT id, name, nationality, nationality_flag
   FROM players
   WHERE nationality IS NOT NULL AND nationality <> 'Brasil'
   ORDER BY nationality, name
   LIMIT 20`,
);

console.log("=== sample foreign players ===");
for (const p of foreign.rows) {
  console.log(
    `#${p.id} ${p.name} | nat=${JSON.stringify(p.nationality)} | flagCol=${JSON.stringify(p.nationality_flag)} | svg=${flagSrc(p.nationality)}`,
  );
}

const byCountry = await pool.query(
  `SELECT nationality, count(*)::int n,
          count(nationality_flag) FILTER (WHERE nationality_flag IS NOT NULL AND btrim(nationality_flag) <> '')::int AS with_emoji
   FROM players
   WHERE nationality IS NOT NULL AND nationality <> 'Brasil'
   GROUP BY 1 ORDER BY n DESC`,
);
console.log("\n=== foreign by country (emoji column filled?) ===");
for (const r of byCountry.rows) {
  console.log(`${r.n}\t${r.nationality}\temojiFilled=${r.with_emoji}\tsvg=${flagSrc(r.nationality)}`);
}

const tops = await pool.query(
  `SELECT p.id, p.name, p.nationality, p.nationality_flag,
          sum(s.goals)::int AS goals
   FROM player_season_stats s
   JOIN players p ON p.id = s.player_id
   WHERE p.nationality IS NOT NULL AND p.nationality <> 'Brasil'
   GROUP BY p.id, p.name, p.nationality, p.nationality_flag
   HAVING sum(s.goals) > 0
   ORDER BY sum(s.goals) DESC
   LIMIT 5`,
);
console.log("\n=== foreign in top scorers pool ===");
for (const p of tops.rows) {
  console.log(
    `#${p.id} ${p.name} goals=${p.goals} nat=${p.nationality} svg=${flagSrc(p.nationality)}`,
  );
}

const base = process.env.SMOKE_BASE ?? "https://portalmarujo.com/api";
async function tryApi(path) {
  try {
    const r = await fetch(`${base}${path}`);
    const j = await r.json();
    return { ok: r.ok, status: r.status, body: j };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const nat = await tryApi("/players/nationalities");
console.log("\n=== API /players/nationalities (prod) ===");
if (nat.ok && Array.isArray(nat.body)) {
  for (const n of nat.body.slice(0, 10)) {
    console.log(
      `${n.nationality} flag=${JSON.stringify(n.nationalityFlag)} svg=${flagSrc(n.nationality)} count=${n.playerCount}`,
    );
  }
} else {
  console.log(nat);
}

const scorers = await tryApi("/players/top-scorers?limit=50");
console.log("\n=== API top-scorers: foreign with nationality field ===");
if (scorers.ok && Array.isArray(scorers.body)) {
  const foreignScorers = scorers.body.filter(
    (p) => p.nationality && p.nationality !== "Brasil",
  );
  console.log(
    `total=${scorers.body.length} foreign=${foreignScorers.length} sampleHasNationalityKey=${"nationality" in (scorers.body[0] ?? {})}`,
  );
  for (const p of foreignScorers.slice(0, 5)) {
    console.log(
      `#${p.id} ${p.name} nat=${p.nationality} flag=${JSON.stringify(p.nationalityFlag)} svg=${flagSrc(p.nationality)}`,
    );
  }
} else {
  console.log(scorers);
}

await pool.end();
