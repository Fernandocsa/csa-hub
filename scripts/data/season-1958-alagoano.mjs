/** Campeonato Alagoano 1958 — jogos do CSA (fonte do usuário).
 * Documento chama de "Campeonato de Futebol da Capital" (só Maceió);
 * gravado como Campeonato Alagoano (FAF reconhece título estadual 1958).
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1958;

/**
 * @typedef {{
 *   date: string;
 *   phase?: string|null;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number|null;
 *   ga: number|null;
 *   unknownResult?: boolean;
 *   stadium?: string|null;
 *   referee?: string|null;
 *   revenueText?: string|null;
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
    date: "1958-07-20",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 1,
    stadium: "Estádio da Pajuçara",
    referee: "José V. Sarmento",
    goals: [{ name: "Clóvis" }],
    note: "Escalação não informada",
  },
  {
    date: "1958-08-31",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: null,
    ga: null,
    unknownResult: true,
    stadium: "Estádio da Pajuçara",
    note: "Documento: sem resultado",
  },
  {
    date: "1958-10-12",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 2,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    goals: [{ name: "Santos" }, { name: "Santos" }],
    note: "Escalação não informada; CSA campeão do 1º turno",
  },
  // ——— 2º turno ———
  {
    date: "1958-10-19",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 2,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Louvain Aires",
    revenueText: "Cr$ 14.000,00",
    goals: [{ name: "Santos" }, { name: "Tonho Lima" }],
    note: "Escalação não informada",
  },
  {
    date: "1958-11-16",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Augustin Ferrapeira",
    note: "Ferroviário abandonou o campo após expulsão de Botinha; gols não detalhados",
  },
  {
    date: "1958-11-23",
    phase: "2º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 9,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    note: "Só placar; CSA campeão do 2º turno da capital",
  },
];
