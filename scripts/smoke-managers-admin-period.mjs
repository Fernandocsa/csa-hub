import { createHmac } from "node:crypto";
import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");
const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:9909/api";
const headers = { Authorization: `Bearer ${token}` };

const caboRes = await fetch(`${base}/admin/managers/3`, { headers });
const cabo = await caboRes.json();
const listRes = await fetch(`${base}/admin/managers`, { headers });
const list = await listRes.json();
const liz = list.find((m) => m.id === 31);

console.log("ADMIN_CABO", {
  status: caboRes.status,
  period: `${cabo.startYear}-${cabo.endYear}`,
  hasSeasonsCol: Object.prototype.hasOwnProperty.call(cabo, "seasons"),
});
console.log("ADMIN_LIZ", {
  period: liz && `${liz.startYear}-${liz.endYear}`,
});

const ok =
  caboRes.ok &&
  listRes.ok &&
  cabo.startYear === 2017 &&
  cabo.endYear === 2026 &&
  liz?.startYear === 2006 &&
  !Object.prototype.hasOwnProperty.call(cabo, "seasons");
console.log(ok ? "ADMIN_POST_DROP_SMOKE_PASS" : "ADMIN_POST_DROP_SMOKE_FAIL");
process.exit(ok ? 0 : 1);
