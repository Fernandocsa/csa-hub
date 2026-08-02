/**
 * Compact competition abbreviation for match-history tables (OGOL-style).
 * Falls back to initials from the competition name.
 */
export function competitionAbbreviation(name?: string | null): string {
  const n = (name ?? "").trim();
  if (!n) return "–";

  const lower = n.toLowerCase();

  const known: Array<[RegExp, string]> = [
    [/s[eé]rie\s*a\b/, "SA"],
    [/s[eé]rie\s*b\b/, "SB"],
    [/s[eé]rie\s*c\b/, "SC"],
    [/s[eé]rie\s*d\b/, "SD"],
    [/ta[cç]a de ouro/, "TdO"],
    [/ta[cç]a de prata/, "TdP"],
    [/jo[aã]o havelange|havelange/, "CJH"],
    [/copa do brasil/, "CdB"],
    [/copa do nordeste/, "CdN"],
    [/campeonato alagoano|alagoano/, "AL"],
    [/torneio norte[- ]?nordeste/, "TNN"],
    [/torneio in[ií]cio/, "TI"],
    [/copa alagoas/, "CA"],
    [/amistoso/, "Am"],
  ];

  for (const [re, abbr] of known) {
    if (re.test(lower)) return abbr;
  }

  const words = n
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .filter((w) => !/^(de|da|do|dos|das|e|the)$/i.test(w))
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Prefer round; fall back to a short phase label. */
export function matchRoundCompact(
  phase?: string | null,
  round?: string | null,
): string {
  const r = round?.trim() || "";
  if (r) {
    // "15ª rodada" → "15"; keep already-compact values like "1/8", "3F"
    const m = r.match(/^(\d+)\s*ª?\s*(rodada)?$/i);
    if (m) return m[1];
    return r;
  }
  const p = phase?.trim() || "";
  if (!p) return "–";

  const lower = p.toLowerCase();
  if (/oitavas/.test(lower)) return "1/8";
  if (/quartas/.test(lower)) return "1/4";
  if (/semi/.test(lower)) return "SF";
  if (/final/.test(lower) && !/semi/.test(lower)) return "F";
  if (/3[oº]?\s*fase|terceira fase/.test(lower)) return "3F";
  if (/2[oº]?\s*fase|segunda fase/.test(lower)) return "2F";
  if (/1[oº]?\s*fase|primeira fase/.test(lower)) return "1F";
  if (/grupo/.test(lower)) return "G";

  return p.length > 8 ? p.slice(0, 8) : p;
}
