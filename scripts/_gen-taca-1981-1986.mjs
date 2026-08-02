/**
 * Generates scripts/data/seasons-taca-1981-1986.mjs
 * Run: node scripts/_gen-taca-1981-1986.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REI = "Estádio Rei Pelé (Trapichão)";
const MINEIRAO = "Estádio Mineirão";
const AMIGAO = "Amigão";
const FRAGELLI = "José Fragelli";
const ILHA = "Estádio Ilha do Retiro";
const VIVALDO = "Vivaldo Lima";
const MARACA = "Estádio Maracanã";
const FONTE = "Fonte Nova";
const JANUARIO = "São Januário";
const LEVY = "Major Levy Sobrinho";
const BATISTA = "Estádio Lourival Baptista";
const AFLITOS = "Estádio Aflitos";
const MORUMBI = "Estádio do Morumbi";
const CASTELAO = "Estádio Castelão";
const ALBERTAO = "Estádio Albertão";
const ARRUDA = "Estádio do Arruda";
const PSJ = "Parque São Jorge";
const PV = "Estádio Presidente Vargas";
const BAENAO = "Baenão";
const CBRANCO = "Castelo Branco";
const ALACIR = "Alacir Nunes";
const LUCARI = "Estádio Moisés Lucarelli";
const BRINCO = "Estádio Brinco de Ouro";
const MORENAO = "Morenão";
const PALESTRA = "Palestra Itália";
const PINHEIRAO = "Pinheirão";
const ITALO = "Ítalo Del Cima";
const SCHLEMM = "Ernesto Schlemm Sobrinho";
const HERMES = "Marechal Hermes";
const CASTELAO_SL = "Castelão (São Luís)";

function g(partial) {
  return partial;
}
function og(name) {
  return { name, ownGoal: true, ownGoalDirection: "for" };
}
function goals(...names) {
  return names.flatMap((n) =>
    typeof n === "object" ? [n] : [{ name: n }],
  );
}
function lineup(starters, subs = []) {
  return {
    starters,
    entered: subs.map((s) => s.in),
    subs,
  };
}

function summarize(games) {
  let w = 0,
    d = 0,
    l = 0,
    gp = 0,
    gc = 0;
  for (const x of games) {
    if (x.gf > x.ga) w++;
    else if (x.gf < x.ga) l++;
    else d++;
    gp += x.gf;
    gc += x.ga;
  }
  return { games: games.length, wins: w, draws: d, losses: l, goals_for: gp, goals_against: gc };
}

/** @type {{ competition: string, season: number, expected: object, games: any[] }[]} */
const BATCHES = [];

