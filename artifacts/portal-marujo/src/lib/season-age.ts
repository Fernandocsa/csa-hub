/**
 * Age of a player during a specific season year (not "today").
 * Keep in sync with artifacts/api-server/src/lib/season-age.ts
 */
export function calcAgeInSeason(
  birthDate: string | null | undefined,
  birthYear: number | null | undefined,
  seasonYear: number,
): number | null {
  if (!Number.isInteger(seasonYear) || seasonYear < 1900 || seasonYear > 2100) {
    return null;
  }

  const ref = new Date(seasonYear, 11, 31, 12, 0, 0, 0);

  if (birthDate) {
    const d = new Date(
      birthDate.includes("T") ? birthDate : `${birthDate}T12:00:00`,
    );
    if (Number.isNaN(d.getTime())) return null;
    let age = ref.getFullYear() - d.getFullYear();
    const m = ref.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age -= 1;
    return age >= 0 ? age : null;
  }

  if (birthYear != null && birthYear > 1900) {
    return Math.max(0, seasonYear - birthYear);
  }

  return null;
}
