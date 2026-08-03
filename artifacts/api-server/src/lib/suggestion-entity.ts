/**
 * Entity types for visitor suggestion / correction reports.
 * Kept separate from rating entity types (player|manager|match only).
 */
export const SUGGESTION_ENTITY_TYPES = [
  "player",
  "manager",
  "match",
  "opponent",
  "stadium",
  "referee",
  "season",
  "general",
] as const;

export type SuggestionEntityType = (typeof SUGGESTION_ENTITY_TYPES)[number];

export function isSuggestionEntityType(
  value: string,
): value is SuggestionEntityType {
  return (SUGGESTION_ENTITY_TYPES as readonly string[]).includes(value);
}

/** Types that require a positive entity_id referencing a real row. */
export function suggestionRequiresEntityId(
  entityType: SuggestionEntityType,
): boolean {
  return entityType !== "general";
}
