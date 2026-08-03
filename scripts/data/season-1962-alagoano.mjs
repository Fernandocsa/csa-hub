/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1962 — jogos do CSA (fonte do usuário).
 * Inclui jogos jan–mai/1963 ainda dos turnos de 1962 (season=1962).
 * Capelense campeão 1º turno; Estivadores campeão 2º turno (decisão sem CSA).
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1962;

/**
 * @typedef {{
 *   date: string;
 *   phase?: string|null;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number|null;
 *   ga: number|null;
 *   stadium?: string|null;
 *   referee?: string|null;
 *   revenueText?: string|null;
 *   manager?: string|null;
 *   starters?: string[];
 *   entered?: string[];
 *   subs?: { out: string; in: string; minute?: number|null }[];
 *   goals?: {
 *     name: string;
 *     minute?: number|null;
 *     penalty?: boolean;
 *     ownGoal?: boolean;
 *     ownGoalDirection?: "for"|"against";
 *   }[];
 *   reds?: string[];
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1º turno ———
  {
    date: "1962-08-05",
    phase: "1º turno",
    opponent: "Alto Camaragibe-AL",
    ha: "home",
    gf: 4,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    note: "Sem gols detalhados ou escalação",
  },
  {
    date: "1962-09-16",
    phase: "1º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 2,
    ga: 4,
    stadium: "Estádio de Capela",
    referee: "Batista Cortez",
    revenueText: "Cr$ 20.408,00",
    manager: "Eduardo Montenegro",
    starters: [
      "Gérson",
      "Joãozinho",
      "Zé Luís",
      "Farias",
      "Ivaldo",
      "Boleado",
      "Bil",
      "Gernand",
      "Clóvis",
      "Bá",
      "Ary",
    ],
    goals: [
      { name: "Biu", minute: absMin(2, 7) },
      { name: "Clóvis", minute: absMin(2, 15) },
    ],
    reds: ["Farias"],
    note: "Gol de Biu com Bil na escalação — mantidos como nomes distintos",
  },
  {
    date: "1962-09-29",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: 0,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 13.860,00",
    note: "Escalação não informada",
  },
  {
    date: "1962-10-19",
    phase: "1º turno",
    opponent: "Othon-AL",
    ha: "home",
    gf: 7,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    revenueText: "Cr$ 4.920,00",
    manager: "Eduardo Montenegro",
    starters: [
      "Gereba",
      "Zezinho",
      "Zé Luís",
      "Boleado",
      "Gernand",
      "Roberto Mendes",
      "Zé Chaves",
      "Clóvis",
      "Biu",
      "Ary",
    ],
    goals: [
      { name: "Clóvis", minute: absMin(1, 10) },
      { name: "Ary", minute: absMin(1, 30) },
      { name: "Bil", minute: absMin(1, 33) },
      { name: "Clóvis", minute: absMin(2, 23) },
      { name: "Ivaldo", minute: absMin(2, 19) },
      { name: "Ary", minute: absMin(2, 42) },
      { name: "Roberto Mendes", minute: absMin(2, 45) },
    ],
    note: "Documento lista 10 na escalação; gol de Bil/Ivaldo sem estar na XI publicada",
  },
  {
    date: "1963-01-10",
    phase: "1º turno",
    opponent: "Rio Branco-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    revenueText: "Cr$ 10.330,00",
    manager: "Eduardo Montenegro",
    starters: [
      "Gérson",
      "Joãozinho",
      "Zé Luís",
      "Gernand",
      "Ivaldo",
      "Farias",
      "Bil",
      "Charles",
      "Clóvis",
      "Bá",
      "Ary",
    ],
    goals: [{ name: "Joãozinho", minute: absMin(2, 10) }],
  },
  {
    date: "1963-01-27",
    phase: "1º turno",
    opponent: "Penedense-AL",
    ha: "home",
    gf: 3,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Osman Ramires",
    revenueText: "Cr$ 52.080,00",
    starters: [
      "Gérson",
      "Joãozinho",
      "Zé Luís",
      "Farias",
      "Ivaldo",
      "Boleado",
      "Ademir",
      "Gernand",
      "Clóvis",
      "Biu",
      "Ary",
    ],
    goals: [
      { name: "Amaro", ownGoal: true, ownGoalDirection: "for", minute: absMin(1, 15) },
      { name: "Boleado", minute: absMin(1, 38) },
      { name: "Gernand", minute: absMin(2, 35) },
    ],
    note: "Ademir na linha de ataque (distinto do goleiro Ademir #2193)",
  },
  {
    date: "1963-02-10",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 2,
    stadium: "Estádio da Pajuçara",
    referee: "Batista Cortez",
    revenueText: "Cr$ 100.820,00",
    manager: "Eduardo Montenegro",
    starters: [
      "Batista",
      "Joãozinho",
      "Zé Luís",
      "Ivaldo",
      "Boleado",
      "Farias",
      "Bá",
      "Chaves",
      "Clóvis",
      "Bil",
      "Ary",
    ],
    goals: [{ name: "Clóvis", minute: absMin(1, 22) }],
  },
  {
    date: "1963-03-03",
    phase: "1º turno",
    opponent: "Estivadores-AL",
    ha: "home",
    gf: 0,
    ga: 5,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    revenueText: "Cr$ 46.720,00",
    starters: [
      "Gérson",
      "Joãozinho",
      "Farias",
      "Gernand",
      "Bá",
      "Boleado",
      "Deda",
      "Neco",
      "Jair",
      "Fernando",
      "Ary",
    ],
    note: "CSA 7º no 1º turno; Capelense campeão do turno",
  },
  // ——— 2º turno ———
  {
    date: "1963-03-16",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 4,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Glênio Guimarães",
    starters: [
      "Batista",
      "Joãozinho",
      "Paranhos",
      "Ivaldo",
      "Deda",
      "Marinho",
      "Roberto Mendes",
      "Jair",
      "Neco",
      "Fernando",
      "Ary",
    ],
    goals: [
      { name: "Neco", minute: absMin(1, 16) },
      { name: "Neco", minute: absMin(1, 25) },
      { name: "Fernando", minute: absMin(1, 44) },
      { name: "Ary", minute: absMin(2, 17) },
    ],
  },
  {
    date: "1963-03-24",
    phase: "2º turno",
    opponent: "Penedense-AL",
    ha: "away",
    gf: 1,
    ga: 1,
    stadium: "Estádio Alfredo Leahy",
    referee: "Glênio Guimarães",
    manager: "Ivon Cordeiro",
    starters: [
      "Batista",
      "Joãozinho",
      "Paranhos",
      "Bá",
      "Ivaldo",
      "Marinho",
      "Roberto Mendes",
      "Neco",
      "Jair",
      "Fernando",
      "Ary",
    ],
    goals: [{ name: "Jair", minute: absMin(2, 26), penalty: true }],
  },
  {
    date: "1963-04-14",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 3,
    ga: 3,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 120.320,00",
    starters: [
      "Batista",
      "Joãozinho",
      "Paranhos",
      "Bá",
      "Ivaldo",
      "Farias",
      "Roberto Mendes",
      "Fernando",
      "Neco",
      "Jair",
      "Ary",
    ],
    note: "Gols não detalhados no documento",
  },
  {
    date: "1963-04-20",
    phase: "2º turno",
    opponent: "Alto Camaragibe-AL",
    ha: "home",
    gf: 1,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    goals: [{ name: "Roberto Mendes" }],
    note: "Escalação não informada",
  },
  {
    date: "1963-04-28",
    phase: "2º turno",
    opponent: "Estivadores-AL",
    ha: "home",
    gf: 1,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Zacarias",
    revenueText: "Cr$ 68.920,00",
    starters: [
      "Gérson",
      "Joãozinho",
      "Paranhos",
      "Ivaldo",
      "Farias",
      "Bá",
      "Fernando",
      "Roberto Mendes",
      "Clóvis",
      "Jair",
      "Neco",
    ],
    goals: [{ name: "Jair", minute: absMin(2, 18) }],
    note: "Resultado afastou o CSA do título",
  },
  {
    date: "1963-05-12",
    phase: "2º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 4,
    ga: 3,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 109.020,00",
    goals: [
      { name: "Jair" },
      { name: "Jair" },
      { name: "Roberto Mendes" },
      { name: "Ivaldo" },
    ],
    note: "Adiado de 07/04/1963 (alagamento do Mutange); CSA 5º no 2º turno",
  },
];
