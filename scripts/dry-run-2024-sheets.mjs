/**
 * Dry-run: CSA 2024 match sheets (39 games) — NO WRITES.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
loadEnvFromDotenv();
const pool = createPgPool();

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Absolute minute from source "X' 1T" / "X' 2T" / "Xmin 1T" */
function convertMinute(rawMin, half) {
  const X = Number(rawMin);
  if (!Number.isFinite(X) || (half !== 1 && half !== 2)) {
    return { error: `bad minute ${rawMin} ${half}T` };
  }
  if (half === 1) {
    if (X <= 45) return { minute: X, injuryTimeMinute: null };
    return { minute: 45, injuryTimeMinute: X - 45 };
  }
  const abs = 45 + X;
  if (abs <= 90) return { minute: abs, injuryTimeMinute: null };
  return { minute: 90, injuryTimeMinute: abs - 90 };
}

const ALIASES = {
  // confirmed merges
  "matues santos": "matheus santos",
  "mateus santos": "matheus santos",
  marqunhos: "marquinhos",
  "eduardo biazuus": "eduardo biazus",
  // common source variants to try
  "raphinha": "rafinha", // may be ambiguous — check DB
};

// --- Source games (compact) ---
// date ISO, homeAway, oppHint, compHint, score [gf,ga], manager, referee,
// attendancePaid?, attendance?, ownGoalsFor?,
// goals: [{player, min, half}], starters:[], subs:[{out,in}], notes?
const GAMES = [
  { n:1, date:"2024-01-06", ha:"home", opp:"Iguatu", comp:"Pré-Copa/Nordeste", gf:1, ga:1, resultNote:"draw then pens loss 3x4", mgr:"Rogério Corrêa", ref:"Fábio Augusto Santos Sá Júnior", attP:8288, att:10453,
    goals:[{p:"Marquinhos",m:34,h:2}],
    starters:["Deivity","Lucas Marques","Jean Pierre","Eduardo Biazus","Kevin","Marlon","Caio Vitor","Gustavo Xuxa","Rômulo","Marquinhos","Tiago Marques"],
    subs:[["Marlon","Pedro Favela"],["Caio Vitor","Jean Cleber"],["Gustavo Xuxa","Erik"],["Rômulo","Douglas Skilo"],["Tiago Marques","Vinícius Popó"]],
    flags:["pens_elim","mgr_vs_db"] },
  { n:2, date:"2024-01-21", ha:"home", opp:"Coruripe", comp:"Alagoano", gf:1, ga:0, mgr:"Rogério Corrêa", ref:"João Paulo dos Santos Nascimento", attP:3133, att:5279,
    goals:[{p:"Gustavo Xuxa",m:37,h:2}],
    starters:["Deivity","Lucas Marques","Jean Pierre","Eduardo Biazus","Kevin","Marlon","Jean Cleber","Caio Vitor","Rômulo","Marquinhos","Vinícius Popó"],
    subs:[["Kevin","Erik"],["Marlon","Rafinha"],["Caio Vitor","Gustavo Xuxa"],["Rômulo","Tiago Marques"],["Vinícius Popó","Douglas Skilo"]] },
  { n:3, date:"2024-01-24", ha:"away", opp:"Cruzeiro", comp:"Alagoano", gf:2, ga:0, mgr:"Marcelo Cabo", ref:"Wiomar Santana de Oliveira",
    goals:[{p:"Gustavo Xuxa",m:16,h:1},{p:"Marquinhos",m:30,h:1}],
    starters:["Deivity","Lucas Marques","Jean Pierre","Eduardo Biazus","Kevin","Marlon","Jean Cleber","Gustavo Xuxa","Marquinhos","Rômulo","Tiago Marques"],
    subs:[["Lucas Marques","Igor Dutra"],["Kevin","Erik"],["Marlon","Pedro Favela"],["Marquinhos","Alisson Farias"],["Tiago Marques","Douglas Skilo"]] },
  { n:4, date:"2024-01-28", ha:"home", opp:"CRB", comp:"Alagoano", gf:1, ga:3, mgr:"Marcelo Cabo", ref:"Denis da Silva Ribeiro Serafim", attP:8148, att:10382,
    goals:[{p:"Gustavo Xuxa",m:18,h:2}],
    starters:["Deivity","Igor Dutra","Jean Pierre","Eduardo Biazus","Kevin","Marlon","Jean Cleber","Gustavo Xuxa","Caio Vitor","Marquinhos","Rômulo"],
    subs:[["Igor Dutra","Douglas Skilo"],["Jean Pierre","Thiago Lopes"],["Gustavo Xuxa","Tiago Marques"],["Caio Vitor","Marcinho"],["Marquinhos","Alisson Farias"]] },
  { n:5, date:"2024-02-07", ha:"away", opp:"ASA", comp:"Alagoano", gf:0, ga:2, mgr:"Marcelo Cabo", ref:"Jonata de Souza Gouveia",
    goals:[],
    starters:["Deivity","Igor Dutra","Wellington Carvalho","Eduardo Biazus","Kevin","Marlon","Jean Cleber","Gustavo Xuxa","Marcinho","Alisson Farias","Rômulo"],
    subs:[["Igor Dutra","Tiago Marques"],["Jean Cleber","Juninho Valoura"],["Gustavo Xuxa","Niltinho"],["Marcinho","Marquinhos"],["Alisson Farias","Rafinha"]] },
  { n:6, date:"2024-02-17", ha:"away", opp:"Murici", comp:"Alagoano", gf:0, ga:0, mgr:"Marcelo Cabo", ref:"Denis da Silva Ribeiro Serafim",
    goals:[],
    starters:["Deivity","Eduardo","Wellington Carvalho","Eduardo Biazus","Kevin","Marlon","Juninho Valoura","Gustavo Xuxa","Alisson Farias","Niltinho","Rômulo"],
    subs:[["Deivity","Fernando Castro"],["Kevin","Ricardo Sena"],["Gustavo Xuxa","Marcinho"],["Niltinho","Marquinhos"],["Rômulo","Tiago Marques"]],
    flags:["eduardo_ambiguous"] },
  { n:7, date:"2024-02-24", ha:"home", opp:"Penedense", comp:"Alagoano", gf:1, ga:1, mgr:"Marcelo Cabo", ref:"Márcio dos Santos Oliveira", attP:1868, att:3621,
    goals:[{p:"Wellington Carvalho",m:26,h:1}],
    starters:["Fernando Castro","Eduardo","Wellington Carvalho","Eduardo Biazus","Kevin","Jean Cleber","Juninho Valoura","Gustavo Xuxa","Marquinhos","Alisson Farias","Tiago Marques"],
    subs:[["Eduardo","Lucas Marques"],["Jean Cleber","Rafinha"],["Gustavo Xuxa","Marcinho"],["Marquinhos","Vinícius Popó"],["Alisson Farias","Rômulo"]] },
  { n:8, date:"2024-03-02", ha:"away", opp:"CSE", comp:"Alagoano", gf:2, ga:3, mgr:"Marcelo Cabo", ref:"Rodrigo José Pereira de Lima",
    goals:[{p:"Tiago Marques",m:15,h:1},{p:"Alisson Farias",m:42,h:2}],
    starters:["Fernando Castro","Eduardo","Wellington Carvalho","Thiago Lopes","Erik","Marlon","Pedro Favela","Juninho Valoura","Marcinho","Marquinhos","Tiago Marques"],
    subs:[["Erik","Kevin"],["Marlon","Guilherme Rend"],["Pedro Favela","Rafinha"],["Marcinho","Alisson Farias"],["Marquinhos","Vinícius Popó"]] },
  { n:9, date:"2024-01-31", ha:"away", opp:"Coruripe", comp:"Copa Alagoas", gf:2, ga:0, mgr:"Marcelo Cabo", ref:"José Ricardo Laranjeira",
    goals:[{p:"Rafinha",m:29,h:2},{p:"Jeffinho",m:39,h:2}],
    starters:["Yuri Sena","Igor Dutra","Thiago Lopes","Almir Luan","Ricardo Sena","Luan Martins","Pedro Favela","Marcinho","Alisson Farias","Douglas Skilo","Tiago Marques"],
    subs:[["Luan Martins","Caio Vitor"],["Marcinho","Rafinha"],["Alisson Farias","Jeffinho"],["Douglas Skilo","Allyson"],["Tiago Marques","Vinícius Popó"]] },
  { n:10, date:"2024-02-04", ha:"home", opp:"CSE", comp:"Copa Alagoas", gf:1, ga:2, mgr:"Marcelo Cabo", ref:"José Jaini Oliveira Bispo", attP:788, att:1002,
    goals:[{p:"Niltinho",m:35,h:2}],
    starters:["Deivity","Pedro Favela","Thiago Lopes","Almir Luan","Ricardo Sena","Luan Martins","Juninho Valoura","Rafinha","Jeffinho","Marquinhos","Vinícius Popó"],
    subs:[["Pedro Favela","Niltinho"],["Luan Martins","Erik"],["Juninho Valoura","Allyson"],["Rafinha","Miqueias"],["Vinícius Popó","Tiago Marques"]],
    flags:["inconsistencia_2"] },
  { n:11, date:"2024-02-14", ha:"away", opp:"Penedense", comp:"Copa Alagoas", gf:1, ga:2, mgr:"Bebeto Moraes", ref:"José Ailton da Silva",
    goals:[{p:"Guilherme Rend",m:9,h:1}],
    starters:["Fernando Castro","Matheus Santos","Almir Luan","Denilson","Erik","Guilherme Rend","Allyson","Luan Martins","Jeffinho","Vinícius Popó","Miqueias"],
    subs:[["Matheus Santos","Jefferson Júnior"],["Guilherme Rend","Clevinho"],["Luan Martins","Cadu"],["Miqueias","Ismael"]] },
  { n:12, date:"2024-02-21", ha:"home", opp:"Dimensão", comp:"Copa Alagoas", gf:6, ga:0, mgr:"Marcelo Cabo", ref:"Carlos Vitor Oliveira Alves", attP:19, att:156,
    goals:[{p:"Rafinha",m:8,h:1},{p:"Tiago Marques",m:14,h:1},{p:"Marcinho",m:44,h:1},{p:"Wellington Carvalho",m:18,h:2},{p:"Tiago Marques",m:21,h:2},{p:"Vinícius Popó",m:44,h:2}],
    starters:["Fernando Castro","Eduardo","Wellington Carvalho","Eduardo Biazus","Ricardo Sena","Marlon","Juninho Valoura","Marcinho","Alisson Dantas","Rafinha","Tiago Marques"],
    subs:[["Eduardo","Lucas Marques"],["Ricardo Sena","Erik"],["Marlon","Jean Cleber"],["Juninho Valoura","Guilherme Rend"],["Tiago Marques","Vinícius Popó"]],
    flags:["inconsistencia_1_mgr","inconsistencia_4_alisson"] },
  { n:13, date:"2024-03-06", ha:"away", opp:"CRB", comp:"Copa Alagoas", gf:1, ga:0, mgr:"Bebeto Moraes", ref:"Felype Wanderley Urubá", attNote:"portões fechados",
    goals:[{p:"Juninho Valoura",m:30,h:2}],
    starters:["Fernando Castro","Lucas Marques","Almir Luan","Wellington Carvalho","Erik","Pedro Favela","Juninho Valoura","Gustavo Xuxa","Jeffinho","Marquinhos","Tiago Marques"],
    subs:[["Almir Luan","Eduardo Biazus"],["Pedro Favela","Marlon"],["Gustavo Xuxa","Rafinha"],["Marquinhos","Alisson Farias"],["Tiago Marques","Vinícius Popó"]] },
  { n:14, date:"2024-03-13", ha:"home", opp:"Cruzeiro", comp:"Copa Alagoas", gf:2, ga:0, mgr:"Bebeto Moraes", ref:"José Ailton da Silva", attP:102, att:1084,
    goals:[{p:"Tiago Marques",m:7,h:1},{p:"Tiago Marques",m:27,h:1}],
    starters:["Deivity","Lucas Marques","Almir Luan","Eduardo Biazus","Erik","Marlon","Juninho Valoura","Marcinho","Jeffinho","Alisson Farias","Tiago Marques"],
    subs:[["Lucas Marques","Miqueias"],["Marcinho","Rafinha"],["Jeffinho","Eduardo"],["Alisson Farias","Gustavo Xuxa"],["Tiago Marques","Vinícius Popó"]] },
  { n:15, date:"2024-03-23", ha:"home", opp:"Murici", comp:"Copa Alagoas SF Ida", gf:3, ga:3, mgr:"Cristian de Souza", ref:"José Ricardo Laranjeira", attP:1837, att:2708,
    goals:[{p:"Tiago Marques",m:11,h:1},{p:"Alisson Farias",m:42,h:1},{p:"Gustavo Xuxa",m:48,h:1}],
    starters:["Fernando Castro","Lucas Marques","Almir Luan","Eduardo Biazus","Erik","Marlon","Juninho Valoura","Gustavo Xuxa","Alisson Farias","Marquinhos","Tiago Marques"],
    subs:[["Lucas Marques","Eduardo"],["Gustavo Xuxa","Pedro Favela"],["Alisson Farias","Jeffinho"],["Marquinhos","Marcinho"],["Tiago Marques","Vinícius Popó"]] },
  { n:16, date:"2024-03-26", ha:"away", opp:"Murici", comp:"Copa Alagoas SF Volta", gf:3, ga:0, mgr:"Cristian de Souza", ref:"Márcio dos Santos Oliveira",
    goals:[{p:"Almir Luan",m:3,h:1},{p:"Tiago Marques",m:10,h:2},{p:"Juninho Valoura",m:26,h:2}],
    starters:["Fernando Castro","Almir Luan","Eduardo Biazus","Wellington Carvalho","Lucas Marques","Marlon","Juninho Valoura","Gustavo Xuxa","Erik","Tiago Marques","Marquinhos"],
    subs:[["Lucas Marques","Jean Cleber"],["Gustavo Xuxa","Pedro Favela"],["Erik","Kevin"],["Tiago Marques","Marcinho"],["Marquinhos","Miqueias"]] },
  { n:17, date:"2024-03-31", ha:"home", opp:"Penedense", comp:"Copa Alagoas Final Ida", gf:1, ga:1, mgr:"Cristian de Souza", ref:"Jonata de Souza Gouveia", attP:3835, att:5320,
    goals:[{p:"Tiago Marques",m:9,h:1}],
    starters:["Fernando Castro","Lucas Marques","Almir Luan","Eduardo Biazus","Erik","Marlon","Juninho Valoura","Gustavo Xuxa","Marcinho","Marquinhos","Tiago Marques"],
    subs:[["Almir Luan","Wellington Carvalho"],["Erik","Kevin"],["Gustavo Xuxa","Jean Cleber"],["Marcinho","Niltinho"],["Marquinhos","Jeffinho"]] },
  { n:18, date:"2024-04-03", ha:"away", opp:"Penedense", comp:"Copa Alagoas Final Volta", gf:1, ga:0, mgr:"Cristian de Souza", ref:"Denis da Silva Ribeiro Serafim",
    goals:[{p:"Gustavo Xuxa",m:21,h:2}],
    starters:["Yuri Sena","Almir Luan","Eduardo Biazus","Wellington Carvalho","Lucas Marques","Marlon","Juninho Valoura","Gustavo Xuxa","Erik","Marquinhos","Tiago Marques"],
    subs:[["Juninho Valoura","Pedro Favela"],["Gustavo Xuxa","Allyson"],["Erik","Kevin"],["Marquinhos","Marcinho"]] },
  { n:19, date:"2024-04-07", ha:"away", opp:"CSE", comp:"Seletiva Copa do Brasil", gf:2, ga:0, mgr:"Cristian de Souza", ref:"Rafael Carlos Salgueiro",
    goals:[{p:"Tiago Marques",m:18,h:2},{p:"Gustavo Xuxa",m:35,h:2}],
    starters:["Yuri Sena","Almir Luan","Eduardo Biazus","Wellington Carvalho","Lucas Marques","Marlon","Pedro Favela","Gustavo Xuxa","Erik","Marcinho","Tiago Marques"],
    subs:[["Almir Luan","Allyson"],["Gustavo Xuxa","Jean Cleber"],["Marcinho","Jeffinho"],["Tiago Marques","Vinícius Popó"]],
    flags:["comp_mapped_as_alagoano"] },
  { n:20, date:"2024-04-11", ha:"home", opp:"CSE", comp:"Seletiva Copa do Brasil", gf:1, ga:2, mgr:"Cristian de Souza", ref:"José Ricardo Laranjeira", attP:5383, att:6936,
    goals:[{p:"Marquinhos",m:44,h:1}],
    starters:["Yuri Sena","Almir Luan","Eduardo Biazus","Wellington Carvalho","Lucas Marques","Marlon","Pedro Favela","Gustavo Xuxa","Erik","Marquinhos","Tiago Marques"],
    subs:[["Pedro Favela","Juninho Valoura"],["Gustavo Xuxa","Allyson"],["Erik","Eduardo"],["Marquinhos","Marcinho"],["Tiago Marques","Jeffinho"]],
    flags:["comp_mapped_as_alagoano"] },
  { n:21, date:"2024-04-20", ha:"away", opp:"Ypiranga", comp:"Série C", gf:1, ga:3, mgr:"Cristian de Souza", ref:"Luiz Paulo de Moura Pinheiro",
    goals:[{p:"Bruno Cardoso",m:12,h:2}],
    starters:["Thomazella","Lucas Marques","Almir Luan","Bruno Cardoso","Wellington Carvalho","Dal Pian","Marlon","Juninho Valoura","Gustavo Xuxa","Marquinhos","Iury Tanque"],
    subs:[["Lucas Marques","Raphinha"],["Dal Pian","Erik"],["Marlon","Pedro Favela"],["Marquinhos","Vitor Leque"]] },
  { n:22, date:"2024-04-28", ha:"home", opp:"Ferroviária", comp:"Série C", gf:1, ga:1, mgr:"Cristian de Souza", ref:"Carlos Tadeu Ferreira de Castro", attP:3573, att:4974,
    goals:[{p:"Iury Tanque",m:3,h:1}],
    starters:["Thomazella","Lucas Marques","Almir Luan","Bruno Cardoso","Dal Pian","Pedro Favela","Juninho Valoura","Gustavo Xuxa","Vitor Leque","Marquinhos","Iury Tanque"],
    subs:[["Lucas Marques","Marlon"],["Dal Pian","Erik"],["Gustavo Xuxa","Alan Pedro"],["Vitor Leque","Raphinha"],["Iury Tanque","Miqueias"]] },
  { n:23, date:"2024-05-06", ha:"away", opp:"Londrina", comp:"Série C", gf:2, ga:2, mgr:"Cristian de Souza", ref:"Wagner Francisco Silva Souza",
    goals:[{p:"Marquinhos",m:1,h:2},{p:"Wellington Carvalho",m:38,h:2}],
    starters:["Thomazella","Lucas Marques","Almir Luan","Wellington Carvalho","Bruno Cardoso","Marlon","Pedro Favela","Juninho Valoura","Gustavo Xuxa","Marquinhos","Iury Tanque"],
    subs:[["Lucas Marques","Raphinha"],["Marlon","Dal Pian"],["Pedro Favela","Eduardo Biazus"],["Marquinhos","Erik"],["Iury Tanque","Vitor Leque"]] },
  { n:24, date:"2024-05-12", ha:"home", opp:"Athletic", comp:"Série C", gf:0, ga:5, mgr:"Cristian de Souza", ref:"José Henrique de Azevedo Júnior", attP:3282, att:4979,
    goals:[],
    starters:["Thomazella","Raphinha","Wellington Carvalho","Matheus Santos","Bruno Cardoso","Pedro Favela","Dal Pian","Juninho Valoura","Gustavo Xuxa","Marquinhos","Iury Tanque"],
    subs:[["Wellington Carvalho","Eduardo Biazus"],["Dal Pian","Richard"],["Gustavo Xuxa","Jean Cleber"],["Marquinhos","Vitor Leque"],["Iury Tanque","Roger"]] },
  { n:25, date:"2024-05-18", ha:"home", opp:"Sampaio Corrêa", comp:"Série C", gf:0, ga:0, mgr:"Bebeto Moraes", ref:"Luiz Augusto Silveira Tisne", attP:3282, att:4979,
    goals:[],
    starters:["Deivity","Lucas Marques","Almir Luan","Matheus Santos","Erik","Pedro Favela","Dal Pian","Juninho Valoura","Vitor Leque","Richard","Iury Tanque"],
    subs:[["Erik","Roger"],["Pedro Favela","Gustavo Xuxa"],["Vitor Leque","Alisson Farias"],["Richard","Tiago Marques"],["Iury Tanque","Jean Cleber"]],
    flags:["inconsistencia_3_attendance_dup"] },
  { n:26, date:"2024-05-26", ha:"away", opp:"São Bernardo", comp:"Série C", gf:0, ga:2, mgr:"Higo Magalhães", ref:"Murilo Ugolini Klein",
    goals:[],
    starters:["Deivity","Raphinha","Eduardo Biazus","Matheus Santos","Erik","Jean Cleber","Juninho Valoura","Dal Pian","Richard","Vitor Leque","Iury Tanque"],
    subs:[["Jean Cleber","Buga"],["Juninho Valoura","Tiago Marques"],["Richard","Marquinhos"],["Vitor Leque","Roger"],["Iury Tanque","Alisson Farias"]] },
  { n:27, date:"2024-06-03", ha:"away", opp:"Volta Redonda", comp:"Série C", gf:1, ga:2, mgr:"Higo Magalhães", ref:"Emerson Souza Silva",
    goals:[{p:"Tiago Marques",m:37,h:2}],
    starters:["Deivity","Raphinha","Eduardo Biazus","Matheus Santos","Erik","Jean Cleber","Juninho Valoura","Gustavo Xuxa","Vitor Leque","Alisson Farias","Tiago Marques"],
    subs:[["Erik","Dal Pian"],["Juninho Valoura","Buga"],["Gustavo Xuxa","Iury Tanque"],["Vitor Leque","Marquinhos"],["Alisson Farias","Lucas Marques"]] },
  { n:28, date:"2024-06-10", ha:"home", opp:"São José", comp:"Série C", gf:1, ga:1, mgr:"Higo Magalhães", ref:"Leonardo Willers Lorenzatto", attP:4110, att:5125,
    goals:[{p:"Tiago Marques",m:30,h:2}],
    starters:["Yuri Sena","Raphinha","Eduardo Biazus","Wellington Carvalho","Dal Pian","Jean Cleber","Juninho Valoura","Vitor Leque","Alisson Farias","Marquinhos","Tiago Marques"],
    subs:[["Raphinha","Richard"],["Jean Cleber","Pedro Favela"],["Juninho Valoura","Buga"],["Alisson Farias","Gustavo Xuxa"],["Marquinhos","Lucas Marques"]] },
  { n:29, date:"2024-06-15", ha:"home", opp:"Botafogo", comp:"Série C", gf:1, ga:1, mgr:"Higo Magalhães", ref:"Roger Goulart", attP:2886, att:3774,
    goals:[{p:"Tiago Marques",m:29,h:2}],
    starters:["Yuri Sena","Lucas Marques","Eduardo Biazus","Matheus Santos","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Richard","Tiago Marques"],
    subs:[["Roberto","Erik"],["Gustavo Nicola","Almir Luan"],["Brayann","Vitor Leque"],["Gustavinho","Dudu Miraíma"],["Richard","Roger"]] },
  { n:30, date:"2024-06-27", ha:"away", opp:"Confiança", comp:"Série C", gf:1, ga:0, mgr:"Higo Magalhães", ref:"Rafael Martins Diniz",
    goals:[{p:"Tiago Marques",m:37,h:1}],
    starters:["Yuri Sena","Lucas Marques","Eduardo Biazus","Matheus Santos","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Richard","Tiago Marques"],
    subs:[["Buga","Pedro Favela"],["Brayann","Dudu Miraíma"],["Gustavinho","Raphinha"],["Richard","Vitor Leque"],["Tiago Marques","Calebe Costa"]] },
  { n:31, date:"2024-07-03", ha:"home", opp:"Figueirense", comp:"Série C", gf:3, ga:1, mgr:"Higo Magalhães", ref:"Tarcizo Pinheiro Caetano", attP:8210, att:10957,
    goals:[{p:"Richard",m:6,h:1},{p:"Vitor Leque",m:4,h:2},{p:"Lucas Marques",m:31,h:2}],
    starters:["Yuri Sena","Lucas Marques","Eduardo Biazus","Matheus Santos","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Richard","Tiago Marques"],
    subs:[["Lucas Marques","Dudu Miraíma"],["Buga","Calebe Costa"],["Gustavinho","Matheus Mega"],["Richard","Vitor Leque"],["Tiago Marques","Iury Tanque"]] },
  { n:32, date:"2024-07-06", ha:"away", opp:"ABC", comp:"Série C", gf:2, ga:0, mgr:"Higo Magalhães", ref:"Léo Simão Holanda",
    goals:[{p:"Tiago Marques",m:30,h:1},{p:"Tiago Marques",m:38,h:1}],
    starters:["Yuri Sena","Lucas Marques","Eduardo Biazus","Matheus Santos","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Vitor Leque","Tiago Marques"],
    subs:[["Gustavo Nicola","Robinho"],["Brayann","Dudu Miraíma"],["Gustavinho","Raphinha"],["Vitor Leque","Calebe Costa"],["Tiago Marques","Iury Tanque"]] },
  { n:33, date:"2024-07-14", ha:"home", opp:"Floresta", comp:"Série C", gf:1, ga:2, mgr:"Higo Magalhães", ref:"Angleison Marcos Vieira Monteiro", attP:15000, att:17898,
    goals:[{p:"Robinho",m:43,h:2}],
    starters:["Yuri Sena","Lucas Marques","Eduardo Biazus","Matheus Santos","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Vitor Leque","Tiago Marques"],
    subs:[["Lucas Marques","Raphinha"],["Gustavo Nicola","Dudu Miraíma"],["Buga","Iury Tanque"],["Gustavinho","Robinho"],["Vitor Leque","Foguinho"]] },
  { n:34, date:"2024-07-22", ha:"away", opp:"Remo", comp:"Série C", gf:1, ga:2, mgr:"Higo Magalhães", ref:"Júlio César Pfleger",
    goals:[{p:"Tiago Marques",m:4,h:2}],
    starters:["Yuri Sena","Raphinha","Matheus Mega","Matheus Santos","Roberto","Gustavo Nicola","Buga","Lucas Marques","Brayann","Vitor Leque","Tiago Marques"],
    subs:[["Gustavo Nicola","Calebe Costa"],["Buga","Dudu Miraíma"],["Lucas Marques","Robinho"],["Brayann","Mateus Buiate"]] },
  { n:35, date:"2024-07-27", ha:"away", opp:"Ferroviário", comp:"Série C", gf:1, ga:1, mgr:"Higo Magalhães", ref:"Fabiano Monteiro dos Santos",
    goals:[{p:"Tiago Marques",m:28,h:1}],
    starters:["Yuri Sena","Raphinha","Matheus Mega","Eduardo Biazus","Roberto","Buga","Dudu Miraíma","Brayann","Gustavinho","Vitor Leque","Tiago Marques"],
    subs:[["Roberto","Dal Pian"],["Buga","Calebe Costa"],["Brayann","Álvaro"],["Vitor Leque","Robinho"]] },
  { n:36, date:"2024-08-04", ha:"home", opp:"Náutico", comp:"Série C", gf:2, ga:2, mgr:"Higo Magalhães", ref:"Alisson Sidnei Furtado", attP:5401, att:8064,
    goals:[{p:"Roberto",m:24,h:2}],
    ownGoalsFor:1, ownGoalNote:"Marco Antônio (Náutico) 50' 2T → own_goals_for_count=1, NOT match_goals",
    starters:["Thomazella","Raphinha","Eduardo Biazus","Mateus Buiate","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Richard","Tiago Marques"],
    subs:[["Gustavo Nicola","Iury Tanque"],["Buga","Dudu Miraíma"],["Brayann","Robinho"],["Gustavinho","Foguinho"],["Richard","Vitor Leque"]] },
  { n:37, date:"2024-08-11", ha:"away", opp:"Tombense", comp:"Série C", gf:1, ga:0, mgr:"Higo Magalhães", ref:"André Ricardo Martins",
    goals:[{p:"Robinho",m:38,h:2}],
    starters:["Thomazella","Raphinha","Eduardo Biazus","Mateus Buiate","Roberto","Gustavo Nicola","Buga","Brayann","Gustavinho","Richard","Tiago Marques"],
    subs:[["Gustavo Nicola","Jean Cleber"],["Buga","Foguinho"],["Brayann","Dudu Miraíma"],["Gustavinho","Lucas Marques"],["Richard","Robinho"]] },
  { n:38, date:"2024-08-18", ha:"away", opp:"Aparecidense", comp:"Série C", gf:1, ga:0, mgr:"Higo Magalhães", ref:"Dyorgines José Padovani de Andrade",
    goals:[{p:"Robinho",m:50,h:2}],
    starters:["Thomazella","Raphinha","Eduardo Biazus","Mateus Buiate","Dal Pian","Gustavo Nicola","Buga","Dudu Miraíma","Richard","Gustavinho","Tiago Marques"],
    subs:[["Dal Pian","Matheus Santos"],["Gustavo Nicola","Jean Cleber"],["Dudu Miraíma","Brayann"],["Richard","Vitor Leque"],["Gustavinho","Robinho"]] },
  { n:39, date:"2024-08-24", ha:"home", opp:"Caxias", comp:"Série C", gf:2, ga:1, mgr:"Higo Magalhães", ref:"Samuel dos Santos", attP:6142, att:7067,
    goals:[{p:"Tiago Marques",m:43,h:1},{p:"Gustavinho",m:38,h:2}],
    starters:["Thomazella","Raphinha","Eduardo Biazus","Mateus Buiate","Roberto","Gustavo Nicola","Buga","Brayann","Robinho","Richard","Tiago Marques"],
    subs:[["Buga","Jean Cleber"],["Brayann","Dal Pian"],["Robinho","Vitor Leque"],["Richard","Gustavinho"]] },
];

