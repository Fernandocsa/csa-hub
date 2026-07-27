import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const base = "http://127.0.0.1:9908/api";

async function j(path) {
  const r = await fetch(base + path);
  const body = await r.json().catch(() => null);
  return { status: r.status, ok: r.ok, body };
}

const cabo = await j("/managers/3");
console.log("CABO", cabo.status, {
  period: `${cabo.body?.startYear}-${cabo.body?.endYear}`,
  matches: cabo.body?.matches,
  seasons: cabo.body?.seasonStats?.length,
  first: cabo.body?.seasonStats?.[0],
  last: cabo.body?.seasonStats?.at?.(-1),
});

const liz = await j("/managers/31");
console.log("LIZ", liz.status, {
  period: `${liz.body?.startYear}-${liz.body?.endYear}`,
  matches: liz.body?.matches,
  seasons: liz.body?.seasonStats?.map((s) => `${s.year}:${s.matches}`),
});

const list = await j("/managers");
const caboList = list.body?.find((m) => m.id === 3);
const lizList = list.body?.find((m) => m.id === 31);
console.log("LIST_CABO", caboList && {
  period: `${caboList.startYear}-${caboList.endYear}`,
  matches: caboList.matches,
  goalsFor: caboList.goalsFor,
});
console.log("LIST_LIZ", lizList && {
  period: `${lizList.startYear}-${lizList.endYear}`,
  matches: lizList.matches,
});

const ok =
  cabo.ok &&
  cabo.body?.startYear === 2017 &&
  cabo.body?.endYear === 2026 &&
  cabo.body?.seasonStats?.length === 10 &&
  liz.ok &&
  liz.body?.startYear === 2006 &&
  liz.body?.endYear === 2006 &&
  liz.body?.seasonStats?.length === 1 &&
  liz.body?.matches === 16 &&
  list.ok &&
  caboList?.startYear === 2017;
console.log(ok ? "PUBLIC_MANAGERS_SMOKE_PASS" : "PUBLIC_MANAGERS_SMOKE_FAIL");
process.exit(ok ? 0 : 1);
