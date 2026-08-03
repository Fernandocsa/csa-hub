/** Campeonato Alagoano 1956 — jogos do CSA (fonte do usuário).
 * Documento chama de "Campeonato da Capital — Edição 1956" (só Maceió);
 * gravado como Campeonato Alagoano (texto: CSA campeão alagoano de 1956).
 * 2º turno e decisão em 1957 (season=1956).
 * 1º jogo da decisão omitido (sem data/placar no documento).
 * Sem inventar fichas.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1956;

/**
 * @typedef {{
 *   date: string;
 *   phase?: string|null;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number|null;
 *   ga: number|null;
 *   unknownResult?: boolean;
 *   officialResult?: "win"|"draw"|"loss";
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
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1º turno ———
  {
    date: "1956-09-30",
    phase: "1º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 2,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    goals: [{ name: "Cláudio" }, { name: "Davino" }],
    note: "Escalação não informada",
  },
  {
    date: "1956-10-07",
    phase: "1º turno",
    opponent: "Arsenal-AL",
    ha: "away",
    gf: 5,
    ga: 0,
    stadium: "Estádio da Pajuçara",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 2.540,00",
    goals: [
      { name: "Barra" },
      { name: "Barra" },
      { name: "Barra" },
      { name: "Davino" },
      { name: "Ítalo" },
    ],
    note: "Escalação não informada",
  },
  {
    date: "1956-11-04",
    phase: "1º turno",
    opponent: "EC Alagoas-AL",
    ha: "home",
    gf: 6,
    ga: 2,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    goals: [
      { name: "Barra" },
      { name: "Barra" },
      { name: "Barra" },
      { name: "Ítalo" },
      { name: "Ítalo" },
      { name: "Bil Wilson" },
    ],
    note:
      "Documento: Bewilson → Bil Wilson; gols adversários atribuídos a Auto Esporte na fonte (provável erro); expulsão Binha (EC Alagoas); escalação não informada",
  },
  {
    date: "1956-12-08",
    phase: "1º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    note: "Gols e escalação não informados",
  },
  {
    date: "1956-12-15",
    phase: "1º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 5,
    ga: 3,
    stadium: "Estádio do Mutange",
    goals: [
      { name: "Barra" },
      { name: "Barra" },
      { name: "Barra" },
      { name: "Clóvis" },
      { name: "Eugênio" },
    ],
    note: "Sem árbitro ou escalação; CSA campeão do 1º turno",
  },
  // ——— 2º turno ———
  {
    date: "1957-03-10",
    phase: "2º turno",
    opponent: "Auto Esporte-AL",
    ha: "home",
    gf: 3,
    ga: 0,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    goals: [{ name: "Ítalo" }, { name: "Ítalo" }, { name: "Bil Wilson" }],
    note: "Escalação não informada",
  },
  {
    date: "1957-03-31",
    phase: "2º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 0,
    ga: 1,
    stadium: "Estádio do Mutange",
    referee: "Cláudio Régis",
    note: "Escalação não informada",
  },
  {
    date: "1957-04-07",
    phase: "2º turno",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: 0,
    ga: 3,
    stadium: "Estádio da Pajuçara",
    referee: "Cláudio Régis",
    revenueText: "Cr$ 7.840,00",
    note: "Escalação não informada; Ferroviário campeão do 2º turno",
  },
  // ——— Decisão do título ———
  {
    date: "1957-06-16",
    phase: "Decisão",
    opponent: "Ferroviário-AL",
    ha: "away",
    gf: null,
    ga: null,
    unknownResult: true,
    officialResult: "win",
    stadium: "Estádio da Pajuçara",
    referee: "Waldomiro Breda",
    starters: [
      "Bandeira",
      "Neu",
      "Orizon",
      "Oscar",
      "Tadeu",
      "Gedir",
      "Barra",
      "Bil Wilson",
      "Clóvis",
      "Davino",
      "Ítalo",
    ],
    note:
      "2º jogo da melhor-de-três; placar não informado; documento: CSA venceu o 1º e este jogo (bicampeão capital 1955–56 / campeão alagoano 1956). 1º jogo da série omitido (sem data)",
  },
];
