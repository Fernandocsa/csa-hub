/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1963 — jogos do CSA (fonte do usuário).
 * Inclui 2ª fase / 2º turno / decisão jan–abr/1964 (season=1963).
 * CSA campeão do 2º turno e campeão geral (decisão vs CRB).
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1963;

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
  // ——— 1º turno — 1ª fase ———
  {
    date: "1963-08-08",
    phase: "1º turno — 1ª fase",
    opponent: "Othon-AL",
    ha: "home",
    gf: 4,
    ga: 0,
    stadium: "Estádio do Mutange",
    goals: [
      { name: "Jair" },
      { name: "Roberto Mendes" },
      { name: "Chico", penalty: true },
      { name: "Clóvis" },
    ],
    note: "Documento: Roberto — unificado como Roberto Mendes",
  },
  {
    date: "1963-08-25",
    phase: "1º turno — 1ª fase",
    opponent: "Flamengo-AL",
    ha: "home",
    gf: 4,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Osman Ramires",
    revenueText: "Cr$ 39.700,00",
    manager: "Pinguela",
    starters: [
      "Ademir",
      "Venâncio",
      "Rogério",
      "Bá",
      "Chico",
      "Flávio",
      "Deda",
      "Roberto Mendes",
      "Jair",
      "Charuto",
      "Clóvis",
    ],
    goals: [
      { name: "Jair", minute: absMin(1, 4) },
      { name: "Chico", minute: absMin(2, 3) },
      { name: "Chico", minute: absMin(2, 12), penalty: true },
      { name: "Jair", minute: absMin(2, 27) },
    ],
  },
  {
    date: "1963-09-01",
    phase: "1º turno — 1ª fase",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 2,
    ga: 3,
    stadium: "Estádio do Mutange",
    revenueText: "Cr$ 232.350,00",
    goals: [{ name: "Clóvis" }, { name: "Jair" }],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1963-09-22",
    phase: "1º turno — 1ª fase",
    opponent: "CRB-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Manoel Correia Lima (PE)",
    goals: [{ name: "Jair" }],
    reds: ["Zé Cláudio"],
    note: "Escalação não informada",
  },
  {
    date: "1963-10-08",
    phase: "1º turno — 1ª fase",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 4,
    ga: 1,
    stadium: "Estádio do Mutange",
    note: "Só placar informado",
  },
  {
    date: "1963-10-27",
    phase: "1º turno — 1ª fase",
    opponent: "Penedense-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Benedito Loureiro",
    revenueText: "Cr$ 232.300,00",
    goals: [{ name: "Chico", minute: absMin(1, 18), penalty: true }],
    note: "Escalação não informada",
  },
  {
    date: "1963-11-03",
    phase: "1º turno — 1ª fase",
    opponent: "Guarany-AL",
    ha: "home",
    gf: 1,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Batista Cortez",
    goals: [{ name: "Clóvis" }],
    note: "Escalação não informada",
  },
  {
    date: "1963-11-10",
    phase: "1º turno — 1ª fase",
    opponent: "Estivadores-AL",
    ha: "home",
    gf: 2,
    ga: 3,
    stadium: "Estádio do Mutange",
    referee: "Osman Ramires",
    revenueText: "Cr$ 407.400,00",
    goals: [
      { name: "Chico", minute: absMin(1, 43) },
      { name: "Pinga", minute: absMin(2, 21), penalty: true },
    ],
    reds: ["Zé Cláudio"],
    note: "Escalação não informada; CSA 4º na 1ª fase",
  },
  // ——— 1º turno — 2ª fase ———
  {
    date: "1963-11-30",
    phase: "1º turno — 2ª fase",
    opponent: "Flamengo-AL",
    ha: "away",
    gf: 5,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "Benedito Loureiro",
    revenueText: "Cr$ 152.300,00",
    starters: [
      "Batista",
      "Chico",
      "Sinval",
      "Zé Cláudio",
      "Marinho",
      "Deda",
      "Charuto",
      "Deda I",
      "Jair",
      "Pinga",
      "Clóvis",
    ],
    goals: [
      { name: "Pinga" },
      { name: "Pinga" },
      { name: "Jair" },
      { name: "Jair" },
      { name: "Clóvis" },
    ],
    note: "Deda (meio) + Deda I (ataque) no mesmo jogo",
  },
  {
    date: "1963-12-08",
    phase: "1º turno — 2ª fase",
    opponent: "Estivadores-AL",
    ha: "away",
    gf: 1,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "Louraber Monteiro (CE)",
    revenueText: "Cr$ 607.900,00",
    goals: [{ name: "Clóvis", minute: absMin(2, 19) }],
    reds: ["Pinga"],
    note: "Expulsão King (massagista) omitida — não é atleta; escalação não informada",
  },
  {
    date: "1963-12-29",
    phase: "1º turno — 2ª fase",
    opponent: "Penedense-AL",
    ha: "away",
    gf: 0,
    ga: 1,
    stadium: "Estádio Alfredo Leahy",
    note: "Só placar informado",
  },
  {
    date: "1964-01-12",
    phase: "1º turno — 2ª fase",
    opponent: "CRB-AL",
    ha: "away",
    gf: 3,
    ga: 2,
    stadium: "Estádio da Pajuçara",
    note: "103º confronto CSA x CRB; só placar informado",
  },
  {
    date: "1964-01-19",
    phase: "1º turno — 2ª fase",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 1,
    ga: 4,
    stadium: "Estádio Manoel Moreira",
    note: "Só placar; CRB campeão do 1º turno; CSA 3º classificado ao 2º turno",
  },
  // ——— 2º turno ———
  {
    date: "1964-02-02",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 3,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Bernardes Torres (PE)",
    revenueText: "Cr$ 864.750,00",
    starters: [
      "Batista",
      "Chico",
      "Sinval",
      "Zé Cláudio",
      "Flávio",
      "Bá",
      "Charuto",
      "Roberto Mendes",
      "Pinga",
      "Jair",
      "Deda",
    ],
    goals: [
      { name: "Jair" },
      { name: "Deda" },
      { name: "Chico", penalty: true },
    ],
    reds: ["Pinga"],
  },
  {
    date: "1964-03-01",
    phase: "2º turno",
    opponent: "Estivadores-AL",
    ha: "away",
    gf: 2,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "Sebastião Rufino (PE)",
    revenueText: "Cr$ 889.150,00",
    goals: [{ name: "Jair" }, { name: "Pinga" }],
    note: "Escalação não informada",
  },
  {
    date: "1964-03-15",
    phase: "2º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 3,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Sebastião Rufino (PE)",
    revenueText: "Cr$ 739.700,00",
    starters: [
      "Batista",
      "Chico",
      "Sinval",
      "Zé Cláudio",
      "Flávio",
      "Roberto Mendes",
      "Charuto",
      "Clóvis",
      "Pinga",
      "Jair",
      "Deda",
    ],
    goals: [
      { name: "Deda", minute: absMin(1, 20) },
      { name: "Clóvis", minute: absMin(1, 40) },
      { name: "Jair", minute: absMin(2, 35) },
    ],
    note: "CSA campeão do 2º turno",
  },
  // ——— Decisão ———
  {
    date: "1964-03-29",
    phase: "Decisão",
    opponent: "CRB-AL",
    ha: "home",
    gf: 3,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Benedito Loureiro",
    revenueText: "Cr$ 1.230.050,00",
    starters: [
      "Batista",
      "Chico",
      "Sinval",
      "Deda I",
      "Zé Cláudio",
      "Flávio",
      "Clóvis",
      "Pinga",
      "Jair",
      "Charuto",
      "Deda II",
    ],
    goals: [
      { name: "Rubens", ownGoal: true, ownGoalDirection: "for", minute: absMin(1, 29) },
      { name: "Jair", minute: absMin(1, 30) },
      { name: "Pinga", minute: absMin(2, 7) },
    ],
  },
  {
    date: "1964-04-05",
    phase: "Decisão",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 0,
    stadium: "Estádio da Pajuçara",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 1.338.000,00",
    starters: [
      "Batista",
      "Chico",
      "Sinval",
      "Roberto Mendes",
      "Zé Cláudio",
      "Flávio",
      "Clóvis",
      "Pinga",
      "Jair",
      "Charuto",
      "Deda",
    ],
  },
  {
    date: "1964-04-12",
    phase: "Decisão",
    opponent: "CRB-AL",
    ha: "home",
    gf: 4,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Louraber Monteiro (PE)",
    starters: [
      "Batista",
      "Flávio",
      "Sinval",
      "Roberto Mendes",
      "Zé Cláudio",
      "Marinho",
      "Pinga",
      "Bá",
      "Jair",
      "Charuto",
      "Deda",
    ],
    goals: [
      { name: "Jair" },
      { name: "Jair" },
      { name: "Pinga" },
      { name: "Charuto" },
    ],
    note: "CSA campeão alagoano 1963",
  },
];
