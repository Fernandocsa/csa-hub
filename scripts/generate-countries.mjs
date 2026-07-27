/**
 * Generate countries.json from ISO 3166-1 (alpha-3) with Portuguese names.
 * Source: mledoze/countries (translations.por.common).
 * Run: node scripts/generate-countries.mjs
 */
import { writeFileSync } from "node:fs";

const SOURCE =
  "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";

console.log("Fetching ISO countries...");
const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`countries source ${res.status}`);

const data = await res.json();
const countries = data
  .map((c) => {
    const code = c.cca3;
    const name =
      c.translations?.por?.common ??
      c.translations?.por?.official ??
      c.name?.common;
    if (!code || !name) return null;
    return { code: String(code).toUpperCase(), name: String(name) };
  })
  .filter(Boolean);

countries.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const out = "artifacts/portal-marujo/src/lib/countries.json";
writeFileSync(out, JSON.stringify(countries, null, 0));
console.log(`Wrote ${countries.length} countries → ${out}`);

const samples = ["BRA", "ARG", "VEN", "URY", "POR"];
for (const code of samples) {
  const row = countries.find((c) => c.code === code);
  console.log(`  ${code}: ${row?.name ?? "?"}`);
}
