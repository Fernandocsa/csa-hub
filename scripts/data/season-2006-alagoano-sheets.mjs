/**
 * CSA Alagoano 2006 — complementary sheets (CSA-only).
 *
 * Formato: Copa Maceió + Copa Alagoas + Finalíssima.
 * CSA: vice Copa Maceió, campeão Copa Alagoas, vice geral (Finalíssima nos pênaltis).
 *
 * Copa Alagoas — estrutura (RSSSF / Bola na Área / 2ª fonte):
 *   1ª Fase → CSA campeão (vai direto à final); 2ª Fase = mata-mata entre 2º–5º
 *   (CSA ainda disputou a semi vs Corinthians, mas a vaga na final já estava garantida);
 *   Decisão = campeão 1ª fase (CSA) × campeão 2ª fase (Corinthians).
 *
 * Datas: fixture importada / RSSSF (CRB 14/03, Ipanema 16/03). Fonte complementar
 * traz 16/03 e 17/03 para esses jogos — não alteramos a data canônica.
 *
 * 28/05 Corinthians: fonte complementar 5x0; placar importado/RSSSF 5x1
 * (gol CSA: Ricardo Boiadeiro). Mantemos 1-5 e o gol do RSSSF.
 *
 * Divergências de artilheiro (mantidas da 1ª aplicação / RSSSF quando possível):
 *   18/01 1º gol CSA → Beto; 25/01 → Goiano; 19/02 gol Coruripe → Édson Di (pênalti);
 *   24/05 3º gol CSA → Édson Sá (hat-trick).
 *
 * Técnicos: Agnaldo Liz (Copa Maceió) → Ricardo Oliveira (interino, 09/04 e 24/05)
 * → Gilberto Pereira (19/04–07/05) → Marcos Magalhães (desde 31/05).
 */
export const SEASON = "2006";
export const COMPETITION_NAME = "Campeonato Alagoano";

export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/** Clear bad attendance left on a match without sheet attendance. */
export const ATTENDANCE_CLEAR = [];

