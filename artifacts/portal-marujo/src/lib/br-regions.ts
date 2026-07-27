export const BRAZIL_REGIONS = [
  "Norte",
  "Nordeste",
  "Centro-Oeste",
  "Sudeste",
  "Sul",
] as const;

export type BrazilRegion = (typeof BRAZIL_REGIONS)[number];

export const UF_TO_REGION: Record<string, BrazilRegion> = {
  AC: "Norte",
  AP: "Norte",
  AM: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

export const REGION_UFS: Record<BrazilRegion, readonly string[]> = {
  Norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "Centro-Oeste": ["DF", "GO", "MT", "MS"],
  Sudeste: ["ES", "MG", "RJ", "SP"],
  Sul: ["PR", "RS", "SC"],
};

export const REGION_SLUGS: Record<BrazilRegion, string> = {
  Norte: "norte",
  Nordeste: "nordeste",
  "Centro-Oeste": "centro-oeste",
  Sudeste: "sudeste",
  Sul: "sul",
};

const SLUG_TO_REGION = Object.fromEntries(
  BRAZIL_REGIONS.map((r) => [REGION_SLUGS[r], r]),
) as Record<string, BrazilRegion>;

export function regionFromUf(uf: string | null | undefined): BrazilRegion | null {
  if (!uf?.trim()) return null;
  return UF_TO_REGION[uf.trim().toUpperCase()] ?? null;
}

export function regionSlug(region: BrazilRegion): string {
  return REGION_SLUGS[region];
}

export function regionFromSlug(slug: string | null | undefined): BrazilRegion | null {
  if (!slug?.trim()) return null;
  return SLUG_TO_REGION[slug.trim().toLowerCase()] ?? null;
}

export function regionDisplayName(region: BrazilRegion): string {
  return region;
}
