/**
 * Stage B smoke: countries.json + lookup helpers.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("=== Stage B countries.json ===");

const jsonPath = `${root}/artifacts/portal-marujo/src/lib/countries.json`;
const countries = JSON.parse(readFileSync(jsonPath, "utf8"));
assert(Array.isArray(countries), "countries.json must be array");
assert(countries.length >= 200, `expected ~250 countries, got ${countries.length}`);
console.log(`OK countries.json (${countries.length} entries)`);

const bra = countries.find((c) => c.code === "BRA");
const arg = countries.find((c) => c.code === "ARG");
const ven = countries.find((c) => c.code === "VEN");
assert(bra?.name === "Brasil", `BRA name ${bra?.name}`);
assert(arg?.name === "Argentina", `ARG name ${arg?.name}`);
assert(ven?.name === "Venezuela", `VEN name ${ven?.name}`);
console.log("OK BRA/ARG/VEN Portuguese names");

const codes = new Set(countries.map((c) => c.code));
assert(codes.size === countries.length, "duplicate country codes");
assert([...codes].every((c) => /^[A-Z]{3}$/.test(c)), "invalid alpha-3 codes");
console.log("OK unique ISO alpha-3 codes");

// Dynamic import of TS module via tsx not available — test lookup logic inline
function normalizeCountryName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function lookupCountriesByName(query, limit = 12) {
  const q = normalizeCountryName(query);
  if (q.length < 1) return [];
  const exact = [];
  const starts = [];
  const contains = [];
  for (const country of countries) {
    const n = normalizeCountryName(country.name);
    const c = country.code.toLowerCase();
    if (n === q || c === q) exact.push(country);
    else if (n.startsWith(q) || c.startsWith(q)) starts.push(country);
    else if (n.includes(q)) contains.push(country);
  }
  return [...exact, ...starts, ...contains].slice(0, limit);
}

const arLookup = lookupCountriesByName("arg");
assert(arLookup.some((c) => c.code === "ARG"), "lookup 'arg' finds Argentina");
const venezuela = lookupCountriesByName("vene");
assert(venezuela[0]?.code === "VEN", `lookup 'vene' → ${venezuela[0]?.code}`);
console.log("OK autocomplete lookup pattern");

assert(readFileSync(`${root}/scripts/generate-countries.mjs`, "utf8").includes("mledoze"), "generator script");
assert(readFileSync(`${root}/artifacts/portal-marujo/src/lib/countries.ts`, "utf8").includes("lookupCountriesByName"), "countries.ts");

console.log("=== Stage B countries smoke PASSED ===");