const { rows: dbMatches } = await pool.query(`
  SELECT m.id, m.match_date::text AS d, o.name AS opp, c.name AS comp,
         m.goals_for AS gf, m.goals_against AS ga, m.result, m.home_away AS ha,
         m.attendance AS att, m.attendance_paid AS att_p, m.own_goals_for_count AS og,
         m.manager_id, mgr.name AS manager, m.referee_id, r.name AS referee,
         (SELECT count(*)::int FROM match_lineups ml WHERE ml.match_id=m.id) AS lineups
  FROM matches m
  JOIN opponents o ON o.id=m.opponent_id
  JOIN competitions c ON c.id=m.competition_id
  LEFT JOIN managers mgr ON mgr.id=m.manager_id
  LEFT JOIN referees r ON r.id=m.referee_id
  WHERE m.season='2024'
  ORDER BY m.match_date, m.id
`);

const { rows: players } = await pool.query(`SELECT id, name FROM players ORDER BY name`);
const { rows: managers } = await pool.query(`SELECT id, name FROM managers ORDER BY name`);
const { rows: referees } = await pool.query(`SELECT id, name, state FROM referees ORDER BY name`);

const playersByNorm = new Map();
for (const p of players) {
  const k = norm(p.name);
  if (!playersByNorm.has(k)) playersByNorm.set(k, []);
  playersByNorm.get(k).push(p);
}

