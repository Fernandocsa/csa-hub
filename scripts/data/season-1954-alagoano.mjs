/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Campeonato Alagoano 1954 — jogos do CSA (fonte do usuário).
 * Fase: Campeonato de Maceió (capital). CSA não venceu turnos;
 * Ferroviário campeão da capital e do Alagoano 1954.
 * 2º turno inclui jogos em jan–mar/1955 (season=1954).
 * Sem inventar fichas / nomes ilegíveis.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1954;

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
    date: "1954-07-18",
    phase: "1º turno",
    opponent: "Alexandria-AL",
    ha: "home",
    gf: 3,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Luiz Medeiros",
    revenueText: "Cr$ 4.169,00",
    starters: [
      "Sílvio Pirilo",
      "Neu",
      "Arestides",
      "Piolho",
      "Zanélio",
      "Napoleão",
      "Valfredo",
      "Ítalo",
      "Oscarzinho",
      "Edgar",
      "Siló",
    ],
    goals: [
      { name: "Piolho", minute: absMin(1, 30), penalty: true },
      { name: "Ítalo", minute: absMin(2, 2) },
      { name: "Ítalo", minute: absMin(2, 37) },
    ],
  },
  {
    date: "1954-08-15",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 3,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Batista Cortez",
    revenueText: "Cr$ 4.877,00",
    starters: [
      "Sílvio Pirilo",
      "Neu",
      "Paulo",
      "Piolho",
      "Zanélio",
      "Napoleão",
      "Siló",
      "Ítalo",
      "Oscarzinho",
      "Edgar",
      "Valfredo",
    ],
    goals: [
      { name: "Piolho", penalty: true },
      { name: "Edgar" },
      { name: "Ítalo" },
    ],
  },
  {
    date: "1954-09-26",
    phase: "1º turno",
    opponent: "EC Alagoas-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Rosalvo Peixoto",
    revenueText: "Cr$ 2.649,00",
    starters: [
      "Sílvio Pirilo",
      "Neu",
      "Paulo",
      "Piolho",
      "Zanélio",
      "Napoleão",
      "Cão",
      "Ítalo",
      "Sued",
      "Oscarzinho",
      "Siló",
    ],
    goals: [{ name: "Piolho", minute: absMin(1, 32), penalty: true }],
  },
  {
    date: "1954-11-07",
    phase: "1º turno",
    opponent: "Auto Esporte-AL",
    ha: "away",
    gf: 2,
    ga: 0,
    stadium: "Estádio da Pajuçara",
    referee: "Adalberto Silva",
    revenueText: "Cr$ 2.803,00",
    starters: [
      "Sílvio Pirilo",
      "Neu",
      "Paulo",
      "Piolho",
      "Zanélio",
      "Napoleão",
      "Cão",
      "Ítalo",
      "Oscarzinho",
      "Edgar",
      "Sued",
    ],
    goals: [
      { name: "Edgar", minute: absMin(1, 20) },
      { name: "Piolho", minute: absMin(2, 35) },
    ],
    reds: ["Neu"],
  },
  {
    date: "1954-11-28",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 2,
    stadium: "Estádio da Pajuçara",
    referee: "Adalberto Silva",
    revenueText: "Cr$ 9.119,00",
    starters: [
      "Sílvio Pirilo",
      "Arestides",
      "Paulo",
      "Piolho",
      "Zanélio",
      "Napoleão",
      "Cão",
      "Ítalo",
      "Oscarzinho",
      "Edgar",
      "Sued",
    ],
    goals: [{ name: "Piolho", minute: absMin(1, 22) }],
    note: "Empate em pontos forçou jogo extra CSA×CRB pelo 1º turno",
  },
  {
    date: "1954-12-05",
    phase: "1º turno (decisão)",
    opponent: "CRB-AL",
    ha: "home",
    gf: 1,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Rosalvo Peixoto",
    revenueText: "Cr$ 8.200,00",
    starters: [
      "Sílvio Pirilo",
      "Arestides",
      "Paulo",
      "Piolho",
      "Zanélio",
      "Napoleão",
      "Cão",
      "Ítalo",
      "Oscarzinho",
      "Edgar",
      "Sued",
    ],
    goals: [
      {
        name: "Zanélio",
        minute: absMin(1, 17),
        ownGoal: true,
        ownGoalDirection: "against",
      },
      { name: "Oscarzinho", minute: absMin(1, 34) },
    ],
    note: "Jogo extra; CRB campeão do 1º turno da capital (gol Miro/CRB não detalhado além do placar)",
  },
  // ——— 2º turno ———
  {
    date: "1954-12-12",
    phase: "2º turno",
    opponent: "EC Alagoas-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Waldomiro Breda",
    starters: [
      "Sílvio Pirilo",
      "Neu",
      "Paulo",
      "Piolho",
      "Nildo",
      "Napoleão",
      "Siló",
      "Ítalo",
      "Oscarzinho",
      "Eugênio",
      "Sued",
    ],
    goals: [{ name: "Ítalo", minute: absMin(2, 43) }],
  },
  {
    date: "1955-01-09",
    phase: "2º turno",
    opponent: "Alexandria-AL",
    ha: "home",
    gf: 4,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 1.787,00",
    starters: [
      "Sílvio Pirilo",
      "Neu",
      "Napoleão",
      "Piolho",
      "Nildo",
      "Zanélio",
      "Davino",
      "Siló",
      "Ítalo",
      "Oscarzinho",
      "Sued",
    ],
    goals: [
      { name: "Ítalo", minute: absMin(1, 10) },
      { name: "Ítalo", minute: absMin(1, 41) },
      { name: "Ítalo", minute: absMin(1, 43) },
      { name: "Piolho", minute: absMin(2, 23) },
    ],
  },
  {
    date: "1955-01-30",
    phase: "2º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 2,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Rosalvo Peixoto",
    goals: [{ name: "Ítalo" }, { name: "Davino" }],
    note:
      "Escalação não informada; Auto Esporte retirou-se aos 30' 1ºT (expulsões Bá e Macumba), retornou a pedido da FAD e entregou os pontos (restante em caráter amistoso)",
  },
  {
    date: "1955-03-13",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 2,
    ga: 3,
    stadium: "Estádio do Mutange",
    referee: "Adalberto Silva",
    revenueText: "Cr$ 8.790,00",
    starters: [
      "Sílvio Pirilo",
      "Gedir",
      "Piolho",
      "Zanélio",
      "Nildo",
      "Ítalo",
      "Cecé",
      "Oscarzinho",
      "Davino",
    ],
    goals: [{ name: "Piolho", minute: absMin(1, 10), penalty: true }],
    note:
      "Escalação incompleta no original (2 nomes ilegíveis); placar 2x3 mas só 1 gol CSA detalhado",
  },
  {
    date: "1955-03-20",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: 0,
    ga: 3,
    stadium: "Estádio da Pajuçara",
    referee: "Louvain Aires",
    starters: [
      "Sílvio Pirilo",
      "Gedir",
      "Nivaldo",
      "Nildo",
      "Zanélio",
      "Neu",
      "Siló",
      "Piolho",
      "Cecé",
      "Davino",
      "Walfrido",
    ],
    note: "CSA 4º na 1ª fase do 2º turno; Ferroviário campeão do 2º turno / capital / Alagoano 1954",
  },
];
