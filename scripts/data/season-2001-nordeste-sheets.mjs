/**
 * CSA Copa do Nordeste / Campeonato do Nordeste 2001 — complementary sheets (CSA-only).
 * 15 jogos da 1ª fase. Sem técnico citado na fonte do usuário.
 *
 * 14/04 Vitória: estádio Barradão + escalação a partir de Blog do Marcão
 * (texto do usuário só tinha gols; campo do estádio em branco).
 */
export const SEASON = "2001";
export const COMPETITION_NAME = "Copa do Nordeste";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2001-01-17": { phase: "1ª Fase", round: "1" },
  "2001-01-25": { phase: "1ª Fase", round: "2" },
  "2001-02-01": { phase: "1ª Fase", round: "3" },
  "2001-02-07": { phase: "1ª Fase", round: "4" },
  "2001-02-11": { phase: "1ª Fase", round: "5" },
  "2001-02-15": { phase: "1ª Fase", round: "6" },
  "2001-02-22": { phase: "1ª Fase", round: "7" },
  "2001-02-28": { phase: "1ª Fase", round: "8" },
  "2001-03-04": { phase: "1ª Fase", round: "9" },
  "2001-03-11": { phase: "1ª Fase", round: "10" },
  "2001-03-17": { phase: "1ª Fase", round: "11" },
  "2001-03-26": { phase: "1ª Fase", round: "12" },
  "2001-04-01": { phase: "1ª Fase", round: "13" },
  "2001-04-08": { phase: "1ª Fase", round: "14" },
  "2001-04-14": { phase: "1ª Fase", round: "15" },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean, ownGoalAgainst?: boolean, ownGoalFor?: boolean }} Goal
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
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "2001-01-17",
    stadium: "Estádio Rei Pelé (Trapichão)",
    oppGoals: [{ name: "Mazinho" }],
  },
  {
    date: "2001-01-25",
    stadium: "Estádio Ilha do Retiro",
  },
  {
    date: "2001-02-01",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Bruno Alves" }],
    oppGoals: [{ name: "Rocha" }],
  },
  {
    date: "2001-02-07",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Cristiano Alagoano" }],
  },
  {
    date: "2001-02-11",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Marlon Reinoldson do Nascimento",
    attendance: 7114,
    grossRevenue: 27062,
    grossRevenueText: "R$ 27.061,50",
    starters: [
      "Luís Carlos",
      "Alex",
      "Da Silva",
      "Caçapa",
      "Ramon",
      "Alisson",
      "Edílson",
      "Bruno Alves",
      "Geninho",
      "Cristiano Alagoano",
      "Alexsandro",
    ],
    subs: [
      { out: "Alex", in: "Mazinho" },
      { out: "Bruno Alves", in: "Rossi" },
      { out: "Alexsandro", in: "Fábio Magrão" },
    ],
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Cristiano Alagoano" },
    ],
  },
  {
    date: "2001-02-15",
    stadium: "Estádio Rei Pelé (Trapichão)",
    oppGoals: [{ name: "Marciano" }, { name: "Bartô" }],
  },
  {
    date: "2001-02-22",
    stadium: "Estádio Lourival Batista",
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Fábio Magrão" },
    ],
  },
  {
    date: "2001-02-28",
    stadium: "Estádio dos Aflitos",
    oppGoals: [
      { name: "Vital" },
      { name: "Torato" },
      { name: "Dorgival" },
    ],
  },
  {
    date: "2001-03-04",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Emerson Sobral",
    attendance: 2097,
    grossRevenue: 7990,
    grossRevenueText: "R$ 7.990,00",
    starters: [
      "Luís Carlos",
      "Alex",
      "Da Silva",
      "Caçapa",
      "Ramon",
      "Geninho",
      "Edílson",
      "Fábio Magrão",
      "Bruno Alves",
      "Wilson",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Geninho", in: "Erivaldo" },
      { out: "Fábio Magrão", in: "Toninho" },
      { out: "Wilson", in: "Alexsandro" },
    ],
    csaGoals: [
      { name: "Bruno Alves" },
      { name: "Bruno Alves" },
      { name: "Cristiano Alagoano" },
    ],
    oppGoals: [{ name: "Osmar" }, { name: "Telmo" }],
  },
  {
    date: "2001-03-11",
    stadium: "Estádio Almeidão",
    starters: [
      "Luís Carlos",
      "Edílson",
      "Da Silva",
      "Caçapa",
      "Ramon",
      "Alisson",
      "Fábio Magrão",
      "Bruno Alves",
      "Geninho",
      "Wilson",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Alisson", in: "Erivaldo" },
      { out: "Bruno Alves", in: "Toninho" },
      { out: "Geninho", in: "Robson" },
    ],
    csaGoals: [{ name: "Geninho" }, { name: "Wilson" }],
    oppGoals: [{ name: "Batistinha" }],
  },
  {
    date: "2001-03-17",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    date: "2001-03-26",
    stadium: "Estádio Presidente Vargas",
    csaGoals: [{ name: "Bruno Alves" }, { name: "Fabinho Silva" }],
    oppGoals: [
      { name: "Esquerdinha" },
      { name: "Zezinho" },
      { name: "Zezinho" },
    ],
  },
  {
    date: "2001-04-01",
    stadium: "Machadão",
    csaGoals: [{ name: "Geninho" }],
    oppGoals: [{ name: "Dias" }, { name: "Helinho" }],
  },
  {
    date: "2001-04-08",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Luís Carlos",
      "Alex",
      "Da Silva",
      "Caçapa",
      "Ramon",
      "Alisson",
      "Fábio Magrão",
      "Bruno Alves",
      "Fabinho Silva",
      "Wilson",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Bruno Alves", in: "Claudinei" },
      { out: "Fabinho Silva", in: "Fabiano" },
      { out: "Cristiano Alagoano", in: "Alexsandro" },
    ],
    csaGoals: [{ name: "Fabiano" }],
    oppGoals: [{ name: "Cacaio" }],
  },
  // Blog do Marcão: Barradão; gols CSA Fabiano (2); técnico Cláudio Adão não gravado (fora do texto do usuário)
  {
    date: "2001-04-14",
    stadium: "Estádio Barradão",
    starters: [
      "Luís Carlos",
      "Alex",
      "Erivaldo",
      "Claudinei",
      "Juninho",
      "Caçapa",
      "Alisson",
      "Fabiano",
      "Fábio Magrão",
      "Toninho",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Erivaldo", in: "Geninho" },
      { out: "Alisson", in: "Robson" },
      { out: "Toninho", in: "Fabinho Silva" },
    ],
    csaGoals: [{ name: "Fabiano" }, { name: "Fabiano" }],
    oppGoals: [
      { name: "Leílton" },
      { name: "Chiquinho" },
      { name: "Fabiano" },
    ],
  },
];
