/**
 * CSA Alagoano 2002 — complementary sheets (CSA-only).
 * CSA e CRB entraram direto na 2ª fase (bye na 1ª).
 * CRB campeão; CSA vice (RSSSF).
 *
 * Notas:
 * - 05/05 Capela 1x2: fonte diz "Capitão (2x) e Geraldo — todos CSA",
 *   mas o placar é 1x2 → Capitão (2) CSA; Geraldo = Capela.
 * - 09/06: fonte lista "Ramon" duas vezes no XI; gravado como está
 *   (2º Ramon colide no mesmo player_id e é ignorado no insert).
 * - 24/04 gol "Goiano" → Juninho Goiano.
 */
export const SEASON = "2002";
export const COMPETITION_NAME = "Campeonato Alagoano";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2002-04-21": { phase: "2ª Fase", round: null },
  "2002-04-24": { phase: "2ª Fase", round: null },
  "2002-04-28": { phase: "2ª Fase", round: null },
  "2002-05-01": { phase: "2ª Fase", round: null },
  "2002-05-05": { phase: "2ª Fase", round: null },
  "2002-05-08": { phase: "2ª Fase", round: null },
  "2002-05-11": { phase: "2ª Fase", round: null },
  "2002-05-16": { phase: "2ª Fase", round: null },
  "2002-05-19": { phase: "2ª Fase", round: null },
  "2002-05-22": { phase: "2ª Fase", round: null },
  "2002-05-26": { phase: "2ª Fase", round: null },
  "2002-05-30": { phase: "2ª Fase", round: null },
  "2002-06-02": { phase: "2ª Fase", round: null },
  "2002-06-09": { phase: "2ª Fase", round: null },
  "2002-06-12": { phase: "Fase Final", round: null },
  "2002-06-16": { phase: "Fase Final", round: null },
  "2002-06-19": { phase: "Fase Final", round: null },
  "2002-06-23": { phase: "Fase Final", round: null },
  "2002-06-27": { phase: "Fase Final", round: null },
  "2002-06-29": { phase: "Fase Final", round: null },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean, ownGoalAgainst?: boolean, ownGoalFor?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  // —— 2ª Fase ——
  {
    date: "2002-04-21",
    stadium: "Estádio Nélson Peixoto (Nelsão)",
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
      { out: "Rubiano", in: "Ramon" },
      { out: "Cleiton Xavier", in: "Lino" },
      { out: "Toninho", in: "Léo" },
    ],
    csaGoals: [{ name: "Cristiano Alagoano" }],
    oppGoals: [{ name: "Damon" }],
  },
  {
    date: "2002-04-24",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Juninho Goiano" },
      { name: "André" },
      { name: "Toninho" },
      { name: "Toninho" },
    ],
    oppGoals: [{ name: "Alexsandro" }],
  },
  {
    date: "2002-04-28",
    stadium: "Estádio Alfredo Leahy",
    starters: [
      "Santos",
      "Souza",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Capitão Alagoano",
      "Alexandre",
      "Toninho",
      "André",
    ],
    subs: [
      { out: "Bartô", in: "Ângelo" },
      { out: "Alexandre", in: "Lino" },
      { out: "Toninho", in: "Léo" },
    ],
    csaGoals: [
      { name: "André" },
      { name: "André" },
      { name: "Márcio Pereira" },
    ],
  },
  {
    date: "2002-05-01",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Ângelo",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Souza",
      "Alexandre",
      "Thiago",
      "André",
    ],
    subs: [
      { out: "Ângelo", in: "Toninho" },
      { out: "Thiago", in: "Capitão Alagoano" },
      { out: "André", in: "Lino" },
    ],
  },
  {
    date: "2002-05-05",
    stadium: "Manoel Moreira",
    starters: [
      "Santos",
      "Ângelo",
      "Carlos",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Borçato",
      "Souza",
      "Capitão Alagoano",
      "André",
    ],
    subs: [
      { out: "Bartô", in: "Alexandre" },
      { out: "Capitão Alagoano", in: "Thiago" },
      { out: "André", in: "Toninho" },
    ],
    csaGoals: [{ name: "Capitão" }, { name: "Capitão" }],
    oppGoals: [{ name: "Geraldo" }],
  },
  {
    date: "2002-05-08",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "André" },
      { name: "André" },
      { name: "André" },
      { name: "Thiago" },
      { name: "Da Silva" },
      { name: "Escurinho", ownGoalFor: true },
    ],
  },
  {
    date: "2002-05-11",
    // placar only
  },
  {
    date: "2002-05-16",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Capitão" },
      { name: "Toninho" },
      { name: "Capitão", ownGoalAgainst: true },
    ],
    oppGoals: [{ name: "Moisés" }],
  },
  {
    date: "2002-05-19",
    stadium: "Estádio José Gomes da Costa",
    starters: [
      "Santos",
      "Soares",
      "Márcio Pereira",
      "Bartô",
      "Ramon",
      "Capitão",
      "Leandro",
      "Souza",
      "Toninho",
      "Cristiano Alagoano",
      "Capitão Alagoano",
    ],
    subs: [
      { out: "Leandro", in: "Carlos Alberto" },
      { out: "Toninho", in: "Borçato" },
      { out: "Capitão Alagoano", in: "Lino" },
    ],
    csaGoals: [
      { name: "Capitão Alagoano" },
      { name: "Márcio Pereira" },
    ],
    oppGoals: [
      { name: "Betinho" },
      { name: "Rogério" },
      { name: "Rogério" },
    ],
  },
  {
    date: "2002-05-22",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Capitão" }],
  },
  {
    date: "2002-05-26",
    stadium: "Coaracy da Mata (Fumeirão)",
    starters: [
      "Santos",
      "Soares",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Souza",
      "Leandro",
      "Toninho",
      "Cristiano Alagoano",
      "Capitão Alagoano",
    ],
    subs: [{ out: "Toninho", in: "Lino" }],
    csaGoals: [{ name: "Toninho" }],
  },
  {
    date: "2002-05-30",
    // placar only
  },
  {
    date: "2002-06-02",
    stadium: "Estádio Edvanil Navarro",
    starters: [
      "Santos",
      "Souza",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Lino",
      "Toninho",
      "Cristiano Alagoano",
      "Capitão Alagoano",
    ],
    subs: [
      { out: "Lino", in: "André" },
      { out: "Toninho", in: "Alexandre" },
    ],
    csaGoals: [{ name: "Cristiano Alagoano" }],
    oppGoals: [
      { name: "Pera" },
      { name: "Wílson" },
      { name: "Fabinho Silva" },
    ],
  },
  {
    date: "2002-06-09",
    stadium: "Estádio Rei Pelé (Trapichão)",
    // Fonte lista Ramon duas vezes (LB + meio); 2º colide no mesmo id
    starters: [
      "Santos",
      "Bartô",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Souza",
      "Capitão",
      "Lino",
      "Ramon",
      "Cristiano Alagoano",
      "André",
    ],
    subs: [
      { out: "Lino", in: "Alisson" },
      { out: "Ramon", in: "Juninho" },
      { out: "André", in: "Capitão Alagoano" },
    ],
    csaGoals: [{ name: "Lino" }, { name: "Souza" }],
  },

  // —— Fase Final ——
  {
    date: "2002-06-12",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "André" },
      { name: "Márcio Pereira" },
    ],
  },
  {
    date: "2002-06-16",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Souza",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Leandro",
      "Lino",
      "Cristiano Alagoano",
      "André",
    ],
    subs: [
      { out: "Souza", in: "Soares" },
      { out: "Lino", in: "Juninho Goiano" },
    ],
    csaGoals: [{ name: "André" }, { name: "Capitão" }],
  },
  {
    date: "2002-06-19",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Alex Martins" }],
    oppGoals: [
      { name: "Fernando César" },
      { name: "Fabrício" },
    ],
  },
  {
    date: "2002-06-23",
    stadium: "Estádio Nélson Peixoto (Nelsão)",
    starters: [
      "Santos",
      "Jacó",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Leandro",
      "Lino",
      "Cristiano Alagoano",
      "André",
    ],
    subs: [
      { out: "Ramon", in: "Juninho Goiano" },
      { out: "Cristiano Alagoano", in: "Valdo" },
      { out: "André", in: "Alisson" },
    ],
    csaGoals: [{ name: "Capitão" }],
  },
  {
    date: "2002-06-27",
    stadium: "Estádio José Gomes da Costa",
    starters: [
      "Santos",
      "Jacó",
      "Márcio Pereira",
      "Alex Martins",
      "Ramon",
      "Capitão",
      "Bartô",
      "Leandro",
      "Valdo",
      "Cristiano Alagoano",
      "André",
    ],
    subs: [
      { out: "Jacó", in: "Edmílson" },
      { out: "Valdo", in: "Souza" },
      { out: "André", in: "Capitão Alagoano" },
    ],
    csaGoals: [{ name: "Cristiano Alagoano" }],
    oppGoals: [{ name: "Rogério" }],
  },
  {
    date: "2002-06-29",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Bartô",
      "Márcio Pereira",
      "Alex Martins",
      "Souza",
      "Capitão",
      "Leandro",
      "Lino",
      "Juninho Goiano",
      "Cristiano Alagoano",
      "André",
    ],
    subs: [
      { out: "Leandro", in: "Capitão Alagoano" },
      { out: "Lino", in: "Soares" },
      { out: "André", in: "Valdo" },
    ],
    oppGoals: [{ name: "Marcelinho" }, { name: "Calixto" }],
  },
];
