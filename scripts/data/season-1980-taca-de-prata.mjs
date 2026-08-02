/** CSA Taça de Prata 1980 (Série B histórica).
 * Contagem (todos os 15 jogos): J15 V9 E3 D3 GP21 GC15.
 * Uberlândia 16/04 e final ida 11/05 já existiam — import faz upsert de súmula na final.
 */
export const COMPETITION_NAME = "Taça de Prata";
export const SEASON = "1980";

const REI = "Estádio Rei Pelé (Trapichão)";

function lineup(starters, subs = []) {
  return {
    starters,
    entered: [...new Set(subs.map((s) => s.in))],
    subs,
  };
}

/** @type {import('./season-1978-taca-de-ouro.mjs').Game[]} */
export const GAMES = [
  {
    date: "1980-02-24",
    phase: "1ª Fase",
    opponent: "Americano-RJ",
    ha: "home",
    gf: 3,
    ga: 1,
  },
  {
    date: "1980-02-28",
    phase: "1ª Fase",
    opponent: "Botafogo-BA",
    ha: "home",
    gf: 3,
    ga: 0,
  },
  {
    date: "1980-03-02",
    phase: "1ª Fase",
    opponent: "Itabuna-BA",
    ha: "away",
    gf: 2,
    ga: 1,
  },
  {
    date: "1980-03-08",
    phase: "1ª Fase",
    opponent: "Sergipe-SE",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1980-03-12",
    phase: "1ª Fase",
    opponent: "Bonsucesso-RJ",
    ha: "away",
    gf: 0,
    ga: 1,
  },
  {
    date: "1980-03-15",
    phase: "1ª Fase",
    opponent: "Confiança-SE",
    ha: "away",
    gf: 2,
    ga: 1,
  },
  {
    date: "1980-03-22",
    phase: "1ª Fase",
    opponent: "ASA-AL",
    ha: "home",
    gf: 1,
    ga: 2,
  },
  {
    date: "1980-04-05",
    phase: "3ª Fase",
    opponent: "Tuna Luso-PA",
    ha: "away",
    gf: 0,
    ga: 0,
  },
  {
    date: "1980-04-12",
    phase: "3ª Fase",
    opponent: "Caxias-RS",
    ha: "home",
    gf: 2,
    ga: 2,
  },
  {
    date: "1980-04-16",
    phase: "3ª Fase",
    opponent: "Uberlândia-MG",
    ha: "away",
    gf: 1,
    ga: 0,
    stadium: "Estádio Parque do Sabiá",
  },
  {
    date: "1980-04-20",
    phase: "3ª Fase",
    opponent: "Comercial-SP",
    ha: "home",
    gf: 2,
    ga: 1,
  },
  {
    date: "1980-05-04",
    phase: "Semifinal",
    opponent: "Ferroviária-SP",
    ha: "home",
    gf: 1,
    ga: 0,
    stadium: REI,
    goals: [{ name: "Dentinho" }],
  },
  {
    date: "1980-05-07",
    phase: "Semifinal",
    opponent: "Ferroviária-SP",
    ha: "away",
    gf: 1,
    ga: 0,
    stadium: "Estádio Fonte Luminosa",
    goals: [{ name: "Gilmar" }],
  },
  {
    date: "1980-05-11",
    phase: "Final",
    opponent: "Londrina-PR",
    ha: "home",
    gf: 1,
    ga: 1,
    stadium: REI,
    manager: "Laerte Dória",
    ...lineup(
      [
        "Zé Luiz",
        "Beto",
        "Paulinho",
        "Dick",
        "Luisinho",
        "Alberto Carioca",
        "Peu",
        "Jorge Siri",
        "Rogério",
        "Dentinho",
        "Gilmar",
      ],
      [{ out: "Rogério", in: "Jorge Luis" }],
    ),
    goals: [{ name: "Dentinho" }],
  },
  {
    date: "1980-05-18",
    phase: "Final",
    opponent: "Londrina-PR",
    ha: "away",
    gf: 0,
    ga: 4,
    stadium: "Estádio do Café",
    manager: "Laerte Dória",
    ...lineup(
      [
        "Zé Luiz",
        "Joca",
        "Paulinho",
        "Dick",
        "Luisinho",
        "Ronaldo Alves",
        "Alberto Carioca",
        "Alberto Leguelé",
        "Jorginho",
        "Peu",
        "Gilmar",
      ],
      [{ out: "Luisinho", in: "Zé Roberto" }],
    ),
  },
];
