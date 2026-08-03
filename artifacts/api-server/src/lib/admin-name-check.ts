import { normName, nameTokens } from "./csv-match-import/name-match";

export type NameCheckMatch = "exact" | "similar";

export type NameCheckCandidate = {
  id: number;
  name: string;
  fullName: string | null;
  photoUrl: string | null;
  match: NameCheckMatch;
  matchedOn: "name" | "fullName";
};

type CatalogRow = {
  id: number;
  name: string;
  fullName: string | null;
  photoUrl?: string | null;
};

function hasPhoto(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

function fieldsOf(row: CatalogRow): Array<{ value: string; matchedOn: "name" | "fullName" }> {
  const out: Array<{ value: string; matchedOn: "name" | "fullName" }> = [];
  if (row.name?.trim()) out.push({ value: row.name, matchedOn: "name" });
  if (row.fullName?.trim()) out.push({ value: row.fullName, matchedOn: "fullName" });
  return out;
}

/** True when `shorter` is the leading token sequence of `longer`. */
function isTokenPrefix(shorter: string[], longer: string[]): boolean {
  if (shorter.length === 0 || longer.length <= shorter.length) return false;
  return shorter.every((t, i) => longer[i] === t);
}

/**
 * Soft "looks like" match. Requires the same first name (prenome).
 * Never used for save-blocking — only warnings.
 */
function isSimilarName(query: string, fieldValue: string): boolean {
  const qNorm = normName(query);
  const fNorm = normName(fieldValue);
  if (!qNorm || !fNorm) return false;
  if (qNorm === fNorm) return true;

  const qTokens = nameTokens(query);
  const fTokens = nameTokens(fieldValue);
  if (!qTokens.length || !fTokens.length) return false;
  if (qTokens[0] !== fTokens[0]) return false;

  if (isTokenPrefix(qTokens, fTokens) || isTokenPrefix(fTokens, qTokens)) return true;
  if (qTokens.length === 1 || fTokens.length === 1) return true;

  const shorter = qTokens.length <= fTokens.length ? qTokens : fTokens;
  const longer = qTokens.length <= fTokens.length ? fTokens : qTokens;
  const longSet = new Set(longer);
  return shorter.slice(1).every((t) => longSet.has(t));
}

/**
 * Find existing players/managers that look like the typed name(s).
 *
 * `exact` (blocks save) = typed full name equals an existing full name.
 * Display-name matches are only `similar` (warning).
 * Results with a photo are listed first within the same match strength.
 */
export function findDuplicateNameCandidates(
  queries: { name?: string; fullName?: string },
  catalog: CatalogRow[],
  excludeId?: number | null,
): NameCheckCandidate[] {
  const nameQ = String(queries.name ?? "").trim();
  const fullQ = String(queries.fullName ?? "").trim();
  if (nameQ.length < 2 && fullQ.length < 2) return [];

  const byId = new Map<number, NameCheckCandidate>();

  function upsert(row: CatalogRow, match: NameCheckMatch, matchedOn: "name" | "fullName") {
    const prev = byId.get(row.id);
    if (!prev || (prev.match === "similar" && match === "exact")) {
      byId.set(row.id, {
        id: row.id,
        name: row.name,
        fullName: row.fullName,
        photoUrl: row.photoUrl?.trim() || null,
        match,
        matchedOn,
      });
    }
  }

  for (const row of catalog) {
    if (excludeId != null && row.id === excludeId) continue;

    // Block only when both sides have a full name and they match exactly.
    if (fullQ.length >= 2 && row.fullName?.trim()) {
      if (normName(fullQ) === normName(row.fullName)) {
        upsert(row, "exact", "fullName");
        continue;
      }
    }

    for (const field of fieldsOf(row)) {
      if (fullQ.length >= 2 && isSimilarName(fullQ, field.value)) {
        upsert(row, "similar", field.matchedOn);
      }
      if (nameQ.length >= 2 && isSimilarName(nameQ, field.value)) {
        upsert(row, "similar", field.matchedOn);
      }
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (a.match !== b.match) return a.match === "exact" ? -1 : 1;
    const aPhoto = hasPhoto(a.photoUrl) ? 0 : 1;
    const bPhoto = hasPhoto(b.photoUrl) ? 0 : 1;
    if (aPhoto !== bPhoto) return aPhoto - bPhoto;
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });
}
