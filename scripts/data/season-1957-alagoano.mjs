/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1957 — jogos do CSA (fonte do usuário).
 * Documento chama de "Campeonato de Futebol da Capital" (só Maceió);
 * gravado como Campeonato Alagoano (texto conclui título estadual 1957).
 * 2º turno inclui jogos em jan–fev/1958 (season=1957).
 * Amistosos CSA×Ipanema omitidos (sem data exata; não oficiais).
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1957;

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
 *   starters?: string[];
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
    date: "1957-08-25",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 2,
    ga: 2,
    stadium: "Estádio da Pajuçara",
    referee: "Waldomiro Breda",
    note: "Gols e escalação não informados",
  },
  {
    date: "1957-09-29",
    phase: "1º turno",
    opponent: "Tabuleiro dos Martins-AL",
    ha: "home",
    gf: 6,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Rosalvo Peixoto",
    starters: [
      "Bandeira",
      "Neu",
      "Orizon",
      "Tadeu",
      "Piolho",
      "Gedir",
      "Ítalo",
      "Bil Wilson",
      "Perereca",
      "Deda",
      "Clóvis",
    ],
    goals: [
      { name: "Clóvis" },
      { name: "Clóvis" },
      { name: "Clóvis" },
      { name: "Clóvis" },
      { name: "Clóvis" },
      { name: "Bil Wilson" },
    ],
  },
  {
    date: "1957-10-13",
    phase: "1º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 4,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Valfrido Vieira",
    revenueText: "Cr$ 3.090,00",
    goals: [
      { name: "Bil Wilson", minute: absMin(1, 5) },
      { name: "Paulo", minute: absMin(1, 7) },
      { name: "Geo", minute: absMin(1, 27) },
      { name: "Bil Wilson", minute: absMin(1, 35) },
    ],
    note: "Escalação não informada; expulsão Nazareno (Auto Esporte)",
  },
  {
    date: "1957-11-03",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 5,
    ga: 4,
    stadium: "Estádio do Mutange",
    referee: "Valfrido Vieira",
    goals: [
      { name: "Orizon", penalty: true },
      { name: "Juca" },
      { name: "Clóvis" },
      { name: "Bil Wilson" },
      { name: "Bil Wilson" },
    ],
    note: "Escalação não informada; CSA campeão do 1º turno",
  },
  // ——— 2º turno ———
  {
    date: "1957-12-15",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Valfrido Vieira",
    revenueText: "Cr$ 14.250,00",
    starters: [
      "Bandeira",
      "Neu",
      "Orizon",
      "Oscarzinho",
      "Tadeu",
      "Gedir",
      "Perereca",
      "Bil Wilson",
      "Ítalo",
      "Geo",
    ],
    goals: [{ name: "Clóvis" }],
    reds: ["Perereca"],
    note: "Documento lista 10 titulares (sem 11º); expulsão Perereca no 1ºT",
  },
  {
    date: "1957-12-29",
    phase: "2º turno",
    opponent: "Tabuleiro dos Martins-AL",
    ha: "away",
    gf: 4,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "José V. Sarmento",
    starters: [
      "Bandeira",
      "Neu",
      "Orizon",
      "Piolho",
      "Tadeu",
      "Gedir",
      "Deda",
      "Davino",
      "Clóvis",
      "Ítalo",
      "Geo",
    ],
    note: "Gols não detalhados no texto",
  },
  {
    date: "1958-02-02",
    phase: "2º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 6,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Adalberto Silva",
    revenueText: "Cr$ 5.550,00",
    starters: [
      "Bandeira",
      "Neu",
      "Orizon",
      "Piolho",
      "Tadeu",
      "Moura",
      "Perereca",
      "Ítalo",
      "Clóvis",
      "Davino",
      "Geo",
    ],
    goals: [
      { name: "Clóvis", minute: absMin(1, 23) },
      { name: "Perereca", minute: absMin(2, 6) },
      { name: "Davino", minute: absMin(2, 21) },
      { name: "Clóvis", minute: absMin(2, 24) },
      { name: "Clóvis", minute: absMin(2, 35) },
      { name: "Perereca", minute: absMin(2, 41) },
    ],
  },
  {
    date: "1958-02-23",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: 4,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "Waldomiro Breda",
    revenueText: "Cr$ 16.380,00",
    starters: [
      "Bandeira",
      "Neu",
      "Orizon",
      "Piolho",
      "Tadeu",
      "Moura",
      "Perereca",
      "Ítalo",
      "Clóvis",
      "Davino",
      "Juca",
    ],
    goals: [
      { name: "Perereca", minute: absMin(1, 21) },
      { name: "Davino", minute: absMin(1, 28) },
      { name: "Davino", minute: absMin(1, 35) },
      { name: "Clóvis", minute: absMin(2, 20) },
    ],
    note: "CSA campeão do 2º turno; título alagoano 1957 (CRB vice)",
  },
];
