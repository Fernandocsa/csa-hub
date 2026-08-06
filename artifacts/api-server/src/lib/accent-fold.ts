import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

/**
 * Portuguese / Latin accents folded for search (same length FROM→TO).
 * Used in SQL translate() so ILIKE-style search ignores diacritics without
 * requiring the unaccent extension.
 */
export const ACCENT_FROM =
  "áàâãäÁÀÂÃÄéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ";
export const ACCENT_TO =
  "aaaaaAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN";

/** Client/server string fold: strip diacritics + lowercase. */
export function foldAccents(s: string | null | undefined): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function escapeLike(s: string): string {
  return s.replace(/([\\%_])/g, "\\$1");
}

/**
 * Accent-insensitive substring match (LIKE), case-insensitive.
 * "Sampaio Correa" matches "Sampaio Corrêa".
 */
export function accentInsensitiveLike(
  column: SQLWrapper,
  search: string,
): SQL {
  const pattern = `%${escapeLike(foldAccents(search))}%`;
  return sql`translate(lower(coalesce(${column}::text, '')), ${ACCENT_FROM}, ${ACCENT_TO}) LIKE ${pattern} ESCAPE '\\'`;
}
