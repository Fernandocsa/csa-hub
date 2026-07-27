/**
 * Stage C smoke: portal route /partidas/estrangeiros + nav link (API-backed).
 * Requires API running at SMOKE_API_BASE (portal proxies /api in dev).
 */
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const API_BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9895/api";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("=== Stage C CSA x Estrangeiros ===");

const res = await fetch(`${API_BASE}/opponents/by-foreign`);
const data = await res.json();
assert(res.status === 200, `by-foreign ${res.status}`);
assert(data.overall?.matches >= 4, "expected live matches");
assert(data.opponents?.length >= 2, "expected foreign opponents");
console.log("OK API data for page");

const fs = await import("node:fs");
const router = fs.readFileSync("artifacts/portal-marujo/src/AppRouter.tsx", "utf8");
const layout = fs.readFileSync("artifacts/portal-marujo/src/components/layout/MainLayout.tsx", "utf8");
const page = fs.readFileSync("artifacts/portal-marujo/src/pages/matches/MatchesByForeign.tsx", "utf8");

assert(router.includes('path="/partidas/estrangeiros"'), "route missing");
assert(router.includes("MatchesByForeign"), "component import missing");
assert(layout.includes("CSA x Estrangeiros"), "nav label missing");
assert(layout.includes('href: "/partidas/estrangeiros"'), "nav href missing");
assert(page.includes("useGetOpponentsByForeign"), "page hook missing");
assert(page.includes("heading-csa-x-estrangeiros"), "page heading testid missing");
console.log("OK route, nav, and page wired");

console.log("=== Stage C foreign opponents portal smoke PASSED ===");
