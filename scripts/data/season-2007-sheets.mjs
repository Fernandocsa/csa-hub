/**
 * CSA 2007 — complementary sheets (CSA-only).
 * Campeonato Alagoano 1ª Fase + Copa do Brasil 1ª Fase.
 *
 * Notas:
 * - 14/01 Pires (contra) e 05/03 Cal (contra) = gols a favor via contra (ownGoalFor).
 * - Cleiton / Cleyton → Clayton; Mateus / Matheus / Matteus → Matteus;
 *   Cristiano (ataque) → Cristiano Alagoano; Evaldo → Evaldo Bahia;
 *   Rodney (fonte) / Rodiney (RSSSF).
 * - Técnico Ênio Oliveira só onde a fonte cita (25/02, 14/02, 01/03).
 */
export const SEASON = "2007";

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean, ownGoalAgainst?: boolean, ownGoalFor?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   competition: string,
 *   date: string,
 *   phase?: string,
 *   round?: string|null,
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
  // —— Alagoano ——
  {
    competition: "Campeonato Alagoano",
    date: "2007-01-14",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Pires", ownGoalFor: true }],
    oppGoals: [{ name: "Ivan" }, { name: "Anderson" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-01-17",
    phase: "1ª Fase",
    stadium: "Estádio Alfredo Leahy",
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-01-21",
    phase: "1ª Fase",
    stadium: "Estádio Nelson Peixoto Feijó",
    csaGoals: [{ name: "Alexsandro" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-01-24",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Alexsandro" }, { name: "Alexsandro" }],
    oppGoals: [{ name: "Wellington" }, { name: "Sabará" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-01-28",
    phase: "1ª Fase",
    stadium: "Estádio Gerson Amaral",
    oppGoals: [{ name: "Vovô" }, { name: "Luciano Rosa" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-01-31",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Cristiano Alagoano" },
      { name: "Alexsandro" },
    ],
    oppGoals: [{ name: "Gustavo" }, { name: "Denilson" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-02-03",
    phase: "1ª Fase",
    stadium: "Estádio José Gomes da Costa",
    oppGoals: [{ name: "Aldo" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-02-07",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Jean" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-02-11",
    phase: "1ª Fase",
    stadium: "Estádio Juca Sampaio",
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-02-25",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Hércules Martins",
    manager: "Ênio Oliveira",
    attendance: 9202,
    grossRevenue: 60845,
    grossRevenueText: "R$ 60.845,00",
    starters: [
      "Alexandre",
      "Fábio",
      "Robson Baiano",
      "Júnior",
      "Evaldo Bahia",
      "Edmílson",
      "Matteus",
      "Jean",
      "Clayton",
      "Alexsandro",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Júnior", in: "Luiz Carlos" },
      { out: "Matteus", in: "Edvaldo" },
      { out: "Cristiano Alagoano", in: "Alex" },
    ],
    csaGoals: [{ name: "Evaldo Bahia" }, { name: "Clayton" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-05",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      { name: "Clayton" },
      { name: "Cal", ownGoalFor: true },
    ],
    oppGoals: [{ name: "Goiabinha" }, { name: "Oliveira" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-08",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-12",
    phase: "1ª Fase",
    stadium: "Estádio Governador Arnon de Mello",
    csaGoals: [{ name: "Alexsandro" }, { name: "Matteus" }],
    oppGoals: [
      { name: "Joilson" },
      { name: "Franco" },
      { name: "Bimba" },
      { name: "Bimba" },
    ],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-14",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-18",
    phase: "1ª Fase",
    stadium: "Coaracy da Mata (Fumeirão)",
    oppGoals: [{ name: "Nem" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-22",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Jean" }, { name: "Rodney" }],
    oppGoals: [{ name: "Peixinho" }, { name: "Peixinho" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-25",
    phase: "1ª Fase",
    stadium: "Estádio Zequinha Barbosa",
    oppGoals: [{ name: "Joab" }],
  },
  {
    competition: "Campeonato Alagoano",
    date: "2007-03-28",
    phase: "1ª Fase",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [{ name: "Clayton", minute: 70 }], // 25' 2ºT
    oppGoals: [{ name: "Fabiano" }],
  },

  // —— Copa do Brasil ——
  {
    competition: "Copa do Brasil",
    date: "2007-02-14",
    phase: "1ª Fase",
    round: "Ida",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Cláudio Luciano Mercante Júnior",
    manager: "Ênio Oliveira",
    starters: [
      "Alexandre",
      "Fábio",
      "Luiz Carlos",
      "Júnior",
      "Evaldo Bahia",
      "Edmílson",
      "Jean",
      "Matteus",
      "João",
      "Alexsandro",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Fábio", in: "Zé Carlos" },
      { out: "Luiz Carlos", in: "Neto" },
      { out: "João", in: "Cristiano Fernandes" },
    ],
    csaGoals: [{ name: "Cristiano Alagoano" }],
    oppGoals: [{ name: "André Lima" }],
  },
  {
    competition: "Copa do Brasil",
    date: "2007-03-01",
    phase: "1ª Fase",
    round: "Volta",
    stadium: "Estádio Maracanã",
    manager: "Ênio Oliveira",
    starters: [
      "Alexandre",
      "Fábio",
      "Luiz Carlos",
      "Robson Baiano",
      "Evaldo Bahia",
      "Jean",
      "Edmílson",
      "Matteus",
      "Clayton",
      "Alexsandro",
      "Cristiano Alagoano",
    ],
    subs: [
      { out: "Evaldo Bahia", in: "Cristiano Fernandes" },
      { out: "Matteus", in: "Alex" },
      { out: "Cristiano Alagoano", in: "Edvaldo" },
    ],
    csaGoals: [{ name: "Alexsandro" }, { name: "Clayton" }],
    oppGoals: [
      { name: "Túlio" },
      { name: "Zé Roberto" },
      { name: "Joilson" },
      { name: "Dodô" },
      { name: "Dodô" },
    ],
  },
];

export const RELATED_PAIRS = [
  ["Copa do Brasil", "2007-02-14", "2007-03-01"],
];
