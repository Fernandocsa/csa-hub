import { formatDateBr } from "@/lib/utils";

/** Year-only mandates are stored as YYYY-01-01. */
export function isYearOnlyTermDate(d: string | null | undefined): boolean {
  return !!d && /^\d{4}-01-01$/.test(d);
}

export function formatPresidentTermDate(d: string | null | undefined): string | null {
  if (!d) return null;
  if (isYearOnlyTermDate(d)) return d.slice(0, 4);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return formatDateBr(d);
  return d;
}

export function presidentTermLabel(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
): string {
  const a = formatPresidentTermDate(start ?? null);
  if (isCurrent) {
    if (!a) return "Mandato em andamento";
    return `${a} — atual`;
  }
  const b = formatPresidentTermDate(end ?? null);
  if (!a && !b) return "Período não informado";
  if (!a) return b ? `até ${b}` : "Período não informado";
  if (!b) return `${a} — fim desconhecido`;
  return `${a} — ${b}`;
}

export function presidentPassageOrdinalLabel(index: number, total: number): string | null {
  if (total < 2) return null;
  return `${index + 1}ª passagem`;
}

export type TermDateMode = "unknown" | "year" | "exact" | "ongoing";

export function inferTermStartMode(date: string | null | undefined): Exclude<TermDateMode, "ongoing"> {
  if (!date) return "unknown";
  if (isYearOnlyTermDate(date)) return "year";
  return "exact";
}

export function inferTermEndMode(
  date: string | null | undefined,
  isCurrent: boolean,
): TermDateMode {
  if (isCurrent) return "ongoing";
  if (!date) return "unknown";
  if (isYearOnlyTermDate(date)) return "year";
  return "exact";
}

/** Normalize UI mode + values into API payload fields. */
export function serializeTermDate(
  mode: TermDateMode,
  year: string,
  exact: string,
): { date: string | null; isCurrent: boolean } {
  if (mode === "ongoing") return { date: null, isCurrent: true };
  if (mode === "unknown") return { date: null, isCurrent: false };
  if (mode === "year") {
    const y = year.trim();
    if (!/^\d{4}$/.test(y)) return { date: null, isCurrent: false };
    const n = Number(y);
    if (n < 1850 || n > 2100) return { date: null, isCurrent: false };
    return { date: `${y}-01-01`, isCurrent: false };
  }
  const d = exact.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { date: null, isCurrent: false };
  return { date: d, isCurrent: false };
}
