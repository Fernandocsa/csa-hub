/** Combined phase / round label for public and admin display. */
export function matchPhaseRoundLabel(
  phase?: string | null,
  round?: string | null,
): string | null {
  const p = phase?.trim() || "";
  const r = round?.trim() || "";
  if (p && r) return `${p} — ${r}`;
  if (p) return p;
  if (r) return r;
  return null;
}
