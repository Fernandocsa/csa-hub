/**
 * Stage B smoke: portal /partidas/por-regiao + client hook wiring.
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

const API_BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:9896/api";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("=== Stage B CSA x Regiões portal ===");

const list = await fetch(`${API_BASE}/opponents/by-region`);
const listData = await list.json();
assert(list.status === 200, "by-region API");
assert(listData.regions?.length === 5, "5 regions");
console.log("OK API ready for page");

const router = readFileSync("artifacts/portal-marujo/src/AppRouter.tsx", "utf8");
const layout = readFileSync("artifacts/portal-marujo/src/components/layout/MainLayout.tsx", "utf8");
const listPage = readFileSync("artifacts/portal-marujo/src/pages/matches/MatchesByRegion.tsx", "utf8");
const detailPage = readFileSync("artifacts/portal-marujo/src/pages/matches/MatchesByRegionDetail.tsx", "utf8");
const client = readFileSync("lib/api-client-react/src/opponents-by-region.ts", "utf8");
const index = readFileSync("lib/api-client-react/src/index.ts", "utf8");

assert(router.includes('path="/partidas/por-regiao/:slug"'), "detail route");
assert(router.includes('path="/partidas/por-regiao"'), "list route");
assert(layout.includes("CSA x Regiões"), "nav label");
assert(layout.includes('href: "/partidas/por-regiao"'), "nav href");
assert(listPage.includes("useGetOpponentsByRegion"), "list hook");
assert(listPage.includes("heading-csa-x-regioes"), "list heading");
assert(detailPage.includes("useGetOpponentsByRegionDetail"), "detail hook");
assert(detailPage.includes("statesBreakdown"), "UF breakdown");
assert(detailPage.includes("link-back-regions"), "back link");
assert(client.includes("useGetOpponentsByRegionDetail"), "client detail hook");
assert(index.includes("opponents-by-region"), "client export");
console.log("OK route, nav, pages, and client hook");

console.log("=== Stage B CSA x Regiões portal smoke PASSED ===");
