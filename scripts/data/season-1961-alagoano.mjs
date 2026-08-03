/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/**
 * Campeonato Alagoano 1961 — jogos do CSA (fonte do usuário).
 * Documento original traz subtítulo "(DECIDIDO NO TAPETÃO)".
 * CRB campeão; Capelense vice; CSA 3º.
 * Jogo CSA 2x0 CRB (10/09): placar de campo mantido; TJD/AL reverteu em
 * 02/12/1961 (escalação irregular de Jerônimo) para 3x2 pró CRB — ver note.
 * Sem técnico informado. Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1961;

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
    date: "1961-07-02",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 2,
    stadium: "Estádio da Pajuçara",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 64.000,00",
    note: "Escalação não informada; CSA não marcou",
  },
  {
    date: "1961-07-09",
    phase: "1º turno",
    opponent: "Estivadores-AL",
    ha: "home",
    gf: 3,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Adalberto Silva",
    revenueText: "Cr$ 15.060,00",
    starters: [
      "Lula",
      "Zé Luiz",
      "Castelo Branco",
      "Carlinhos",
      "Boleado",
      "Gernand",
      "Machado",
      "Bá",
      "Roberto Mendes",
      "Paulo Patriota",
      "Tonho",
    ],
    entered: ["Clóvis"],
    subs: [{ out: "Tonho", in: "Clóvis" }],
    goals: [
      { name: "Paulo Patriota", minute: absMin(1, 14) },
      {
        name: "Oncinha",
        minute: absMin(2, 6),
        ownGoal: true,
        ownGoalDirection: "for",
      },
      { name: "Machado", minute: absMin(2, 10) },
    ],
    note: "Documento: Tonho (Clóvis); Oncinha (contra, Estivadores)",
  },
  {
    date: "1961-08-06",
    phase: "1º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 2,
    ga: 2,
    stadium: "Estádio de Capela",
    referee: "Walfrido Vieira",
    revenueText: "Cr$ 16.660,00",
    starters: [
      "Lula",
      "Zé Luiz",
      "Castelo Branco",
      "Bá",
      "Boleado",
      "Paulo Santos",
      "Cícero",
      "Clóvis",
      "Paulo Patriota",
      "Didi",
      "Machado",
    ],
    entered: ["Roberto Mendes"],
    subs: [{ out: "Paulo Patriota", in: "Roberto Mendes" }],
    goals: [
      { name: "Castelo Branco", minute: absMin(1, 20) },
      { name: "Castelo Branco", minute: absMin(1, 31) },
    ],
    note: "Expulsão Zé Paulo (Capelense); Paulo Patriota (Roberto) na fonte",
  },
  {
    date: "1961-08-20",
    phase: "1º turno",
    opponent: "Rio Branco-AL",
    ha: "home",
    gf: 2,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 13.800,00",
    starters: [
      "Lula",
      "Jerônimo",
      "Boleado",
      "Paulo Patriota",
      "Zé Luiz",
      "Gernand",
      "Roberto Mendes",
      "Ítalo",
      "Clóvis",
      "Bá",
      "Cícero",
    ],
    entered: ["Carlinhos"],
    subs: [{ out: "Ítalo", in: "Carlinhos" }],
    goals: [
      { name: "Clóvis" },
      { name: "Roberto Mendes" },
    ],
    note: "CSA 3º no 1º turno (5 pts, 2V-1E-1D); CRB liderou o turno",
  },

  // ——— 2º turno ———
  {
    date: "1961-09-10",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 2,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 54.300,00",
    starters: [
      "Lula",
      "Gernand",
      "Zé Luiz",
      "Boleado",
      "Jerônimo",
      "Paulo Patriota",
      "Bá",
      "Roberto Mendes",
      "Ítalo",
      "Clóvis",
      "Machado",
    ],
    goals: [
      { name: "Clóvis", minute: absMin(1, 6) },
      { name: "Clóvis", minute: absMin(2, 44) },
    ],
    note:
      "Placar de campo 2x0 CSA. Em 02/12/1961 o TJD/AL reverteu os pontos ao CRB (julgamento 3x2 pró CRB) por escalação irregular de Jerônimo (CSA). Expulsão: Edinho (CRB). Essa reversão decidiu o título a favor do CRB.",
  },
  {
    date: "1961-09-17",
    phase: "2º turno",
    opponent: "Estivadores-AL",
    ha: "away",
    gf: 4,
    ga: 0,
    stadium: "Estádio do Mutange",
    goals: [
      { name: "Boleado" },
      { name: "Boleado" },
      { name: "Paulo Patriota" },
      { name: "Ítalo" },
    ],
    note: "Fonte: gols Boleado (2), Paulo, Ítalo; sem árbitro/escalação. Estádio Mutange (casa do CSA, adversário mandante no documento)",
  },
  {
    date: "1961-10-15",
    phase: "2º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 2,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    revenueText: "Cr$ 47.250,00",
    goals: [
      { name: "Clóvis" },
      { name: "Boleado", penalty: true },
    ],
    note: "Escalação não informada",
  },
  {
    date: "1961-10-29",
    phase: "2º turno",
    opponent: "Rio Branco-AL",
    ha: "away",
    gf: 4,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Walfrido Vieira",
    revenueText: "Cr$ 17.300,00",
    starters: [
      "Lula",
      "Jerônimo",
      "Zé Luiz",
      "Paulo Santos",
      "Paulo Patriota",
      "Boleado",
      "Roberto Mendes",
      "Ítalo",
      "Clóvis",
      "Bá",
      "Machado",
    ],
    goals: [
      { name: "Clóvis" },
      { name: "Clóvis" },
    ],
    note:
      "Placar 4x2; documento só nomeia Clóvis (2x) — outros 2 gols CSA sem autor. Observação da fonte: com o resultado o CSA conquistaria o bicampeonato, porém o CRB ficou com o título após a reversão de 10/09 no TJD/AL. CSA 3º geral.",
  },
];
