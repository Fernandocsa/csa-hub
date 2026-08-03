/**
 * Position normalization and lineup ordering for match sheets.
 *
 * Field order:
 *   Goleiro → Lateral Direito → Lateral → Zagueiro → Lateral Esquerdo →
 *   Volante → Meia → Meia Central → Meia Ofensivo → Meia Direita → Meia Esquerda →
 *   Ponta Direita → Ponta Esquerda → 2º Atacante → Centroavante → Atacante → Outros
 *
 * "Meia" without subtype sits between Volante and Meia Central.
 * "Lateral" without side sits between Lateral Direito and Zagueiro.
 */

export type LineupPositionSlot =
  | "Goleiro"
  | "Lateral Direito"
  | "Lateral"
  | "Zagueiro"
  | "Lateral Esquerdo"
  | "Volante"
  | "Meia"
  | "Meia Central"
  | "Meia Ofensivo"
  | "Meia Direita"
  | "Meia Esquerda"
  | "Ponta Direita"
  | "Ponta Esquerda"
  | "2º Atacante"
  | "Centroavante"
  | "Atacante"
  | "Outros";

/** Canonical admin select options (no Outros). */
export const PLAYER_POSITIONS: Exclude<LineupPositionSlot, "Outros">[] = [
  "Goleiro",
  "Lateral Direito",
  "Lateral",
  "Zagueiro",
  "Lateral Esquerdo",
  "Volante",
  "Meia",
  "Meia Central",
  "Meia Ofensivo",
  "Meia Direita",
  "Meia Esquerda",
  "Ponta Direita",
  "Ponta Esquerda",
  "2º Atacante",
  "Centroavante",
  "Atacante",
];

export const LINEUP_POSITION_ORDER: LineupPositionSlot[] = [
  ...PLAYER_POSITIONS,
  "Outros",
];

/** Coarser groups for admin season-roster sections. */
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

/**
 * Map free-text / codes (GK, FW, DF, MF, Lateral, etc.) to lineup slots.
 * Unrecognized or empty → Outros (sorted last).
 */
export function lineupPositionSlot(
  position: string | null | undefined,
): LineupPositionSlot {
  const p = normalizePosition(position);
  if (!p) return "Outros";

  // Lateral with side (before generic lateral / DF)
  if (
    p === "ld" ||
    p === "bd" ||
    p === "rb" ||
    p === "lateral direito" ||
    p === "lateral direita" ||
    p.includes("lateral direito") ||
    p.includes("lateral direita")
  ) {
    return "Lateral Direito";
  }
  if (
    p === "le" ||
    p === "be" ||
    p === "lb" ||
    p === "lateral esquerdo" ||
    p === "lateral esquerda" ||
    p.includes("lateral esquerdo") ||
    p.includes("lateral esquerda")
  ) {
    return "Lateral Esquerdo";
  }

  // Generic lateral (no side)
  if (p === "lat" || p === "lateral" || p === "laterais") {
    return "Lateral";
  }

  if (
    p === "gol" ||
    p === "gk" ||
    p === "goleiro" ||
    p === "goleira" ||
    p.includes("goleir")
  ) {
    return "Goleiro";
  }

  if (
    p === "zag" ||
    p === "zagueiro" ||
    p === "zagueira" ||
    p === "cb" ||
    p === "df" ||
    p === "def" ||
    p === "defensor" ||
    p === "defensora" ||
    p.includes("zagueir") ||
    p.includes("defensor")
  ) {
    return "Zagueiro";
  }

  if (p === "vol" || p === "volante" || p === "cdm" || p.includes("volante")) {
    return "Volante";
  }

  // Midfield specifics before generic "meia"
  if (
    p === "meia ofensivo" ||
    p === "meia-ofensivo" ||
    p === "cam" ||
    p === "am" ||
    p.includes("meia ofensiv") ||
    p.includes("meia-ofensiv")
  ) {
    return "Meia Ofensivo";
  }

  if (
    p === "meia central" ||
    p === "meia-central" ||
    p === "mc" ||
    p === "cm" ||
    p.includes("meia central") ||
    p.includes("meia-central")
  ) {
    return "Meia Central";
  }

  if (
    p === "meia direita" ||
    p === "meia-direita" ||
    p === "md" ||
    p.includes("meia direita") ||
    p.includes("meia-direita")
  ) {
    return "Meia Direita";
  }

  if (
    p === "meia esquerda" ||
    p === "meia-esquerda" ||
    p === "me" ||
    p.includes("meia esquerda") ||
    p.includes("meia-esquerda")
  ) {
    return "Meia Esquerda";
  }

  // Generic meia (no subtype) and other midfield aliases
  if (
    p === "mei" ||
    p === "mf" ||
    p === "meia" ||
    p.includes("meia") ||
    p.includes("meio")
  ) {
    return "Meia";
  }

  if (
    p === "ponta direita" ||
    p === "pd" ||
    p === "rw" ||
    p.includes("ponta direita")
  ) {
    return "Ponta Direita";
  }

  if (
    p === "ponta esquerda" ||
    p === "pe" ||
    p === "lw" ||
    p.includes("ponta esquerda")
  ) {
    return "Ponta Esquerda";
  }

  // Generic "ponta" without side — keep as Outros rather than inventing a side
  if (p === "ponta" || p.includes("ponta")) {
    return "Outros";
  }

  if (
    p === "2o atacante" ||
    p === "2º atacante" ||
    p === "segundo atacante" ||
    p === "sa" ||
    p === "ss" ||
    p.includes("2o atacante") ||
    p.includes("2º atacante") ||
    p.includes("segundo atacante")
  ) {
    return "2º Atacante";
  }

  if (
    p === "centroavante" ||
    p === "ca" ||
    p === "st" ||
    p === "cf" ||
    p.includes("centroavante")
  ) {
    return "Centroavante";
  }

  if (
    p === "ata" ||
    p === "fw" ||
    p === "atacante" ||
    p.includes("atacant")
  ) {
    return "Atacante";
  }

  // "lateral …" leftover (e.g. typo variants) after side checks
  if (p.includes("lateral")) return "Lateral";

  return "Outros";
}

