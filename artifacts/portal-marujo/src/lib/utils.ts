import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Fuso oficial do portal (horário de Brasília). */
export const BR_TIMEZONE = "America/Sao_Paulo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Integers with Brazilian thousand separators (2.624). */
export function formatInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.trunc(n).toLocaleString("pt-BR");
}

/**
 * Format a calendar date for display in pt-BR using Brasília calendar rules.
 * Prefer YYYY-MM-DD string parts (no UTC shift). Datetimes use America/Sao_Paulo.
 */
export function formatDateBr(
  d: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!d) return "—";
  const raw = String(d).trim();
  const ymd = raw.slice(0, 10);
  const hasTime = /T|\s\d{2}:\d{2}/.test(raw);

  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd) && !hasTime) {
    const [y, m, day] = ymd.split("-");
    if (options?.month === "long" || options?.year === "numeric") {
      // Long form via Intl still anchored at noon Brasília to avoid day shift
      return new Date(`${ymd}T12:00:00-03:00`).toLocaleDateString("pt-BR", {
        timeZone: BR_TIMEZONE,
        day: options.day ?? "2-digit",
        month: options.month ?? "2-digit",
        year: options.year ?? "numeric",
      });
    }
    return `${day}/${m}/${y}`;
  }

  const instant = new Date(raw.includes("T") || raw.includes(" ") ? raw : `${raw}T12:00:00-03:00`);
  if (Number.isNaN(instant.getTime())) return "—";
  return instant.toLocaleDateString("pt-BR", {
    timeZone: BR_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  });
}

/** Date+time in pt-BR, always America/Sao_Paulo. */
export function formatDateTimeBr(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const instant = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(instant.getTime())) return "—";
  return instant.toLocaleString("pt-BR", { timeZone: BR_TIMEZONE });
}
