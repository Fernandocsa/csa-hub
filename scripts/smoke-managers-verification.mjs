import { createHmac } from "node:crypto";
import { loadEnvFromDotenv } from "./_load-env.mjs";
loadEnvFromDotenv();

const base = process.env.SMOKE_BASE ?? "http://127.0.0.1:9911/api";
const secret = process.env.SESSION_SECRET ?? "fallback-secret";
const password = process.env.ADMIN_PASSWORD ?? "admin";
const token = createHmac("sha256", secret)
  .update(`marujo-admin:${password}`)
  .digest("hex");
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function j(method, path, body) {
  const r = await fetch(base + path, {
    method,
    headers: method === "GET" ? { Authorization: headers.Authorization } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => null);
  return { status: r.status, ok: r.ok, body: data };
}

const before = await j("GET", "/admin/managers/3");
if (!before.ok) {
  console.error("admin get failed", before);
  process.exit(1);
}

const mark = await j("PUT", "/admin/managers/3", {
  name: before.body.name,
  fullName: before.body.fullName,
  nationality: before.body.nationality,
  birthDate: before.body.birthDate,
  birthCity: before.body.birthCity,
  birthState: before.body.birthState,
  birthCountry: before.body.birthCountry,
  isDeceased: before.body.isDeceased,
  verificationStatus: "verified",
  verifiedBy: "Portal Marujo smoke",
});
console.log("MARK", mark.status, {
  status: mark.body?.verificationStatus,
  by: mark.body?.verifiedBy,
  at: mark.body?.verifiedAt,
});

const pub = await j("GET", "/managers/3");
console.log("PUBLIC", pub.status, {
  status: pub.body?.verificationStatus,
  by: pub.body?.verifiedBy,
});

const unmark = await j("PUT", "/admin/managers/3", {
  name: before.body.name,
  fullName: before.body.fullName,
  nationality: before.body.nationality,
  birthDate: before.body.birthDate,
  birthCity: before.body.birthCity,
  birthState: before.body.birthState,
  birthCountry: before.body.birthCountry,
  isDeceased: before.body.isDeceased,
  verificationStatus: "unverified",
  verifiedBy: null,
});
console.log("UNMARK", unmark.status, {
  status: unmark.body?.verificationStatus,
  by: unmark.body?.verifiedBy,
  at: unmark.body?.verifiedAt,
});

const ok =
  mark.ok &&
  mark.body?.verificationStatus === "verified" &&
  mark.body?.verifiedBy === "Portal Marujo smoke" &&
  !!mark.body?.verifiedAt &&
  pub.ok &&
  pub.body?.verificationStatus === "verified" &&
  unmark.ok &&
  unmark.body?.verificationStatus === "unverified" &&
  unmark.body?.verifiedAt == null;
console.log(ok ? "MANAGER_VERIFICATION_SMOKE_PASS" : "MANAGER_VERIFICATION_SMOKE_FAIL");
process.exit(ok ? 0 : 1);
