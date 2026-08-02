/** CSA Série B 1992 — lineups/goals from ogol (CSA side only).
 * Rounds 10 and 12: no sheet (source missing).
 * Subs: pair "saiu" starters with "reservas que entraram" in listed order
 * (minute 0). Not claimed as verified out→in when source was ambiguous.
 * Round 1 "(entrou)" inside titulares: treated as starters (no separate bank).
 * Round 14 Talvanes on bank without confirmed entry: bench only, no sub.
 */
export const SEASON = "1992";
export const COMPETITION_NAME = "Campeonato Brasileiro Série B";

/** Force IDs for known 1992 roster / confirmed aliases. */
export const FORCE_ID = {
  flavio: 485,
  "carlinhos marechal": 546,
  carlinhos: 546,
  ivanildo: 555,
  rau: 572,
  cafe: 547,
  café: 547,
  talvanes: 549,
  oseias: 550,
  oséias: 550,
  edson: 554,
  édson: 554,
  "edson carioca": 554,
  "édson carioca": 554,
  peu: 498,
  chico: 551,
  ivan: 541,
  piti: 566,
  mazinho: 553,
  beu: 556,
  bizu: 552,
  marcelo: 561,
  "marcelo silva": 561,
  lino: 540,
};

/**
 * @typedef {{
 *   date: string;
 *   ha: "home"|"away";
 *   opp: string;
 *   starters: string[];
 *   entered?: string[];
 *   subbedOut?: string[];
 *   benchOnly?: string[];
 *   goals?: { name: string; minute: number }[];
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "1992-02-09",
    ha: "home",
    opp: "Ceará-CE",
    starters: [
      "Flávio",
      "Carlinhos",
      "Ivanildo",
      "Rau",
      "Café",
      "Talvanes",
      "Oséias",
      "Édson Carioca",
      "Peu",
      "Chico",
      "Ivan",
    ],
    goals: [
      { name: "Café", minute: 33 },
      { name: "Chico", minute: 36 },
    ],
  },
  {
    date: "1992-02-12",
    ha: "away",
    opp: "Picos-PI",
    starters: [
      "Flávio",
      "Carlinhos",
      "Ivanildo",
      "Rau",
      "Café",
      "Talvanes",
      "Oséias",
      "Édson Carioca",
      "Peu",
      "Chico",
      "Ivan",
    ],
    subbedOut: ["Carlinhos", "Talvanes", "Oséias", "Chico", "Ivan"],
    entered: ["Marcão", "Piti"],
  },
  {
    date: "1992-02-16",
    ha: "home",
    opp: "Fortaleza-CE",
    starters: [
      "Flávio",
      "Carlinhos",
      "Ivanildo Gomes",
      "Rau",
      "Café",
      "Talvanes",
      "Oséias",
      "Édson Carioca",
      "Peu",
      "Chico",
      "Piti",
    ],
    goals: [
      { name: "Piti", minute: 8 },
      { name: "Piti", minute: 22 },
      { name: "Piti", minute: 56 },
    ],
  },
  {
    date: "1992-02-19",
    ha: "home",
    opp: "Santa Cruz-PE",
    starters: [
      "Flávio",
      "Ivanildo",
      "Rau",
      "Café",
      "Talvanes",
      "Oséias",
      "Mazinho",
      "Peu",
      "Chico",
      "Piti",
      "Ivan",
    ],
    goals: [{ name: "Talvanes", minute: 19 }],
  },
  {
    date: "1992-02-23",
    ha: "home",
    opp: "Central-PE",
    starters: [
      "Flávio",
      "Carlinhos",
      "Ivanildo",
      "Rau",
      "Café",
      "Talvanes",
      "Mazinho",
      "Édson Carioca",
      "Marcão",
      "Peu",
      "Ivan",
    ],
    subbedOut: ["Carlinhos", "Ivanildo", "Rau", "Café", "Talvanes"],
    entered: ["Fernando Lima", "Chico"],
    goals: [
      { name: "Talvanes", minute: 44 },
      { name: "Marcão", minute: 75 },
      { name: "Ivanildo", minute: 80 },
    ],
  },
  {
    date: "1992-03-08",
    ha: "away",
    opp: "ABC-RN",
    starters: [
      "Flávio",
      "Fernando Lima",
      "Carlinhos",
      "Ivanildo Gomes",
      "Café",
      "Mazinho",
      "Oséias",
      "Marcão",
      "Édson Carioca",
      "Ivan",
    ],
    // Source lists 10 starters — keep as given (do not invent 11th)
    subbedOut: ["Mazinho", "Marcão"],
    entered: ["Peu", "Chico"],
  },
  {
    date: "1992-03-11",
    ha: "away",
    opp: "Campinense-PB",
    starters: [
      "Flávio",
      "Carlinhos",
      "Ivanildo",
      "Rau",
      "Café",
      "Oséias",
      "Beu",
      "Édson Carioca",
      "Piti",
      "Ivan",
    ],
    // 10 starters as sourced
    subbedOut: ["Carlinhos", "Rau", "Café", "Oséias", "Beu"],
    entered: ["Mazinho", "Marcão"],
  },
  {
    date: "1992-03-18",
    ha: "home",
    opp: "Campinense-PB",
    starters: [
      "Flávio",
      "Fernando Lima",
      "Carlinhos",
      "Ivanildo",
      "Rau",
      "Talvanes",
      "Oséias",
      "Édson Carioca",
      "Ivan",
      "Bizu",
      "Peu",
    ],
    subbedOut: ["Talvanes", "Peu"],
    entered: ["Mazinho", "Piti"],
    goals: [
      { name: "Fernando Lima", minute: 77 },
      { name: "Bizu", minute: 87 },
    ],
  },
  {
    date: "1992-03-22",
    ha: "away",
    opp: "Santa Cruz-PE",
    starters: [
      "Flávio",
      "Fernando Lima",
      "Carlinhos",
      "Rau",
      "Café",
      "Talvanes",
      "Oséias",
      "Mazinho",
      "Édson Carioca",
      "Bizu",
      "Piti",
    ],
  },
  {
    date: "1992-03-29",
    ha: "home",
    opp: "ABC-RN",
    starters: [
      "Flávio",
      "Fernando Lima",
      "Carlinhos",
      "Café",
      "Talvanes",
      "Marcelo",
      "Mazinho",
      "Oséias",
      "Bizu",
      "Édson Carioca",
      "Ivan",
    ],
  },
  {
    date: "1992-04-04",
    ha: "away",
    opp: "Ceará-CE",
    starters: [
      "Flávio",
      "Fernando Lima",
      "Carlinhos",
      "Rau",
      "Café",
      "Mingo",
      "Oséias",
      "Édson Carioca",
      "Bizu",
      "Peu",
      "Chico",
    ],
    subbedOut: ["Oséias"],
    entered: ["Mazinho"],
  },
  {
    date: "1992-04-08",
    ha: "home",
    opp: "Picos-PI",
    starters: [
      "Flávio",
      "Fernando Lima",
      "Carlinhos",
      "Rau",
      "Marcelo",
      "Mingo",
      "Oséias",
      "Édson Carioca",
      "Bizu",
      "Peu",
      "Chico",
    ],
    benchOnly: ["Talvanes"],
    goals: [
      { name: "Bizu", minute: 22 },
      { name: "Bizu", minute: 28 },
    ],
  },
];