/** @type {Record<string, { phase: string, round?: string|null }>} */
export const PHASE_BY_DATE = {
  "2006-01-15": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-01-18": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-01-22": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-01-25": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-01-29": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-01": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-05": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-08": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-11": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-14": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-16": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-02-19": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-02": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-05": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-11": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-14": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-16": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-19": { phase: "Copa Maceió", round: "1ª Fase" },
  "2006-03-26": { phase: "Copa Maceió", round: "Semifinal - Ida" },
  "2006-03-29": { phase: "Copa Maceió", round: "Semifinal - Volta" },
  "2006-04-02": { phase: "Copa Maceió", round: "Final - Ida" },
  "2006-04-05": { phase: "Copa Maceió", round: "Final - Volta" },
  "2006-04-09": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-04-12": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-04-16": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-04-19": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-04-23": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-04-26": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-04-30": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-03": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-07": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-10": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-14": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-17": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-21": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-24": { phase: "Copa Alagoas", round: "1ª Fase" },
  "2006-05-28": { phase: "Copa Alagoas", round: "Semifinal - Ida" },
  "2006-05-31": { phase: "Copa Alagoas", round: "Semifinal - Volta" },
  "2006-06-11": { phase: "Copa Alagoas", round: "Final - Ida" },
  "2006-06-14": { phase: "Copa Alagoas", round: "Final - Volta" },
  "2006-06-17": { phase: "Finalíssima", round: "1º jogo" },
  "2006-06-21": { phase: "Finalíssima", round: "2º jogo" },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   stadium?: string|null,
 *   referee?: string|null,
 *   manager?: string|null,
 *   attendance?: number|null,
 *   attendancePaid?: number|null,
 *   grossRevenue?: number|null,
 *   grossRevenueText?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 *   csaReds?: string[],
 *   oppReds?: string[],
 *   penaltiesFor?: number|null,
 *   penaltiesAgainst?: number|null,
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  {
    date: "2006-01-15",
    stadium: "Estádio Nelson Peixoto Feijó",
    referee: "Hércules Martins",
    csaGoals: [
      {
        name: "Alexsandro",
        minute: 22,
      },
    ],
    oppGoals: [
      {
        name: "Édson",
        minute: 46,
      },
    ],
  },
  {
    date: "2006-01-18",
    stadium: "Estádio Rei Pelé (Trapichão)",
    manager: "Agnaldo Liz",
    attendance: 5820,
    grossRevenue: 24873,
    grossRevenueText: "R$ 24.873,00",
    starters: [
      "Delmir",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Leomar",
      "Edmílson",
      "Beto",
      "Goiano",
      "Alexsandro",
      "Têmisson",
    ],
    subs: [
      {
        out: "Beto",
        in: "Marquinhos Mossoró",
      },
      {
        out: "Goiano",
        in: "Lulinha",
      },
      {
        out: "Têmisson",
        in: "Gilberto",
      },
    ],
    csaGoals: [
      {
        name: "Beto",
        minute: 7,
      },
      {
        name: "Leomar",
        minute: 24,
      },
      {
        name: "Leomar",
        minute: 56,
      },
    ],
    oppGoals: [
      {
        name: "Lamar",
        minute: 65,
      },
    ],
  },
  {
    date: "2006-01-22",
    stadium: "Estádio Gerson Amaral",
    referee: "Fernando Rogério Assunção",
    manager: "Agnaldo Liz",
    attendance: 3224,
    grossRevenue: 12463.5,
    grossRevenueText: "R$ 12.463,50",
    starters: [
      "Delmir",
      "Cláudio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Edmílson",
      "Leomar",
      "Beto",
      "Goiano",
      "Alexsandro",
      "Têmisson",
    ],
    subs: [
      {
        out: "Alexsandro",
        in: "Júnior Ferrim",
      },
      {
        out: "Têmisson",
        in: "Gilberto",
      },
    ],
    oppGoals: [
      {
        name: "Calmon",
        minute: 53,
      },
    ],
  },
  {
    date: "2006-01-25",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sílvio Acioli",
    manager: "Agnaldo Liz",
    attendance: 4462,
    grossRevenue: 14900,
    grossRevenueText: "R$ 14.900,00",
    starters: [
      "Delmir",
      "Cláudio",
      "Vilmar",
      "Alisson",
      "Rogerinho",
      "Leomar",
      "Edmílson",
      "Alex",
      "Goiano",
      "Alexsandro",
      "Júnior Ferrim",
    ],
    subs: [
      {
        out: "Alisson",
        in: "Sílvio",
      },
      {
        out: "Edmílson",
        in: "Jackson",
      },
      {
        out: "Júnior Ferrim",
        in: "Alex",
      },
    ],
    csaGoals: [
      {
        name: "Goiano",
        minute: 92,
      },
    ],
    oppReds: [
      "Júnior",
    ],
  },
  {
    date: "2006-01-29",
    stadium: "Estádio Alfredo Leahy",
    csaGoals: [
      {
        name: "Alisson",
        minute: 16,
      },
      {
        name: "Ribamar",
        minute: 36,
      },
    ],
    oppGoals: [
      {
        name: "Rogério",
        minute: 53,
      },
    ],
  },
  {
    date: "2006-02-01",
    stadium: "Estádio Edvanil Navarro",
    csaGoals: [
      {
        name: "Júnior Ferrim",
        minute: 50,
      },
    ],
  },
  {
    date: "2006-02-05",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Hércules Martins",
    manager: "Agnaldo Liz",
    attendance: 18479,
    attendancePaid: 12846,
    grossRevenue: 70145,
    grossRevenueText: "R$ 70.145,00",
    starters: [
      "Delmir",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Sílvio",
      "Leomar",
      "Cláudio",
      "Goiano",
      "Júnior Ferrim",
      "Alexsandro",
    ],
    subs: [
      {
        out: "Fábio",
        in: "Beto",
      },
      {
        out: "Júnior Ferrim",
        in: "Dejames",
      },
      {
        out: "Alexsandro",
        in: "Ribamar",
      },
    ],
  },
  {
    date: "2006-02-08",
    csaGoals: [{ name: "Alex" }, { name: "Goiano" }],
    oppGoals: [{ name: "Aroldo" }, { name: "Gerônimo" }],
  },
  {
    date: "2006-02-11",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sílvio Acioli",
    manager: "Agnaldo Liz",
    attendance: 3932,
    grossRevenue: 13445,
    grossRevenueText: "R$ 13.445,00",
    starters: [
      "Delmir",
      "Cláudio",
      "Sílvio",
      "Vilmar",
      "Rogerinho",
      "Edmílson",
      "Beto",
      "Leomar",
      "Goiano",
      "Ribamar",
      "Alexsandro",
    ],
    subs: [
      {
        out: "Vilmar",
        in: "Alex",
      },
      {
        out: "Beto",
        in: "Dejames",
      },
      {
        out: "Goiano",
        in: "Luciano",
      },
    ],
    csaGoals: [
      {
        name: "Leomar",
        minute: 55,
      },
      {
        name: "Alexsandro",
        minute: 81,
      },
    ],
    oppGoals: [
      {
        name: "Williams Bidê",
        minute: 30,
      },
      {
        name: "Mimi",
        minute: 38,
      },
    ],
  },
  {
    date: "2006-02-14",
    stadium: "Estádio Rei Pelé (Trapichão)",
    manager: "Agnaldo Liz",
    attendance: 4353,
    grossRevenue: 15265,
    grossRevenueText: "R$ 15.265,00",
    starters: [
      "Delmir",
      "Fábio",
      "Alisson",
      "Vilmar",
      "Rogerinho",
      "Edmílson",
      "Cláudio",
      "Leomar",
      "Goiano",
      "Beto",
      "Alex",
    ],
    subs: [
      {
        out: "Edmílson",
        in: "Bruno",
      },
      {
        out: "Goiano",
        in: "Dejames",
      },
    ],
    oppGoals: [
      {
        name: "Douglas",
        minute: 51,
      },
    ],
    csaReds: [
      "Beto",
    ],
  },
  {
    date: "2006-02-16",
    csaGoals: [{ name: "Jessuí" }],
    oppGoals: [{ name: "Denilson" }],
  },
  {
    date: "2006-02-19",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Flávio Feijó de Omena",
    csaGoals: [
      {
        name: "Édson Sá",
        minute: 4,
      },
      {
        name: "Édson Sá",
        minute: 38,
      },
    ],
    oppGoals: [
      {
        name: "Édson Di",
        minute: 56,
        penalty: true,
      },
    ],
  },
  {
    date: "2006-03-02",
    csaGoals: [
      { name: "Ribamar" },
      { name: "Dejames" },
      { name: "Dejames" },
    ],
    oppGoals: [{ name: "Márcio" }, { name: "Júnior" }],
  },
  {
    date: "2006-03-05",
    stadium: "Estádio Rei Pelé (Trapichão)",
    csaGoals: [
      {
        name: "Alexsandro",
      },
      {
        name: "Ribamar",
      },
    ],
  },
  {
    date: "2006-03-11",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Jorge Luís da Silva",
    manager: "Agnaldo Liz",
    attendance: 3708,
    grossRevenue: 12052.5,
    grossRevenueText: "R$ 12.052,50",
    starters: [
      "Delmir",
      "Cláudio",
      "Alisson",
      "Pícoli",
      "Vânderson",
      "Marquinhos Mossoró",
      "Arivélton",
      "Leomar",
      "Édson Sá",
      "Ribamar",
      "Jessuí",
    ],
    subs: [
      {
        out: "Pícoli",
        in: "Vilmar",
      },
      {
        out: "Ribamar",
        in: "Alexsandro",
      },
      {
        out: "Jessuí",
        in: "Bruno",
      },
    ],
    csaGoals: [
      {
        name: "Arivélton",
        minute: 54,
      },
      {
        name: "Bruno",
        minute: 61,
      },
    ],
  },
  {
    date: "2006-03-14",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sílvio Acioli",
    manager: "Agnaldo Liz",
    starters: [
      "Delmir",
      "Cláudio",
      "Pícoli",
      "Sílvio",
      "Rogerinho",
      "Jean",
      "Lamar",
      "Édson Sá",
      "Dejames",
      "Jessuí",
      "Émerson",
    ],
    subs: [
      {
        out: "Cláudio",
        in: "Arivélton",
      },
      {
        out: "Jean",
        in: "Bruno",
      },
      {
        out: "Émerson",
        in: "Alexsandro",
      },
    ],
    oppGoals: [
      {
        name: "Benhur",
        minute: 21,
      },
      {
        name: "Saulo",
        minute: 82,
      },
    ],
  },
  {
    date: "2006-03-16",
    stadium: "Estádio Rei Pelé (Trapichão)",
    attendance: 3550,
    grossRevenue: 11177.5,
    grossRevenueText: "R$ 11.177,50",
    csaGoals: [
      {
        name: "Arivélton",
        minute: 6,
      },
      {
        name: "Édson Sá",
        minute: 40,
      },
      {
        name: "Rogerinho",
        minute: 62,
      },
      {
        name: "Rogerinho",
        minute: 83,
      },
      {
        name: "Jessuí",
        minute: 89,
      },
    ],
  },
  {
    date: "2006-03-19",
    csaGoals: [{ name: "Dejames" }, { name: "Dejames" }],
    oppGoals: [{ name: "Anderson" }],
  },
  {
    date: "2006-03-26",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Fernando Rogério",
    manager: "Agnaldo Liz",
    attendance: 13599,
    grossRevenue: 61755,
    grossRevenueText: "R$ 61.755,00",
    starters: [
      "Delmir",
      "Fábio",
      "Pícoli",
      "Sílvio",
      "Rogerinho",
      "Jean",
      "Leomar",
      "Arivélton",
      "Dejames",
      "Jessuí",
      "Ribamar",
    ],
    subs: [
      {
        out: "Jean",
        in: "Marquinhos Mossoró",
      },
    ],
    csaGoals: [
      {
        name: "Jessuí",
      },
    ],
    oppGoals: [
      {
        name: "Tico Mineiro",
      },
    ],
  },
  {
    date: "2006-03-29",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Charles Hebert",
    manager: "Agnaldo Liz",
    attendance: 18371,
    attendancePaid: 12341,
    grossRevenue: 86120,
    grossRevenueText: "R$ 86.120,00",
    starters: [
      "Delmir",
      "Fábio",
      "Alisson",
      "Sílvio",
      "Rogerinho",
      "Leomar",
      "Marquinhos Mossoró",
      "Arivélton",
      "Dejames",
      "Ribamar",
      "Jessuí",
    ],
    subs: [
      { out: "Leomar", in: "Vânderson" },
      { out: "Dejames", in: "Édson Sá" },
      { out: "Ribamar", in: "Alexsandro" },
    ],
    csaGoals: [
      { name: "Alisson", minute: 9 },
      { name: "Alexsandro", minute: 95 },
    ],
    oppGoals: [
      { name: "Júnior Amorim", minute: 26 },
      { name: "Bebeto", minute: 92 },
    ],
  },
  {
    date: "2006-04-02",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sivaldo Silva",
    manager: "Agnaldo Liz",
    attendance: 7748,
    grossRevenue: 35573.5,
    grossRevenueText: "R$ 35.573,50",
    starters: [
      "Delmir",
      "Fábio",
      "Pícoli",
      "Sílvio",
      "Rogerinho",
      "Marquinhos Mossoró",
      "Cláudio",
      "Édson Sá",
      "Arivélton",
      "Ribamar",
      "Jessuí",
    ],
    subs: [
      {
        out: "Rogerinho",
        in: "Vânderson",
      },
      {
        out: "Édson Sá",
        in: "Alexsandro",
      },
      {
        out: "Jessuí",
        in: "Émerson",
      },
    ],
  },
  {
    date: "2006-04-05",
    stadium: "Estádio Gerson Amaral",
    manager: "Agnaldo Liz",
    starters: [
      "Delmir",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Sílvio",
      "Leomar",
      "Arivélton",
      "Édson Sá",
      "Ribamar",
      "Jessuí",
    ],
    subs: [
      { out: "Alisson", in: "Émerson" },
      { out: "Leomar", in: "Cláudio" },
      { out: "Ribamar", in: "João Alves" },
    ],
    oppGoals: [
      { name: "Édson Di", minute: 28 },
      { name: "Calmon", minute: 35 },
      { name: "Vovô", minute: 74 },
    ],
  },
  {
    date: "2006-04-09",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Hércules Martins",
    manager: "Ricardo Oliveira",
    attendance: 1492,
    grossRevenue: 7095.5,
    grossRevenueText: "R$ 7.095,50",
    starters: [
      "Beto Goleiro",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Marquinhos Mossoró",
      "Edmílson",
      "Édson Sá",
      "Arivélton",
      "Ribamar",
      "Bruno",
    ],
    subs: [
      {
        out: "Edmílson",
        in: "Acácio",
      },
      {
        out: "Bruno",
        in: "Luciano",
      },
    ],
    csaGoals: [
      {
        name: "Pícoli",
        minute: 2,
      },
      {
        name: "Ribamar",
        minute: 6,
      },
    ],
  },
  {
    date: "2006-04-12",
    csaGoals: [{ name: "Arivélton" }],
    oppGoals: [{ name: "Da Silva" }],
  },
  {
    date: "2006-04-16",
    csaGoals: [{ name: "Ricardo Boiadeiro" }],
    oppGoals: [{ name: "Jânio" }],
  },
  {
    date: "2006-04-19",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "José Vicente Neto",
    manager: "Gilberto Pereira",
    attendance: 2844,
    grossRevenue: 10540.4,
    grossRevenueText: "R$ 10.540,40",
    starters: [
      "Beto Goleiro",
      "Leandro",
      "Júnior",
      "Mineiro",
      "Jean",
      "Rogerinho",
      "Marquinhos Mossoró",
      "Arivélton",
      "Ivan",
      "Ribamar",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Arivélton",
        in: "Warley",
      },
      {
        out: "Ribamar",
        in: "Luciano",
      },
    ],
    csaGoals: [
      {
        name: "Ricardo Boiadeiro",
        minute: 42,
      },
      {
        name: "Warley",
        minute: 58,
      },
    ],
    oppGoals: [
      {
        name: "Leo Macaé",
        minute: 18,
      },
      {
        name: "Leo Macaé",
        minute: 32,
      },
      {
        name: "Júlio",
        minute: 75,
      },
    ],
    oppReds: [
      "Xandão",
    ],
  },
  {
    date: "2006-04-23",
    stadium: "Estádio José Gomes da Costa",
    referee: "Flávio Feijó de Omena",
    manager: "Gilberto Pereira",
    starters: [
      "Vílson",
      "Fábio",
      "Alisson",
      "Mineiro",
      "Rogerinho",
      "Leandro",
      "Marquinhos Mossoró",
      "Jean",
      "Ivan",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Jean",
        in: "Ribamar",
      },
      {
        out: "Ivan",
        in: "Jéferson",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Leomar",
      },
    ],
    csaGoals: [
      {
        name: "Warley",
        minute: 15,
      },
      {
        name: "Mineiro",
        minute: 39,
      },
    ],
    oppGoals: [
      {
        name: "Mário Neto",
        minute: 51,
      },
    ],
  },
  {
    date: "2006-04-26",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sivaldo Silva",
    manager: "Gilberto Pereira",
    attendance: 3271,
    grossRevenue: 10550.5,
    grossRevenueText: "R$ 10.550,50",
    starters: [
      "Vílson",
      "Fábio",
      "Alisson",
      "Mineiro",
      "Luciano",
      "Leandro",
      "Jean",
      "Marquinhos Mossoró",
      "Ivan",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Luciano",
        in: "Jéferson",
      },
      {
        out: "Ivan",
        in: "Leomar",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Ribamar",
      },
    ],
    csaGoals: [
      {
        name: "Jean",
        minute: 35,
      },
      {
        name: "Ricardo Boiadeiro",
        minute: 40,
      },
    ],
    oppGoals: [
      {
        name: "Rômulo",
        minute: 9,
      },
    ],
  },
  {
    date: "2006-04-30",
    stadium: "Estádio Juca Sampaio",
    referee: "Fernando Rogério",
    oppGoals: [{ name: "Batistinha" }],
  },
  {
    date: "2006-05-03",
    stadium: "Coaracy da Mata (Fumeirão)",
    referee: "Rosival Aureliano",
    attendance: 4693,
    grossRevenue: 12838,
    grossRevenueText: "R$ 12.838,00",
    oppGoals: [
      {
        name: "Gílson Costa",
        minute: 34,
      },
      {
        name: "Clayton",
        minute: 92,
      },
    ],
  },
  {
    date: "2006-05-07",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Charles Hebert",
    manager: "Gilberto Pereira",
    attendance: 2480,
    grossRevenue: 9118,
    grossRevenueText: "R$ 9.118,00",
    starters: [
      "Beto Goleiro",
      "Fábio",
      "Alisson",
      "Leandro",
      "Rogerinho",
      "Leomar",
      "Ivan",
      "Jean",
      "Dejames",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Ivan",
        in: "Mineiro",
      },
      {
        out: "Dejames",
        in: "Alexsandro",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Ribamar",
      },
    ],
    csaGoals: [
      {
        name: "Dejames",
        minute: 65,
      },
    ],
    oppGoals: [
      {
        name: "Bimba",
        minute: 5,
      },
    ],
  },
  {
    date: "2006-05-10",
    csaGoals: [
      { name: "Ricardo Boiadeiro" },
      { name: "Leomar" },
      { name: "Mineiro" },
      { name: "Rogerinho" },
    ],
  },
  {
    date: "2006-05-14",
    csaGoals: [{ name: "Édson Sá" }],
  },
  {
    date: "2006-05-17",
    csaGoals: [{ name: "Alisson" }],
  },
  {
    date: "2006-05-21",
    stadium: "Estádio Alfredo Leahy",
    referee: "Marcelo Fonseca",
    csaGoals: [
      {
        name: "Marquinhos Mossoró",
        minute: 67,
      },
    ],
    oppReds: [
      "Laranjeiras",
      "Ronald",
      "Róger",
    ],
  },
  {
    date: "2006-05-24",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Fernando Rogério",
    manager: "Ricardo Oliveira",
    attendance: 4104,
    grossRevenue: 12399,
    grossRevenueText: "R$ 12.399,00",
    starters: [
      "Vílson",
      "Leandro",
      "Alisson",
      "Mineiro",
      "Fábio",
      "Jean",
      "Marquinhos Mossoró",
      "Rogerinho",
      "Édson Sá",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Mineiro",
        in: "Edmílson",
      },
      {
        out: "Édson Sá",
        in: "Ivan",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Sílvio",
      },
    ],
    csaGoals: [
      {
        name: "Édson Sá",
        minute: 34,
      },
      {
        name: "Édson Sá",
        minute: 42,
      },
      {
        name: "Édson Sá",
        minute: 49,
      },
      {
        name: "Fábio",
        minute: 62,
      },
      {
        name: "Rogerinho",
        minute: 85,
      },
    ],
    csaReds: [
      "Alisson",
    ],
    oppReds: [
      "Hélio",
    ],
  },
  {
    date: "2006-05-28",
    csaGoals: [
      {
        name: "Ricardo Boiadeiro",
      },
    ],
    oppGoals: [
      {
        name: "Léo Macaé",
      },
      {
        name: "Léo Macaé",
      },
      {
        name: "Rodrigo Silva",
      },
      {
        name: "Rodrigo Silva",
      },
      {
        name: "Elpídio Silva",
      },
    ],
  },
  {
    date: "2006-05-31",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Fernando Rogério",
    manager: "Marcos Magalhães",
    starters: [
      "Vílson",
      "Fábio",
      "Sílvio",
      "Alisson",
      "Rogerinho",
      "Leomar",
      "Marquinhos Mossoró",
      "Édson Sá",
      "Ribamar",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Alisson",
        in: "Leandro",
      },
      {
        out: "Leomar",
        in: "Mineiro",
      },
      {
        out: "Ribamar",
        in: "Alexsandro",
      },
    ],
    csaGoals: [
      {
        name: "Ribamar",
        minute: 9,
      },
      {
        name: "Ribamar",
        minute: 46,
      },
      {
        name: "Warley",
        minute: 72,
      },
    ],
    oppGoals: [
      {
        name: "Silva",
        minute: 25,
      },
    ],
    oppReds: [
      "Júnior",
    ],
  },
  {
    date: "2006-06-11",
    stadium: "Estádio Nelson Peixoto Feijó",
    referee: "Wagner Tardelli",
    manager: "Marcos Magalhães",
    attendance: 2314,
    grossRevenue: 11162,
    grossRevenueText: "R$ 11.162,00",
    starters: [
      "Vílson",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Mineiro",
      "Marquinhos Mossoró",
      "Jean",
      "Dejames",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Mineiro",
        in: "Leandro",
      },
      {
        out: "Dejames",
        in: "Teo",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Ribamar",
      },
    ],
  },
  {
    date: "2006-06-14",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Jorge Figueira",
    manager: "Marcos Magalhães",
    attendance: 8040,
    grossRevenue: 20301.5,
    grossRevenueText: "R$ 20.301,50",
    starters: [
      "Vílson",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Jean",
      "Leomar",
      "Marquinhos Mossoró",
      "Édson Sá",
      "Warley",
      "Ricardo Boiadeiro",
    ],
    subs: [
      {
        out: "Jean",
        in: "Leandro",
      },
      {
        out: "Warley",
        in: "Ribamar",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Alexsandro",
      },
    ],
    csaGoals: [
      {
        name: "Warley",
        minute: 72,
      },
      {
        name: "Édson Sá",
        minute: 80,
        penalty: true,
      },
    ],
    csaReds: [
      "Beto",
    ],
  },
  {
    date: "2006-06-17",
    stadium: "Estádio Rei Pelé (Trapichão)",
    referee: "Sálvio Spínola Fagundes Filho",
    manager: "Marcos Magalhães",
    attendance: 12525,
    grossRevenue: 32035,
    grossRevenueText: "R$ 32.035,00",
    starters: [
      "Vílson",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Mineiro",
      "Leomar",
      "Marquinhos Mossoró",
      "Édson Sá",
      "Ricardo Boiadeiro",
      "Warley",
    ],
    subs: [
      {
        out: "Mineiro",
        in: "Ribamar",
      },
      {
        out: "Leomar",
        in: "Jean",
      },
      {
        out: "Ricardo Boiadeiro",
        in: "Alexsandro",
      },
    ],
    oppGoals: [
      {
        name: "Édson Di",
        minute: 69,
      },
    ],
  },
  {
    date: "2006-06-21",
    stadium: "Estádio Gerson Amaral",
    referee: "Wilson Luís Seneme",
    manager: "Marcos Magalhães",
    attendance: 4664,
    grossRevenue: 13688,
    grossRevenueText: "R$ 13.688,00",
    starters: [
      "Vílson",
      "Fábio",
      "Pícoli",
      "Alisson",
      "Rogerinho",
      "Marquinhos Mossoró",
      "Mineiro",
      "Édson Sá",
      "Ribamar",
      "Alexsandro",
      "Warley",
    ],
    subs: [
      {
        out: "Alexsandro",
        in: "Sílvio",
      },
      {
        out: "Warley",
        in: "Leomar",
      },
    ],
    csaGoals: [
      {
        name: "Mineiro",
        minute: 22,
      },
    ],
    csaReds: [
      "Édson Sá",
    ],
    penaltiesFor: 5,
    penaltiesAgainst: 6,
  },
];

export const RELATED_PAIRS = [
  ["2006-03-26", "2006-03-29"],
  ["2006-04-02", "2006-04-05"],
  ["2006-05-28", "2006-05-31"],
  ["2006-06-11", "2006-06-14"],
  ["2006-06-17", "2006-06-21"],
];
