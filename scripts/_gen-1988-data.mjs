/**
 * Generates scripts/data/season-1988-alagoano.mjs
 * Run: node scripts/_gen-1988-data.mjs
 *
 * Fonte enxuta: data, C/F/N, placar, adversário, autores dos gols do CSA (quando há).
 * C=home, F=away, N=neutral (interpretação da coluna C/F/N).
 * Fases/rodadas: estrutura do Campeonato Alagoano 1988 (fonte do usuário).
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const OPP = {
  Penedense: "Penedense-AL",
  Comercial: "Comercial-AL",
  Capelense: "Capelense-AL",
  Ferroviário: "Ferroviário-AL",
  CSE: "CSE-AL",
  ASA: "ASA-AL",
  Cruzeiro: "Cruzeiro-AL",
  "São Domingos": "São Domingos-AL",
  CRB: "CRB-AL",
};

const HA = { C: "home", F: "away", N: "neutral" };

/** [id, d/m/y, C|F|N, gf, ga, opp, goals[]|null, phase, round] */
const RAW = [
  // ——— 1º turno da 1ª fase ———
  [801, "28/02/1988", "F", 3, 0, "Penedense", null, "1º turno da 1ª fase", "1ª rodada"],
  [802, "05/03/1988", "C", 2, 0, "Comercial", null, "1º turno da 1ª fase", "2ª rodada"],
  [803, "13/03/1988", "F", 0, 2, "Capelense", null, "1º turno da 1ª fase", "3ª rodada"],
  [804, "20/03/1988", "N", 0, 1, "Ferroviário", null, "1º turno da 1ª fase", "4ª rodada"],
  [805, "27/03/1988", "F", 1, 2, "CSE", null, "1º turno da 1ª fase", "5ª rodada"],
  [806, "03/04/1988", "C", 1, 2, "ASA", null, "1º turno da 1ª fase", "6ª rodada"],
  [807, "10/04/1988", "F", 4, 0, "Cruzeiro", null, "1º turno da 1ª fase", "7ª rodada"],
  [808, "17/04/1988", "C", 0, 0, "São Domingos", null, "1º turno da 1ª fase", "8ª rodada"],
  // ——— 2º turno da 1ª fase ———
  [809, "24/04/1988", "N", 0, 1, "CRB", null, "2º turno da 1ª fase", "1ª rodada"],
  [810, "28/04/1988", "C", 2, 4, "Penedense", null, "2º turno da 1ª fase", "2ª rodada"],
  [811, "01/05/1988", "F", 1, 2, "Comercial", null, "2º turno da 1ª fase", "3ª rodada"],
  [812, "08/05/1988", "C", 2, 1, "Capelense", ["Chico"], "2º turno da 1ª fase", "4ª rodada"],
  [813, "15/05/1988", "N", 1, 1, "Ferroviário", ["Zé Pedro"], "2º turno da 1ª fase", "5ª rodada"],
  [814, "21/05/1988", "C", 3, 3, "CSE", null, "2º turno da 1ª fase", "6ª rodada"],
  [815, "28/05/1988", "F", 0, 2, "ASA", null, "2º turno da 1ª fase", "7ª rodada"],
  [816, "05/06/1988", "C", 2, 0, "Cruzeiro", ["Chico"], "2º turno da 1ª fase", "8ª rodada"],
  [817, "09/06/1988", "F", 0, 1, "São Domingos", null, "2º turno da 1ª fase", "9ª rodada"],
  [818, "11/06/1988", "N", 0, 1, "CRB", null, "2º turno da 1ª fase", "10ª rodada"],
  // ——— 1º turno da 2ª fase ———
  [819, "10/07/1988", "F", 0, 1, "Penedense", null, "1º turno da 2ª fase", "1ª rodada"],
  [823, "10/08/1988", "C", 1, 0, "Comercial", ["Zé Pedro"], "1º turno da 2ª fase", "2ª rodada"],
  [820, "24/07/1988", "F", 1, 1, "Capelense", null, "1º turno da 2ª fase", "3ª rodada"],
  [821, "30/07/1988", "N", 3, 1, "Ferroviário", ["Zé Pedro", "Maurinho", "Jairo"], "1º turno da 2ª fase", "4ª rodada"],
  [822, "06/08/1988", "C", 0, 0, "ASA", null, "1º turno da 2ª fase", "5ª rodada"],
  [825, "17/08/1988", "F", 2, 3, "CSE", null, "1º turno da 2ª fase", "6ª rodada"],
  [824, "14/08/1988", "F", 4, 1, "Cruzeiro", ["Naldo", "Zé Pedro", "Maurinho", "Borges"], "1º turno da 2ª fase", "7ª rodada"],
  [826, "21/08/1988", "C", 1, 0, "São Domingos", ["Ricardo"], "1º turno da 2ª fase", "8ª rodada"],
  [827, "28/08/1988", "N", 0, 1, "CRB", null, "1º turno da 2ª fase", "9ª rodada"],
  // ——— 2º turno da 2ª fase ———
  [828, "03/09/1988", "C", 3, 2, "Penedense", ["Ivan", "Zezinho", "Zé Pedro"], "2º turno da 2ª fase", "1ª rodada"],
  [829, "11/09/1988", "F", 0, 0, "Comercial", null, "2º turno da 2ª fase", "2ª rodada"],
  [830, "14/09/1988", "C", 1, 0, "Capelense", ["Maurinho"], "2º turno da 2ª fase", "3ª rodada"],
  [831, "17/09/1988", "N", 2, 0, "Ferroviário", null, "2º turno da 2ª fase", "4ª rodada"],
  [832, "21/09/1988", "C", 2, 2, "CSE", null, "2º turno da 2ª fase", "5ª rodada"],
  [833, "25/09/1988", "F", 3, 1, "ASA", null, "2º turno da 2ª fase", "6ª rodada"],
  [834, "01/10/1988", "C", 2, 1, "Cruzeiro", ["Carlos Silva", "Zé Pedro"], "2º turno da 2ª fase", "7ª rodada"],
  [835, "08/10/1988", "F", 1, 1, "São Domingos", null, "2º turno da 2ª fase", "8ª rodada"],
  [836, "16/10/1988", "N", 0, 0, "CRB", null, "2º turno da 2ª fase", "9ª rodada"],
  // ——— Quadrangular (fonte do usuário: 4 rodadas; planilha traz +2 jogos no mesmo grupo) ———
  [837, "20/10/1988", "C", 2, 1, "CSE", null, "Quadrangular", "1ª rodada"],
  [838, "23/10/1988", "N", 1, 0, "CRB", ["Ivan"], "Quadrangular", "2ª rodada"],
  [839, "26/10/1988", "F", 1, 0, "São Domingos", null, "Quadrangular", "3ª rodada"],
  [840, "30/10/1988", "F", 1, 2, "CSE", ["Carlos Silva"], "Quadrangular", "4ª rodada"],
  [841, "02/11/1988", "C", 1, 0, "São Domingos", null, "Quadrangular", "5ª rodada"],
  [842, "06/11/1988", "N", 0, 1, "CRB", null, "Quadrangular", "6ª rodada"],
  // ——— Fase final ———
  [843, "10/11/1988", "F", 1, 0, "São Domingos", null, "Fase final", "1ª rodada"],
  [844, "13/11/1988", "C", 1, 1, "ASA", null, "Fase final", "2ª rodada"],
  [845, "17/11/1988", "C", 5, 2, "CSE", [
    "Café",
    "Chico",
    "Zé Pedro",
    "Carlinhos Paulista",
    "Carlos Silva",
  ], "Fase final", "3ª rodada"],
  [846, "20/11/1988", "F", 2, 1, "CSE", null, "Fase final", "4ª rodada"],
  [847, "23/11/1988", "C", 2, 1, "São Domingos", ["Paulo Marcos", "Zé Pedro"], "Fase final", "5ª rodada"],
  [848, "27/11/1988", "F", 2, 2, "ASA", null, "Fase final", "6ª rodada"],
];

