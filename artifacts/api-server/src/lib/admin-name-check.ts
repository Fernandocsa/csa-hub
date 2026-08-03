import { normName, nameTokens } from "./csv-match-import/name-match";

export type NameCheckMatch = "exact" | "similar";

export type NameCheckCandidate = {
  id: number;
  name: string;
  fullName: string | null;
  match: NameCheckMatch;
  matchedOn: "name" | "fullName";
};

type CatalogRow = {
  id: number;
  name: string;
  fullName: string | null;
};

function fieldsOf(row: CatalogRow): Array<{ value: string; matchedOn: "name" | "fullName" }> {
  const out: Array<{ value: string; matchedOn: "name" | "fullName" }> = [];
  if (row.name?.trim()) out.push({ value: row.name, matchedOn: "name" });
  if (row.fullName?.trim()) out.push({ value: row.fullName, matchedOn: "fullName" });
  return out;
}

function isTokenPrefix(shorter: string[], longer: string[]): boolean {
  if (shorter.length === 0 || longer.length <= shorter.length) return false;
  return shorter.every((t, i) => longer[i] === t);
}

function scoreAgainstField(
  qNorm: string,
  qTokens: string[],
  fieldValue: string,
): NameCheckMatch | null {
  const fNorm = normName(fieldValue);
  if (!fNorm) return null;
  if (qNorm === fNorm) return "exact";

  const fTokens = nameTokens(fieldValue);
  if (!qTokens.length || !fTokens.length) return null;

  if (isTokenPrefix(qTokens, fTokens) || isTokenPrefix(fTokens, qTokens)) {
    return "similar";
  }

  const set = new Set(fTokens);
  const shared = qTokens.filter((t) => set.has(t));
  if (shared.length >= 2) return "similar";

  return null;
}

/**
 * Find existing players/managers that look like the typed name(s).
 * Compares against both display name and full name.
 */
export function findDuplicateNameCandidates(
  queries: string[],
  catalog: CatalogRow[],
  excludeId?: number | null,
): NameCheckCandidate[] {
  const queryNorms = new Map<string, string>();
  for (const raw of queries) {
    const trimmed = String(raw ?? "").trim();
    if (trimmed.length < 2) continue;
    const n = normName(trimmed);
    if (!n) continue;
    queryNorms.set(n, trimmed);
  }
  if (queryNorms.size === 0) return [];

  const byId = new Map<number, NameCheckCandidate>();

  for (const row of catalog) {
    if (excludeId != null && row.id === excludeId) continue;

    for (const [, raw] of queryNorms) {
      const qNorm = normName(raw);
      const qTokens = nameTokens(raw);

      for (const field of fieldsOf(row)) {
        const match = scoreAgainstField(qNorm, qTokens, field.value);
        if (!match) continue;

        const prev = byId.get(row.id);
        if (!prev || (prev.match === "similar" && match === "exact")) {
          byId.set(row.id, {
            id: row.id,
            name: row.name,
            fullName: row.fullName,
            match,
            matchedOn: field.matchedOn,
          });
        }
      }
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (a.match !== b.match) return a.match === "exact" ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });
}
