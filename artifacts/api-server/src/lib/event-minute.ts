/** Sentinel stored in NOT NULL minute columns when the exact minute is unknown. */
export const UNKNOWN_EVENT_MINUTE = 200;

export function isUnknownEventMinute(minute: number | null | undefined): boolean {
  return minute == null || Number(minute) === UNKNOWN_EVENT_MINUTE;
}

/**
 * Normalize API minute input.
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
