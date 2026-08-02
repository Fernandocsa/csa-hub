/**
 * CSA Alagoano 2003 — complementary sheets (CSA-only).
 * CSA 8º/último, rebaixado à 2ª divisão (11 pts, 3V-2E-9D, 17-26).
 *
 * 22/01 Murici: gols adversário conferidos no RSSSF
 * (fonte complementar misturava Corinthians Alagoano).
 */
export const SEASON = "2003";
export const COMPETITION_NAME = "Campeonato Alagoano";

/** Fixture date corrections → canonical date used by sheets */
export const DATE_FIXES = [
  { from: "2003-01-19", to: "2003-01-22" }, // Murici 3x3 (RSSSF / fonte)
  { from: "2003-02-11", to: "2003-02-12" }, // Corinthians 2x3
];

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2003-01-22": { phase: "1º Turno", round: null },
  "2003-01-24": { phase: "1º Turno", round: null },
  "2003-01-26": { phase: "1º Turno", round: null },
  "2003-01-30": { phase: "1º Turno", round: null },
  "2003-02-02": { phase: "1º Turno", round: null },
  "2003-02-06": { phase: "1º Turno", round: null },
  "2003-02-09": { phase: "1º Turno", round: null },
  "2003-02-12": { phase: "2º Turno", round: null },
  "2003-02-16": { phase: "2º Turno", round: null },
  "2003-02-19": { phase: "2º Turno", round: null },
  "2003-02-23": { phase: "2º Turno", round: null },
  "2003-02-26": { phase: "2º Turno", round: null },
  "2003-03-06": { phase: "2º Turno", round: null },
  "2003-03-09": { phase: "2º Turno", round: null },
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
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  // —— 1º Turno ——
  {
    date: "2003-01-22",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Edmílson" },
      { name: "Edmar" },
      { name: "Edmar" },
    ],
    // RSSSF: Rogério (2), Reginaldo — Murici (fonte misturava Corinthians)
    oppGoals: [
      { name: "Reginaldo" },
      { name: "Rogério" },
      { name: "Rogério" },
    ],
  },
  {
    date: "2003-01-24",
    stadium: "Estádio Nélson Peixoto (Nelsão)",
    starters: [
      "Santos",
      "Alex Gomes",
      "Fabiano",
      "Sinval",
      "Ramon",
      "Célio",
      "Edmílson",
      "Sandro",
      "Tiago",
      "Alexsandro",
      "Edmar",
    ],
    subs: [
      { out: "Sandro", in: "Da Silva" },
      { out: "Alexsandro", in: "Juninho" },
      { out: "Edmar", in: "Jorjão" },
    ],
    csaGoals: [{ name: "Edmar" }],
    oppGoals: [{ name: "Elivélton" }],
  },
  {
    date: "2003-01-26",
    stadium: "Estádio Juca Sampaio",
    starters: [
      "Santos",
      "Alex Gomes",
      "Fabiano",
      "Sinval",
      "Ramon",
      "Célio",
      "Edmílson",
      "Tiago",
      "Sandro",
      "Alexsandro",
      "Edmar",
    ],
    subs: [{ out: "Sandro", in: "Jorjão" }],
    oppGoals: [{ name: "Sóstenes" }, { name: "Fuscão" }],
  },
  {
    date: "2003-01-30",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Fernando Rogério",
    // Fonte lista "Juninho" duas vezes; LB = Juninho, ataque = Juninho Paulista
    starters: [
      "Santos",
      "Cristiano",
      "Sinval",
      "Fabiano",
      "Juninho",
      "Edmílson",
      "Célio",
      "Sandro",
      "Tiago",
      "Jorjão",
      "Juninho Paulista",
    ],
    subs: [
      { out: "Sandro", in: "Da Silva" },
      { out: "Jorjão", in: "Misso" },
      { out: "Juninho Paulista", in: "Neto" },
    ],
    oppGoals: [
      { name: "Moisés" },
      { name: "Moisés" },
      { name: "Souza" },
      { name: "Souza" },
    ],
  },
  {
    date: "2003-02-02",
    stadium: "Manoel Moreira",
    referee: "Marlon Reinoldson",
    starters: [
      "Santos",
      "Alex Gomes",
      "Sinval",
      "Fabiano",
      "Ramon",
      "Edmílson",
      "Célio",
      "Da Silva",
      "Tiago",
      "Edmar",
      "Almada",
    ],
    subs: [
      { out: "Edmílson", in: "Neto" },
      { out: "Da Silva", in: "Sandro" },
      { out: "Edmar", in: "Alexsandro" },
    ],
    oppGoals: [{ name: "Rogélio" }],
  },
  {
    date: "2003-02-06",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Tiago" },
      { name: "Da Silva" },
      { name: "Almada" },
      { name: "Edmar" },
      { name: "Edmar" },
    ],
  },
  {
    date: "2003-02-09",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Nílson de Carvalho",
    attendance: 4316,
    grossRevenue: 16688,
    grossRevenueText: "R$ 16.688,00",
    starters: [
      "Santos",
      "Fernando",
      "Sinval",
      "Alex Martins",
      "Ramon",
      "Nélson",
      "Célio",
      "Edmílson",
      "Tiago",
      "Edmar",
      "Jairon",
    ],
    subs: [
      { out: "Ramon", in: "Sandro" },
      { out: "Célio", in: "Da Silva" },
      { out: "Jairon", in: "Cássio" },
    ],
    csaGoals: [{ name: "Nélson" }],
  },

  // —— 2º Turno ——
  {
    date: "2003-02-12",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Nélson" },
      { name: "Juninho Paulista" },
    ],
    oppGoals: [
      { name: "Cássio" },
      { name: "Gláucio" },
      { name: "Luciano Rosa" },
    ],
  },
  {
    date: "2003-02-16",
    stadium: "José Gomes (Murici)",
    starters: [
      "Santos",
      "Fernando",
      "Sinval",
      "Alex Martins",
      "Juninho Alagoano",
      "Nélson",
      "Célio",
      "Tiago",
      "Cássio",
      "Juninho Paulista",
      "Jorjão",
    ],
    subs: [
      { out: "Célio", in: "Sandro" },
      { out: "Tiago", in: "Da Silva" },
      { out: "Jorjão", in: "Neto" },
    ],
    csaGoals: [{ name: "Nélson" }],
    oppGoals: [{ name: "Rogério" }, { name: "Mazinho" }],
  },
  {
    date: "2003-02-19",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Alexsandro" },
      { name: "Tiago" },
    ],
  },
  {
    date: "2003-02-23",
    stadium: "Coaracy da Mata (Fumeirão)",
    starters: [
      "Santos",
      "Cristiano",
      "Fabiano",
      "Alex Martins",
      "Juninho Alagoano",
      "Nélson",
      "Célio",
      "Cássio",
      "Tiago",
      "Alexsandro",
      "Jairon",
    ],
    subs: [
      { out: "Tiago", in: "Da Silva" },
      { out: "Alexsandro", in: "Juninho Paulista" },
    ],
    oppGoals: [
      { name: "Jhonatan" },
      { name: "Moisés" },
      { name: "Moisés" },
    ],
  },
  {
    date: "2003-02-26",
    stadium: "Estádio Rei Pelé (Trapichão)",
    oppGoals: [{ name: "Rogério" }],
  },
  {
    date: "2003-03-06",
    stadium: "Estádio Edvanil Navarro",
    starters: [
      "Santos",
      "Edmílson",
      "Sinval",
      "Bel",
      "Ramon",
      "Anderson La Bamba",
      "Célio",
      "Da Silva",
      "Cássio",
      "Tiago",
      "Jorjão",
    ],
    subs: [
      { out: "Célio", in: "Alexsandro" },
      { out: "Da Silva", in: "Jairon" },
      { out: "Jorjão", in: "Neto" },
    ],
    oppGoals: [
      { name: "Fabinho Silva" },
      { name: "Fabinho Silva" },
    ],
  },
  {
    date: "2003-03-09",
    stadium: "Estádio Rei Pelé (Trapichão)",
    starters: [
      "Santos",
      "Edmílson",
      "Sinval",
      "Alex Martins",
      "Ramon",
      "Nélson",
      "Anderson La Bamba",
      "Cássio",
      "Da Silva",
      "Tiago",
      "Alexsandro",
    ],
    subs: [
      { out: "Sinval", in: "Bel" },
      { out: "Cássio", in: "Jairon" },
      { out: "Da Silva", in: "Sandrinho" },
    ],
    csaGoals: [
      { name: "Nélson" },
      { name: "Alexsandro" },
    ],
    oppGoals: [
      { name: "Binho" },
      { name: "Marcelinho" },
      { name: "Marcelinho" },
      { name: "Reinaldo" },
    ],
  },
];
