export function normName(s: string | null | undefined): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Convert sheet-style minute (value in half) + half (1|2) → absolute + injury. */
export function convertHalfMinute(
  rawMin: number,
  half: 1 | 2,
): { minute: number; injuryTimeMinute: number | null } {
  const X = Number(rawMin);
  if (!Number.isFinite(X) || (half !== 1 && half !== 2)) {
    return { minute: 0, injuryTimeMinute: null };
  }
  if (half === 1) {
    if (X <= 45) return { minute: X, injuryTimeMinute: null };
    return { minute: 45, injuryTimeMinute: X - 45 };
  }
  const abs = 45 + X;
  if (abs <= 90) return { minute: abs, injuryTimeMinute: null };
  return { minute: 90, injuryTimeMinute: abs - 90 };
}