export function positionGroup(position: string | null | undefined): PositionGroup {
  const slot = lineupPositionSlot(position);
  switch (slot) {
    case "Goleiro":
      return "Goleiros";
    case "Lateral Direito":
    case "Lateral":
    case "Zagueiro":
    case "Lateral Esquerdo":
      return "Defensores";
    case "Volante":
    case "Meia":
    case "Meia Central":
    case "Meia Ofensivo":
    case "Meia Direita":
    case "Meia Esquerda":
      return "Meias";
    case "Ponta Direita":
    case "Ponta Esquerda":
    case "2º Atacante":
    case "Centroavante":
    case "Atacante":
      return "Atacantes";
    default:
      return "Outros";
  }
}

/** Short codes for Ogol-style lineup table (GOL / DEF / MEI / ATA). */
export function shortPositionCode(position: string | null | undefined): string {
  const g = positionGroup(position);
  if (g === "Goleiros") return "GOL";
  if (g === "Defensores") return "DEF";
  if (g === "Meias") return "MEI";
  if (g === "Atacantes") return "ATA";
  return "—";
}

function shirtNum(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Sort lineups: position slot → shirt # → sortOrder → name. */
export function compareLineupByPosition<
  T extends {
    position?: string | null;
    shirtNumber?: string | number | null;
    sortOrder?: number | null;
    playerName?: string;
    name?: string;
  },
>(a: T, b: T): number {
  const sa = LINEUP_POSITION_ORDER.indexOf(lineupPositionSlot(a.position));
  const sb = LINEUP_POSITION_ORDER.indexOf(lineupPositionSlot(b.position));
  if (sa !== sb) return sa - sb;

  const na = shirtNum(a.shirtNumber);
  const nb = shirtNum(b.shirtNumber);
  if (na != null && nb != null && na !== nb) return na - nb;
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;

  const oa = a.sortOrder ?? 0;
  const ob = b.sortOrder ?? 0;
  if (oa !== ob) return oa - ob;

  const nameA = a.playerName ?? a.name ?? "";
  const nameB = b.playerName ?? b.name ?? "";
  return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
}

export function sortLineupByPosition<
  T extends {
    position?: string | null;
    shirtNumber?: string | number | null;
    sortOrder?: number | null;
    playerName?: string;
    name?: string;
  },
>(players: T[]): T[] {
  return [...players].sort(compareLineupByPosition);
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