function resolvePlayer(raw) {
  const original = raw;
  let key = norm(raw);
  if (ALIASES[key]) key = ALIASES[key];
  let hits = playersByNorm.get(key) ?? [];
  if (hits.length === 1) return { status: "exact", id: hits[0].id, name: hits[0].name, original };
  if (hits.length > 1) return { status: "ambiguous", candidates: hits, original };

  // fuzzy contains
  const soft = [];
  for (const [k, list] of playersByNorm) {
    if (k.includes(key) || key.includes(k)) soft.push(...list);
  }
  // unique soft
  const uniq = [...new Map(soft.map((x) => [x.id, x])).values()];
  if (uniq.length === 1) return { status: "fuzzy", id: uniq[0].id, name: uniq[0].name, original };
  if (uniq.length > 1) return { status: "ambiguous", candidates: uniq.slice(0, 8), original };
  return { status: "missing", original };
}

function resolveManager(raw) {
  const key = norm(raw);
  const hits = managers.filter((m) => norm(m.name) === key);
  if (hits.length === 1) return { status: "exact", ...hits[0] };
  const soft = managers.filter((m) => norm(m.name).includes(key) || key.includes(norm(m.name)));
  if (soft.length === 1) return { status: "fuzzy", ...soft[0] };
  if (soft.length > 1) return { status: "ambiguous", candidates: soft };
  return { status: "missing", original: raw };
}

