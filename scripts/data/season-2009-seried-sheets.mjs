/**
 * CSA Série D 2009 — complementary sheets (CSA-only).
 * Eliminado na 1ª fase por desempate (menos vitórias que o Sergipe; ambos 7 pts).
 *
 * Técnicos: Freitas Nascimento (05/07) → Celso Teixeira (12/07–09/08).
 * Sem árbitro/renda/público na fonte. Minutos de gol não informados.
 */
export const SEASON = "2009";
export const COMPETITION_NAME = "Campeonato Brasileiro Série D";

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2009-07-05": { phase: "1ª Fase", round: null },
  "2009-07-12": { phase: "1ª Fase", round: null },
  "2009-07-19": { phase: "1ª Fase", round: null },
  "2009-07-26": { phase: "1ª Fase", round: null },
  "2009-08-01": { phase: "1ª Fase", round: null },
  "2009-08-09": { phase: "1ª Fase", round: null },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   manager?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "2009-07-05",
    stadium: "Estádio Rei Pelé",
    manager: "Freitas Nascimento",
    starters: [
      "Jéferson",
      "Jorginho",
      "Thiago Messias",
      "Selmo Lima",
      "Fábio",
      "Fábio Gaúcho",
      "Kim",
      "Nem",
      "Gustavo",
      "Júnior Amorim",
      "Etinho",
    ],
    subs: [
      { out: "Gustavo", in: "Marcílio" },
      { out: "Júnior Amorim", in: "Fagner" },
      { out: "Etinho", in: "Serginho Baiano" },
    ],
    oppGoals: [
      { name: "Juninho" },
      { name: "Reinaldo" },
      { name: "Reinaldo" },
    ],
  },
  {
    date: "2009-07-12",
    stadium: "Estádio Lourival Batista",
    manager: "Celso Teixeira",
    starters: [
      "Heverton",
      "Fábio",
      "Thiago Messias",
      "Fábio Lima",
      "Mica",
      "Selmo Lima",
      "Magno",
      "Marcílio",
      "Nem",
      "Serginho Baiano",
      "Etinho",
    ],
    subs: [
      { out: "Fábio Lima", in: "Victor Hugo" },
      { out: "Magno", in: "Fagner" },
      { out: "Nem", in: "Kim" },
    ],
  },
  {
    date: "2009-07-19",
    stadium: "Estádio Lacerdão",
    manager: "Celso Teixeira",
    starters: [
      "Heverton",
      "Júnior Caiçara",
      "Thiago Messias",
      "Selmo Lima",
      "Rafael",
      "Marcílio",
      "Magno",
      "Anderson Alagoano",
      "Marcos Antônio",
      "Serginho Baiano",
      "Rinaldo",
    ],
    subs: [
      { out: "Magno", in: "Victor Hugo" },
      { out: "Serginho Baiano", in: "Etinho" },
      { out: "Rinaldo", in: "Neguinho" },
    ],
  },
  {
    date: "2009-07-26",
    stadium: "Estádio Rei Pelé",
    manager: "Celso Teixeira",
    starters: [
      "Heverton",
      "Júnior Caiçara",
      "Thiago Messias",
      "Selmo Lima",
      "Rafael",
      "Marcílio",
      "Anderson Alagoano",
      "Magno",
      "Marcos Antônio",
      "Etinho",
      "Serginho Baiano",
    ],
    subs: [
      { out: "Anderson Alagoano", in: "Serginho" },
      { out: "Magno", in: "Rinaldo" },
      { out: "Etinho", in: "Fagner" },
    ],
    csaGoals: [{ name: "Serginho Baiano" }],
    oppGoals: [{ name: "Laércio" }],
  },
  {
    date: "2009-08-01",
    stadium: "Estádio Rei Pelé",
    manager: "Celso Teixeira",
    starters: [
      "Heverton",
      "Júnior Caiçara",
      "Thiago Messias",
      "Selmo Lima",
      "Rafael",
      "Anderson Alagoano",
      "Marcílio",
      "Marcos Antônio",
      "Piá",
      "Serginho Baiano",
      "Harley",
    ],
    subs: [
      { out: "Marcos Antônio", in: "Mica" },
      { out: "Piá", in: "Sinval" },
      { out: "Harley", in: "Emílio" },
    ],
    csaGoals: [{ name: "Piá" }, { name: "Emílio" }],
  },
  {
    date: "2009-08-09",
    stadium: "Estádio do Arruda",
    manager: "Celso Teixeira",
    starters: [
      "Heverton",
      "Júnior Caiçara",
      "Thiago Messias",
      "Selmo Lima",
      "Rafael",
      "Marcílio",
      "Anderson Alagoano",
      "Marcos Antônio",
      "Piá",
      "Serginho Baiano",
      "Emílio",
    ],
    subs: [
      { out: "Anderson Alagoano", in: "Sinval" },
      { out: "Marcos Antônio", in: "Braun" },
      { out: "Serginho Baiano", in: "Mica" },
    ],
    csaGoals: [{ name: "Thiago Messias" }, { name: "Júnior Caiçara" }],
    oppGoals: [{ name: "Marquinhos" }, { name: "Leandro Gobatto" }],
  },
];
