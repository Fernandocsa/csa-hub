/**
 * Compact season list for admin tables.
 * Examples:
 *   [2010] → "2010"
 *   [2013,2014,2015] → "2013-15"
 *   [1980,1981,1982,1983,1990] → "1980-83 e 1990"
 *   [1950,1952,1955,1956] → "1950, 1952 e 1955-56"
 */
export function formatSeasonSpans(seasons: Array<string | number> | null | undefined): string {
  if (!seasons?.length) return "";

  const years = [
    ...new Set(
      seasons
        .map((s) => parseInt(String(s).trim(), 10))
        .filter((y) => Number.isFinite(y) && y > 1800 && y < 3000),
    ),
  ].sort((a, b) => a - b);

  if (!years.length) return "";

  const ranges: Array<{ start: number; end: number }> = [];
  for (const y of years) {
    const last = ranges[ranges.length - 1];
    if (last && y === last.end + 1) last.end = y;
    else ranges.push({ start: y, end: y });
  }

  const parts = ranges.map(({ start, end }) => {
    if (start === end) return String(start);
    const sameCentury = Math.floor(start / 100) === Math.floor(end / 100);
    const endLabel = sameCentury ? String(end).slice(-2).padStart(2, "0") : String(end);
    return `${start}-${endLabel}`;
  });

  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}