function resolveReferee(raw) {
  const key = norm(raw);
  const hits = referees.filter((r) => norm(r.name) === key);
  if (hits.length === 1) return { status: "exact", ...hits[0] };
  // strip UF suffix -SE etc from source
  const noUf = key.replace(/\s+[a-z]{2}$/, "");
  const hits2 = referees.filter((r) => norm(r.name) === noUf || norm(r.name).includes(noUf) || noUf.includes(norm(r.name)));
  const uniq = [...new Map(hits2.map((x) => [x.id, x])).values()];
  if (uniq.length === 1) return { status: "fuzzy", ...uniq[0] };
  if (uniq.length > 1) return { status: "ambiguous", candidates: uniq.slice(0, 6), original: raw };
  return { status: "missing", original: raw };
}

function findDbMatch(g) {
  const sameDate = dbMatches.filter((m) => m.d === g.date);
  if (sameDate.length === 1) return { status: "date", match: sameDate[0] };
  if (sameDate.length === 0) return { status: "missing" };
  const oppKey = norm(g.opp);
  const byOpp = sameDate.filter((m) => norm(m.opp).includes(oppKey) || oppKey.includes(norm(m.opp).split(" ")[0]));
  if (byOpp.length === 1) return { status: "date+opp", match: byOpp[0] };
  return { status: "ambiguous_date", candidates: sameDate };
}

