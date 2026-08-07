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

/**
 * Absolute extra-time clock (prorrogação), e.g. 105'–120'.
 * Regulation stoppage is encoded as 90+N or legacy 91–99.
 */
export function isExtraTimeEventMinute(minute: number | null | undefined): boolean {
  if (isUnknownEventMinute(minute)) return false;
  return Number(minute) >= 100;
}

/** Second-half stoppage (90+N), including legacy 91'–99' without injury field. */
export function isSecondHalfStoppageMinute(
  minute: number | null | undefined,
  injuryTimeMinute: number | null | undefined,
): boolean {
  if (isUnknownEventMinute(minute) || isExtraTimeEventMinute(minute)) return false;
  const m = Number(minute);
  const injury =
    injuryTimeMinute != null && Number(injuryTimeMinute) > 0
      ? Number(injuryTimeMinute)
      : 0;
  if (m === 90 && injury > 0) return true;
  if (m > 90 && m < 100) return true;
  return false;
}

/** Comparable key: regulation minute + stoppage (90+5 → after 90). */
export function eventMinuteSortKey(
  minute: number,
  injuryTimeMinute: number | null | undefined,
): number {
  const injury =
    injuryTimeMinute != null && Number(injuryTimeMinute) > 0
      ? Number(injuryTimeMinute)
      : 0;
  if (minute === 90 && injury > 0) return 90 * 1000 + injury;
  if (minute > 90 && minute < 100) return 90 * 1000 + (minute - 90);
  return minute * 1000 + injury;
}

export function formatEventMinuteLabel(
  minute: number,
  injuryTimeMinute: number | null | undefined,
): string {
  if (isUnknownEventMinute(minute)) return "n/d";
  const injury =
    injuryTimeMinute != null && Number(injuryTimeMinute) > 0
      ? Number(injuryTimeMinute)
      : 0;
  if (minute === 90 && injury > 0) return `90+${injury}'`;
  if (minute > 90 && minute < 100 && injury === 0) return `90+${minute - 90}'`;
  if (injury > 0) return `${minute}+${injury}'`;
  return `${minute}'`;
}
