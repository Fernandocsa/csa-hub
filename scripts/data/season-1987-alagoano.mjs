/** Campeonato Alagoano 1987 — jogos do CSA (fonte enxuta).
 * Sem árbitro/gols/público/escalação (não informados).
 * Fonte incompleta: faltam 1 jogo na 1ª fase do 1º turno e 1 no hexagonal
 * (classificação cita 9J e 10J; texto lista 8 e 9). Importa só o listado.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1987;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   walkover?: boolean;
 *   note?: string;
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  // ——— 1ª fase do 1° turno (texto: 8; classificação: 9) ———
  {
    date: "1987-02-19",
    phase: "1ª fase do 1º turno",
    opponent: "Cruzeiro-AL",
    ha: "home",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-02-22",
    phase: "1ª fase do 1º turno",
    opponent: "CSE-AL",
    ha: "away",
    gf: 2,
    ga: 1,
  },
  {
    date: "1987-02-26",
    phase: "1ª fase do 1º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1987-03-08",
    phase: "1ª fase do 1º turno",
    opponent: "Penedense-AL",
    ha: "home",
    gf: 0,
    ga: 1,
  },
  {
    date: "1987-03-14",
    phase: "1ª fase do 1º turno",
    opponent: "São Domingos-AL",
    ha: "away",
    gf: 2,
    ga: 2,
  },
  {
    date: "1987-03-29",
    phase: "1ª fase do 1º turno",
    opponent: "ASA-AL",
    ha: "away",
    gf: 1,
    ga: 2,
  },
  {
    date: "1987-04-01",
    phase: "1ª fase do 1º turno",
    opponent: "Comercial-AL",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1987-04-05",
    phase: "1ª fase do 1º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 1,
    ga: 0,
  },

  // ——— 2ª fase do 1° turno ———
  {
    date: "1987-04-08",
    phase: "2ª fase do 1º turno",
    opponent: "Capelense-AL",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1987-04-12",
    phase: "2ª fase do 1º turno",
    opponent: "ASA-AL",
    ha: "away",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-04-15",
    phase: "2ª fase do 1º turno",
    opponent: "CSE-AL",
    ha: "away",
    gf: 0,
    ga: 1,
  },
  {
    date: "1987-04-19",
    phase: "2ª fase do 1º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-04-22",
    phase: "2ª fase do 1º turno",
    opponent: "ASA-AL",
    ha: "home",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-04-26",
    phase: "2ª fase do 1º turno",
    opponent: "CSE-AL",
    ha: "home",
    gf: 0,
    ga: 1,
  },

  // ——— 1ª fase do 2° turno ———
  {
    date: "1987-05-03",
    phase: "1ª fase do 2º turno",
    opponent: "Penedense-AL",
    ha: "away",
    gf: 1,
    ga: 0,
  },
  {
    date: "1987-05-06",
    phase: "1ª fase do 2º turno",
    opponent: "Ferroviário-AL",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1987-05-10",
    phase: "1ª fase do 2º turno",
    opponent: "Cruzeiro-AL",
    ha: "away",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-05-17",
    phase: "1ª fase do 2º turno",
    opponent: "São Domingos-AL",
    ha: "home",
    gf: 1,
    ga: 1,
  },
  {
    date: "1987-05-20",
    phase: "1ª fase do 2º turno",
    opponent: "CSE-AL",
    ha: "home",
    gf: 0,
    ga: 0,
    note: "Fonte não confirma se reposição de jogo adiado",
  },
  {
    date: "1987-05-24",
    phase: "1ª fase do 2º turno",
    opponent: "Capelense-AL",
    ha: "away",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-05-27",
    phase: "1ª fase do 2º turno",
    opponent: "ASA-AL",
    ha: "home",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-05-31",
    phase: "1ª fase do 2º turno",
    opponent: "Comercial-AL",
    ha: "away",
    gf: 1,
    ga: 2,
  },
  {
    date: "1987-06-07",
    phase: "1ª fase do 2º turno",
    opponent: "CRB-AL",
    ha: "away",
    gf: 2,
    ga: 2,
  },

  // ——— Hexagonal decisivo (texto: 9; classificação: 10) ———
  {
    date: "1987-07-05",
    phase: "Hexagonal decisivo",
    opponent: "Comercial-AL",
    ha: "away",
    gf: 1,
    ga: 0,
  },
  {
    date: "1987-07-08",
    phase: "Hexagonal decisivo",
    opponent: "Penedense-AL",
    ha: "home",
    gf: 1,
    ga: 0,
  },
  {
    date: "1987-07-12",
    phase: "Hexagonal decisivo",
    opponent: "ASA-AL",
    ha: "home",
    gf: 2,
    ga: 3,
  },
  {
    date: "1987-07-15",
    phase: "Hexagonal decisivo",
    opponent: "CRB-AL",
    ha: "home",
    gf: 0,
    ga: 1,
  },
  {
    date: "1987-07-19",
    phase: "Hexagonal decisivo",
    opponent: "Comercial-AL",
    ha: "home",
    gf: 0,
    ga: 0,
  },
  {
    date: "1987-07-26",
    phase: "Hexagonal decisivo",
    opponent: "Penedense-AL",
    ha: "away",
    gf: 0,
    ga: 1,
  },
  {
    date: "1987-07-29",
    phase: "Hexagonal decisivo",
    opponent: "ASA-AL",
    ha: "away",
    gf: 1,
    ga: 1,
  },
  {
    date: "1987-08-02",
    phase: "Hexagonal decisivo",
    opponent: "CSE-AL",
    ha: "home",
    gf: 1,
    ga: 0,
    walkover: true,
    note: "Vitória por W.O. (CSA WOx0 CSE)",
  },
  {
    date: "1987-08-09",
    phase: "Hexagonal decisivo",
    opponent: "CRB-AL",
    ha: "home",
    gf: 0,
    ga: 1,
  },
];