const nameIssues = new Map();
const managerIssues = [];
const refereeIssues = [];
const matchRows = [];
const decisionNeeded = [];

for (const g of GAMES) {
  const found = findDbMatch(g);
  const row = {
    n: g.n,
    date: g.date,
    source: `${g.opp} ${g.gf}x${g.ga} (${g.comp}) mgr=${g.mgr}`,
    found: found.status,
    db: null,
    scoreOk: null,
    haOk: null,
    mgrSource: g.mgr,
    mgrDb: null,
    mgrResolve: null,
    refResolve: null,
    goalsConv: [],
    ownGoalsFor: g.ownGoalsFor ?? 0,
    playerIssues: [],
    flags: g.flags ?? [],
  };

  if (found.match) {
    const m = found.match;
    row.db = { id: m.id, opp: m.opp, comp: m.comp, gf: m.gf, ga: m.ga, ha: m.ha, result: m.result, manager: m.manager, att: m.att, attP: m.att_p, lineups: m.lineups, og: m.og };
    row.scoreOk = m.gf === g.gf && m.ga === g.ga;
    row.haOk = m.ha === g.ha;
    row.mgrDb = m.manager;
  }

  const mgr = resolveManager(g.mgr);
  row.mgrResolve = mgr.status === "exact" || mgr.status === "fuzzy"
    ? { status: mgr.status, id: mgr.id, name: mgr.name }
    : mgr;
  if (mgr.status === "missing" || mgr.status === "ambiguous") managerIssues.push({ game: g.n, ...mgr, source: g.mgr });

  const ref = resolveReferee(g.ref);
  row.refResolve = ref.status === "exact" || ref.status === "fuzzy"
    ? { status: ref.status, id: ref.id, name: ref.name }
    : ref;
  if (ref.status !== "exact" && ref.status !== "fuzzy") refereeIssues.push({ game: g.n, ...ref, source: g.ref });

  for (const goal of g.goals) {
    const conv = convertMinute(goal.m, goal.h);
    const pr = resolvePlayer(goal.p);
    row.goalsConv.push({ ...goal, ...conv, player: pr });
    if (pr.status !== "exact" && pr.status !== "fuzzy") {
      row.playerIssues.push({ role: "scorer", ...pr });
      nameIssues.set(goal.p, pr);
    }
  }
  if (g.ownGoalsFor) {
    const ogConv = convertMinute(50, 2); // 50' 2T
    row.ownGoalMinute = ogConv;
  }

  const allNames = new Set([...g.starters, ...g.subs.flat()]);
  for (const name of allNames) {
    const pr = resolvePlayer(name);
    if (pr.status !== "exact" && pr.status !== "fuzzy") {
      row.playerIssues.push({ role: "lineup", ...pr });
      nameIssues.set(name, pr);
    } else if (pr.status === "fuzzy") {
      // track fuzzy for review
      if (!nameIssues.has(name)) nameIssues.set(name, pr);
    }
  }

  // special flags → decision queue
  if (g.flags?.includes("inconsistencia_1_mgr")) {
    decisionNeeded.push({
      id: "Q1",
      game: 12,
      topic: "Técnico jogo 12 (Dimensão Saúde 21/02)",
      detail: "Fonte: Marcelo Cabo. Jogo 11 (14/02) tinha Bebeto Moraes. Banco hoje: Marcelo Cabo em praticamente toda a temporada 2024.",
      need: "Confirmar se aplica Marcelo Cabo no #12 (como na fonte) e Bebeto no #11.",
    });
  }
  if (g.flags?.includes("inconsistencia_2")) {
    decisionNeeded.push({
      id: "Q2",
      game: 10,
      topic: "Inconsistência #2 marcada na fonte (Copa Alagoas CSA 1×2 CSE 04/02)",
      detail: "Marcador ⚠️ presente, mas a descrição textual da inconsistência #2 não veio no paste. Placar/adversário/data batem com o banco (#1225).",
      need: "Descrever o que é a inconsistência #2 antes de aplicar (não adivinhar).",
    });
  }
  if (g.flags?.includes("inconsistencia_3_attendance_dup")) {
    decisionNeeded.push({
      id: "Q3",
      game: 25,
      topic: "Público idêntico ao jogo 24",
      detail: "Athletic-MG 12/05 e Sampaio Corrêa 18/05: ambos pagante 3.282 / presente 4.979 na fonte. Banco: ambos attendance null hoje.",
      need: "Usar esses números no #25, deixar null no #25, ou só aplicar no #24?",
    });
  }
  if (g.flags?.includes("inconsistencia_4_alisson")) {
    decisionNeeded.push({
      id: "Q4",
      game: 12,
      topic: "Alisson Dantas vs Alisson Farias",
      detail: "Titular listado como 'Alisson Dantas' no jogo 12; resto da temporada usa Alisson Farias.",
      need: "É o mesmo Alisson Farias (mesclar) ou outro jogador?",
    });
  }
  if (g.flags?.includes("pens_elim")) {
    decisionNeeded.push({
      id: "Q5",
      game: 1,
      topic: "Pré-Copa / pênaltis Iguatu",
      detail: "Fonte: empate 1×1 e eliminação nos pênaltis (3×4). Banco: result=draw, comp=Copa do Nordeste, manager=Marcelo Cabo (fonte: Rogério Corrêa). Pênaltis não têm tabela dedicada.",
      need: "Manter result=draw? Atualizar manager para Rogério? Guardar pênaltis só em texto/comentário ou ignorar?",
    });
  }

  matchRows.push(row);
}

