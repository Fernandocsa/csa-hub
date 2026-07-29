/** Sentinel stored in NOT NULL minute columns when the exact minute is unknown. */
export const UNKNOWN_EVENT_MINUTE = 200;

export function isUnknownEventMinute(minute: number | null | undefined): boolean {
  return minute == null || Number(minute) === UNKNOWN_EVENT_MINUTE;
}

/**
 * Normalize form/API minute input.
 * Empty / null / NaN / 200 → 200 (unavailable). Other finite numbers kept as integers.
 */
export function normalizeEventMinute(raw: unknown): number {
  if (raw == null || raw === "") return UNKNOWN_EVENT_MINUTE;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || Number.isNaN(n)) return UNKNOWN_EVENT_MINUTE;
  const truncated = Math.trunc(n);
  if (truncated === UNKNOWN_EVENT_MINUTE) return UNKNOWN_EVENT_MINUTE;
  return truncated;
}

/** Form display: unknown → blank field (user can also type 200). */
export function eventMinuteToFormValue(minute: number | null | undefined): string {
  if (isUnknownEventMinute(minute)) return "";
  return String(minute);
}

export const UNKNOWN_EVENT_MINUTE_TITLE = "Minuto não disponível";
