/** Shared CSV import conflict / resolution types. */

export type NameResolution = {
  rowIndex: number;
  kind: "player" | "manager";
  rawName: string;
  action: "use" | "create";
  entityId?: number;
};

export type NameConflict = {
  rowIndex: number;
  date: string;
  opponent: string;
  kind: "player" | "manager";
  rawName: string;
  matchType: "exact" | "similar";
  candidates: Array<{
    id: number;
    name: string;
    yearFrom: number | null;
    yearTo: number | null;
  }>;
  importYear: number | null;
  message: string;
};
