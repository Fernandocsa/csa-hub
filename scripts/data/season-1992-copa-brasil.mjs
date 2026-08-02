/** CSA Copa do Brasil 1992 — matches + goals; lineup only where sourced. */
export const COMPETITION_NAME = "Copa do Brasil";
export const SEASON = "1992";

/** Confirmed player IDs (same person as Alagoano 1992). */
export const PLAYERS = {
  "Marcelo Gomes": 558,
  Édson: 554,
  Edson: 554,
  Ivan: 541,
  Bizu: 552,
  "Marcelo Barreto": 560,
  Piti: 566,
  Chico: 551,
  Chiquinho: 551,
  Dago: 563,
  "Carlinhos Marechal": 546,
  Flávio: 485,
  Rau: 572,
  Oseas: 550,
  Ozéias: 550,
  Oséas: 550,
  "Mário Xavier": 559,
  Talvanes: 549,
  Lino: 540,
};

export const MANAGER_FELIX_ID = 82;

/**
 * @typedef {{
 *   key: string;
 *   date: string;
 *   opponent: string;
 *   gf: number;
 *   ga: number;
 *   ha: "home"|"away";
 *   result: "win"|"draw"|"loss";
 *   phase: string;
 *   round: string;
 *   stadium: string;
 *   stadiumCity?: string;
 *   stadiumState?: string;
 *   managerId?: number|null;
 *   goals: string[];
 *   pairKey?: string;
 *   sheet?: {
 *     starters: string[];
 *     subs: { out: string; in: string }[];
 *   };
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  {
    key: "tuna-ida",
    date: "1992-07-07",
    opponent: "Tuna Luso-PA",
    gf: 1,
    ga: 2,
    ha: "away",
    result: "loss",
    phase: "1ª Fase",
    round: "Ida",
    stadium: "Baenão",
    stadiumCity: "Belém",
    stadiumState: "PA",
    goals: ["Marcelo Gomes"],
    pairKey: "tuna",
  },
  {
    key: "tuna-volta",
    date: "1992-08-04",
    opponent: "Tuna Luso-PA",
    gf: 4,
    ga: 0,
    ha: "home",
    result: "win",
    phase: "1ª Fase",
    round: "Volta",
    stadium: "Estádio Rei Pelé (Trapichão)",
    stadiumCity: "Maceió",
    stadiumState: "AL",
    goals: ["Édson", "Ivan", "Bizu", "Bizu"],
    pairKey: "tuna",
  },
  {
    key: "vasco-ida",
    date: "1992-09-12",
    opponent: "Vasco-RJ",
    gf: 3,
    ga: 3,
    ha: "home",
    result: "draw",
    phase: "2ª Fase",
    round: "Ida",
    stadium: "Pajuçara",
    stadiumCity: "Maceió",
    stadiumState: "AL",
    goals: ["Marcelo Barreto", "Piti", "Chico"],
    pairKey: "vasco",
  },
  {
    key: "vasco-volta",
    date: "1992-09-25",
    opponent: "Vasco-RJ",
    gf: 1,
    ga: 0,
    ha: "away",
    result: "win",
    phase: "2ª Fase",
    round: "Volta",
    stadium: "São Januário",
    stadiumCity: "Rio de Janeiro",
    stadiumState: "RJ",
    managerId: MANAGER_FELIX_ID,
    goals: ["Dago"],
    pairKey: "vasco",
    // Correio do Povo (Lino interview) — São Januário 25/09/1992
    sheet: {
      starters: [
        "Flávio",
        "Rau",
        "Oseas",
        "Marcelo Barreto",
        "Carlinhos Marechal",
        "Mário Xavier",
        "Talvanes",
        "Marcelo Gomes",
        "Chico",
        "Lino",
        "Édson",
      ],
      subs: [
        { out: "Oseas", in: "Dago" },
        { out: "Carlinhos Marechal", in: "Piti" },
      ],
    },
  },
  {
    key: "sport-ida",
    date: "1992-10-28",
    opponent: "Sport-PE",
    gf: 1,
    ga: 3,
    ha: "home",
    result: "loss",
    phase: "3ª Fase",
    round: "Ida",
    stadium: "Estádio Rei Pelé (Trapichão)",
    stadiumCity: "Maceió",
    stadiumState: "AL",
    goals: ["Carlinhos Marechal"],
    pairKey: "sport",
  },
  {
    key: "sport-volta",
    date: "1992-11-10",
    opponent: "Sport-PE",
    gf: 0,
    ga: 4,
    ha: "away",
    result: "loss",
    phase: "3ª Fase",
    round: "Volta",
    stadium: "Estádio Ilha do Retiro",
    stadiumCity: "Recife",
    stadiumState: "PE",
    goals: [],
    pairKey: "sport",
  },
];
