/**
 * Competition ("1224") ranking used in sports standings:
 * tied values share the same rank; the next distinct value skips
 * by the number of tied places.
 *
 * Example: values [10, 10, 9] → ranks [1, 1, 3]
 */

export type RankValue = number | string | boolean | null | undefined;

function rankKey(value: RankValue): string {
  if (value === null || value === undefined) return "\0";
  if (typeof value === "number") {
    return Number.isNaN(value) ? "\0nan" : `n:${value}`;
  }
  if (typeof value === "boolean") return `b:${value ? 1 : 0}`;
  return `s:${value}`;
}

/**
 * Returns one competition rank per list item (same length as `list`).
 * List must already be sorted by the ranking metric (desc or asc).
 *
 * @param startAt — 1-based rank for index 0 (use `(page-1)*limit + 1` when paginating).
 */
export function assignCompetitionRanks<T>(
  list: readonly T[],
  valueSelector: (item: T, index: number) => RankValue,
  options?: { startAt?: number },
): number[] {
  const startAt = options?.startAt ?? 1;
  const ranks: number[] = new Array(list.length);
  let lastKey: string | null = null;
  let lastRank = startAt;

  for (let i = 0; i < list.length; i++) {
    const key = rankKey(valueSelector(list[i], i));
    if (i === 0 || key !== lastKey) {
      lastRank = startAt + i;
      lastKey = key;
    }
    ranks[i] = lastRank;
  }

  return ranks;
}
