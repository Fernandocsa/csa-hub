/**
 * Smoke test: opponent detail API — competition stats, highlights, goals.
 * Usage: node scripts/smoke-opponent-detail.mjs
 */

const API = process.env.API_URL ?? "http://127.0.0.1:8080";
const SAO_LUIZ_ID = 126;

async function fetchOpponent(id) {
  const res = await fetch(`${API}/api/opponents/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for opponent ${id}`);
  return res.json();
}

async function findOpponentWithoutFicha() {
  const res = await fetch(`${API}/api/opponents?limit=100&sort=matches`);
  if (!res.ok) throw new Error(`HTTP ${res.status} listing opponents`);
  const list = await res.json();
  for (const opp of list.data ?? []) {
    const detail = await fetchOpponent(opp.id);
    if (detail.highlights == null) return { id: opp.id, detail };
  }
  throw new Error("Could not find opponent without ficha in first 100");
}

function summarize(id, data) {
  const hl = data.highlights;
  const hlKeys = hl
    ? Object.entries(hl)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}: ${v.name} (${v.value})`)
    : [];

  return {
    id,
    name: data.name,
    summary: {
      matches: data.matches,
      wins: data.wins,
      goalsFor: data.goalsFor,
      goalsAgainst: data.goalsAgainst,
    },
    competitionStatsCount: data.competitionStats?.length ?? 0,
    competitionStatsSample: (data.competitionStats ?? []).slice(0, 3).map((c) => ({
      name: c.competitionName,
      matches: c.matches,
      goalsFor: c.goalsFor,
    })),
    highlights: hl ? (hlKeys.length ? hlKeys : "empty object (all null)") : null,
    allMatchesSample: data.allMatches?.[0]?.id ?? null,
  };
}

async function main() {
  const saoLuiz = await fetchOpponent(SAO_LUIZ_ID);
  const noFicha = await findOpponentWithoutFicha();

  const out = {
    saoLuiz: summarize(SAO_LUIZ_ID, saoLuiz),
    withoutFicha: summarize(noFicha.id, noFicha.detail),
    checks: {
      saoLuizHasCompetitionStats: (saoLuiz.competitionStats?.length ?? 0) > 0,
      saoLuizHasGoalsInSummary: saoLuiz.goalsFor != null && saoLuiz.goalsAgainst != null,
      saoLuizHasHighlights: saoLuiz.highlights != null,
      noFichaOmitsHighlights: noFicha.detail.highlights == null,
      noFichaStillHasCompetitionStats: (noFicha.detail.competitionStats?.length ?? 0) > 0,
    },
  };

  console.log(JSON.stringify(out, null, 2));

  const failed = Object.entries(out.checks).filter(([, ok]) => !ok);
  if (failed.length) {
    console.error("FAILED:", failed.map(([k]) => k).join(", "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
