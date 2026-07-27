/** Display grouping for free-text player positions (admin roster sort only). */

export type PositionGroup =
  | "Goleiros"
  | "Defensores"
  | "Meias"
  | "Atacantes"
  | "Outros";

const GROUP_ORDER: PositionGroup[] = [
  "Goleiros",
  "Defensores",
  "Meias",
  "Atacantes",
  "Outros",
];

function normalizePosition(raw: string | null | undefined): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function positionGroup(position: string | null | undefined): PositionGroup {
  const p = normalizePosition(position);
  if (!p) return "Outros";

  if (
    p === "gol" ||
    p === "gk" ||
    p === "goleiro" ||
    p === "goleira" ||
    p.includes("goleir")
  ) {
    return "Goleiros";
  }

  if (
    p === "zag" ||
    p === "zagueiro" ||
    p === "zagueira" ||
    p === "lat" ||
    p === "lateral" ||
    p === "le" ||
    p === "ld" ||
    p === "be" ||
    p === "bd" ||
    p === "def" ||
    p === "defensor" ||
    p === "defensora" ||
    p === "df" ||
    p.includes("zagueir") ||
    p.includes("lateral") ||
    p.includes("defensor")
  ) {
    return "Defensores";
  }

  if (
    p === "mei" ||
    p === "mf" ||
    p === "meia" ||
    p === "vol" ||
    p === "volante" ||
    p === "mc" ||
    p === "md" ||
    p === "me" ||
    p.includes("meia") ||
    p.includes("volante") ||
    p.includes("meio")
  ) {
    return "Meias";
  }

  if (
    p === "ata" ||
    p === "fw" ||
    p === "st" ||
    p === "atacante" ||
    p === "centroavante" ||
    p === "ca" ||
    p === "pe" ||
    p === "pd" ||
    p === "sa" ||
    p.includes("atacant") ||
    p.includes("centroavante") ||
    p.includes("ponta")
  ) {
    return "Atacantes";
  }

  return "Outros";
}

export function compareByPositionGroupThenName(
  a: { name: string; position?: string | null },
  b: { name: string; position?: string | null },
): number {
  const ga = GROUP_ORDER.indexOf(positionGroup(a.position));
  const gb = GROUP_ORDER.indexOf(positionGroup(b.position));
  if (ga !== gb) return ga - gb;
  return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
}

export function groupPlayersByPosition<T extends { name: string; position?: string | null }>(
  players: T[],
): { group: PositionGroup; players: T[] }[] {
  const sorted = [...players].sort(compareByPositionGroupThenName);
  const map = new Map<PositionGroup, T[]>();
  for (const g of GROUP_ORDER) map.set(g, []);
  for (const p of sorted) {
    map.get(positionGroup(p.position))!.push(p);
  }
  return GROUP_ORDER.filter((g) => (map.get(g)?.length ?? 0) > 0).map((group) => ({
    group,
    players: map.get(group)!,
  }));
}
