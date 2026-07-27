import { writeFileSync } from "node:fs";
const url = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";
console.log("Fetching IBGE municipalities...");
const res = await fetch(url);
if (!res.ok) throw new Error(`IBGE ${res.status}`);
const data = await res.json();
const cities = data.map((m) => ({
  name: m.nome,
  uf: m.microrregiao?.mesorregiao?.UF?.sigla ?? m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla,
})).filter((c) => c.name && c.uf);
cities.sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.uf.localeCompare(b.uf));
writeFileSync("artifacts/portal-marujo/src/lib/br-cities.json", JSON.stringify(cities));
console.log(`Wrote ${cities.length} cities`);
console.log("sample:", cities.slice(0, 3));
