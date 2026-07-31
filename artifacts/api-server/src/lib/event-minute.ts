/** Sentinel stored in NOT NULL minute columns when the exact minute is unknown. */
export const UNKNOWN_EVENT_MINUTE = 200;

/**
 * Unknown when null, sentinel 200, or legacy imports that used 0 for "no minute".
 * (Real 0' events are not used in this dataset.)
 */
export function isUnknownEventMinute(minute: number | null | undefined): boolean {
  if (minute == null) return true;
  const n = Number(minute);
  return n === UNKNOWN_EVENT_MINUTE || n === 0;
}

/**
 * Normalize API minute input.
 * Empty / null / NaN / 0 / 200 → 200 (unavailable). Other finite numbers kept as integers.
 */
export function normalizeEventMinute(raw: unknown): number {
  if (raw == null || raw === "") return UNKNOWN_EVENT_MINUTE;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || Number.isNaN(n)) return UNKNOWN_EVENT_MINUTE;
  const truncated = Math.trunc(n);
  if (truncated === UNKNOWN_EVENT_MINUTE || truncated === 0) return UNKNOWN_EVENT_MINUTE;
  return truncated;
}
