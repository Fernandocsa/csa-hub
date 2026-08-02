/**
 * CSA Campeonato do Nordeste / Copa do Nordeste 2002 — complementary sheets (CSA-only).
 * 15 jogos da 1ª fase. Sem técnico; sem tabela/classificação na fonte.
 *
 * Notas:
 * - Marcos Aurélio / Júnior Goiano → Marco Aurélio / Juninho Goiano.
 * - Goiano (gols) → Juninho Goiano.
 * - Alexandro → Alexsandro; Cleiton/Cristiano (14/04) → Cleiton Xavier / Cristiano Alagoano.
 * - 10/03: sub "Toninho (Valdo/Leo)" ambígua na fonte — omitida.
 * - 17/02 CRB no Rei Pelé: home_away corrigido para home (DB estava away).
 */
export const SEASON = "2002";
export const COMPETITION_NAME = "Copa do Nordeste";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2002-01-20": { phase: "1ª Fase", round: "1" },
  "2002-01-27": { phase: "1ª Fase", round: "2" },
  "2002-01-30": { phase: "1ª Fase", round: "3" },
  "2002-02-03": { phase: "1ª Fase", round: "4" },
  "2002-02-09": { phase: "1ª Fase", round: "5" },
  "2002-02-17": { phase: "1ª Fase", round: "6" },
  "2002-02-24": { phase: "1ª Fase", round: "7" },
  "2002-03-02": { phase: "1ª Fase", round: "8" },
  "2002-03-10": { phase: "1ª Fase", round: "9" },
  "2002-03-17": { phase: "1ª Fase", round: "10" },
  "2002-03-20": { phase: "1ª Fase", round: "11" },
  "2002-03-24": { phase: "1ª Fase", round: "12" },
  "2002-03-30": { phase: "1ª Fase", round: "13" },
  "2002-04-07": { phase: "1ª Fase", round: "14" },
  "2002-04-14": { phase: "1ª Fase", round: "15" },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   referee?: string|null,
 *   attendance?: number|null,
 *   grossRevenue?: number|null,
 *   grossRevenueText?: string|null,
 *   homeAway?: 'home'|'away'|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "2002-01-20",
    stadium: "Estádio Presidente Vargas",
    referee: "Cláudio Mercante",
    starters: [
      "Ricardo Gomes",
      "Marco Aurélio",
      "Márcio Pereira",
      "Alex Gomes",
      "Juninho Goiano",
      "Menta",
      "Capitão",
      "Lino",
      "Cleiton Xavier",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Lino", in: "Rubiano" },
      { out: "Cristiano Alagoano", in: "Valdenir" },
    ],
    csaGoals: [{ name: "Cristiano Alagoano" }],
    oppGoals: [{ name: "Daniel Franco" }],
  },
  {
    date: "2002-01-27",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Ricardo Gomes",
      "Marco Aurélio",
      "Márcio Pereira",
      "Alex Martins",
      "Juninho Goiano",
      "Capitão",
      "Menta",
      "Cleiton Xavier",
      "Rubiano",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Menta", in: "Geninho" },
      { out: "Cleiton Xavier", in: "Pedrinho Maradona" },
      { out: "Rubiano", in: "Bartô" },
    ],
    csaGoals: [
      { name: "Toninho" },
      { name: "Cristiano Alagoano" },
      { name: "Cristiano Alagoano" },
    ],
    oppGoals: [{ name: "Cacá" }, { name: "Fabinho" }],
  },
  {
    date: "2002-01-30",
    stadium: "Estádio dos Aflitos",
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Juninho Goiano" },
      { name: "Marco Aurélio" },
    ],
    oppGoals: [
      { name: "Ludemar" },
      { name: "Tupã" },
      { name: "Lima" },
    ],
  },
  {
    date: "2002-02-03",
    stadium: "Estádio do Arruda",
    starters: [
      "Ricardo Gomes",
      "Marco Aurélio",
      "Márcio Pereira",
      "Alex Martins",
      "Juninho Goiano",
      "Capitão",
      "Geninho",
      "Pedrinho Maradona",
      "Rubiano",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Cristiano Alagoano", in: "Alexsandro" },
      { out: "Toninho", in: "Cleiton Xavier" },
    ],
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Cristiano Alagoano" },
    ],
  },
  {
    date: "2002-02-09",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    date: "2002-02-17",
    stadium: "Estádio Rei Pelé (Trapichão)",
    homeAway: "home",
    starters: [
      "Santos",
      "Marco Aurélio",
      "Márcio Pereira",
      "Alex Martins",
      "Juninho Goiano",
      "Capitão",
      "Geninho",
      "Pedrinho Maradona",
      "Rubiano",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Pedrinho Maradona", in: "Cleiton Xavier" },
      { out: "Rubiano", in: "Alexsandro" },
    ],
    csaGoals: [{ name: "Toninho" }],
    oppGoals: [{ name: "Fernando César" }],
  },
  {
    date: "2002-02-24",
    stadium: "Machadão",
    starters: [
      "Santos",
      "Marco Aurélio",
      "Márcio Pereira",
      "Alex Martins",
      "Juninho Goiano",
      "Capitão",
      "Geninho",
      "Rubiano",
      "Cleiton Xavier",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Rubiano", in: "Menta" },
      { out: "Cleiton Xavier", in: "Valdo" },
      { out: "Toninho", in: "Léo" },
    ],
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Geninho" },
      { name: "Cleiton Xavier" },
    ],
    oppGoals: [{ name: "Moreno" }],
  },
  {
    date: "2002-03-02",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Cleiton Xavier" },
      { name: "Cleiton Xavier" },
      { name: "Cristiano Alagoano" },
    ],
  },
  {
    date: "2002-03-10",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Fabiano",
      "Márcio Pereira",
      "Alex Martins",
      "Juninho Goiano",
      "Capitão",
      "Geninho",
      "Rubiano",
      "Cleiton Xavier",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Rubiano", in: "Pedrinho Maradona" },
      // Toninho (Valdo/Leo) — ambígua; omitida
    ],
    csaGoals: [{ name: "Cleiton Xavier" }],
    oppGoals: [{ name: "Jadilson" }],
  },
  {
    date: "2002-03-17",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Marco Aurélio",
      "Márcio Pereira",
      "Alex Martins",
      "Juninho Goiano",
      "Capitão",
      "Geninho",
      "Rubiano",
      "Cleiton Xavier",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Capitão", in: "Alisson" },
      { out: "Cristiano Alagoano", in: "Léo" },
      { out: "Toninho", in: "Pedrinho Maradona" },
    ],
    csaGoals: [
      { name: "Geninho" },
      { name: "Toninho" },
      { name: "Márcio Pereira" },
    ],
  },
  {
    date: "2002-03-20",
    stadium: "Estádio da Fonte Nova",
    csaGoals: [{ name: "Juninho Goiano" }],
    oppGoals: [
      { name: "Nonato" },
      { name: "Róbson" },
      { name: "Róbson" },
      { name: "Preto" },
    ],
  },
  {
    date: "2002-03-24",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Marco Aurélio",
      "Bartô",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Geninho",
      "Rubiano",
      "Pedrinho Maradona",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Rubiano", in: "Eliel" },
      { out: "Pedrinho Maradona", in: "Fabiano" },
    ],
    oppGoals: [{ name: "Arlindo Maracanã" }],
  },
  {
    date: "2002-03-30",
    stadium: "Machadão",
  },
  {
    date: "2002-04-07",
    stadium: "Amigão",
  },
  {
    date: "2002-04-14",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Rubens dos Santos",
    attendance: 4991,
    grossRevenue: 17420,
    grossRevenueText: "R$ 17.420,00",
    starters: [
      "Santos",
      "Marco Aurélio",
      "Márcio Pereira",
      "Edmílson",
      "Juninho Goiano",
      "Capitão",
      "Geninho",
      "Rubiano",
      "Cleiton Xavier",
      "Cristiano Alagoano",
      "Toninho",
    ],
    subs: [
      { out: "Rubiano", in: "Eliel" },
      { out: "Cristiano Alagoano", in: "Léo" },
      { out: "Toninho", in: "Lino" },
    ],
    oppGoals: [{ name: "Sandy" }],
  },
];
