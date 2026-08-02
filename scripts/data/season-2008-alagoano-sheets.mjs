/**
 * CSA Alagoano 2008 — complementary sheets (CSA-only).
 * CSA campeão estadual 2008 (agregado 4x3 sobre o ASA na decisão).
 *
 * Datas canônicas = fixtures importadas:
 *   Ipanema 0x3: 2008-03-30 (fonte complementar 28/03)
 *   Decisão 2º turno ida: 2008-04-23 (fonte 24/04)
 *
 * 28/03→30/03 Ipanema: Serginho confirmado CSA (RSSSF: Serginho Baiano, Marciano, Matteus).
 * 04/05 Genílson: fonte rotula “(CSA)”; Genílson era goleiro do ASA — gravado como
 *   gol contra a favor do CSA (RSSSF atribui a Jean Carlo; preferimos o nome da fonte).
 */
export const SEASON = "2008";
export const COMPETITION_NAME = "Campeonato Alagoano";

export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2008-01-13": { phase: "1º Turno", round: "Grupo B" },
  "2008-01-20": { phase: "1º Turno", round: "Grupo B" },
  "2008-01-23": { phase: "1º Turno", round: "Grupo B" },
  "2008-01-26": { phase: "1º Turno", round: "Grupo B" },
  "2008-01-30": { phase: "1º Turno", round: "Grupo B" },
  "2008-02-10": { phase: "1º Turno", round: "Grupo B" },
  "2008-02-13": { phase: "1º Turno", round: "Grupo B" },
  "2008-02-17": { phase: "1º Turno", round: "Grupo B" },
  "2008-02-20": { phase: "1º Turno", round: "Semifinal - Ida" },
  "2008-02-24": { phase: "1º Turno", round: "Semifinal - Volta" },
  "2008-03-11": { phase: "2º Turno", round: "Grupo B" },
  "2008-03-13": { phase: "2º Turno", round: "Grupo B" },
  "2008-03-16": { phase: "2º Turno", round: "Grupo B" },
  "2008-03-23": { phase: "2º Turno", round: "Grupo B" },
  "2008-03-25": { phase: "2º Turno", round: "Grupo B" },
  "2008-03-30": { phase: "2º Turno", round: "Grupo B" },
  "2008-04-06": { phase: "2º Turno", round: "Grupo B" },
  "2008-04-13": { phase: "2º Turno", round: "Grupo B" },
  "2008-04-16": { phase: "2º Turno", round: "Semifinal - Ida" },
  "2008-04-20": { phase: "2º Turno", round: "Semifinal - Volta" },
  "2008-04-23": { phase: "2º Turno", round: "Final - Ida" },
  "2008-04-27": { phase: "2º Turno", round: "Final - Volta" },
  "2008-05-01": { phase: "Decisão", round: "1º jogo" },
  "2008-05-04": { phase: "Decisão", round: "2º jogo" },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean, ownGoalFor?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
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
 *   csaReds?: string[],
 *   oppReds?: string[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  // —— 1º Turno Grupo B ——
  {
    date: "2008-01-13",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Flávio Feijó de Omena",
    attendance: 2533,
    grossRevenue: 16110,
    grossRevenueText: "R$ 16.110,00",
    csaGoals: [
      { name: "Helinho", minute: absMin(1, 36) },
      { name: "Helinho", minute: absMin(1, 39) },
      { name: "Helinho", minute: absMin(2, 3) },
      { name: "Ricardo Miranda", minute: absMin(2, 48) },
    ],
    csaReds: ["Roberto Ramos"],
  },
  {
    date: "2008-01-20",
    stadium: "Estádio Olival Elias de Morais",
    referee: "Fernando Rogério Oliveira Assunção",
    csaGoals: [
      { name: "Paulinho Macaíba", minute: absMin(1, 1) },
      { name: "Toninho", minute: absMin(2, 23) },
      { name: "Thiago Silva", minute: absMin(2, 39) },
    ],
    oppGoals: [
      { name: "Cal", minute: absMin(1, 4) },
      { name: "Paulo Henrique", minute: absMin(1, 6) },
    ],
  },
  {
    date: "2008-01-23",
    stadium: "Estádio Gerson Amaral",
    referee: "Rosivaldo Aureliano",
    csaGoals: [{ name: "Thiago Silva", minute: absMin(2, 49) }],
    oppGoals: [{ name: "Luciano Dias", minute: absMin(1, 43) }],
  },
  {
    date: "2008-01-26",
    stadium: "Estádio José Gomes da Costa",
    referee: "George Alves Feitoza",
    oppGoals: [{ name: "Gilson", minute: absMin(1, 8) }],
  },
  {
    date: "2008-01-30",
    stadium: "Estádio Zequinha Barbosa",
    referee: "Charles Hebert Cavalcante Ferreira",
    csaGoals: [{ name: "Jean Carlo", minute: absMin(1, 24) }],
    oppGoals: [
      { name: "Mendonça", minute: absMin(1, 5) },
      { name: "Jânio", minute: absMin(1, 28) },
    ],
    csaReds: ["Ari"],
    oppReds: ["Mário"],
  },
  {
    date: "2008-02-10",
    stadium: "Estádio Nelson Peixoto Feijó",
    referee: "Rosivaldo Aureliano",
    attendance: 2038,
    grossRevenue: 11020,
    grossRevenueText: "R$ 11.020,00",
    csaGoals: [
      { name: "Ricardo Miranda", minute: absMin(2, 6) },
      { name: "Ricardo Miranda", minute: absMin(2, 14) },
      { name: "Serginho Baiano", minute: absMin(2, 32) },
      { name: "Paulinho Macaíba", minute: absMin(2, 45), penalty: true },
    ],
  },
  {
    date: "2008-02-13",
    stadium: "Pajuçara",
    referee: "Sílvio Acioli dos Santos",
    csaGoals: [
      { name: "Da Silva", minute: absMin(2, 10) },
      { name: "Da Silva", minute: absMin(2, 29) },
    ],
  },
  {
    date: "2008-02-17",
    stadium: "Estádio Nelson Peixoto Feijó",
    referee: "Francisco Carlos Nascimento",
    oppGoals: [
      { name: "Haílton", minute: absMin(1, 30) },
      { name: "Haílton", minute: absMin(2, 25) },
    ],
    csaReds: ["Ari"],
    oppReds: ["Nado"],
  },

  // —— Semifinais 1º Turno ——
  {
    date: "2008-02-20",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Fernando Rogério de Oliveira Assunção",
    csaGoals: [{ name: "Daniel", minute: absMin(1, 7), ownGoalFor: true }],
    oppGoals: [
      { name: "Reinaldo Alagoano", minute: absMin(1, 26) },
      { name: "Irineu", minute: absMin(2, 34) },
    ],
  },
  {
    date: "2008-02-24",
    stadium: "Estádio Nelson Peixoto Feijó",
    referee: "Sílvio Acioli dos Santos",
    grossRevenue: 19692,
    grossRevenueText: "R$ 19.692,00",
    oppGoals: [{ name: "Tozin", minute: absMin(2, 8) }],
  },

  // —— 2º Turno ——
  {
    date: "2008-03-11",
    stadium: "Coaracy da Mata (Fumeirão)",
    referee: "Francisco Carlos Nascimento",
    attendance: 5849,
    grossRevenue: 14426,
    grossRevenueText: "R$ 14.426,00",
    starters: [
      "Gilberto",
      "Deleu",
      "Júnior",
      "Cristiano Fernandes",
      "Marciano",
      "Matteus",
      "Du Cosmo",
      "Magno",
      "Jean Carlo",
      "Serginho Baiano",
      "Paulinho Macaíba",
    ],
    subs: [
      { out: "Magno", in: "Cleisson Rato" },
      { out: "Serginho Baiano", in: "Claudinho" },
      { out: "Paulinho Macaíba", in: "Fagner" },
    ],
    csaGoals: [{ name: "Paulinho Macaíba", minute: absMin(1, 23) }],
  },
  {
    date: "2008-03-13",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Serginho Baiano" },
      { name: "Serginho Baiano" },
    ],
    oppGoals: [{ name: "Reinaldo Alagoano" }],
  },
  {
    date: "2008-03-16",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Carlos José Dantas",
    csaGoals: [
      { name: "Serginho Baiano", minute: absMin(1, 13) },
      { name: "Da Silva", minute: absMin(2, 19) },
      { name: "Serginho Baiano", minute: absMin(2, 24) },
    ],
    oppGoals: [{ name: "Everlan", minute: absMin(2, 8) }],
  },
  {
    date: "2008-03-23",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sílvio Acioli dos Santos",
    manager: "Zé do Carmo",
    grossRevenue: 22820,
    grossRevenueText: "R$ 22.820,00",
    starters: [
      "Gilberto",
      "Deleu",
      "Júnior",
      "Flamarion",
      "Claudinho",
      "Matteus",
      "Ricardo Miranda",
      "Magno",
      "Jean Carlo",
      "Serginho Baiano",
      "Paulinho Macaíba",
    ],
    subs: [
      { out: "Jean Carlo", in: "Cleisson Rato" },
      { out: "Serginho Baiano", in: "Da Silva" },
      { out: "Paulinho Macaíba", in: "Thiago Silva" },
    ],
    csaGoals: [{ name: "Paulinho Macaíba", minute: absMin(1, 5) }],
    oppGoals: [{ name: "Júnior Amorim", minute: absMin(1, 21), penalty: true }],
  },
  {
    date: "2008-03-25",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Charles Hebert Cavalcante Ferreira",
    manager: "Zé do Carmo",
    starters: [
      "Adson",
      "Deleu",
      "Júnior",
      "Flamarion",
      "Marciano",
      "Matteus",
      "Ricardo Miranda",
      "Magno",
      "Jean Carlo",
      "Serginho Baiano",
      "Paulinho Macaíba",
    ],
    subs: [
      { out: "Ricardo Miranda", in: "Cleisson Rato" },
      { out: "Jean Carlo", in: "Thiago Silva" },
      { out: "Paulinho Macaíba", in: "Da Silva" },
    ],
    oppGoals: [{ name: "Washington", minute: absMin(2, 18) }],
  },
  // fonte complementar: 28/03; fixture/RSSSF: 30/03
  {
    date: "2008-03-30",
    stadium: "Estádio Governador Arnon de Mello",
    referee: "George Alves Feitosa",
    csaGoals: [
      { name: "Serginho Baiano", minute: absMin(1, 10) },
      { name: "Marciano", minute: absMin(2, 31) },
      { name: "Matteus", minute: absMin(2, 45) },
    ],
  },
  {
    date: "2008-04-06",
    stadium: "Estádio Nelson Peixoto Feijó",
    referee: "José Elias Santos Filho",
    csaGoals: [
      { name: "Paulinho Macaíba", minute: absMin(1, 27) },
      { name: "Serginho Baiano", minute: absMin(2, 31) },
      { name: "Paulinho Macaíba", minute: absMin(2, 49) },
    ],
    oppGoals: [
      { name: "Reinaldo Alagoano", minute: absMin(1, 32) },
      { name: "Daniel", minute: absMin(1, 34) },
      { name: "Reinaldo Alagoano", minute: absMin(1, 46) },
      { name: "Fábio Neves", minute: absMin(2, 5) },
    ],
    csaReds: ["Serginho Baiano"],
    oppReds: ["Maizena"],
  },
  {
    date: "2008-04-13",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Flávio Feijó de Omena",
    attendance: 5445,
    grossRevenue: 39265.5,
    grossRevenueText: "R$ 39.265,50",
    csaGoals: [{ name: "Paulinho Macaíba", minute: absMin(1, 36) }],
    oppGoals: [{ name: "Júnior Amorim", minute: absMin(2, 26) }],
  },

  // —— Semifinais 2º Turno ——
  {
    date: "2008-04-16",
    stadium: "Estádio Gerson Amaral",
    referee: "George Alves Feitoza",
    attendance: 2490,
    grossRevenue: 6513,
    grossRevenueText: "R$ 6.513,00",
    csaGoals: [
      { name: "Serginho Baiano", minute: absMin(1, 40) },
      { name: "Paulinho Macaíba", minute: absMin(2, 40) },
    ],
    oppGoals: [{ name: "Anderson", minute: absMin(2, 16), penalty: true }],
  },
  {
    date: "2008-04-20",
    stadium: "Estádio Rei Pelé (Trapichão)",
    grossRevenue: 21086.5,
    grossRevenueText: "R$ 21.086,50",
    csaGoals: [{ name: "Ricardo Miranda" }],
    oppGoals: [{ name: "Ivan" }],
  },

  // —— Decisão 2º Turno ——
  // fonte complementar: 24/04; fixture: 23/04
  {
    date: "2008-04-23",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Charles Hebert Cavalcante Ferreira",
    manager: "Flávio Barros",
    attendance: 4771,
    grossRevenue: 34787.5,
    grossRevenueText: "R$ 34.787,50",
    starters: [
      "Gilberto",
      "Deleu",
      "Fábio Lima",
      "Júnior",
      "Marciano",
      "Matteus",
      "Ricardo Miranda",
      "Magno",
      "Jean Carlo",
      "Paulinho Macaíba",
      "Serginho Baiano",
    ],
    subs: [
      { out: "Magno", in: "Du Cosmo" },
      { out: "Jean Carlo", in: "Gil Baiano" },
      { out: "Paulinho Macaíba", in: "Da Silva" },
    ],
    csaGoals: [
      { name: "Jean Carlo", minute: absMin(1, 34) },
      { name: "Paulinho Macaíba", minute: absMin(1, 42) },
      { name: "Gil Baiano", minute: absMin(2, 44) },
    ],
  },
  {
    date: "2008-04-27",
    stadium: "Coaracy da Mata (Fumeirão)",
    referee: "George Alves Feitoza",
    manager: "Flávio Barros",
    attendance: 3357,
    grossRevenue: 17080,
    grossRevenueText: "R$ 17.080,00",
    starters: [
      "Gilberto",
      "Júnior",
      "Flamarion",
      "Cristiano Fernandes",
      "Deleu",
      "Matteus",
      "Magno",
      "Jean Carlo",
      "Marciano",
      "Serginho Baiano",
      "Paulinho Macaíba",
    ],
    subs: [
      { out: "Cristiano Fernandes", in: "Du Cosmo" },
      { out: "Magno", in: "Cleisson Rato" },
      { out: "Jean Carlo", in: "Gil Baiano" },
    ],
    csaGoals: [
      { name: "Paulinho Macaíba", minute: absMin(1, 39) },
      { name: "Serginho Baiano", minute: absMin(2, 30) },
    ],
    oppGoals: [{ name: "Ricardo Boiadeiro", minute: absMin(1, 30) }],
  },

  // —— Decisão do Campeonato ——
  {
    date: "2008-05-01",
    stadium: "Coaracy da Mata (Fumeirão)",
    referee: "Marcelo de Lima Henrique",
    manager: "Flávio Barros",
    attendance: 6310,
    grossRevenue: 27336,
    grossRevenueText: "R$ 27.336,00",
    starters: [
      "Gilberto",
      "Paulinho Macaíba",
      "Deleu",
      "Júnior",
      "Fábio Lima",
      "Marciano",
      "Matteus",
      "Ricardo Miranda",
      "Magno",
      "Serginho Baiano",
      "Jean Carlo",
    ],
    subs: [
      { out: "Paulinho Macaíba", in: "Du Cosmo" },
      { out: "Marciano", in: "Cristiano Fernandes" },
      { out: "Jean Carlo", in: "Gil Baiano" },
    ],
    csaGoals: [
      { name: "Paulinho Macaíba", minute: absMin(1, 33) },
      { name: "Paulinho Macaíba", minute: absMin(2, 30) },
    ],
    oppGoals: [{ name: "Ricardo Boiadeiro", minute: absMin(1, 8) }],
  },
  {
    date: "2008-05-04",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sálvio Spínola Fagundes Filho",
    manager: "Flávio Barros",
    attendance: 10353,
    grossRevenue: 58847.5,
    grossRevenueText: "R$ 58.847,50",
    starters: [
      "Gilberto",
      "Deleu",
      "Júnior",
      "Fábio Lima",
      "Marciano",
      "Matteus",
      "Ricardo Miranda",
      "Magno",
      "Jean Carlo",
      "Serginho Baiano",
      "Paulinho Macaíba",
    ],
    subs: [
      { out: "Magno", in: "Gil Baiano" },
      { out: "Jean Carlo", in: "Cleisson Rato" },
      { out: "Serginho Baiano", in: "Izaías" },
    ],
    csaGoals: [
      { name: "Serginho Baiano", minute: absMin(1, 26) },
      // Genílson = goleiro do ASA; fonte rotula (CSA) → gol contra
      { name: "Genílson", minute: absMin(2, 38), ownGoalFor: true },
    ],
    oppGoals: [
      { name: "Ricardo Boiadeiro", minute: absMin(1, 34) },
      { name: "Mariélson", minute: absMin(1, 38) },
    ],
    csaReds: ["Izaías"],
  },
];

export const RELATED_PAIRS = [
  ["2008-02-20", "2008-02-24"],
  ["2008-04-16", "2008-04-20"],
  ["2008-04-23", "2008-04-27"],
  ["2008-05-01", "2008-05-04"],
];