// Confirmed merges check
const mergeChecks = {};
for (const [alias, target] of Object.entries({
  "Matues Santos": "matheus santos",
  "Mateus Santos": "matheus santos",
  "Matheus Santos": "matheus santos",
  Marqunhos: "marquinhos",
  Marquinhos: "marquinhos",
  "Eduardo Biazuus": "eduardo biazus",
  "Eduardo Biazus": "eduardo biazus",
  "Alisson Farias": "alisson farias",
  "Alisson Dantas": "alisson dantas",
  Rafinha: "rafinha",
  Raphinha: "raphinha",
  Eduardo: "eduardo",
})) {
  mergeChecks[alias] = resolvePlayer(alias);
}

// Summary
const found = matchRows.filter((r) => r.db).length;
const missing = matchRows.filter((r) => !r.db);
const scoreMismatch = matchRows.filter((r) => r.db && !r.scoreOk);
const haMismatch = matchRows.filter((r) => r.db && !r.haOk);
const mgrDiff = matchRows.filter((r) => r.db && r.mgrDb && norm(r.mgrDb) !== norm(r.mgrSource));

const uniqueMissingPlayers = [...nameIssues.entries()]
  .filter(([, v]) => v.status === "missing" || v.status === "ambiguous")
  .map(([k, v]) => ({ name: k, ...v }));