// ——— 1981 Taça de Ouro ———
{
  const games = [
    g({ date: "1981-01-18", phase: "1ª fase", opponent: "Atlético-MG", ha: "away", gf: 0, ga: 3, stadium: MINEIRAO }),
    g({ date: "1981-01-21", phase: "1ª fase", opponent: "Fluminense-RJ", ha: "home", gf: 0, ga: 2, stadium: REI }),
    g({ date: "1981-01-25", phase: "1ª fase", opponent: "River-PI", ha: "home", gf: 2, ga: 1, stadium: REI, goals: goals("Jacozinho", "Jacozinho") }),
    g({ date: "1981-01-29", phase: "1ª fase", opponent: "Campinense-PB", ha: "away", gf: 1, ga: 0, stadium: AMIGAO, goals: goals("Rômel") }),
    g({ date: "1981-02-01", phase: "1ª fase", opponent: "São Paulo-SP", ha: "home", gf: 2, ga: 2, stadium: REI, goals: goals("Luís Paulo", "Dentinho") }),
    g({ date: "1981-02-04", phase: "1ª fase", opponent: "Mixto-MT", ha: "away", gf: 0, ga: 3, stadium: FRAGELLI }),
    g({ date: "1981-02-07", phase: "1ª fase", opponent: "Ferroviário-CE", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1981-02-14", phase: "1ª fase", opponent: "América-RN", ha: "home", gf: 3, ga: 2, stadium: REI, goals: goals("Antunes", "Antunes", "Rômel") }),
    g({ date: "1981-02-26", phase: "1ª fase", opponent: "Sport-PE", ha: "away", gf: 1, ga: 2, stadium: ILHA, goals: goals("Dentinho") }),
    g({ date: "1981-03-07", phase: "2ª fase", opponent: "Vasco-RJ", ha: "home", gf: 1, ga: 1, stadium: REI, goals: goals("Rômel") }),
    g({ date: "1981-03-12", phase: "2ª fase", opponent: "Galícia-BA", ha: "home", gf: 4, ga: 0, stadium: REI, goals: goals("Rômel", "Rômel", "Dentinho", "Adílton") }),
    g({ date: "1981-03-15", phase: "2ª fase", opponent: "Nacional-AM", ha: "away", gf: 1, ga: 2, stadium: VIVALDO, goals: goals("Jorginho") }),
    g({ date: "1981-03-19", phase: "2ª fase", opponent: "Vasco-RJ", ha: "away", gf: 1, ga: 1, stadium: MARACA, goals: goals("Dentinho") }),
    g({ date: "1981-03-26", phase: "2ª fase", opponent: "Galícia-BA", ha: "away", gf: 3, ga: 1, stadium: FONTE, goals: goals("Jorginho", "Jorginho", "Rômel") }),
    g({ date: "1981-04-04", phase: "2ª fase", opponent: "Nacional-AM", ha: "home", gf: 3, ga: 0, stadium: REI, goals: goals("Luís Paulo", "Mauro", "Rômel") }),
    g({ date: "1981-04-09", phase: "Oitavas de final", opponent: "Botafogo-RJ", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1981-04-12", phase: "Oitavas de final", opponent: "Botafogo-RJ", ha: "away", gf: 0, ga: 2, stadium: HERMES }),
  ];
  BATCHES.push({ competition: "Taça de Ouro", season: 1981, expected: summarize(games), games });
}

// ——— 1982 Taça de Ouro ———
{
  const games = [
    g({ date: "1982-01-17", phase: "1ª fase", opponent: "Sport-PE", ha: "home", gf: 1, ga: 2, stadium: REI, goals: goals("Flávio") }),
    g({ date: "1982-01-24", phase: "1ª fase", opponent: "Itabaiana-SE", ha: "home", gf: 2, ga: 0, stadium: REI, goals: goals("Jacozinho", "Rômel") }),
    g({ date: "1982-01-28", phase: "1ª fase", opponent: "Fluminense-RJ", ha: "away", gf: 0, ga: 2, stadium: JANUARIO }),
    g({ date: "1982-01-31", phase: "1ª fase", opponent: "Inter de Limeira-SP", ha: "away", gf: 2, ga: 2, stadium: LEVY, goals: goals("Américo", "Ademir") }),
    g({ date: "1982-02-04", phase: "1ª fase", opponent: "Itabaiana-SE", ha: "away", gf: 0, ga: 0, stadium: BATISTA }),
    g({ date: "1982-02-07", phase: "1ª fase", opponent: "Fluminense-RJ", ha: "home", gf: 3, ga: 3, stadium: REI, goals: goals("Zé Carlos", "Zé Carlos", "Ademir") }),
    g({ date: "1982-02-10", phase: "1ª fase", opponent: "Inter de Limeira-SP", ha: "home", gf: 1, ga: 1, stadium: REI, goals: goals("Dentinho") }),
    g({ date: "1982-02-14", phase: "1ª fase", opponent: "Sport-PE", ha: "away", gf: 0, ga: 3, stadium: ILHA }),
    g({ date: "1982-02-20", phase: "Repescagem", opponent: "Náutico-PE", ha: "away", gf: 2, ga: 6, stadium: AFLITOS, goals: goals("Freitas", "Dentinho") }),
  ];
  BATCHES.push({ competition: "Taça de Ouro", season: 1982, expected: summarize(games), games });
}

// ——— 1982 Taça de Prata ———
{
  const games = [
    g({ date: "1982-02-28", phase: "3ª fase", opponent: "Fortaleza-CE", ha: "home", gf: 2, ga: 0, note: "Gols não informados" }),
    g({ date: "1982-03-07", phase: "3ª fase", opponent: "Fortaleza-CE", ha: "away", gf: 1, ga: 1, note: "Gol não informado" }),
    g({ date: "1982-03-14", phase: "4ª fase", opponent: "Mixto-MT", ha: "home", gf: 3, ga: 1 }),
    g({ date: "1982-03-20", phase: "4ª fase", opponent: "Mixto-MT", ha: "away", gf: 2, ga: 1 }),
    // Caxias 12/04, Uberlândia 16/04 e Comercial 20/04 são Taça de Prata 1980 — não reimportar em 1982
    g({ date: "1982-03-28", phase: "Semifinal", opponent: "Joinville-SC", ha: "away", gf: 1, ga: 2, stadium: SCHLEMM, note: "Gol não informado" }),
    g({ date: "1982-04-04", phase: "Semifinal", opponent: "Joinville-SC", ha: "home", gf: 2, ga: 1, stadium: REI, note: "Gols não informados; CSA classificado pela melhor campanha" }),
    g({ date: "1982-04-11", phase: "Final", opponent: "Campo Grande-RJ", ha: "home", gf: 4, ga: 3, stadium: REI, note: "Gols não informados" }),
    g({
      date: "1982-04-18",
      phase: "Final",
      opponent: "Campo Grande-RJ",
      ha: "away",
      gf: 1,
      ga: 2,
      stadium: ITALO,
      manager: "Jorge Vasconcelos",
      goals: goals("Ademir"),
      ...lineup(
        ["Joseli", "Flávio", "Fernando", "Café", "Zezinho", "Ademir", "Rômel", "Zé Carlos", "Jacozinho", "Freitas", "Mug"],
        [{ out: "Freitas", in: "Veiga" }],
      ),
    }),
    g({
      date: "1982-04-20",
      phase: "Final",
      opponent: "Campo Grande-RJ",
      ha: "away",
      gf: 0,
      ga: 3,
      stadium: ITALO,
      manager: "Jorge Vasconcelos",
      ...lineup(
        ["Joseli", "Flávio", "Jerônimo", "Fernando", "Zezinho", "Ademir", "Zé Carlos", "Veiga", "Américo", "Dentinho", "Mug"],
        [
          { out: "Zé Carlos", in: "Josenílton" },
          { out: "Américo", in: "Freitas" },
        ],
      ),
    }),
  ];
  BATCHES.push({ competition: "Taça de Prata", season: 1982, expected: summarize(games), games });
}

// ——— 1983 Taça de Ouro ———
{
  const games = [
    g({ date: "1983-01-23", phase: "1ª fase", opponent: "Tiradentes-PI", ha: "home", gf: 4, ga: 0, stadium: REI, goals: [...goals("Marciano", "Marciano", "Rômel"), og("Zezé")] }),
    g({ date: "1983-01-26", phase: "1ª fase", opponent: "Fluminense-RJ", ha: "away", gf: 2, ga: 1, stadium: MARACA, goals: goals("Jacozinho", "Marciano") }),
    g({ date: "1983-02-02", phase: "1ª fase", opponent: "Fortaleza-CE", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1983-02-05", phase: "1ª fase", opponent: "Corinthians-SP", ha: "away", gf: 2, ga: 4, stadium: MORUMBI, goals: goals("Zé Carlos", "Rômel") }),
    g({ date: "1983-02-19", phase: "1ª fase", opponent: "Fortaleza-CE", ha: "away", gf: 1, ga: 1, stadium: CASTELAO, goals: goals("Zé Carlos") }),
    g({ date: "1983-02-23", phase: "1ª fase", opponent: "Fluminense-RJ", ha: "home", gf: 1, ga: 2, stadium: REI, goals: goals("Josenílton") }),
    g({ date: "1983-02-27", phase: "1ª fase", opponent: "Corinthians-SP", ha: "home", gf: 1, ga: 2, stadium: REI, goals: goals("Marciano") }),
    g({ date: "1983-03-06", phase: "1ª fase", opponent: "Tiradentes-PI", ha: "away", gf: 1, ga: 2, stadium: ALBERTAO, goals: goals("Rômel") }),
    g({ date: "1983-03-09", phase: "Repescagem", opponent: "Sport-PE", ha: "away", gf: 1, ga: 2, stadium: ARRUDA, goals: goals("Zezinho") }),
  ];
  BATCHES.push({ competition: "Taça de Ouro", season: 1983, expected: summarize(games), games });
}

// ——— 1983 Taça de Prata ———
{
  const games = [
    g({ date: "1983-03-13", phase: "3ª fase", opponent: "Guarany-CE", ha: "home", gf: 4, ga: 1, note: "Gols não informados" }),
    g({ date: "1983-03-20", phase: "3ª fase", opponent: "Guarany-CE", ha: "away", gf: 0, ga: 0 }),
    g({ date: "1983-03-27", phase: "4ª fase", opponent: "Mixto-MT", ha: "away", gf: 3, ga: 1, note: "Gols não informados" }),
    g({ date: "1983-04-03", phase: "4ª fase", opponent: "Mixto-MT", ha: "home", gf: 4, ga: 1, note: "Gols não informados" }),
    g({ date: "1983-04-10", phase: "Semifinal", opponent: "Brasília-DF", ha: "away", gf: 0, ga: 0 }),
    g({ date: "1983-04-17", phase: "Semifinal", opponent: "Brasília-DF", ha: "home", gf: 1, ga: 1, note: "Gol não informado; CSA classificado pela melhor campanha" }),
    g({
      date: "1983-04-24",
      phase: "Final",
      opponent: "Juventus-SP",
      ha: "home",
      gf: 3,
      ga: 1,
      stadium: REI,
      manager: "China",
      goals: goals("Rômel", "Zé Carlos", "Josenílton"),
      ...lineup(["Adeíldo", "Humberto", "Café", "Dequinha", "Zezinho", "Ademir", "Josenílton", "Jorge Siri", "Américo", "Zé Carlos", "Jacozinho"]),
    }),
    g({
      date: "1983-05-01",
      phase: "Final",
      opponent: "Juventus-SP",
      ha: "away",
      gf: 0,
      ga: 3,
      stadium: PSJ,
      manager: "China",
      ...lineup(
        ["Adeíldo", "Humberto", "Café", "Dequinha", "Zezinho", "Ademir", "Jorginho", "Rômel", "Américo", "Zé Carlos", "Jacozinho"],
        [{ out: "Rômel", in: "Josenílton" }],
      ),
    }),
    g({
      date: "1983-05-04",
      phase: "Final",
      opponent: "Juventus-SP",
      ha: "away",
      gf: 0,
      ga: 1,
      stadium: PSJ,
      manager: "China",
      ...lineup(["Adeíldo", "Humberto", "Café", "Dequinha", "Zezinho", "Ademir", "Josenílton", "Jorge Siri", "Américo", "Zé Carlos", "Jacozinho"]),
    }),
  ];
  BATCHES.push({ competition: "Taça de Prata", season: 1983, expected: summarize(games), games });
}

// ——— 1985 Taça de Ouro ———
{
  const games = [
    g({ date: "1985-01-28", phase: "1ª fase - 1º turno", opponent: "Mixto-MT", ha: "home", gf: 0, ga: 1, stadium: REI }),
    g({ date: "1985-01-31", phase: "1ª fase - 1º turno", opponent: "Nacional-AM", ha: "home", gf: 4, ga: 0, stadium: REI, goals: [...goals("Frank", "Frank", "Jacozinho"), og("Marcão")] }),
    g({ date: "1985-02-03", phase: "1ª fase - 1º turno", opponent: "Flamengo-PI", ha: "away", gf: 0, ga: 1, stadium: ALBERTAO }),
    g({ date: "1985-02-06", phase: "1ª fase - 1º turno", opponent: "Sampaio Corrêa-MA", ha: "away", gf: 1, ga: 1, stadium: CASTELAO_SL, goals: goals("Zé Carlos") }),
    g({ date: "1985-02-10", phase: "1ª fase - 1º turno", opponent: "Sergipe-SE", ha: "home", gf: 1, ga: 0, stadium: REI, goals: goals("Frank") }),
    g({ date: "1985-02-13", phase: "1ª fase - 1º turno", opponent: "Ceará-CE", ha: "away", gf: 2, ga: 2, stadium: PV, goals: goals("Frank", "Frank") }),
    g({ date: "1985-02-24", phase: "1ª fase - 1º turno", opponent: "ABC-RN", ha: "home", gf: 2, ga: 1, stadium: REI, goals: goals("Luizão", "Luizão") }),
    g({ date: "1985-02-27", phase: "1ª fase - 1º turno", opponent: "Botafogo-PB", ha: "away", gf: 1, ga: 1, stadium: "Estádio Almeidão", goals: goals("Zé Carlos") }),
    g({ date: "1985-03-03", phase: "1ª fase - 1º turno", opponent: "Sport-PE", ha: "home", gf: 0, ga: 2, stadium: REI }),
    g({ date: "1985-03-06", phase: "1ª fase - 1º turno", opponent: "Paysandu-PA", ha: "home", gf: 2, ga: 1, stadium: REI, goals: goals("Miguelzinho", "Ednaldo") }),
    g({ date: "1985-03-09", phase: "1ª fase - 1º turno", opponent: "Remo-PA", ha: "away", gf: 3, ga: 1, stadium: BAENAO, goals: goals("Josenílton", "Jacozinho", "Zé Carlos") }),
    g({ date: "1985-03-16", phase: "1ª fase - 2º turno", opponent: "Mixto-MT", ha: "away", gf: 0, ga: 1, stadium: FRAGELLI }),
    g({ date: "1985-03-20", phase: "1ª fase - 2º turno", opponent: "Nacional-AM", ha: "away", gf: 0, ga: 1, stadium: VIVALDO }),
    g({ date: "1985-03-24", phase: "1ª fase - 2º turno", opponent: "Flamengo-PI", ha: "home", gf: 1, ga: 0, stadium: REI, goals: goals("Zé Carlos") }),
    g({ date: "1985-03-27", phase: "1ª fase - 2º turno", opponent: "Sampaio Corrêa-MA", ha: "home", gf: 2, ga: 0, stadium: REI, goals: goals("Josenílton", "Café") }),
    g({ date: "1985-03-31", phase: "1ª fase - 2º turno", opponent: "Sergipe-SE", ha: "away", gf: 2, ga: 2, stadium: BATISTA, goals: goals("Zé Carlos", "Zé Carlos") }),
    g({ date: "1985-04-03", phase: "1ª fase - 2º turno", opponent: "Ceará-CE", ha: "home", gf: 2, ga: 0, stadium: REI, goals: [...goals("Luizão"), og("Lula Pereira")] }),
    g({ date: "1985-04-07", phase: "1ª fase - 2º turno", opponent: "ABC-RN", ha: "away", gf: 0, ga: 0, stadium: CBRANCO }),
    g({ date: "1985-04-10", phase: "1ª fase - 2º turno", opponent: "Botafogo-PB", ha: "home", gf: 5, ga: 1, stadium: REI, goals: goals("Carlos Alberto", "Zé Carlos", "Josenílton", "Luizão", "Agnaldo") }),
    g({ date: "1985-04-14", phase: "1ª fase - 2º turno", opponent: "Sport-PE", ha: "away", gf: 1, ga: 3, stadium: ILHA, goals: goals("Veiga") }),
    g({ date: "1985-04-17", phase: "1ª fase - 2º turno", opponent: "Paysandu-PA", ha: "away", gf: 0, ga: 0, stadium: ALACIR }),
    g({ date: "1985-04-21", phase: "1ª fase - 2º turno", opponent: "Remo-PA", ha: "home", gf: 3, ga: 0, stadium: REI, goals: goals("Luizão", "Luizão", "Miguelzinho") }),
    g({ date: "1985-07-03", phase: "2ª fase", opponent: "Guarani-SP", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1985-07-07", phase: "2ª fase", opponent: "Ponte Preta-SP", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1985-07-10", phase: "2ª fase", opponent: "Atlético-MG", ha: "away", gf: 0, ga: 2, stadium: MINEIRAO }),
    g({ date: "1985-07-14", phase: "2ª fase", opponent: "Ponte Preta-SP", ha: "away", gf: 0, ga: 2, stadium: LUCARI }),
    g({ date: "1985-07-17", phase: "2ª fase", opponent: "Atlético-MG", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1985-07-21", phase: "2ª fase", opponent: "Guarani-SP", ha: "away", gf: 1, ga: 6, stadium: BRINCO, goals: goals("Luizão") }),
  ];
  BATCHES.push({ competition: "Taça de Ouro", season: 1985, expected: summarize(games), games });
}

// ——— 1986 Taça de Ouro (inclui jan/1987) ———
{
  const games = [
    g({ date: "1986-08-31", phase: "1ª fase", opponent: "Fortaleza-CE", ha: "away", gf: 0, ga: 0, stadium: CASTELAO }),
    g({ date: "1986-09-04", phase: "1ª fase", opponent: "Nacional-AM", ha: "away", gf: 0, ga: 0, stadium: VIVALDO }),
    g({ date: "1986-09-07", phase: "1ª fase", opponent: "Atlético-MG", ha: "home", gf: 0, ga: 2, stadium: REI }),
    g({ date: "1986-09-10", phase: "1ª fase", opponent: "Portuguesa-SP", ha: "home", gf: 4, ga: 0, stadium: REI, goals: goals("Nívio", "Borges", "Carlinhos Paulista", "Carlinhos Marechal") }),
    g({ date: "1986-09-17", phase: "1ª fase", opponent: "Santa Cruz-PE", ha: "away", gf: 0, ga: 2, stadium: ARRUDA }),
    g({ date: "1986-09-21", phase: "1ª fase", opponent: "Alecrim-RN", ha: "home", gf: 2, ga: 1, stadium: REI, goals: goals("Nívio", "Mário Tilico") }),
    g({ date: "1986-09-24", phase: "1ª fase", opponent: "Botafogo-RJ", ha: "home", gf: 1, ga: 1, stadium: REI, goals: goals("André") }),
    g({ date: "1986-09-28", phase: "1ª fase", opponent: "Vitória-BA", ha: "away", gf: 0, ga: 0, stadium: FONTE }),
    g({ date: "1986-10-02", phase: "1ª fase", opponent: "Comercial-MS", ha: "away", gf: 0, ga: 1, stadium: MORENAO }),
    g({ date: "1986-10-05", phase: "1ª fase", opponent: "Palmeiras-SP", ha: "home", gf: 1, ga: 0, stadium: REI, goals: goals("Nívio") }),
    g({ date: "1986-10-16", phase: "2ª fase", opponent: "Bahia-BA", ha: "away", gf: 0, ga: 2, stadium: FONTE }),
    g({ date: "1986-10-22", phase: "2ª fase", opponent: "Athletico-PR", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1986-10-26", phase: "2ª fase", opponent: "Portuguesa-SP", ha: "away", gf: 0, ga: 0, stadium: PALESTRA }),
    g({ date: "1986-10-29", phase: "2ª fase", opponent: "Inter de Limeira-SP", ha: "home", gf: 1, ga: 1, stadium: REI, goals: [og("Bolívar")] }),
    g({ date: "1986-11-02", phase: "2ª fase", opponent: "Cruzeiro-MG", ha: "away", gf: 0, ga: 2, stadium: MINEIRAO }),
    g({ date: "1986-11-05", phase: "2ª fase", opponent: "Náutico-PE", ha: "away", gf: 1, ga: 1, stadium: ARRUDA, goals: goals("André") }),
    g({ date: "1986-11-09", phase: "2ª fase", opponent: "Sport-PE", ha: "home", gf: 1, ga: 0, stadium: REI, goals: goals("André") }),
    g({ date: "1986-11-19", phase: "2ª fase", opponent: "Comercial-MS", ha: "home", gf: 0, ga: 0, stadium: REI }),
    g({ date: "1986-11-23", phase: "2ª fase", opponent: "Portuguesa-SP", ha: "home", gf: 1, ga: 1, stadium: REI, goals: goals("Carlinhos Paulista") }),
    g({ date: "1986-11-26", phase: "2ª fase", opponent: "Comercial-MS", ha: "away", gf: 3, ga: 0, stadium: MORENAO, goals: goals("Mário Tilico", "Veiga", "Helinho") }),
    g({ date: "1986-12-03", phase: "2ª fase", opponent: "Bahia-BA", ha: "home", gf: 1, ga: 0, stadium: REI, goals: goals("Coca") }),
    g({ date: "1986-12-07", phase: "2ª fase", opponent: "Sport-PE", ha: "away", gf: 1, ga: 3, stadium: REI, goals: goals("Ditinho Souza"), note: "Estádio Rei Pelé conforme o texto" }),
    g({ date: "1986-12-10", phase: "2ª fase", opponent: "Náutico-PE", ha: "home", gf: 2, ga: 1, stadium: REI, goals: goals("Washington", "Washington") }),
    g({ date: "1986-12-14", phase: "2ª fase", opponent: "Athletico-PR", ha: "away", gf: 1, ga: 2, stadium: PINHEIRAO, goals: goals("André") }),
    g({ date: "1987-01-25", phase: "2ª fase", opponent: "Cruzeiro-MG", ha: "home", gf: 0, ga: 1, stadium: REI, note: "Partida de 1987 pertencente ao Brasileiro 1986" }),
    g({ date: "1987-01-28", phase: "2ª fase", opponent: "Inter de Limeira-SP", ha: "away", gf: 0, ga: 2, stadium: LEVY, note: "Partida de 1987 pertencente ao Brasileiro 1986" }),
  ];
  BATCHES.push({ competition: "Taça de Ouro", season: 1986, expected: summarize(games), games });
}

for (const b of BATCHES) {
  const s = summarize(b.games);
  console.log(`${b.competition} ${b.season}: J${s.games} V${s.wins} E${s.draws} D${s.losses} GP${s.goals_for} GC${s.goals_against}`);
}

const out = `/** Taça de Ouro / Taça de Prata — CSA 1981–1986 (Brasileiro Série A/B).
 * Gerado por scripts/_gen-taca-1981-1986.mjs
 */
export const BATCHES = ${JSON.stringify(BATCHES, null, 2)};
`;
writeFileSync(resolve(__dirname, "data/seasons-taca-1981-1986.mjs"), out, "utf8");
console.log("wrote data/seasons-taca-1981-1986.mjs");
