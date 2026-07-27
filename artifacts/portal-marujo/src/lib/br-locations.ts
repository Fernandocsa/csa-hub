import cities from "./br-cities.json";

export type BrCity = { name: string; uf: string };

export const BRAZIL_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrazilUf = (typeof BRAZIL_UFS)[number];

export const BRAZIL_UF_NAMES: Record<BrazilUf, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export function ufDisplayName(uf: string): string {
  const key = uf.toUpperCase() as BrazilUf;
  return BRAZIL_UF_NAMES[key] ?? uf.toUpperCase();
}

const BR_CITIES = cities as BrCity[];

export function normalizeCityName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function lookupCitiesByName(query: string, limit = 12): BrCity[] {
  const q = normalizeCityName(query);
  if (q.length < 2) return [];

  const exact: BrCity[] = [];
  const starts: BrCity[] = [];
  const contains: BrCity[] = [];

  for (const city of BR_CITIES) {
    const n = normalizeCityName(city.name);
    if (n === q) exact.push(city);
    else if (n.startsWith(q)) starts.push(city);
    else if (n.includes(q)) contains.push(city);
    if (exact.length + starts.length >= limit) break;
  }

  return [...exact, ...starts, ...contains].slice(0, limit);
}

export function uniqueUfsForCityName(cityName: string): string[] {
  const q = normalizeCityName(cityName);
  if (!q) return [];
  const ufs = new Set<string>();
  for (const city of BR_CITIES) {
    if (normalizeCityName(city.name) === q) ufs.add(city.uf);
  }
  return [...ufs].sort();
}

/** Strip trailing -UF suffix if present (e.g. "Foo-RS" → "Foo"). */
export function stripNameUfSuffix(name: string): string {
  return name.replace(/\s*-\s*[A-Za-z]{2}\s*$/, "").trim();
}

export function applyNameUfSuffix(name: string, uf: string): string {
  const base = stripNameUfSuffix(name);
  const cleanUf = uf.trim().toUpperCase();
  if (!base || !cleanUf) return name.trim();
  return `${base}-${cleanUf}`;
}

export function nameAlreadyHasUfSuffix(name: string, uf?: string | null): boolean {
  const m = name.trim().match(/-\s*([A-Za-z]{2})\s*$/);
  if (!m) return false;
  if (!uf) return true;
  return m[1].toUpperCase() === uf.trim().toUpperCase();
}