function toIso(dmy) {
  const [d, m, y] = dmy.split("/");
  return `${y}-${m}-${d}`;
}

const GAMES = RAW.map(([sheetId, dmy, cfn, gf, ga, opp, goals, phase, round]) => {
  /** @type {any} */
  const g = {
    sheetId,
    date: toIso(dmy),
    phase,
    round,
    opponent: OPP[opp],
    ha: HA[cfn],
    gf,
    ga,
  };
  if (goals?.length) {
    g.goals = goals.map((name) => ({ name }));
  }
  return g;
});

// Keep chronological order in exported file (by date, then sheetId)
GAMES.sort((a, b) => (a.date === b.date ? a.sheetId - b.sheetId : a.date.localeCompare(b.date)));

let w = 0,
  d = 0,
  l = 0,
  gf = 0,
  ga = 0;
for (const g of GAMES) {
  if (g.gf > g.ga) w++;
  else if (g.gf < g.ga) l++;
  else d++;
  gf += g.gf;
  ga += g.ga;
}
console.log(`games=${GAMES.length} V${w} E${d} D${l} GF${gf} GC${ga}`);
if (GAMES.length !== 48 || w !== 22 || d !== 11 || l !== 15) {
  console.error("WDL mismatch vs resumo (J48 V22 E11 D15)");
  process.exit(1);
}

const out = `/** Campeonato Alagoano 1988 — jogos do CSA (fonte enxuta).
 * Sem árbitro/estádio/público/escalação/técnico (não informados).
 * C/F/N interpretado como home/away/neutral.
 * Gols: apenas autores do CSA quando a fonte listou nomes (minutos desconhecidos).
 * Fases/rodadas: estrutura do campeonato (CSA campeão).
 * sheetId = ID da planilha original.
 * Contagem: J48 V22 E11 D15 GP67 GC49.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1988;

/**
 * @typedef {{
 *   sheetId: number;
 *   date: string;
 *   phase: string;
 *   round: string;
 *   opponent: string;
 *   ha: "home"|"away"|"neutral";
 *   gf: number;
 *   ga: number;
 *   goals?: { name: string }[];
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = ${JSON.stringify(GAMES, null, 2)};
`;

const dest = resolve(__dirname, "data", "season-1988-alagoano.mjs");
writeFileSync(dest, out);
console.log("wrote", dest);
