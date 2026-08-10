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
  cbfRegistration?: string | null;
  birthYear?: number | null;
  /** Season years (e.g. 2015 from "2015" or "2015/16"). */
  seasonYears?: number[] | null;
};

export type NameCheckQuery = {
  name?: string;
  fullName?: string;
  /** Current form / profile CBF — used to drop distinct registered athletes. */
  cbfRegistration?: string | null;
  birthYear?: number | null;
  seasonYears?: number[] | null;
};

/** Max gap (years) between career ranges before we treat them as unrelated eras. */
export const NAME_CHECK_MAX_SEASON_GAP = 10;
/** Max birth-year distance when seasons are missing on one/both sides. */
export const NAME_CHECK_MAX_BIRTH_GAP = 15;

function hasPhoto(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

function normCbf(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/\D/g, "");
}

function hasFullName(value: string | null | undefined): boolean {
  return String(value ?? "").trim().length >= 2;
}

export function parseSeasonYear(season: string): number | null {
  const m = String(season ?? "").trim().match(/^(\d{4})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return Number.isFinite(y) ? y : null;
}

export function seasonYearsFromList(seasons: string[]): number[] {
  const years: number[] = [];
  for (const s of seasons) {
    const y = parseSeasonYear(s);
    if (y != null) years.push(y);
  }
  return years;
}

function careerRange(years: number[] | null | undefined): { min: number; max: number } | null {
  if (!years?.length) return null;
  let min = years[0];
  let max = years[0];
  for (const y of years) {
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return { min, max };
}

/**
 * Whether two careers are close enough to be the same person.
 * Returns null when either side lacks season data (caller may fall back to birth year).
 */
export function careersNear(
  aYears: number[] | null | undefined,
  bYears: number[] | null | undefined,
  maxGap = NAME_CHECK_MAX_SEASON_GAP,
): boolean | null {
  const a = careerRange(aYears);
  const b = careerRange(bYears);
  if (!a || !b) return null;
  const gap = a.max < b.min ? b.min - a.max : b.max < a.min ? a.min - b.max : 0;
  return gap <= maxGap;
}

function birthYearsNear(
  a: number | null | undefined,
  b: number | null | undefined,
  maxGap = NAME_CHECK_MAX_BIRTH_GAP,
): boolean | null {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.abs(a - b) <= maxGap;
}

/**
 * Drop lookalikes that are clearly different people:
 * - both have full name + different CBF inscriptions
 * - careers (or birth years) are decades apart
 */
export function isDistinctIdentityCandidate(
  query: NameCheckQuery,
  row: CatalogRow,
): boolean {
  const qFull = String(query.fullName ?? "").trim();
  const qCbf = normCbf(query.cbfRegistration);
  const rowCbf = normCbf(row.cbfRegistration);

  if (qFull.length >= 2 && qCbf && hasFullName(row.fullName) && rowCbf && qCbf !== rowCbf) {
    return true;
  }

  const nearSeasons = careersNear(query.seasonYears, row.seasonYears);
  if (nearSeasons === false) return true;

  if (nearSeasons === null) {
    const nearBirth = birthYearsNear(query.birthYear, row.birthYear);
    if (nearBirth === false) return true;
  }

  return false;
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
 *
 * Optional query context (CBF / seasons / birth year) drops clear false positives.
 */
export function findDuplicateNameCandidates(
  queries: NameCheckQuery,
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
    if (isDistinctIdentityCandidate(queries, row)) continue;

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
