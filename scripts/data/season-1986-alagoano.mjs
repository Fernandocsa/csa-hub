/** Campeonato Alagoano 1986 — jogos do CSA (fonte enxuta + ficha do título).
 * Quadrangular: inconsistência fonte mantida (ver notes).
 * Jogo do título: data 1986-05-25 conforme seção do Blog do Sorrentino
 * (listado após CSE 3x1 ASA nesse dia; fonte não isola a data em linha própria).
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1986;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium?: string|null;
 *   referee?: string|null;
 *   attendance?: number|null;
 *   revenue?: number|null;
 *   revenueText?: string|null;
 *   manager?: string|null;
 *   starters?: string[];
 *   entered?: string[];
 *   subs?: { out: string; in: string; minute?: number|null }[];
 *   goals?: { name: string; minute?: number|null }[];
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1ª fase do 1° turno ———
  {
    date: "1986-01-26",
    phase: "1ª fase do 1º turno",
    opponent: "São Domingos-AL",
    ha: "home",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-02-02",
    phase: "1ª fase do 1º turno",
    opponent: "ASA-AL",
    ha: "away",
    gf: 1,
    ga: 1,
  },
  {
    date: "1986-02-05",
    phase: "1ª fase do 1º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 2,
    ga: 0,
  },
  {
    date: "1986-02-16",
    phase: "1ª fase do 1º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-02-23",
    phase: "1ª fase do 1º turno",
    opponent: "CSE-AL",
    ha: "away",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-03-02",
    phase: "1ª fase do 1º turno",
    opponent: "CRB-AL",
    ha: "home",
    gf: 0,
    ga: 0,
  },
  {
    date: "1986-04-05",
    phase: "1ª fase do 1º turno",
    opponent: "Penedense-AL",
    ha: "home",
    gf: 2,
    ga: 0,
    note: "Data fora da ordem cronológica das outras partidas desta fase (fonte)",
  },

  // ——— 2ª fase do 1° turno ———
  {
    date: "1986-03-09",
    phase: "2ª fase do 1º turno",
    opponent: "CSE-AL",
    ha: "home",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-03-13",
    phase: "2ª fase do 1º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 5,
    ga: 0,
  },
  {
    date: "1986-03-16",
    phase: "2ª fase do 1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 0,
  },

  // ——— 1ª fase do 2° turno ———
  {
    date: "1986-03-22",
    phase: "1ª fase do 2º turno",
    opponent: "São Domingos-AL",
    ha: "away",
    gf: 2,
    ga: 0,
  },
  {
    date: "1986-03-30",
    phase: "1ª fase do 2º turno",
    opponent: "CSE-AL",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1986-04-02",
    phase: "1ª fase do 2º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 0,
    ga: 0,
  },
  {
    date: "1986-04-06",
    phase: "1ª fase do 2º turno",
    opponent: "Penedense-AL",
    ha: "away",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-04-13",
    phase: "1ª fase do 2º turno",
    opponent: "ASA-AL",
    ha: "home",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-04-20",
    phase: "1ª fase do 2º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 4,
    ga: 0,
  },
  {
    date: "1986-04-27",
    phase: "1ª fase do 2º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 0,
    ga: 0,
  },

  // ——— 2ª fase do 2° turno ———
  {
    date: "1986-05-01",
    phase: "2ª fase do 2º turno",
    opponent: "ASA-AL",
    ha: "home",
    gf: 3,
    ga: 1,
  },
  {
    date: "1986-05-07",
    phase: "2ª fase do 2º turno",
    opponent: "CSE-AL",
    ha: "home",
    gf: 1,
    ga: 1,
  },
  {
    date: "1986-05-11",
    phase: "2ª fase do 2º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 2,
  },

  // ——— Quadrangular decisivo ———
  {
    date: "1986-05-17",
    phase: "Quadrangular decisivo",
    opponent: "CSE-AL",
    ha: "home",
    gf: 2,
    ga: 2,
  },
  {
    date: "1986-05-21",
    phase: "Quadrangular decisivo",
    opponent: "ASA-AL",
    ha: "home",
    gf: 1,
    ga: 0,
  },
  {
    date: "1986-05-25",
    phase: "Quadrangular decisivo — jogo do título",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 2,
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Wilson Carlos dos Santos",
    attendance: 22531,
    revenue: 223790,
    revenueText: "Cz$ 223.790,00",
    manager: "Valmir Louruz",
    starters: [
      "Zé Luís",
      "Nei Dias",
      "Cale",
      "Edvaldo",
      "Zezinho",
      "Veiga",
      "Betão",
      "Dudu",
      "Carlinhos",
      "Borges",
      "Ditinho",
    ],
    entered: ["Paulinho", "Dentinho"],
    subs: [
      { out: "Dudu", in: "Paulinho" },
      { out: "Borges", in: "Dentinho" },
    ],
    goals: [{ name: "Ditinho", minute: 13 }],
    note:
      "Data alinhada à seção 25/05 no Blog do Sorrentino (após CSE 3x1 ASA). Tabela do quadrangular da fonte não inclui esta derrota (V1 E2 D0).",
  },
];
