/**
 * CSA Alagoano 1999 — complementary sheets from match reports.
 * Only fields present in source; missing = omitted.
 * CSA campeão alagoano 1999.
 */
export const SEASON = "1999";
export const COMPETITION_NAME = "Campeonato Alagoano";

/**
 * Corrections vs stub rows (date/score/stadium/phase).
 * Score is always CSA goals_for / goals_against.
 */
export const MATCH_FIXES = {
  "1999-02-28": {
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  "1999-03-07": {
    phase: "1ª Fase",
    stadium: "João Batista",
    goalsFor: 0,
    goalsAgainst: 1,
  },
  "1999-03-14": {
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  "1999-03-21": {
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  "1999-03-27": {
    phase: "1ª Fase",
    // estádio não informado — não sobrescrever
  },
  "1999-04-04": {
    phase: "1ª Fase",
    stadium: "Estádio Elísio da Silva Maia",
  },
  "1999-04-12": {
    phase: "1ª Fase",
    stadium: "Estádio do Mutange",
    attendance: 1056,
    revenueText: "R$ 2.926,50",
  },
  "1999-04-18": {
    phase: "1ª Fase",
    stadium: "Estádio do Mutange",
  },
  // stub was 1999-04-26
  "1999-04-26": {
    newDate: "1999-04-25",
    phase: "1ª Fase",
    stadium: "Coaracy da Mata (Fumeirão)",
  },
  "1999-05-02": {
    phase: "1ª Fase",
    stadium: "Estádio do Mutange",
  },
  "1999-05-10": {
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  "1999-05-16": {
    phase: "1ª Fase",
    stadium: "Estádio Manoel Ferreira de Amorim (Ferreirão)",
  },
  "1999-05-23": {
    phase: "1ª Fase",
    stadium: "Estádio do Mutange",
  },
  // stub was 1999-05-25
  "1999-05-25": {
    newDate: "1999-05-30",
    phase: "1ª Fase",
    stadium: "Teotônio Vilela",
  },
  "1999-06-06": {
    phase: "1ª Fase",
  },
  "1999-06-12": {
    phase: "1ª Fase",
  },
  "1999-06-20": {
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  "1999-06-23": {
    phase: "1ª Fase",
    stadium: "Estádio Juca Sampaio",
  },
  "1999-06-27": {
    phase: "1ª Fase",
    stadium: "Manoel Moreira",
  },
  "1999-07-01": {
    phase: "1ª Fase",
  },
  "1999-07-04": {
    phase: "1ª Fase",
    stadium: "Estádio José Gomes da Costa",
  },
  "1999-07-10": {
    phase: "1ª Fase",
  },
  "1999-07-15": {
    phase: "Semifinal",
    round: "Ida",
    stadium: "Estádio Rei Pelé (Trapichão)",
    goalsFor: 2,
    goalsAgainst: 1,
  },
  "1999-07-17": {
    phase: "Semifinal",
    round: "Volta",
    stadium: "Estádio do Mutange",
  },
  "1999-07-24": {
    phase: "Final",
    round: "1º jogo",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  "1999-07-27": {
    phase: "Final",
    round: "2º jogo",
    stadium: "Estádio Manoel Ferreira de Amorim (Ferreirão)",
  },
  "1999-07-31": {
    phase: "Final",
    round: "3º jogo",
    stadium: "Estádio Manoel Ferreira de Amorim (Ferreirão)",
  },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean, ownGoalFor?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   referee?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   oppStarters?: string[],
 *   oppSubs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "1999-02-28",
    csaGoals: [{ name: "Willams Souza" }, { name: "Genílson" }],
    oppGoals: [{ name: "Murilo" }, { name: "Neto" }, { name: "Valmir" }],
  },
  {
    date: "1999-03-07",
    oppGoals: [{ name: "Ronaldo" }],
  },
  {
    date: "1999-03-14",
    csaGoals: [{ name: "Luiz Carlos" }],
    oppGoals: [{ name: "Vladimir" }],
  },
  {
    date: "1999-03-21",
    csaGoals: [{ name: "Willian" }],
  },
  // 1999-03-27 Zumbi — só placar
  {
    date: "1999-04-04",
    csaGoals: [{ name: "Mimi" }, { name: "Willian" }],
    oppGoals: [{ name: "Gílson" }],
  },
  {
    date: "1999-04-12",
    referee: "Pedro di Grande",
    starters: [
      "Wanderley",
      "Souza",
      "Fabinho",
      "Givaldo",
      "Williams",
      "Willian",
      "Jeferson",
      "Otávio",
      "Everaldo",
      "Naílson",
      "Mimi",
    ],
    subs: [
      { out: "Jeferson", in: "Léo" },
      { out: "Mimi", in: "Luís Carlos" },
    ],
    oppStarters: [
      "Taffarel",
      "Eládio",
      "Ricardo",
      "Laélson",
      "Nilton",
      "Dudu",
      "Fio",
      "Roberto",
      "Valdo",
      "Rógenes",
      "Nildo",
    ],
    oppSubs: [{ out: "Nildo", in: "Adriano" }],
    csaGoals: [{ name: "Otávio" }, { name: "Mimi" }],
  },
  {
    date: "1999-04-18",
    csaGoals: [{ name: "Willian" }],
  },
  {
    date: "1999-04-25",
    csaGoals: [{ name: "Leonardo" }],
    oppGoals: [{ name: "Nem" }],
  },
  {
    date: "1999-05-02",
    csaGoals: [{ name: "Naílson" }],
    oppGoals: [{ name: "Cliuton" }],
  },
  {
    date: "1999-05-10",
    referee: "Marlon Reinoldson",
    starters: [
      "Wanderley",
      "Erly",
      "Fabinho",
      "André",
      "Williams",
      "Léo",
      "Willian",
      "Otávio",
      "Everaldo",
      "Naílson",
      "Leonardo",
    ],
    subs: [
      { out: "Willian", in: "Pastor" },
      { out: "Otávio", in: "Fabinho Goiano" },
      { out: "Leonardo", in: "Luís Carlos" },
    ],
    oppStarters: [
      "Luna",
      "Soares",
      "Beto",
      "China",
      "Chico",
      "Charles",
      "Adílson",
      "Jean",
      "Fúlvio",
      "Val",
      "Tuta",
    ],
    oppSubs: [
      { out: "Adílson", in: "Marco Aurélio" },
      { out: "Jean", in: "Rodrigo Carioca" },
      { out: "Val", in: "Adriano" },
    ],
    csaGoals: [{ name: "Everaldo" }],
    oppGoals: [{ name: "Beto" }],
  },
  {
    date: "1999-05-16",
    csaGoals: [{ name: "Williams" }],
    oppGoals: [{ name: "Toni" }],
  },
  {
    date: "1999-05-23",
    csaGoals: [{ name: "Naílson" }, { name: "Naílson" }, { name: "Otávio" }],
    oppGoals: [{ name: "Leu" }],
  },
  {
    date: "1999-05-30",
    csaGoals: [{ name: "Willams" }, { name: "Reinaldo" }, { name: "Willian" }],
    oppGoals: [{ name: "Paulinho" }],
  },
  // 1999-06-06 / 06-12 / 07-01 / 07-10 / 07-17 / 07-31 — sem gols detalhados
  {
    date: "1999-06-20",
    csaGoals: [
      { name: "Naílson" },
      { name: "Otávio" },
      { name: "Otávio" },
      { name: "Otávio" },
    ],
  },
  {
    date: "1999-06-23",
    csaGoals: [{ name: "Pastor" }],
    oppGoals: [{ name: "Adriano" }],
  },
  {
    date: "1999-06-27",
    csaGoals: [{ name: "Pastor" }],
    oppGoals: [{ name: "Gílson Jacaré" }],
  },
  {
    date: "1999-07-04",
    csaGoals: [{ name: "Naílson" }],
  },
  {
    date: "1999-07-15",
    csaGoals: [{ name: "Williams" }, { name: "Flávio", ownGoalFor: true }],
    oppGoals: [{ name: "Robinho" }],
  },
  {
    date: "1999-07-24",
    csaGoals: [{ name: "Everaldo" }],
    oppGoals: [{ name: "Murilo" }],
  },
  {
    date: "1999-07-27",
    csaGoals: [
      { name: "Naílson" },
      { name: "Williams" },
      { name: "Williams" },
      { name: "Mimi" },
      { name: "Fabinho Goiano" },
    ],
    oppGoals: [{ name: "Escurinho" }],
  },
];
