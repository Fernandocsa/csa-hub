/**
 * Smoke: streak detail pages — goals totals match sum of listed matches.
 * Usage: API_URL=http://127.0.0.1:PORT node scripts/smoke-streak-details.mjs
 */

const API = process.env.API_URL ?? "http://127.0.0.1:8080";
const TYPES = ["winning", "unbeaten", "losing"];

async function check(type) {
  const res = await fetch(`${API}/api/records/streaks/${type}`);
  if (!res.ok) throw new Error(`${type}: HTTP ${res.status}`);
  const data = await res.json();
  const sumFor = data.matches.reduce((s, m) => s + (m.goalsFor ?? 0), 0);
  const sumAgainst = data.matches.reduce((s, m) => s + (m.goalsAgainst ?? 0), 0);
  const ok =
    data.length === data.matches.length &&
    data.goalsFor === sumFor &&
    data.goalsAgainst === sumAgainst;
  return {
    type,
    length: data.length,
    startDate: data.startDate,
    endDate: data.endDate,
    goalsFor: data.goalsFor,
    goalsAgainst: data.goalsAgainst,
    manualSumFor: sumFor,
    manualSumAgainst: sumAgainst,
    sample: data.matches.slice(0, 3).map((m) => ({
      id: m.id,
      opponent: m.opponent,
      score: `${m.goalsFor}-${m.goalsAgainst}`,
    })),
    ok,
  };
}

const results = [];
for (const t of TYPES) results.push(await check(t));
console.log(JSON.stringify({ results, allOk: results.every((r) => r.ok) }, null, 2));
if (!results.every((r) => r.ok)) process.exit(1);
