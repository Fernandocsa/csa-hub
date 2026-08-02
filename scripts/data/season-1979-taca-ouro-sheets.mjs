/**
 * CSA Taça de Ouro 1979 — complementary sheets (Grupo F, 1ª fase).
 * Only CSA-side data from source; opponent lineups omitted.
 * 2ª fase already in DB from prior import — not overwritten here.
 */
export const SEASON = "1979";
export const COMPETITION_NAME = "Taça de Ouro";

/** Absolute minute: 1ºT = m; 2ºT = 45+m */
export function absMin(half, m) {
  if (m == null) return 0;
  return half === 2 ? 45 + m : m;
}

/**
 * Meta fixes for 1ª fase Grupo F.
 * clearStadium: true → set stadium_id NULL (fonte sem estádio).
 */
export const MATCH_FIXES = {
  "1979-09-25": { phase: "1ª Fase - Grupo F", clearStadium: true },
  "1979-10-03": { phase: "1ª Fase - Grupo F", clearStadium: true },
  "1979-10-06": {
    phase: "1ª Fase - Grupo F",
    stadium: "Estádio Rei Pelé (Trapichão)",
    attendance: 7367,
    revenueText: "Cr$ 317.440,00",
    manager: "Laerte Dória",
  },
  "1979-10-10": { phase: "1ª Fase - Grupo F", clearStadium: true },
  "1979-10-14": {
    phase: "1ª Fase - Grupo F",
    stadium: "Estádio Rei Pelé (Trapichão)",
    revenueText: "Cr$ 736.380,00",
    manager: "Evaristo de Macedo",
  },
  "1979-10-17": { phase: "1ª Fase - Grupo F", clearStadium: true },
  "1979-10-21": { phase: "1ª Fase - Grupo F", clearStadium: true },
  "1979-10-30": { phase: "1ª Fase - Grupo F", clearStadium: true },
  "1979-11-03": { phase: "1ª Fase - Grupo F", clearStadium: true },
};

/**
 * @typedef {{ name: string, minute?: number, penalty?: boolean }} Goal
 * @typedef {{ out: string, in: string, minute?: number }} Sub
 * @typedef {{
 *   date: string,
 *   referee?: string|null,
 *   refereeState?: string|null,
 *   manager?: string|null,
 *   starters?: string[],
 *   subs?: Sub[],
 *   csaGoals?: Goal[],
 *   oppGoals?: Goal[],
 * }} Sheet
 */

/** @type {Sheet[]} */
export const SHEETS = [
  // 1979-09-25 — só placar
  {
    date: "1979-10-03",
    csaGoals: [{ name: "Almir" }],
    oppGoals: [{ name: "Marinho" }, { name: "Marinho" }],
  },
  {
    date: "1979-10-06",
    referee: "Ivanildo Sales da Silva",
    refereeState: "PA",
    manager: "Laerte Dória",
    starters: [
      "Rafael",
      "Hudson",
      "Zé Luiz",
      "Ademar",
      "Luizinho",
      "Alberto",
      "Gilmar",
      "Aílton",
      "Ênio Oliveira",
      "Corinto",
      "Odilon",
    ],
    subs: [
      { out: "Luizinho", in: "Paulo" },
      { out: "Ênio Oliveira", in: "Almir" },
    ],
    csaGoals: [
      { name: "Aílton", minute: absMin(2, 14) },
      { name: "Gilmar", minute: absMin(2, 20) },
    ],
    oppGoals: [{ name: "Freitas", minute: absMin(1, 2) }],
  },
  {
    date: "1979-10-10",
    csaGoals: [{ name: "Ênio Oliveira" }, { name: "Gilmar" }],
    oppGoals: [{ name: "Zé Eduardo" }],
  },
  {
    date: "1979-10-14",
    referee: "Márcio Campos Sales",
    refereeState: "SP",
    manager: "Evaristo de Macedo",
    starters: [
      "Rafael",
      "Hudson",
      "Zé Luiz",
      "Ademar",
      "Evaristo",
      "Alberto",
      "Gilmar",
      "Aílton",
      "Ênio Oliveira",
      "Almir",
      "Odilon",
    ],
    subs: [
      { out: "Ênio Oliveira", in: "Jorge Siri" },
      { out: "Almir", in: "Luiz Carlos" },
    ],
    csaGoals: [{ name: "Almir" }],
  },
  {
    date: "1979-10-17",
    csaGoals: [{ name: "Odilon" }],
    oppGoals: [{ name: "Babá" }],
  },
  {
    date: "1979-10-21",
    csaGoals: [{ name: "Almir" }, { name: "Almir" }, { name: "Jorge Siri" }],
  },
  {
    date: "1979-10-30",
    csaGoals: [{ name: "Ênio Oliveira" }],
    oppGoals: [{ name: "Aílton" }, { name: "Ricardo" }],
  },
  {
    date: "1979-11-03",
    csaGoals: [
      { name: "Almir" },
      { name: "Almir" },
      { name: "Ênio Oliveira" },
    ],
    oppGoals: [{ name: "Danilo Menezes" }],
  },
];

/** Final table line from source (campanha completa, não só 1ª fase). */
export const SEASON_CLASSIFICATION = "25º";
