/**
 * CSA Copa do Brasil 2009 — complementary sheets (CSA-only).
 * Eliminado nas oitavas pelo Coritiba (agregado 7x0).
 *
 * Técnicos: Hugo Sales (1ª fase) → Júlio Espinosa (2ª fase, ida)
 * → Gilmar Batista (2ª fase, volta + oitavas).
 *
 * Sem escalação: 18/03 (volta x Serra-ES).
 * Sem árbitro/renda/público na fonte. Minutos de gol não informados
 * (exceto cartões/substituições da volta x Coritiba).
 */
export const SEASON = "2009";
export const COMPETITION_NAME = "Copa do Brasil";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2009-03-04": { phase: "1ª Fase", round: "Ida" },
  "2009-03-18": { phase: "1ª Fase", round: "Volta" },
  "2009-04-08": { phase: "2ª Fase", round: "Ida" },
  "2009-04-22": { phase: "2ª Fase", round: "Volta" },
  "2009-04-29": { phase: "Oitavas de Final", round: "Ida" },
  "2009-05-06": { phase: "Oitavas de Final", round: "Volta" },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{ name: string, minute?: number } | string} Red
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   manager?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 *   csaReds?: Red[],
 *   oppReds?: Red[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  // —— 1ª Fase — Serra-ES (agregado 6x3) ——
  {
    date: "2009-03-04",
    stadium: "Estádio Estiva",
    manager: "Hugo Sales",
    starters: [
      "Rodrigues",
      "Augusto",
      "Júnior",
      "Fábio Lima",
      "Marciano",
      "Anderson Alagoano",
      "Jean",
      "Magno",
      "Cleisson Rato",
      "Marco Brito",
      "Fábio Lopes",
    ],
    subs: [
      { out: "Jean", in: "Fagner" },
      { out: "Cleisson Rato", in: "Camilo" },
      { out: "Marco Brito", in: "Thiago Potiguar" },
    ],
    csaGoals: [
      { name: "Camilo" },
      { name: "Thiago Potiguar" },
      { name: "Thiago Potiguar" },
    ],
    oppGoals: [{ name: "Rigoberto" }, { name: "Mateus" }],
  },
  {
    date: "2009-03-18",
    stadium: "Estádio Rei Pelé",
    manager: "Hugo Sales",
    csaGoals: [
      { name: "Camilo" },
      { name: "Fagner" },
      { name: "Thiago Potiguar" },
    ],
    oppGoals: [{ name: "Regílson" }],
  },

  // —— 2ª Fase — Santos (agregado 1x0) ——
  {
    date: "2009-04-08",
    stadium: "Estádio Rei Pelé",
    manager: "Júlio Espinosa",
    starters: [
      "Jéferson",
      "Júnior Caiçara",
      "Carlos Diogo",
      "Fábio Lima",
      "Marciano",
      "Anderson Alagoano",
      "Magno",
      "Jean",
      "Fábio Lopes",
      "Júnior Amorim",
      "Thiago Potiguar",
    ],
    subs: [
      { out: "Magno", in: "Ricardo Miranda" },
      { out: "Fábio Lopes", in: "Esquerdinha" },
      { out: "Thiago Potiguar", in: "Marco Brito" },
    ],
  },
  {
    date: "2009-04-22",
    stadium: "Estádio Vila Belmiro",
    manager: "Gilmar Batista",
    starters: [
      "Jéferson",
      "Júnior Caiçara",
      "Carlos Diogo",
      "Fábio Lima",
      "Marciano",
      "Magno",
      "Anderson Alagoano",
      "Jean",
      "Camilo",
      "Júnior Amorim",
      "Fábio Lopes",
    ],
    subs: [
      { out: "Marciano", in: "Leandro" },
      { out: "Camilo", in: "Ricardo Miranda" },
      { out: "Fábio Lopes", in: "Fagner" },
    ],
    csaGoals: [{ name: "Júnior Amorim" }],
  },

  // —— Oitavas — Coritiba (agregado 0x7) ——
  {
    date: "2009-04-29",
    stadium: "Estádio Rei Pelé",
    manager: "Gilmar Batista",
    starters: [
      "Jéferson",
      "Júnior Caiçara",
      "Carlos Diogo",
      "Fábio Lima",
      "Marciano",
      "Magno",
      "Anderson Alagoano",
      "Jean",
      "Fábio Lopes",
      "Camilo",
      "Thiago Potiguar",
    ],
    subs: [
      { out: "Magno", in: "Matteus" },
      { out: "Jean", in: "Ricardo Miranda" },
      { out: "Thiago Potiguar", in: "Tiago Laranjeira" },
    ],
    oppGoals: [
      { name: "Marcelinho Paraíba" },
      { name: "Marcelinho Paraíba" },
      { name: "Marcelinho Paraíba" },
      { name: "Márcio Gabriel" },
    ],
  },
  {
    date: "2009-05-06",
    stadium: "Estádio Couto Pereira",
    manager: "Gilmar Batista",
    starters: [
      "Jéferson",
      "Júnior Caiçara",
      "Carlos Diogo",
      "Fábio Lima",
      "Jonatas Vieira",
      "Magno",
      "Ricardo Miranda",
      "Anderson Canhão",
      "Camilo",
      "Júnior Amorim",
      "Fábio Lopes",
    ],
    subs: [
      { out: "Júnior Amorim", in: "Marco Brito", minute: 46 },
      { out: "Jonatas Vieira", in: "Augusto", minute: 52 },
      { out: "Camilo", in: "Thiago Potiguar", minute: 60 },
    ],
    csaReds: [
      { name: "Fábio Lopes", minute: 14 },
      { name: "Júnior Caiçara", minute: 40 },
      { name: "Magno", minute: 42 },
      { name: "Jonatas Vieira", minute: 43 },
      { name: "Carlos Diogo", minute: 73 },
    ],
    oppGoals: [
      { name: "Marcelinho Paraíba" },
      { name: "Ramon" },
      { name: "Ariel" },
    ],
  },
];
