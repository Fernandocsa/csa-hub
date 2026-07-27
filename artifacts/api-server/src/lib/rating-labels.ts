export type RatingEntityType = "player" | "manager" | "match";

export const RATING_ENTITY_TYPES: RatingEntityType[] = [
  "player",
  "manager",
  "match",
];

/**
 * Label bands (half-open except the last):
 * [0, 1.5) → band 0
 * [1.5, 2.5) → band 1
 * [2.5, 3.5) → band 2
 * [3.5, 4.5) → band 3
 * [4.5, 5] → band 4
 */
const PLAYER_LABELS = [
  "Esquecível",
  "Mediano",
  "Bom",
  "Craque",
  "Ídolo",
] as const;

const MANAGER_LABELS = [
  "Esquecível",
  "Mediano",
  "Competente",
  "Mestre",
  "Ídolo",
] as const;

const MATCH_LABELS = [
  "Fraquinho",
  "Morno",
  "Bom jogo",
  "Emocionante",
  "Jogo histórico",
] as const;

function bandIndex(average: number): number {
  if (average < 1.5) return 0;
  if (average < 2.5) return 1;
  if (average < 3.5) return 2;
  if (average < 4.5) return 3;
  return 4;
}

export function ratingLabel(
  entityType: RatingEntityType,
  average: number,
): string {
  const i = bandIndex(average);
  switch (entityType) {
    case "player":
      return PLAYER_LABELS[i];
    case "manager":
      return MANAGER_LABELS[i];
    case "match":
      return MATCH_LABELS[i];
  }
}

/** Round to 1 decimal for display / API. */
export function roundAverage(average: number): number {
  return Math.round(average * 10) / 10;
}

export function isRatingEntityType(value: string): value is RatingEntityType {
  return (RATING_ENTITY_TYPES as string[]).includes(value);
}
