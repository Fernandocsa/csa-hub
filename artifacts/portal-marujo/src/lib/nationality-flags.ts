/**
 * Local SVG flags under /public/flags (Wikimedia Commons, no runtime hotlink).
 * Resolve by nationality name; optional legacy emoji → same local asset.
 */

const FLAG = {
  br: "/flags/br.svg",
  ar: "/flags/ar.svg",
  py: "/flags/py.svg",
  co: "/flags/co.svg",
  cl: "/flags/cl.svg",
  ec: "/flags/ec.svg",
  uy: "/flags/uy.svg",
} as const;

/** Normalized nationality (lowercase, accents kept on keys that need them) → local SVG. */
const BY_NATIONALITY: Record<string, string> = {
  brasil: FLAG.br,
  brazil: FLAG.br,
  bra: FLAG.br,
  br: FLAG.br,
  brasileiro: FLAG.br,
  brasileira: FLAG.br,
  argentina: FLAG.ar,
  argentine: FLAG.ar,
  paraguai: FLAG.py,
  paraguay: FLAG.py,
  colombia: FLAG.co,
  colômbia: FLAG.co,
  chile: FLAG.cl,
  equador: FLAG.ec,
  ecuador: FLAG.ec,
  uruguai: FLAG.uy,
  uruguay: FLAG.uy,
};

const BY_EMOJI: Record<string, string> = {
  "🇧🇷": FLAG.br,
  "🇦🇷": FLAG.ar,
  "🇵🇾": FLAG.py,
  "🇨🇴": FLAG.co,
  "🇨🇱": FLAG.cl,
  "🇪🇨": FLAG.ec,
  "🇺🇾": FLAG.uy,
};

function normNationality(nationality?: string | null): string {
  return String(nationality ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase();
}

/** Local SVG path for a country name, or null if unknown. */
export function flagSrcForNationality(nationality?: string | null): string | null {
  const key = normNationality(nationality);
  if (!key) return null;
  return BY_NATIONALITY[key] ?? null;
}

/**
 * Map legacy `nationality_flag` emoji (or already-local path) to SVG src.
 * Unknown → null (caller should not render a broken flag).
 */
export function flagSrcFromLegacyFlag(flag?: string | null): string | null {
  const raw = String(flag ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/flags/") && raw.endsWith(".svg")) return raw;

  for (const [emoji, src] of Object.entries(BY_EMOJI)) {
    if (raw.includes(emoji)) return src;
  }
  return null;
}

/** Prefer nationality; fall back to legacy flag column. */
export function resolveNationalityFlagSrc(opts: {
  nationality?: string | null;
  flag?: string | null;
}): string | null {
  return (
    flagSrcForNationality(opts.nationality) ??
    flagSrcFromLegacyFlag(opts.flag) ??
    null
  );
}

export const LOCAL_FLAG_PATHS = FLAG;
