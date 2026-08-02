/**
 * CSA Série C 2006 — complementary sheets (CSA-only).
 * Grupo 7, 1ª fase: 1V-2E-3D, 5 pts (3º; não avançou).
 *
 * Fonte original sem escalações/técnico/árbitro/renda/público e cortada
 * na 6ª rodada. Placar Colo-Colo 1x0 (06/08) já existia no banco
 * (GolAberto/bola n@ área); sem autor do gol na fonte.
 */
export const SEASON = "2006";
export const COMPETITION_NAME = "Campeonato Brasileiro Série C";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2006-07-16": { phase: "1ª Fase", round: null },
  "2006-07-19": { phase: "1ª Fase", round: null },
  "2006-07-23": { phase: "1ª Fase", round: null },
  "2006-07-30": { phase: "1ª Fase", round: null },
  "2006-08-02": { phase: "1ª Fase", round: null },
  "2006-08-06": { phase: "1ª Fase", round: null },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "2006-07-16",
    stadium: "Estádio Rei Pelé",
    csaGoals: [
      { name: "Gilson Costa" },
      { name: "Alexsandro" },
      { name: "Alexsandro" },
    ],
    oppGoals: [{ name: "Guga" }],
  },
  {
    date: "2006-07-19",
    stadium: "Estádio da Fonte Nova",
    oppGoals: [{ name: "Sorato" }],
  },
  {
    date: "2006-07-23",
    stadium: "Estádio Lourival Batista",
    csaGoals: [{ name: "Jean" }],
    oppGoals: [{ name: "Marcelinho" }],
  },
  {
    date: "2006-07-30",
    stadium: "Estádio Rei Pelé",
    csaGoals: [{ name: "Édson Sá" }],
    oppGoals: [
      { name: "Lima" },
      { name: "Harlei" },
      { name: "Marcelinho" },
    ],
  },
  {
    date: "2006-08-02",
    stadium: "Estádio Rei Pelé",
    csaGoals: [
      { name: "Alexsandro" },
      { name: "David" },
      { name: "David" },
    ],
    oppGoals: [{ name: "Fábio" }, { name: "Sorato" }, { name: "Gil" }],
  },
  {
    // Fonte cortada: só estádio; placar 0x1 já no banco.
    date: "2006-08-06",
    stadium: "Estádio Mário Pessoa",
  },
];
