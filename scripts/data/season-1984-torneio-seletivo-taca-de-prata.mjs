/**
 * CSA — Torneio Seletivo para Taça de Prata 1984 (4 jogos).
 * Only CSA fields present in source.
 */
export const SEASON = "1984";
export const COMPETITION_NAME = "Torneio Seletivo Taça de Prata";
export const COMPETITION_TYPE = "league";

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
 *   phase?: string|null,
 *   stadium?: string|null,
 *   referee?: string|null,
 *   manager?: string|null,
 *   attendance?: number|null,
 *   grossRevenue?: number|null,
 *   grossRevenueText?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  {
    date: "1984-02-08",
    opponent: "ASA-AL",
    goalsFor: 0,
    goalsAgainst: 1,
    homeAway: "away",
    result: "loss",
    phase: "Seletivo",
    stadium: "Coaracy da Mata (Fumeirão)",
    // ficha técnica ausente na fonte
  },
  {
    date: "1984-02-12",
    opponent: "São Domingos-AL",
    goalsFor: 4,
    goalsAgainst: 1,
    homeAway: "home",
    result: "win",
    phase: "Seletivo",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Ernani Jonas",
    manager: "Manoelzinho",
    starters: [
      "Zé Luiz",
      "Veiga",
      "Café",
      "Josival",
      "Careca",
      "Édson Silva",
      "Carlinhos",
      "João Neto",
      "Zelito",
      "Josenílton",
      "Bel",
    ],
    subs: [
      { out: "Josival", in: "Falcão" },
      { out: "Bel", in: "Gera" },
    ],
    csaGoals: [
      { name: "Zelito", minute: 0 },
      { name: "Zelito", minute: 0 },
      { name: "Josenílton", minute: 0 },
      { name: "Carlinhos", minute: 0 },
    ],
    oppGoals: [{ name: "Sílvio", minute: 0 }],
  },
  {
    date: "1984-02-15",
    opponent: "São Domingos-AL",
    goalsFor: 6,
    goalsAgainst: 0,
    homeAway: "away",
    result: "win",
    phase: "Seletivo",
    // Fonte: Estádio Rei Pelé (neutro/casa do adversário no texto)
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Ronaldo Nunes",
    manager: "Manoelzinho",
    attendance: 643,
    grossRevenue: 479400,
    grossRevenueText: "Cr$ 479.400,00",
    csaGoals: [
      { name: "Carlinhos", minute: 0 },
      { name: "Carlinhos", minute: 0 },
      { name: "Josenílton", minute: 0 },
      { name: "Josenílton", minute: 0 },
      { name: "Jorginho", minute: 0 },
      { name: "Gera", minute: 0 },
    ],
  },
  {
    date: "1984-02-18",
    opponent: "ASA-AL",
    goalsFor: 0,
    goalsAgainst: 0,
    homeAway: "home",
    result: "draw",
    phase: "Seletivo",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "João Monteiro",
    manager: "Manoelzinho",
    starters: [
      "Zé Luiz",
      "Veiga",
      "Café",
      "Josival",
      "Zé Carlos",
      "Édson Silva",
      "Jorginho",
      "Carlinhos",
      "Zelito",
      "Josenílton",
      "Gera",
    ],
    subs: [
      { out: "Veiga", in: "Batista" },
      { out: "Zelito", in: "Falcão" },
    ],
  },
];
