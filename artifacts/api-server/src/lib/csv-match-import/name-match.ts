/** Shared name normalization + conflict heuristics for CSV match import. */

export function normName(s: string | null | undefined): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOP = new Set(["de", "da", "do", "dos", "das", "e"]);

/** Significant tokens (drops de/da/do…). */
export function nameTokens(s: string | null | undefined): string[] {
  return normName(s)
    .split(" ")
    .filter((t) => t.length > 0 && !STOP.has(t));
}

export type NameCatalogEntry = {
  id: number;
  name: string;
};

export type NameMatchHit = NameCatalogEntry & {
  tokens: string[];
  norm: string;
};

export type NameMatchResult =
  | { type: "none"; hits: [] }
  | { type: "exact"; hits: NameMatchHit[] }
  | { type: "similar"; hits: NameMatchHit[] };

function toHit(e: NameCatalogEntry): NameMatchHit {
  return { ...e, tokens: nameTokens(e.name), norm: normName(e.name) };
}

/**
 * Name conflict rules for CSV import:
 * - exact: full normalized name equal
 * - similar: prenome curto vs nome composto (token boundary), e.g. "Marcelo" ↔ "Marcelo Silva"
 * - NOT similar: pure prefix/substring of a different full token ("Ivan" vs "Ivanildo")
 */
export function findNameMatches(
  raw: string,
  catalog: NameCatalogEntry[],
): NameMatchResult {
  const qNorm = normName(raw);
  if (!qNorm) return { type: "none", hits: [] };
  const qTokens = nameTokens(raw);
  if (!qTokens.length) return { type: "none", hits: [] };

  const hits = catalog.map(toHit);
  const exact = hits.filter((h) => h.norm === qNorm);
  if (exact.length) return { type: "exact", hits: exact };

  const similar = hits.filter((h) => {
    if (!h.tokens.length) return false;
    // Short query vs composed catalog: "Marcelo" → "Marcelo Silva"
    if (qTokens.length === 1 && h.tokens.length >= 2 && h.tokens[0] === qTokens[0]) {
      return true;
    }
    // Composed query vs short catalog: "Marcelo Silva" → "Marcelo"
    if (h.tokens.length === 1 && qTokens.length >= 2 && h.tokens[0] === qTokens[0]) {
      return true;
    }
    return false;
  });

  if (similar.length) return { type: "similar", hits: similar };
  return { type: "none", hits: [] };
}

export function buildConflictMessage(opts: {
  rawName: string;
  kind: "player" | "manager";
  matchType: "exact" | "similar";
  candidates: Array<{
    id: number;
    name: string;
    yearFrom: number | null;
    yearTo: number | null;
  }>;
  importYear: number | null;
}): string {
  const label = opts.kind === "player" ? "jogador" : "técnico";
  const lines: string[] = [];
  if (opts.matchType === "exact") {
    lines.push(
      `Nome "${opts.rawName}" bate exatamente com ${opts.candidates.length > 1 ? "registros" : "registro"} de ${label} no banco.`,
    );
  } else {
    lines.push(
      `Nome "${opts.rawName}" é parecido com ${label}(es) já cadastrado(s) (prenome igual a nome composto).`,
    );
  }

  for (const c of opts.candidates) {
    const years =
      c.yearFrom != null && c.yearTo != null
        ? c.yearFrom === c.yearTo
          ? String(c.yearFrom)
          : `${c.yearFrom}–${c.yearTo}`
        : "sem jogos registrados";
    lines.push(`• #${c.id} ${c.name} (jogos: ${years})`);
  }

  if (opts.importYear != null) {
    lines.push(`Esta importação: ${opts.importYear}.`);
    const far = opts.candidates.some((c) => {
      if (c.yearFrom == null || c.yearTo == null) return false;
      return opts.importYear! < c.yearFrom - 5 || opts.importYear! > c.yearTo + 5;
    });
    if (far) {
      lines.push(
        "A diferença de época sugere que provavelmente NÃO é a mesma pessoa — mas confirme.",
      );
    }
  }

  lines.push("Usar registro existente ou criar um novo?");
  return lines.join("\n");
}
