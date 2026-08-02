/**
 * CSA Copa do Brasil 2002 + Série C 2002 — complementary sheets (CSA-only).
 *
 * CdB: classificado vs Moto (4x1) e Ceará (3x2); eliminado pelo Vasco nas oitavas (5x2).
 * Série C: avançou vs Treze (6x2); eliminado pelo ABC na 3ª fase (8x1).
 * Sem técnico citado na fonte.
 *
 * Notas:
 * - 27/03 Vasco: fonte lista 10 titulares (falta 1); gravado como está.
 * - Pedrinho (27/03) → Pedrinho Maradona.
 * - 15/09 "Cristiano" (lateral/zaga) ≠ Cristiano Alagoano; 20/10 atacante = Alagoano.
 * - 02/09: Jaelson CSA e Jaelson Corinthians-AL são jogadores diferentes.
 * - 09/10 Treze: Presidente Vargas em Campina Grande (não o de Fortaleza).
 */
export const SEASON = "2002";

/** @type {Record<string, { competition: string, phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2002-02-14": { competition: "Copa do Brasil", phase: "1ª Fase", round: "Ida" },
  "2002-02-20": { competition: "Copa do Brasil", phase: "1ª Fase", round: "Volta" },
  "2002-03-06": { competition: "Copa do Brasil", phase: "2ª Fase", round: "Ida" },
  "2002-03-14": { competition: "Copa do Brasil", phase: "2ª Fase", round: "Volta" },
  "2002-03-27": {
    competition: "Copa do Brasil",
    phase: "Oitavas de Final",
    round: "Ida",
  },
  "2002-04-03": {
    competition: "Copa do Brasil",
    phase: "Oitavas de Final",
    round: "Volta",
  },
  "2002-08-25": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "1",
  },
  "2002-09-02": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "2",
  },
  "2002-09-08": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "3",
  },
  "2002-09-15": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "4",
  },
  "2002-09-21": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "5",
  },
  "2002-09-28": {
    competition: "Campeonato Brasileiro Série C",
    phase: "1ª Fase",
    round: "6",
  },
  "2002-10-04": {
    competition: "Campeonato Brasileiro Série C",
    phase: "2ª Fase",
    round: "Ida",
  },
  "2002-10-09": {
    competition: "Campeonato Brasileiro Série C",
    phase: "2ª Fase",
    round: "Volta",
  },
  "2002-10-13": {
    competition: "Campeonato Brasileiro Série C",
    phase: "3ª Fase",
    round: "Ida",
  },
  "2002-10-20": {
    competition: "Campeonato Brasileiro Série C",
    phase: "3ª Fase",
    round: "Volta",
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
 *   attendance?: number|null,
 *   grossRevenue?: number|null,
 *   grossRevenueText?: string|null,
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
    date: "2002-02-14",
    competition: "Copa do Brasil",
    stadium: "Estádio Nhozinho Santos",
    csaGoals: [{ name: "Cristiano Alagoano" }, { name: "Toninho" }],
    oppGoals: [{ name: "Zé Raimundo" }],
  },
  {
    date: "2002-02-20",
    competition: "Copa do Brasil",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Toninho" }, { name: "Cristiano Alagoano" }],
  },
  {
    date: "2002-03-06",
    competition: "Copa do Brasil",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    date: "2002-03-14",
    competition: "Copa do Brasil",
    stadium: "Estádio Presidente Vargas",
    csaGoals: [
      { name: "Rubiano" },
      { name: "Marco Aurélio" },
      { name: "Cristiano Alagoano" },
    ],
  },
  {
    date: "2002-03-27",
    competition: "Copa do Brasil",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Marco Antônio Sampaio",
    attendance: 20265,
    grossRevenue: 155650,
    grossRevenueText: "R$ 155.650,00",
    // Fonte lista 10 titulares
    starters: [
      "Santos",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Bartô",
      "Geninho",
      "Rubiano",
      "Cleiton Xavier",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Rubiano", in: "Lino" },
      { out: "Cleiton Xavier", in: "Pedrinho Maradona" },
    ],
    csaGoals: [{ name: "Rubiano" }, { name: "Cleiton Xavier" }],
    oppGoals: [{ name: "Felipe" }],
  },
  {
    date: "2002-04-03",
    competition: "Copa do Brasil",
    stadium: "São Januário",
    oppGoals: [
      { name: "Euller" },
      { name: "Léo Lima" },
      { name: "Romário" },
      { name: "Romário" },
    ],
  },

  // —— Série C 1ª Fase ——
  {
    date: "2002-08-25",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Lourival Batista",
    starters: [
      "Santos",
      "Luciano",
      "Rogério Gaúcho",
      "Sinval",
      "Betinho",
      "Jaelson",
      "Williams",
      "Souza",
      "Bruno Alves",
      "Luciano Paulista",
      "Moisés",
    ],
    subs: [
      { out: "Betinho", in: "Ramon" },
      { out: "Luciano Paulista", in: "Rogério" },
    ],
    csaGoals: [{ name: "Luciano Paulista" }],
  },
  {
    date: "2002-09-02",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Jaelson" }, { name: "Luciano Paulista" }],
    oppGoals: [{ name: "Jaelson" }],
  },
  {
    date: "2002-09-08",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Lourival Batista",
    starters: [
      "Santos",
      "Luciano",
      "Rogério Gaúcho",
      "Sinval",
      "Betinho",
      "Jaelson",
      "Edmílson",
      "Souza",
      "Williams",
      "Rogério",
      "Moisés",
    ],
    subs: [
      { out: "Souza", in: "Vagner" },
      { out: "Williams", in: "Alexsandro" },
      { out: "Rogério", in: "Bruno Alves" },
    ],
    csaGoals: [{ name: "Alexsandro" }],
  },
  {
    date: "2002-09-15",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Cristiano",
      "Rogério Gaúcho",
      "Sinval",
      "Betinho",
      "Jaelson",
      "Edmílson",
      "Souza",
      "Williams",
      "Alexsandro",
      "Moisés",
    ],
    subs: [
      { out: "Cristiano", in: "Da Silva" },
      { out: "Williams", in: "Bruno Alves" },
      { out: "Moisés", in: "Rogério Carioca" },
    ],
    csaGoals: [{ name: "Alexsandro" }],
    oppGoals: [{ name: "Antônio Carlos" }],
  },
  {
    date: "2002-09-21",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Nelson Peixoto Feijó",
    csaGoals: [{ name: "Souza" }],
  },
  {
    date: "2002-09-28",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Rogério Gaúcho" }, { name: "Luciano Paulista" }],
  },

  // —— Série C 2ª Fase ——
  {
    date: "2002-10-04",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Moisés" },
      { name: "Rogério Carioca" },
      { name: "Rogério Carioca" },
      { name: "Souza" },
      { name: "Jaelson" },
      { name: "Cristiano Alagoano" },
    ],
    oppGoals: [{ name: "Anderson" }],
  },
  {
    date: "2002-10-09",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Presidente Vargas (Campina Grande)",
    oppGoals: [{ name: "Nunes" }],
  },

  // —— Série C 3ª Fase ——
  {
    date: "2002-10-13",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Luciano",
      "Carlos Alberto",
      "Robson",
      "Ramon",
      "Jaelson",
      "Edmílson",
      "Vagner",
      "Moisés",
      "Cristiano Alagoano",
      "Rogério Carioca",
    ],
    subs: [
      { out: "Luciano", in: "Da Silva" },
      { out: "Ramon", in: "Williams" },
      { out: "Vagner", in: "Jackson" },
    ],
    oppGoals: [
      { name: "Márcio Cardoso" },
      { name: "Márcio Cardoso" },
      { name: "Fábio Silva" },
      { name: "Joãozinho" },
    ],
  },
  {
    date: "2002-10-20",
    competition: "Campeonato Brasileiro Série C",
    stadium: "Machadão",
    starters: [
      "Santos",
      "Luciano",
      "Rogério Gaúcho",
      "Sinval",
      "Ramon",
      "Jaelson",
      "Edmílson",
      "Souza",
      "Moisés",
      "Cristiano Alagoano",
      "Rogério Carioca",
    ],
    subs: [
      { out: "Ramon", in: "Bruno Alves" },
      { out: "Edmílson", in: "Jackson" },
      { out: "Rogério Carioca", in: "Luciano Paulista" },
    ],
    csaGoals: [{ name: "Jackson" }],
    oppGoals: [
      { name: "Joãozinho" },
      { name: "Joãozinho" },
      { name: "Leonardo" },
      { name: "Fábio Silva" },
    ],
  },
];

/** Ida/volta pairs: { competition, dates: [ida, volta] } */
export const RELATED_PAIRS = [
  { competition: "Copa do Brasil", dates: ["2002-02-14", "2002-02-20"] },
  { competition: "Copa do Brasil", dates: ["2002-03-06", "2002-03-14"] },
  { competition: "Copa do Brasil", dates: ["2002-03-27", "2002-04-03"] },
  {
    competition: "Campeonato Brasileiro Série C",
    dates: ["2002-10-04", "2002-10-09"],
  },
  {
    competition: "Campeonato Brasileiro Série C",
    dates: ["2002-10-13", "2002-10-20"],
  },
];
