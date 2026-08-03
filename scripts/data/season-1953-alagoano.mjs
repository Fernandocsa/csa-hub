/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1953 — jogos do CSA (fonte do usuário).
 * CSA joga só na chave Clubes de Maceió (não disputa zonas do interior).
 * Campeão do 2º turno; caiu nas finalíssimas (Ferroviário campeão da capital).
 * Título estadual: ASA (2ª Zona) por recusa do Ferroviário à decisão.
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1953;

/**
 * @typedef {{
 *   date: string;
 *   phase?: string|null;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number|null;
 *   ga: number|null;
 *   stadium?: string|null;
 *   referee?: string|null;
 *   revenueText?: string|null;
 *   starters?: string[];
 *   entered?: string[];
 *   subs?: { out: string; in: string; minute?: number|null }[];
 *   goals?: {
 *     name: string;
 *     minute?: number|null;
 *     penalty?: boolean;
 *     ownGoal?: boolean;
 *     ownGoalDirection?: "for"|"against";
 *   }[];
 *   reds?: string[];
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1º turno ———
  {
    date: "1953-04-27",
    phase: "1º turno",
    opponent: "Alexandria-AL",
    ha: "home",
    gf: 4,
    ga: 1,
    note: "Sem estádio, árbitro, gols detalhados ou escalação",
  },
  {
    date: "1953-05-14",
    phase: "1º turno",
    opponent: "Moto Clube-AL",
    ha: "home",
    gf: 4,
    ga: 0,
    goals: [
      { name: "King" },
      { name: "King" },
      { name: "Dida" },
      { name: "Dida" },
    ],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-05-21",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: 2,
    ga: 3,
    goals: [{ name: "Valfredo" }, { name: "Valfredo" }],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-05-31",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 2,
    revenueText: "Cr$ 6.710,00",
    starters: [
      "Zequinha",
      "Neu",
      "Paulo",
      "Oscarzinho",
      "Zanélio",
      "Berenaldo",
      "Piolho",
      "Dida",
      "Edgard",
      "Geo",
      "Valfredo",
    ],
    note: "Escalações divulgadas na véspera; gols CRB: Macedo, Divaldo",
  },
  {
    date: "1953-06-07",
    phase: "Final 1º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 1,
    ga: 2,
    goals: [{ name: "Geo" }],
    note: "Auto Esporte campeão do 1º turno; escalação CSA não informada",
  },
  // ——— 2º turno ———
  {
    date: "1953-06-25",
    phase: "2º turno",
    opponent: "Alexandria-AL",
    ha: "home",
    gf: 1,
    ga: 0,
    note: "Sem estádio, árbitro, gols detalhados ou escalação",
  },
  {
    date: "1953-07-05",
    phase: "2º turno",
    opponent: "Moto Clube-AL",
    ha: "home",
    gf: 5,
    ga: 1,
    goals: [
      { name: "King" },
      { name: "King" },
      { name: "Piolho" },
      { name: "Deda" },
      { name: "Geo" },
    ],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-07-12",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 2,
    ga: 1,
    goals: [{ name: "Dida" }, { name: "Cão" }],
    reds: ["Cão", "Pedro Branco", "Piolho"],
    note: "Escalação não informada",
  },
  {
    date: "1953-07-23",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 4,
    ga: 1,
    goals: [
      { name: "Dida" },
      { name: "Dida" },
      { name: "Cão" },
      { name: "King" },
    ],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-07-30",
    phase: "Final 2º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 3,
    ga: 1,
    starters: [
      "Zequinha",
      "Neu",
      "Arestides",
      "Napoleão",
      "Zanélio",
      "Piolho",
      "Cão",
      "Dida",
      "King",
      "Oscarzinho",
      "Geo",
    ],
    note: "Gols não detalhados — CSA campeão do 2º turno (Maceió)",
  },
  // ——— 3º turno ———
  {
    date: "1953-08-09",
    phase: "3º turno",
    opponent: "Alexandria-AL",
    ha: "home",
    gf: 5,
    ga: 1,
    goals: [
      { name: "King" },
      { name: "King" },
      { name: "Cão" },
      { name: "Cão" },
      { name: "Dida" },
    ],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-08-22",
    phase: "3º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 2,
    ga: 3,
    goals: [{ name: "Dida" }, { name: "King" }],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-08-30",
    phase: "3º turno",
    opponent: "Moto Clube-AL",
    ha: "home",
    gf: 7,
    ga: 2,
    referee: "Hildebrando Codá",
    starters: [
      "Zequinha",
      "Neu",
      "Arestides",
      "Piolho",
      "Zanélio",
      "Gedir",
      "Cão",
      "Dida",
      "King",
      "Deda",
      "Geo",
    ],
    goals: [
      { name: "Dida", minute: absMin(1, 0) },
      { name: "Deda", minute: absMin(1, 0) },
      { name: "King", minute: absMin(1, 0) },
      { name: "Geo", minute: absMin(2, 0) },
      { name: "King", minute: absMin(2, 0) },
      { name: "Cão", minute: absMin(2, 0) },
      { name: "Cão", minute: absMin(2, 0) },
    ],
  },
  {
    date: "1953-09-20",
    phase: "3º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 4,
    referee: "Hildebrando Codá",
    starters: [
      "Levino",
      "Neu",
      "Paulo",
      "Oscarzinho",
      "Zanélio",
      "Piolho",
      "Cão",
      "Dida",
      "King",
      "Dida",
      "Geo",
    ],
    subs: [
      { out: "Oscarzinho", in: "Piolho" },
      { out: "Piolho", in: "Oscarzinho" },
    ],
    goals: [{ name: "Neu", ownGoal: true, ownGoalDirection: "against" }],
    note: "Fonte lista Dida duas vezes na XI (provável erro); 4º gol CRB = Neu (gc); Oscarzinho↔Piolho na fonte",
  },
  // ——— Finalíssimas ———
  {
    date: "1953-10-18",
    phase: "Finalíssimas",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 3,
    ga: 3,
    goals: [{ name: "Geo" }, { name: "King" }, { name: "Piolho" }],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1953-10-25",
    phase: "Finalíssimas",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 0,
    ga: 1,
    referee: "Adalberto Silva",
    note: "Gol Ferroviário: Newton; Ferroviário campeão da capital 1953",
  },
];
