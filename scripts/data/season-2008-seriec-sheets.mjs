/**
 * CSA Série C 2008 — complementary sheets (CSA-only).
 * 1ª fase: 1V–5D (Tozim artilheiro da campanha).
 *
 * Técnicos: Gil Baiano (13/07 em diante); 06/07 e 09/07 sem técnico na fonte.
 * Sem árbitro/renda/público. Minutos de gol não informados.
 * 23/07: gol do Sergipe = Júnior (CSA, contra).
 */
export const SEASON = "2008";
export const COMPETITION_NAME = "Campeonato Brasileiro Série C";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2008-07-06": { phase: "1ª Fase", round: null },
  "2008-07-09": { phase: "1ª Fase", round: null },
  "2008-07-13": { phase: "1ª Fase", round: null },
  "2008-07-20": { phase: "1ª Fase", round: null },
  "2008-07-23": { phase: "1ª Fase", round: null },
  "2008-07-27": { phase: "1ª Fase", round: null },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean, ownGoal?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   manager?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "2008-07-06",
    stadium: "Estádio Luiz Viana Filho",
    csaGoals: [{ name: "Tozim" }],
    oppGoals: [{ name: "Guga" }, { name: "Guga" }],
  },
  {
    date: "2008-07-09",
    stadium: "Estádio Rei Pelé",
    csaGoals: [{ name: "Tozim" }],
    oppGoals: [{ name: "Luciano Dias" }, { name: "Jorginho" }],
  },
  {
    date: "2008-07-13",
    stadium: "Estádio Lomanto Júnior",
    manager: "Gil Baiano",
    starters: [
      "Gilberto",
      "Buiu",
      "Júnior",
      "Samuel",
      "Marciano",
      "Jota",
      "Matteus",
      "Du",
      "Márcio Diogo",
      "Tozim",
      "Hevandro",
    ],
    subs: [
      { out: "Du", in: "Claudinho" },
      { out: "Márcio Diogo", in: "Celsinho" },
      { out: "Tozim", in: "Anderson Lobão" },
    ],
    oppGoals: [{ name: "Carlos Magno" }, { name: "Léo Macaé" }],
  },
  {
    date: "2008-07-20",
    stadium: "Estádio Nelson Peixoto Feijó",
    manager: "Gil Baiano",
    starters: [
      "Veloso",
      "Buiu",
      "Júnior",
      "Samuel",
      "Marciano",
      "Magno",
      "Matteus",
      "Jota",
      "Márcio Diogo",
      "Claudinho",
      "Tozim",
    ],
    subs: [
      { out: "Magno", in: "Du" },
      { out: "Jota", in: "Hevandro" },
      { out: "Claudinho", in: "Hugo" },
    ],
    csaGoals: [{ name: "Tozim" }],
    oppGoals: [
      { name: "Kléber" },
      { name: "Danilo Cruz" },
      { name: "Danilo Cruz" },
    ],
  },
  {
    date: "2008-07-23",
    stadium: "Estádio Lourival Batista",
    manager: "Gil Baiano",
    starters: [
      "Gilberto",
      "Cristiano Fernandes",
      "Júnior",
      "Samuel",
      "Marciano",
      "Matteus",
      "Magno",
      "Claudinho",
      "Du",
      "Márcio Diogo",
      "Tozim",
    ],
    subs: [
      { out: "Magno", in: "Igor" },
      { out: "Claudinho", in: "Diego Torres" },
      { out: "Márcio Diogo", in: "Hevandro" },
    ],
    oppGoals: [{ name: "Júnior", ownGoal: true }],
  },
  {
    date: "2008-07-27",
    stadium: "Estádio Rei Pelé",
    manager: "Gil Baiano",
    starters: [
      "Gilberto",
      "Buiu",
      "Moacri",
      "Samuel",
      "Marciano",
      "Matteus",
      "Magno",
      "Claudinho",
      "Diego Torres",
      "Du",
      "Tozim",
    ],
    subs: [
      { out: "Claudinho", in: "Hugo" },
      { out: "Du", in: "Márcio Diogo" },
    ],
    csaGoals: [{ name: "Tozim" }],
  },
];
