/** CSA Taça de Ouro 1978 (Série A / Copa Brasil).
 * Sergipe corrigido para 23/04/1978 (fonte: futebol80 / GolAberto; texto tinha 20/04 duplicado).
 * Contagem: J16 V5 E4 D7 GP18 GC24.
 */
export const COMPETITION_NAME = "Taça de Ouro";
export const SEASON = "1978";

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium?: string|null;
 *   manager?: string|null;
 *   starters?: string[];
 *   entered?: string[];
 *   subs?: { out: string; in: string }[];
 *   goals?: { name: string; minute?: number|null; penalty?: boolean }[];
 *   note?: string;
 * }} Game
 */

const REI = "Estádio Rei Pelé (Trapichão)";

/** @type {Game[]} */
export const GAMES = [
  {
    date: "1978-03-30",
    phase: "1ª Fase",
    opponent: "Vasco-RJ",
    ha: "away",
    gf: 0,
    ga: 4,
    stadium: "São Januário",
  },
  {
    date: "1978-04-02",
    phase: "1ª Fase",
    opponent: "Volta Redonda-RJ",
    ha: "away",
    gf: 0,
    ga: 0,
    stadium: "Estádio Raulino de Oliveira",
  },
  {
    date: "1978-04-06",
    phase: "1ª Fase",
    opponent: "Guarani-SP",
    ha: "away",
    gf: 0,
    ga: 2,
    stadium: "Estádio Brinco de Ouro",
  },
  {
    date: "1978-04-09",
    phase: "1ª Fase",
    opponent: "Bahia-BA",
    ha: "home",
    gf: 0,
    ga: 2,
    stadium: REI,
  },
  {
    date: "1978-04-16",
    phase: "1ª Fase",
    opponent: "CRB-AL",
    ha: "home",
    gf: 1,
    ga: 3,
    stadium: REI,
    goals: [{ name: "Ênio" }],
  },
  {
    date: "1978-04-20",
    phase: "1ª Fase",
    opponent: "Vitória-BA",
    ha: "away",
    gf: 1,
    ga: 3,
    stadium: "Arena Fonte Nova",
    goals: [{ name: "Hélio" }],
  },
  {
    date: "1978-04-23",
    phase: "1ª Fase",
    opponent: "Sergipe-SE",
    ha: "away",
    gf: 2,
    ga: 1,
    stadium: "Estádio Lourival Batista",
    goals: [{ name: "Hélio" }, { name: "Hélio" }],
    note: "Data corrigida de 20/04 para 23/04 (futebol80 / GolAberto)",
  },
  {
    date: "1978-04-30",
    phase: "1ª Fase",
    opponent: "Ponte Preta-SP",
    ha: "home",
    gf: 1,
    ga: 2,
    stadium: REI,
    goals: [{ name: "Élcio" }],
  },
  {
    date: "1978-05-04",
    phase: "1ª Fase",
    opponent: "Itabuna-BA",
    ha: "home",
    gf: 2,
    ga: 0,
    stadium: REI,
    goals: [{ name: "Élcio" }, { name: "Hélio" }],
  },
  {
    date: "1978-05-07",
    phase: "1ª Fase",
    opponent: "Botafogo-RJ",
    ha: "home",
    gf: 0,
    ga: 0,
    stadium: REI,
  },
  {
    date: "1978-05-11",
    phase: "1ª Fase",
    opponent: "Confiança-SE",
    ha: "home",
    gf: 3,
    ga: 1,
    stadium: REI,
    goals: [{ name: "Élcio" }, { name: "Hélio" }, { name: "Jorge Siri" }],
  },
  {
    date: "1978-05-21",
    phase: "Repescagem",
    opponent: "CRB-AL",
    ha: "home",
    gf: 0,
    ga: 0,
    stadium: REI,
  },
  {
    date: "1978-05-24",
    phase: "Repescagem",
    opponent: "Itabuna-BA",
    ha: "away",
    gf: 1,
    ga: 1,
    stadium: "Estádio Luís Viana Filho",
    goals: [{ name: "Élcio" }],
  },
  {
    date: "1978-05-28",
    phase: "Repescagem",
    opponent: "Confiança-SE",
    ha: "away",
    gf: 1,
    ga: 3,
    stadium: "Estádio Lourival Batista",
    goals: [{ name: "Hélio" }],
  },
  {
    date: "1978-05-31",
    phase: "Repescagem",
    opponent: "Volta Redonda-RJ",
    ha: "home",
    gf: 3,
    ga: 1,
    stadium: REI,
    goals: [{ name: "Jorge Siri" }, { name: "Jorge Siri" }, { name: "Ênio" }],
  },
  {
    date: "1978-06-17",
    phase: "Repescagem",
    opponent: "Sergipe-SE",
    ha: "home",
    gf: 3,
    ga: 1,
    stadium: REI,
    goals: [{ name: "Betinho" }, { name: "Jorge Siri" }, { name: "Élcio" }],
  },
];
