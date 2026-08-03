/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1959 — jogos do CSA (fonte do usuário).
 * Inclui 2º turno mar–abr/1960 (season=1959).
 * Torneio Início (02/08/1959) omitido — não é campeonato oficial.
 * 16/04/1960 vs Capelense: vitória em campo 3x2 anulada (Jerônimo irregular).
 * Contagem oficial (exclui anulado): J5 V3 E0 D2 GP9 GC10.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1959;

/**
 * @typedef {{
 *   date: string;
 *   phase?: string|null;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number|null;
 *   ga: number|null;
 *   excludeFromStats?: boolean;
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
    date: "1959-09-13",
    phase: "1º turno",
    opponent: "Ouricuri-AL",
    ha: "home",
    gf: 2,
    ga: 1,
    stadium: "Estádio do Mutange",
    goals: [{ name: "Ítalo" }, { name: "Clóvis" }],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1959-09-27",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 2,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Alfredo Santa Rita",
    starters: [
      "Caliça",
      "Maso",
      "Nivaldo",
      "Deda",
      "Nazareno",
      "Paulo Santos",
      "Milton",
      "Machado",
      "Clóvis",
      "Ítalo",
      "Eromir",
    ],
    goals: [{ name: "Milton" }, { name: "Clóvis" }],
  },
  {
    date: "1959-10-04",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 3,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "Alfredo Santa Rita",
    revenueText: "Cr$ 30.060,00",
    starters: [
      "Caliça",
      "Maso",
      "Nivaldo",
      "Deda",
      "Neném",
      "Paulo Santos",
      "Milton",
      "Ítalo",
      "Santos",
      "Clóvis",
      "Juca",
    ],
    goals: [{ name: "Milton" }, { name: "Milton" }, { name: "Santos" }],
  },
  {
    date: "1959-10-18",
    phase: "1º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 0,
    ga: 2,
    stadium: "Estádio de Capela",
    referee: "Augustin Ferrapeira",
    revenueText: "Cr$ 31.180,00",
    note: "Escalação não informada; Capelense campeão do 1º turno; CSA 2º",
  },
  // ——— 2º turno ———
  {
    date: "1960-03-27",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 2,
    ga: 6,
    stadium: "Estádio do Mutange",
    goals: [{ name: "Clóvis" }, { name: "Clóvis" }],
    note: "Sem árbitro ou escalação",
  },
  {
    date: "1960-04-16",
    phase: "2º turno (jogo anulado)",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 3,
    ga: 2,
    stadium: "Estádio do Mutange",
    excludeFromStats: true,
    goals: [{ name: "Clóvis" }, { name: "Ítalo" }, { name: "Eromir" }],
    note:
      "Vitória em campo 3x2; pontos perdidos por escalação irregular de Jerônimo (mesmo atleta do caso 1961). Documento: Eronir — unificado como Eromir",
  },
];
