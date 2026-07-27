import countries from "./countries.json";

export type Country = { code: string; name: string };

const COUNTRIES = countries as Country[];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code.toUpperCase(), c]));

export function normalizeCountryName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function lookupCountriesByName(query: string, limit = 12): Country[] {
  const q = normalizeCountryName(query);
  if (q.length < 1) return [];

  const exact: Country[] = [];
  const starts: Country[] = [];
  const contains: Country[] = [];

  for (const country of COUNTRIES) {
    const n = normalizeCountryName(country.name);
    const c = country.code.toLowerCase();
    if (n === q || c === q) exact.push(country);
    else if (n.startsWith(q) || c.startsWith(q)) starts.push(country);
    else if (n.includes(q)) contains.push(country);
    if (exact.length + starts.length >= limit) break;
  }

  return [...exact, ...starts, ...contains].slice(0, limit);
}

export function countryDisplayName(code: string | null | undefined): string {
  if (!code?.trim()) return "";
  return BY_CODE.get(code.trim().toUpperCase())?.name ?? code.toUpperCase();
}

export function isBrazilCountryCode(code: string | null | undefined): boolean {
  return code?.trim().toUpperCase() === "BRA";
}

export { COUNTRIES };
