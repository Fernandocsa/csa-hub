/**
 * Accent-insensitive search helpers for public + admin filters.
 * "Sampaio Correa" matches "Sampaio Corrêa".
 */

/** Strip diacritics + lowercase (NFD). */
export function foldAccents(s: string | null | undefined): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** True when haystack contains needle, ignoring accents and case. */
export function includesFolded(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const q = foldAccents(needle).trim();
  if (!q) return true;
  return foldAccents(haystack).includes(q);
}
