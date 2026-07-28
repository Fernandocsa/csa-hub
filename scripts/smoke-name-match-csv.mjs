/**
 * Smoke: CSV import name-match heuristic (Ivan vs Ivanildo, Marcelo vs Marcelo X).
 * Pure logic — no DB.
 */
import { findNameMatches } from "../artifacts/api-server/src/lib/csv-match-import/name-match.ts";

const catalog1992 = [
  { id: 1, name: "Ivan" },
  { id: 2, name: "Ivanildo" },
  { id: 3, name: "Marcelo Silva" },
  { id: 4, name: "Marcelo Barreto" },
  { id: 5, name: "Marcelo Gomes" },
  { id: 6, name: "Café" },
];

const cases = [
  { raw: "Ivan", expect: "exact", note: "bate só com Ivan; Ivanildo NÃO entra" },
  { raw: "Ivanildo", expect: "exact", note: "bate só com Ivanildo; Ivan NÃO entra" },
  { raw: "Marcelo", expect: "similar", note: "prenome curto → Marcelo Silva/Barreto/Gomes" },
  { raw: "Marcelo Silva", expect: "exact", note: "nome completo exato" },
  { raw: "Marcelo Barreto", expect: "exact", note: "nome completo exato (não conflita com outros Marcelos)" },
  { raw: "Zé Desconhecido", expect: "none", note: "sem match → auto-criar" },
];

let failed = 0;
for (const c of cases) {
  const r = findNameMatches(c.raw, catalog1992);
  const hitNames = r.hits.map((h) => h.name).join(", ") || "(nenhum)";
  const ok = r.type === c.expect;
  if (!ok) failed++;
  console.log(
    `${ok ? "OK" : "FAIL"} raw="${c.raw}" → ${r.type} [${hitNames}]  // ${c.note}`,
  );
}

// Explicit Ivan/Ivanildo cross-check
const ivan = findNameMatches("Ivan", catalog1992);
const hasIvanildo = ivan.hits.some((h) => h.name === "Ivanildo");
if (hasIvanildo) {
  failed++;
  console.log("FAIL Ivan não deveria listar Ivanildo");
} else {
  console.log("OK Ivan não lista Ivanildo (sem falso positivo de substring)");
}

if (failed) {
  console.error(`NAME_MATCH_SMOKE_FAIL (${failed})`);
  process.exit(1);
}
console.log("NAME_MATCH_SMOKE_PASS");
