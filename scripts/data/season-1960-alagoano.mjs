/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1960 — jogos do CSA (fonte do usuário).
 * CSA campeão do 1º turno (empatado em pts com Capelense) e campeão geral antecipado
 * no empate Capelense 3x3 em 22/01/1961 (season=1960).
 * CSA x Ferroviário (2º turno): data desconhecida → year-only 1960-01-01; placar unknown.
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1960;

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
 *   unknownResult?: boolean;
 *   walkover?: boolean;
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1º turno ———
  {
    date: "1960-08-07",
    phase: "1º turno",
    opponent: "Alto Camaragibe-AL",
    ha: "home",
    gf: 1,
    ga: 0,
    walkover: true,
    stadium: "Estádio do Mutange",
    note: "W.O. a favor do CSA — Alto Camaragibe não compareceu",
  },
  {
    date: "1960-08-28",
    phase: "1º turno",
    opponent: "Ouricuri-AL",
    ha: "home",
    gf: 5,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Neném",
      "Paulo Santos",
      "Carlinhos",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Ítalo",
      "Clóvis",
      "Deda",
      "Eromir",
    ],
    goals: [
      { name: "Deda", minute: absMin(1, 0) },
      { name: "Ítalo", minute: absMin(1, 0) },
      { name: "Ítalo", minute: absMin(2, 0) },
      { name: "Bil Wilson", minute: absMin(2, 0) },
    ],
    note: "Placar 5x0; documento lista só 4 gols (Deda, Ítalo×2, Bil Wilson) — 5º autor não informado",
  },
  {
    date: "1960-09-18",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 3,
    ga: 2,
    stadium: "Estádio da Pajuçara",
    referee: "Agostín Ferrapeira",
    revenueText: "Cr$ 43.030,00",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Paulo Santos",
      "Neném",
      "Carlinhos",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Ítalo",
      "Clóvis",
      "Bil",
      "Giba",
    ],
    goals: [
      { name: "Giba", minute: absMin(1, 0) },
      { name: "Giba", minute: absMin(1, 0) },
      { name: "Bil Wilson", minute: absMin(2, 0) },
    ],
    reds: ["Ítalo"],
    note: "Bil Wilson e Bil distintos na escalação; documento: Germand",
  },
  {
    date: "1960-10-16",
    phase: "1º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 3,
    ga: 4,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 30.740,00",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Neném",
      "Paulo Santos",
      "Carlinhos",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Ítalo",
      "Clóvis",
      "Bil",
      "Giba",
    ],
    entered: ["Casado"],
    subs: [{ out: "Moacir", in: "Casado" }],
    goals: [
      { name: "Bil Wilson", minute: absMin(1, 10) },
      { name: "Clóvis", minute: absMin(1, 20) },
      { name: "Clóvis", minute: absMin(2, 43) },
    ],
    note: "Torcida tentou linchar o goleiro reserva Casado (3 frangos no 2ºT com CSA vencendo 2x1); contida pela diretoria",
  },
  {
    date: "1960-11-06",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: 1,
    ga: 0,
    stadium: "Estádio da Pajuçara",
    referee: "Agnaldo Ferreira",
    revenueText: "Cr$ 13.470,00",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Deda",
      "Paulo Santos",
      "Didi",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Ítalo",
      "Clóvis",
      "Biu",
      "Eromir",
    ],
    goals: [{ name: "Ítalo", minute: absMin(1, 35) }],
    note: "Documento: Biu Wilson / Biu — Biu Wilson unificado como Bil Wilson; Biu distinto",
  },
  // ——— 2º turno ———
  {
    date: "1960-11-13",
    phase: "2º turno",
    opponent: "Alto Camaragibe-AL",
    ha: "away",
    gf: 3,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Neném",
      "Paulo Santos",
      "Didi",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Bil",
      "Clóvis",
      "Ítalo",
      "Eromir",
    ],
    goals: [
      { name: "Clóvis", minute: absMin(1, 27) },
      { name: "Didi", minute: absMin(2, 20) },
      { name: "Clóvis", minute: absMin(2, 0) },
    ],
  },
  {
    date: "1960-11-27",
    phase: "2º turno",
    opponent: "Ouricuri-AL",
    ha: "away",
    gf: 2,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Neném",
      "Paulo Santos",
      "Carlinhos",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Ítalo",
      "Clóvis",
      "Didi",
      "Eromir",
    ],
    entered: ["Guido"],
    subs: [{ out: "Eromir", in: "Guido" }],
    goals: [{ name: "Guido" }, { name: "Guido" }],
    note: "Documento: Gernard → Gernand; Eromir (Guido)",
  },
  {
    date: "1960-12-11",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 2,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 34.930,00",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Neném",
      "Paulo Santos",
      "Carlinhos",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Ítalo",
      "Clóvis",
      "Didi",
      "Giba",
    ],
    entered: ["Eromir"],
    subs: [{ out: "Giba", in: "Eromir" }],
    goals: [
      { name: "Giba", minute: absMin(1, 30) },
      { name: "Clóvis", minute: absMin(2, 20) },
    ],
  },
  {
    date: "1961-01-22",
    phase: "2º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 3,
    ga: 3,
    stadium: "Estádio de Capela",
    referee: "Benedito Loureiro",
    manager: "Madalena",
    starters: [
      "Moacir",
      "Neném",
      "Paulo Santos",
      "Carlinhos",
      "Piolho",
      "Gernand",
      "Bil Wilson",
      "Guido",
      "Clóvis",
      "Didi",
      "Eromir",
    ],
    goals: [
      { name: "Bil Wilson", minute: absMin(1, 20) },
      { name: "Guido", minute: absMin(2, 25) },
      { name: "Guido", minute: absMin(2, 40) },
    ],
    note: "Jogo do título — CSA campeão alagoano 1960 de forma antecipada",
  },
  {
    date: "1960-01-01",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: null,
    ga: null,
    unknownResult: true,
    note: "Data desconhecida (year-only 1960-01-01); placar e demais dados não informados",
  },
];