const goalsSample = [];
for (const r of matchRows) {
  for (const g of r.goalsConv) {
    if (g.injuryTimeMinute != null || g.m > 45) goalsSample.push({ game: r.n, raw: `${g.m}' ${g.h}T`, ...g });
  }
}
if (matchRows.find((r) => r.n === 36)?.ownGoalMinute) {
  goalsSample.push({ game: 36, raw: "50' 2T own goal", ...matchRows.find((r) => r.n === 36).ownGoalMinute, note: "own_goals_for only" });
}

import fs from "node:fs";

const report = {
  summary: {
    sourceGames: GAMES.length,
    dbSeason2024: dbMatches.length,
    matched: found,
    unmatched: missing.map((m) => m.n),
    scoreMismatch: scoreMismatch.map((m) => ({ n: m.n, source: [GAMES.find(g=>g.n===m.n).gf, GAMES.find(g=>g.n===m.n).ga], db: [m.db.gf, m.db.ga] })),
    haMismatch: haMismatch.map((m) => ({ n: m.n, source: GAMES.find(g=>g.n===m.n).ha, db: m.db.ha })),
    sheetsEmpty: matchRows.filter((r) => r.db?.lineups === 0).length,
    managerDiffCount: mgrDiff.length,
    refereeUnresolved: refereeIssues.length,
    playerUnresolved: uniqueMissingPlayers.length,
  },
  mergeChecks,
  decisionNeeded,
  refereeIssues,
  managerMissing: managerIssues,
  playerUnresolved: uniqueMissingPlayers,
  managerDiffSample: mgrDiff.slice(0, 15).map((m) => ({ n: m.n, source: m.mgrSource, db: m.mgrDb, resolve: m.mgrResolve })),
  matches: matchRows.map((r) => ({
    n: r.n,
    date: r.date,
    dbId: r.db?.id ?? null,
    dbOpp: r.db?.opp ?? null,
    dbComp: r.db?.comp ?? null,
    scoreOk: r.scoreOk,
    haOk: r.haOk,
    mgrSource: r.mgrSource,
    mgrDb: r.mgrDb,
    mgrResolve: r.mgrResolve,
    refResolve: r.refResolve,
    ownGoalsFor: r.ownGoalsFor,
    flags: r.flags,
    playerIssueCount: r.playerIssues.length,
    goals: r.goalsConv.map((g) => ({
      p: g.p,
      raw: `${g.m}' ${g.h}T`,
      minute: g.minute,
      injury: g.injuryTimeMinute,
      playerId: g.player.id ?? null,
      playerStatus: g.player.status,
      playerName: g.player.name ?? null,
    })),
  })),
  injuryTimeExamples: goalsSample,
};

fs.writeFileSync("scripts/_dry-run-2024-out.json", JSON.stringify(report, null, 2), "utf8");
console.log("WROTE scripts/_dry-run-2024-out.json");
console.log(JSON.stringify(report.summary, null, 2));
console.log("DECisions", report.decisionNeeded.length);
console.log("PLAYERS unresolved", report.playerUnresolved.length);
console.log("REFS unresolved", report.refereeIssues.length);
console.log("MGR missing", report.managerMissing.length);

await pool.end();
