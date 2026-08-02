/**
 * CSA Copa do Brasil 2001 + Série C 2001 — complementary sheets (CSA-only).
 *
 * Copa do Brasil: agregado 4x4 vs Sport-PE; Sport classificou por gols fora
 * (wiki/RSSSF: Sport Recife (v.)).
 *
 * Gustavo Paiva = Estádio do Mutange (Maceió).
 * Sem técnico citado na fonte.
 */
export const SEASON = "2001";

/** @type {Record<string, { competition: string, phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2001-04-04": {
    competition: "Copa do Brasil",
    phase: "1ª Fase",
    round: "Ida",
  },
  "2001-04-11": {
    competition: "Copa do Brasil",
    phase: "1ª Fase",
    round: "Volta",
  },
  "2001-09-16": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "1",
  },
  "2001-09-19": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "2",
  },
  "2001-09-23": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "3",
  },
  "2001-09-26": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "4",
  },
  "2001-09-30": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "5",
  },
  "2001-10-07": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "6",
  },
  "2001-10-11": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "7",
  },
  "2001-10-14": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "8",
  },
  "2001-10-18": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "9",
  },
  "2001-10-28": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "10",
  },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   competition: string,
 *   stadium?: string|null,
 *   referee?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  // —— Copa do Brasil ——
  {
    date: "2001-04-04",
    competition: "Copa do Brasil",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Wilson" },
      { name: "Fábio Magrão" },
      { name: "Cristiano Alagoano" },
    ],
    oppGoals: [
      { name: "Leomar" },
      { name: "Fabinho" },
      { name: "Leonardo" },
      { name: "Leonardo" },
    ],
  },
  {
    date: "2001-04-11",
    competition: "Copa do Brasil",
    stadium: "Estádio Ilha do Retiro",
    csaGoals: [{ name: "Claudinei" }],
  },

  // —— Série C ——
  {
    date: "2001-09-16",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Nelson Peixoto Feijó",
    starters: [
      "Hudson",
      "Mazinho",
      "Fabinho",
      "Carlos Alberto",
      "Ramon",
      "Edílson",
      "Erivaldo",
      "Geninho",
      "Marlon",
      "Cristiano Alagoano",
      "Eliseu",
    ],
    subs: [
      { out: "Edílson", in: "Cleiton Xavier" },
      { out: "Marlon", in: "Joab" },
      { out: "Eliseu", in: "Renatinho" },
    ],
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Cristiano Alagoano" },
    ],
    oppGoals: [
      { name: "Luciano" },
      { name: "Júnior" },
      { name: "Mendonça" },
    ],
  },
  {
    date: "2001-09-19",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Coaracy da Mata (Fumeirão)",
    starters: [
      "Paulo Sérgio",
      "Mazinho",
      "Fabinho",
      "Carlos Alberto",
      "Ramon",
      "Edson",
      "Erivaldo",
      "Geninho",
      "Marlon",
      "Cristiano Alagoano",
      "Eliseu",
    ],
    subs: [
      { out: "Ramon", in: "Rogerinho" },
      { out: "Geninho", in: "Rubiano" },
      { out: "Marlon", in: "Alexsandro" },
    ],
    csaGoals: [
      { name: "Eliseu" },
      { name: "Cristiano Alagoano" },
      { name: "Cristiano Alagoano" },
    ],
    oppGoals: [{ name: "Cristiano" }],
  },
  {
    date: "2001-09-23",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Paulo Sérgio",
      "Mazinho",
      "Fabinho",
      "Carlos Alberto",
      "Ramon",
      "Erivaldo",
      "Edson",
      "Rubiano",
      "Marlon",
      "Cristiano Alagoano",
      "Eliseu",
    ],
    subs: [
      { out: "Ramon", in: "Renatinho" },
      { out: "Erivaldo", in: "Geninho" },
      { out: "Marlon", in: "Rogerinho" },
    ],
    csaGoals: [{ name: "Eliseu" }, { name: "Eliseu" }],
    oppGoals: [
      { name: "Almir" },
      { name: "Almir" },
      { name: "André" },
    ],
  },
  {
    date: "2001-09-26",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    date: "2001-09-30",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Lacerdão",
    starters: [
      "Paulo Sérgio",
      "Mazinho",
      "Erivaldo",
      "Alex Martins",
      "Ramon",
      "Edson",
      "Leandro",
      "Lino",
      "Geninho",
      "Cleiton Xavier",
      "Eliseu",
    ],
    subs: [
      { out: "Alex Martins", in: "Carlos Alberto" },
      { out: "Leandro", in: "Rubiano" },
      { out: "Cleiton Xavier", in: "Cristiano Alagoano" },
    ],
    csaGoals: [{ name: "Alex Martins" }, { name: "Cristiano Alagoano" }],
    oppGoals: [{ name: "Luciano Rosa" }],
  },
  {
    date: "2001-10-07",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Lourival Batista",
    starters: [
      "Paulo Sérgio",
      "Mazinho",
      "Erivaldo",
      "Alex Martins",
      "Rogerinho",
      "Edson",
      "Leandro",
      "Geninho",
      "Lino",
      "Cleiton Xavier",
      "Eliseu",
    ],
    subs: [
      { out: "Mazinho", in: "Luciano" },
      { out: "Eliseu", in: "Alexsandro" },
    ],
    oppGoals: [{ name: "Arthur" }],
  },
  {
    date: "2001-10-11",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Presidente Médici",
    starters: [
      "Paulo Sérgio",
      "Mazinho",
      "Erivaldo",
      "Alex Martins",
      "Rogerinho",
      "Edson",
      "Leandro",
      "Lino",
      "Geninho",
      "Cleiton Xavier",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Mazinho", in: "Luciano" },
      { out: "Rogerinho", in: "Ramon" },
      { out: "Leandro", in: "Washington" },
    ],
    oppGoals: [
      { name: "Moacir" },
      { name: "Orlando" },
      { name: "Vilson" },
    ],
  },
  {
    date: "2001-10-14",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio do Mutange",
    starters: [
      "Nivaldo",
      "Luciano",
      "Carlos Alberto",
      "Alex Martins",
      "Ramon",
      "Edílson",
      "Washington",
      "Geninho",
      "Lino",
      "Cleiton Xavier",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Washington", in: "Alexsandro" },
      { out: "Cleiton Xavier", in: "Renatinho" },
      { out: "Cristiano Alagoano", in: "Marlon" },
    ],
    oppGoals: [{ name: "Nélio" }, { name: "Morgado" }],
  },
  {
    date: "2001-10-18",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio do Mutange",
    starters: [
      "Nivaldo",
      "Luciano",
      "Carlos Alberto",
      "Alex Martins",
      "Juninho",
      "Erivaldo",
      "Leandro",
      "Cleiton Xavier",
      "Bruno Alves",
      "Cristiano Alagoano",
      "Washington",
    ],
    subs: [
      { out: "Luciano", in: "Anderson La Bamba" },
      { out: "Bruno Alves", in: "Ramon" },
      { out: "Washington", in: "Alexsandro" },
    ],
    csaGoals: [{ name: "Cleiton Xavier" }],
  },
  {
    date: "2001-10-28",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio do Mutange",
    starters: [
      "Santos",
      "Anderson La Bamba",
      "Carlos Alberto",
      "Alex Martins",
      "Juninho",
      "Erivaldo",
      "Geninho",
      "Cleiton Xavier",
      "Lino",
      "Renatinho",
      "Alexsandro",
    ],
    subs: [
      { out: "Anderson La Bamba", in: "Edmílson" },
      { out: "Alexsandro", in: "Marlon" },
    ],
    csaGoals: [
      { name: "Marlon" },
      { name: "Alexsandro" },
      { name: "Cleiton Xavier" },
    ],
  },
];

/** Copa do Brasil related legs */
export const RELATED_PAIRS = [["2001-04-04", "2001-04-11"]];
