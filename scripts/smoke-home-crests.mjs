/**
 * Smoke: Home-related payloads expose crest URLs for clubs that have them.
 */
const API = process.env.API_URL ?? "http://127.0.0.1:8080";

async function j(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

const [summary, milestones, attendance, victories, nextMatch] = await Promise.all([
  j("/api/summary"),
  j("/api/matches/milestones"),
  j("/api/matches/biggest-attendance?limit=10"),
  j("/api/matches/biggest-victories?limit=3"),
  j("/api/next-match"),
]);

const withLogo = [];
const withoutLogo = [];

function note(source, name, logo) {
  const entry = { source, name, hasLogo: !!logo };
  if (logo) withLogo.push(entry);
  else withoutLogo.push(entry);
}

for (const o of summary.mostCommonOpponents ?? []) {
  note(`summary:${o.id}`, o.name, o.logoUrl);
}
if (milestones.first) {
  note("milestone:first", milestones.first.opponent, milestones.first.opponentLogoUrl);
}
if (milestones.last) {
  note("milestone:last", milestones.last.opponent, milestones.last.opponentLogoUrl);
}
for (const m of attendance ?? []) {
  note(`attendance:${m.id}`, m.opponent, m.opponentLogoUrl);
}
for (const m of victories ?? []) {
  note(`victory:${m.id}`, m.opponent, m.opponentLogoUrl);
}
if (nextMatch) {
  note("next-match", nextMatch.opponent, nextMatch.opponentLogoUrl);
}

// Prefer a known club with logo (São Paulo / Palmeiras / etc.) and one without
const saoPaulo = [...withLogo].find((e) => /s[aã]o paulo/i.test(e.name));
const sampleWith = saoPaulo ?? withLogo[0] ?? null;
const sampleWithout = withoutLogo[0] ?? null;

const out = {
  counts: {
    withLogo: withLogo.length,
    withoutLogo: withoutLogo.length,
  },
  sampleWithLogo: sampleWith,
  sampleWithoutLogo: sampleWithout,
  milestones: {
    first: milestones.first
      ? { opponent: milestones.first.opponent, hasLogo: !!milestones.first.opponentLogoUrl }
      : null,
    last: milestones.last
      ? { opponent: milestones.last.opponent, hasLogo: !!milestones.last.opponentLogoUrl }
      : null,
  },
  mostCommon: (summary.mostCommonOpponents ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    hasLogo: !!o.logoUrl,
  })),
  biggestWin: victories?.[0]
    ? { opponent: victories[0].opponent, hasLogo: !!victories[0].opponentLogoUrl }
    : null,
  checks: {
    apiReturnsLogoFieldOnSummary: (summary.mostCommonOpponents ?? []).some(
      (o) => "logoUrl" in o,
    ),
    apiReturnsLogoFieldOnMilestones: milestones.first
      ? "opponentLogoUrl" in milestones.first
      : true,
    apiReturnsLogoFieldOnAttendance: attendance?.[0]
      ? "opponentLogoUrl" in attendance[0]
      : true,
    hasAtLeastOneWithAndWithout:
      withLogo.length > 0 && withoutLogo.length > 0,
  },
};

console.log(JSON.stringify(out, null, 2));
if (!Object.values(out.checks).every(Boolean)) process.exit(1);
