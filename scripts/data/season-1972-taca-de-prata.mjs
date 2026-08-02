/** CSA Taça de Prata 1972 (2ª divisão nacional / Série B histórica).
 * Fonte do usuário — só placares e mando; sem gols/escalação/estádio inventados.
 * Contagem: J14 V5 E2 D7 GP17 GC19.
 */
export const COMPETITION_NAME = "Taça de Prata";
export const SEASON = "1972";

/**
 * @typedef {{
 *   date: string;
 *   opponent: string;
 *   gf: number;
 *   ga: number;
 *   ha: "home"|"away";
 *   result: "win"|"draw"|"loss";
 *   phase: string;
 *   stadium?: string|null;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1ª fase ———
  {
    date: "1972-09-16",
    opponent: "Ferroviário-PE",
    gf: 2,
    ga: 1,
    ha: "home",
    result: "win",
    phase: "1ª Fase",
  },
  {
    date: "1972-09-23",
    opponent: "América-PE",
    gf: 1,
    ga: 2,
    ha: "away",
    result: "loss",
    phase: "1ª Fase",
  },
  {
    date: "1972-10-07",
    opponent: "Botafogo-PB",
    gf: 0,
    ga: 0,
    ha: "home",
    result: "draw",
    phase: "1ª Fase",
  },
  {
    date: "1972-10-15",
    opponent: "Alecrim-RN",
    gf: 3,
    ga: 2,
    ha: "home",
    result: "win",
    phase: "1ª Fase",
  },
  {
    date: "1972-10-22",
    opponent: "Alecrim-RN",
    gf: 2,
    ga: 4,
    ha: "away",
    result: "loss",
    phase: "1ª Fase",
  },
  {
    date: "1972-10-31",
    opponent: "Ferroviário-PE",
    gf: 1,
    ga: 1,
    ha: "away",
    result: "draw",
    phase: "1ª Fase",
  },
  {
    date: "1972-11-04",
    opponent: "América-PE",
    gf: 2,
    ga: 0,
    ha: "home",
    result: "win",
    phase: "1ª Fase",
  },
  {
    date: "1972-11-19",
    opponent: "Botafogo-PB",
    gf: 3,
    ga: 1,
    ha: "away",
    result: "win",
    phase: "1ª Fase",
  },
  // ——— 2ª fase ———
  {
    date: "1972-11-25",
    opponent: "América-RN",
    gf: 0,
    ga: 1,
    ha: "away",
    result: "loss",
    phase: "2ª Fase",
  },
  {
    date: "1972-11-29",
    opponent: "Campinense-PB",
    gf: 0,
    ga: 1,
    ha: "away",
    result: "loss",
    phase: "2ª Fase",
  },
  {
    date: "1972-12-02",
    opponent: "América-PE",
    gf: 2,
    ga: 1,
    ha: "home",
    result: "win",
    phase: "2ª Fase",
  },
  {
    date: "1972-12-06",
    opponent: "América-RN",
    gf: 0,
    ga: 1,
    ha: "home",
    result: "loss",
    phase: "2ª Fase",
  },
  {
    date: "1972-12-10",
    opponent: "Campinense-PB",
    gf: 1,
    ga: 3,
    ha: "home",
    result: "loss",
    phase: "2ª Fase",
  },
  {
    date: "1972-12-13",
    opponent: "América-PE",
    gf: 0,
    ga: 1,
    ha: "away",
    result: "loss",
    phase: "2ª Fase",
  },
];
