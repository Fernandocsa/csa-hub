/** Campeonato Brasileiro 1976 (Série A) — jogos do CSA.
 * Competição no banco: Taça de Ouro (nomenclatura histórica do hub).
 * Placar sempre na visão CSA (gf/ga).
 * Contagem: J12 V2 E5 D5 GP14 GC19.
 * ownGoalDirection: "for" = GPF.
 */
export const COMPETITION_NAME = "Taça de Ouro";
export const SEASON = 1976;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium?: string|null;
 *   referee?: string|null;
 *   attendance?: number|null;
 *   manager?: string|null;
 *   goals?: {
 *     name: string;
 *     minute?: number|null;
 *     penalty?: boolean;
 *     ownGoal?: boolean;
 *     ownGoalDirection?: "for"|"against";
 *     side?: "csa"|"opponent";
 *   }[];
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  {
    date: "1976-08-29",
    phase: "1ª fase",
    opponent: "Fluminense-BA",
    ha: "away",
    gf: 0,
    ga: 0,
  },
  {
    date: "1976-09-01",
    phase: "1ª fase",
    opponent: "Fluminense-RJ",
    ha: "away",
    gf: 1,
    ga: 1,
    stadium: "Estádio Maracanã",
    goals: [{ name: "Ênio" }],
  },
  {
    date: "1976-09-04",
    phase: "1ª fase",
    opponent: "Vitória-BA",
    ha: "away",
    gf: 1,
    ga: 3,
    stadium: "Fonte Nova",
    goals: [{ name: "Almir" }],
  },
  {
    date: "1976-09-07",
    phase: "1ª fase",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 2,
    stadium: "Estádio Rei Pelé (Trapichão)",
    goals: [{ name: "Almir" }],
  },
  {
    date: "1976-09-19",
    phase: "1ª fase",
    opponent: "Bahia-BA",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio Rei Pelé (Trapichão)",
    goals: [{ name: "Valdeci" }],
  },
  {
    date: "1976-09-22",
    phase: "1ª fase",
    opponent: "Botafogo-RJ",
    ha: "home",
    gf: 2,
    ga: 1,
    stadium: "Estádio Rei Pelé (Trapichão)",
    goals: [{ name: "Aluísio" }, { name: "Aluísio" }],
  },
  {
    date: "1976-09-26",
    phase: "1ª fase",
    opponent: "Treze-PB",
    ha: "home",
    gf: 3,
    ga: 2,
    stadium: "Estádio Rei Pelé (Trapichão)",
    goals: [{ name: "Manguito" }, { name: "Zezinho" }, { name: "Tadeu" }],
  },
  {
    date: "1976-09-29",
    phase: "1ª fase",
    opponent: "Botafogo-PB",
    ha: "away",
    gf: 1,
    ga: 1,
    stadium: "Estádio Almeidão",
    goals: [{ name: "Naldo" }],
  },
  {
    date: "1976-10-10",
    phase: "Repescagem",
    opponent: "Botafogo-PB",
    ha: "home",
    gf: 3,
    ga: 5,
    stadium: "Estádio Rei Pelé (Trapichão)",
    goals: [
      { name: "João Carlos", ownGoal: true, ownGoalDirection: "for" },
      { name: "Valdeci" },
      { name: "Oliveira" },
    ],
  },
  {
    date: "1976-10-13",
    phase: "Repescagem",
    opponent: "Treze-PB",
    ha: "away",
    gf: 0,
    ga: 1,
    stadium: "Amigão",
  },
  {
    date: "1976-10-17",
    phase: "Repescagem",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 1,
    stadium: "Estádio Rei Pelé (Trapichão)",
  },
  {
    date: "1976-10-24",
    phase: "Repescagem",
    opponent: "Fluminense-BA",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio Rei Pelé (Trapichão)",
    goals: [{ name: "Zezinho" }],
  },
];
