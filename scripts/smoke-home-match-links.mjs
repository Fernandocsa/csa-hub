/**
 * Smoke: Home milestone + attendance match IDs resolve to GET /api/matches/:id (no 404).
 */
import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const API =
  process.env.API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:11901/api";

async function getJson(path) {
  const r = await fetch(`${API}${path}`);
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: r.status, body };
}

const mil = await getJson("/matches/milestones");
const att = await getJson("/matches/biggest-attendance?limit=10");
const next = await getJson("/next-match");

if (mil.status !== 200) {
  console.error("FAIL milestones", mil.status);
  process.exit(1);
}
if (att.status !== 200) {
  console.error("FAIL attendance", att.status);
  process.exit(1);
}

const ids = [];
if (mil.body?.first?.id) ids.push({ label: "first", id: mil.body.first.id });
if (mil.body?.last?.id) ids.push({ label: "last", id: mil.body.last.id });
for (const m of att.body ?? []) {
  ids.push({ label: `attendance:${m.opponent}`, id: m.id });
}

const results = [];
for (const item of ids) {
  const r = await getJson(`/matches/${item.id}`);
  results.push({
    ...item,
    status: r.status,
    ok: r.status === 200,
    opponent: r.body?.opponent ?? null,
  });
}

const failed = results.filter((r) => !r.ok);
console.log(
  JSON.stringify(
    {
      api: API,
      nextMatchHasId: next.body != null && "id" in (next.body || {}),
      nextMatchKeys: next.body ? Object.keys(next.body) : null,
      checked: results.length,
      failed: failed.length,
      sample: results.slice(0, 5),
      allOk: failed.length === 0,
    },
    null,
    2,
  ),
);

if (failed.length) process.exit(1);
console.log("OK");
