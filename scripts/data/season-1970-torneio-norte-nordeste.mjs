/**
 * CSA — Torneio / III Copa Norte-Nordeste 1970 (Grupo 5, 1ª fase).
 * Only fields present in source reports.
 */
export const SEASON = "1970";
export const COMPETITION_NAME = "Torneio Norte-Nordeste";

export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   opponent: string,
 *   goalsFor: number,
 *   goalsAgainst: number,
 *   homeAway: 'home'|'away'|'neutral',
 *   result: 'win'|'draw'|'loss',
 *   phase: string,
 *   stadium?: string|null,
 *   referee?: string|null,
 *   manager?: string|null,
 *   attendance?: number|null,
 *   grossRevenue?: number|null,
 *   grossRevenueText?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   oppStarters?: string[],
 *   oppSubs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  {
    date: "1970-10-14",
    opponent: "Confiança-SE",
    goalsFor: 1,
    goalsAgainst: 1,
    homeAway: "home",
    result: "draw",
    phase: "1ª Fase - Grupo 5",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Armindo Tavares",
    grossRevenue: 3675,
    grossRevenueText: "Cr$ 3.675,00",
    csaGoals: [{ name: "Piranha", minute: 0 }],
    oppGoals: [{ name: "Bertinho", minute: 0 }],
  },
  {
    date: "1970-10-18",
    opponent: "Botafogo-BA",
    goalsFor: 1,
    goalsAgainst: 2,
    homeAway: "home",
    result: "loss",
    phase: "1ª Fase - Grupo 5",
    stadium: "Estádio do Mutange",
    referee: "Murilo Duarte",
    manager: "Barbosa",
    grossRevenue: 5148,
    grossRevenueText: "Cr$ 5.148,00",
    starters: [
      "Holanda",
      "Catatau",
      "Dida",
      "Beto",
      "Joãozinho",
      "Dudu",
      "Marcos Antônio",
      "Joaci",
      "Piranha",
      "Salê",
      "Canhoteiro",
    ],
    subs: [
      { out: "Marcos Antônio", in: "Ratinho" },
      { out: "Canhoteiro", in: "Ricardo" },
    ],
    // Source: Piranhas — same player as Piranha
    oppStarters: [
      "Amauri",
      "Félix",
      "Luiz Carlos",
      "Elias",
      "Cacau",
      "Zequinha",
      "Lapinha",
      "César",
      "Valdomiro",
      "Lourival",
      "Carlos Alberto",
    ],
    oppSubs: [{ out: "Zequinha", in: "Luís Alberto" }],
    csaGoals: [{ name: "Salê", minute: absMin(2, 16) }],
    oppGoals: [
      { name: "Lapinha", minute: absMin(2, 13) },
      { name: "Lourival", minute: absMin(2, 19) },
    ],
  },
  {
    date: "1970-10-22",
    opponent: "Vitória-BA",
    goalsFor: 3,
    goalsAgainst: 1,
    homeAway: "away",
    result: "win",
    phase: "1ª Fase - Grupo 5",
    // Ficha técnica ausente na fonte
  },
  {
    date: "1970-10-28",
    opponent: "ASA-AL",
    goalsFor: 0,
    goalsAgainst: 1,
    homeAway: "home",
    result: "loss",
    phase: "1ª Fase - Grupo 5",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Rubens Cerqueira",
    manager: "Maglione Sales",
    starters: [
      "Zé Luiz",
      "Major",
      "Dida",
      "Givaldo",
      "Erivaldo",
      "Tadeu",
      "Dudu",
      "Bite",
      "Jorge Bassu",
      "Salê",
      "Piranha",
    ],
    oppStarters: [
      "Itamar",
      "Valter",
      "Pires",
      "Ailton",
      "Zé Leite",
      "Chico Bal",
      "Zito",
      "Álvaro",
      "Targino",
      "Adeíldo",
      "Bió",
    ],
    oppSubs: [{ out: "Valter", in: "Tião" }],
    oppGoals: [{ name: "Adeíldo", minute: 0 }],
  },
  {
    date: "1970-11-01",
    opponent: "Central-PE",
    goalsFor: 2,
    goalsAgainst: 0,
    homeAway: "away",
    result: "win",
    phase: "1ª Fase - Grupo 5",
    stadium: "Estádio Ilha do Retiro",
    referee: "José Carlos Santos Oliveira",
    manager: "Maglione Sales",
    attendance: 120,
    grossRevenue: 436,
    grossRevenueText: "Cr$ 436,00",
    // Fonte: Zé Luiz II (goleiro) / Zé Luiz I (volante).
    // No cadastro Alagoano 1970: goleiro = Zé Luiz (#1180), volante = Zé Luiz II (#1179).
    starters: [
      "Zé Luiz",
      "Ciro",
      "Dida",
      "Givaldo",
      "Erivaldo",
      "Tadeu",
      "Zé Luiz II",
      "Jorge Bassu",
      "Canhoteiro",
      "Salê",
      "Ricardo",
    ],
    subs: [
      { out: "Jorge Bassu", in: "Joaci" },
      { out: "Ricardo", in: "Duda" },
    ],
    oppStarters: [
      "Félix",
      "Borges",
      "Fernando Silva",
      "Jucélio",
      "Alemão",
      "João Paulo",
      "Paulo Roberto",
      "Joãozinho",
      "Colorado",
      "Douglas",
      "Zito",
    ],
    oppSubs: [
      { out: "Alemão", in: "Misa" },
      { out: "Colorado", in: "Moacir" },
    ],
    csaGoals: [
      { name: "Jorge Bassu", minute: 0 },
      { name: "Jorge Bassu", minute: 0 },
    ],
  },
];
