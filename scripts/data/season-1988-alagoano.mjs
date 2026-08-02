/** Campeonato Alagoano 1988 — jogos do CSA (fonte enxuta).
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
export const GAMES = [
  {
    "sheetId": 801,
    "date": "1988-02-28",
    "phase": "1º turno da 1ª fase",
    "round": "1ª rodada",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0
  },
  {
    "sheetId": 802,
    "date": "1988-03-05",
    "phase": "1º turno da 1ª fase",
    "round": "2ª rodada",
    "opponent": "Comercial-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0
  },
  {
    "sheetId": 803,
    "date": "1988-03-13",
    "phase": "1º turno da 1ª fase",
    "round": "3ª rodada",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2
  },
  {
    "sheetId": 804,
    "date": "1988-03-20",
    "phase": "1º turno da 1ª fase",
    "round": "4ª rodada",
    "opponent": "Ferroviário-AL",
    "ha": "neutral",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 805,
    "date": "1988-03-27",
    "phase": "1º turno da 1ª fase",
    "round": "5ª rodada",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2
  },
  {
    "sheetId": 806,
    "date": "1988-04-03",
    "phase": "1º turno da 1ª fase",
    "round": "6ª rodada",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 2
  },
  {
    "sheetId": 807,
    "date": "1988-04-10",
    "phase": "1º turno da 1ª fase",
    "round": "7ª rodada",
    "opponent": "Cruzeiro-AL",
    "ha": "away",
    "gf": 4,
    "ga": 0
  },
  {
    "sheetId": 808,
    "date": "1988-04-17",
    "phase": "1º turno da 1ª fase",
    "round": "8ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0
  },
  {
    "sheetId": 809,
    "date": "1988-04-24",
    "phase": "2º turno da 1ª fase",
    "round": "1ª rodada",
    "opponent": "CRB-AL",
    "ha": "neutral",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 810,
    "date": "1988-04-28",
    "phase": "2º turno da 1ª fase",
    "round": "2ª rodada",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 4
  },
  {
    "sheetId": 811,
    "date": "1988-05-01",
    "phase": "2º turno da 1ª fase",
    "round": "3ª rodada",
    "opponent": "Comercial-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2
  },
  {
    "sheetId": 812,
    "date": "1988-05-08",
    "phase": "2º turno da 1ª fase",
    "round": "4ª rodada",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "goals": [
      {
        "name": "Chico"
      }
    ]
  },
  {
    "sheetId": 813,
    "date": "1988-05-15",
    "phase": "2º turno da 1ª fase",
    "round": "5ª rodada",
    "opponent": "Ferroviário-AL",
    "ha": "neutral",
    "gf": 1,
    "ga": 1,
    "goals": [
      {
        "name": "Zé Pedro"
      }
    ]
  },
  {
    "sheetId": 814,
    "date": "1988-05-21",
    "phase": "2º turno da 1ª fase",
    "round": "6ª rodada",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 3,
    "ga": 3
  },
  {
    "sheetId": 815,
    "date": "1988-05-28",
    "phase": "2º turno da 1ª fase",
    "round": "7ª rodada",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2
  },
  {
    "sheetId": 816,
    "date": "1988-06-05",
    "phase": "2º turno da 1ª fase",
    "round": "8ª rodada",
    "opponent": "Cruzeiro-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "goals": [
      {
        "name": "Chico"
      }
    ]
  },
  {
    "sheetId": 817,
    "date": "1988-06-09",
    "phase": "2º turno da 1ª fase",
    "round": "9ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 818,
    "date": "1988-06-11",
    "phase": "2º turno da 1ª fase",
    "round": "10ª rodada",
    "opponent": "CRB-AL",
    "ha": "neutral",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 819,
    "date": "1988-07-10",
    "phase": "1º turno da 2ª fase",
    "round": "1ª rodada",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 820,
    "date": "1988-07-24",
    "phase": "1º turno da 2ª fase",
    "round": "3ª rodada",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1
  },
  {
    "sheetId": 821,
    "date": "1988-07-30",
    "phase": "1º turno da 2ª fase",
    "round": "4ª rodada",
    "opponent": "Ferroviário-AL",
    "ha": "neutral",
    "gf": 3,
    "ga": 1,
    "goals": [
      {
        "name": "Zé Pedro"
      },
      {
        "name": "Maurinho"
      },
      {
        "name": "Jairo"
      }
    ]
  },
  {
    "sheetId": 822,
    "date": "1988-08-06",
    "phase": "1º turno da 2ª fase",
    "round": "5ª rodada",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0
  },
  {
    "sheetId": 823,
    "date": "1988-08-10",
    "phase": "1º turno da 2ª fase",
    "round": "2ª rodada",
    "opponent": "Comercial-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "goals": [
      {
        "name": "Zé Pedro"
      }
    ]
  },
  {
    "sheetId": 824,
    "date": "1988-08-14",
    "phase": "1º turno da 2ª fase",
    "round": "7ª rodada",
    "opponent": "Cruzeiro-AL",
    "ha": "away",
    "gf": 4,
    "ga": 1,
    "goals": [
      {
        "name": "Naldo"
      },
      {
        "name": "Zé Pedro"
      },
      {
        "name": "Maurinho"
      },
      {
        "name": "Borges"
      }
    ]
  },
  {
    "sheetId": 825,
    "date": "1988-08-17",
    "phase": "1º turno da 2ª fase",
    "round": "6ª rodada",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 2,
    "ga": 3
  },
  {
    "sheetId": 826,
    "date": "1988-08-21",
    "phase": "1º turno da 2ª fase",
    "round": "8ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "goals": [
      {
        "name": "Ricardo"
      }
    ]
  },
  {
    "sheetId": 827,
    "date": "1988-08-28",
    "phase": "1º turno da 2ª fase",
    "round": "9ª rodada",
    "opponent": "CRB-AL",
    "ha": "neutral",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 828,
    "date": "1988-09-03",
    "phase": "2º turno da 2ª fase",
    "round": "1ª rodada",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 2,
    "goals": [
      {
        "name": "Ivan"
      },
      {
        "name": "Zezinho"
      },
      {
        "name": "Zé Pedro"
      }
    ]
  },
  {
    "sheetId": 829,
    "date": "1988-09-11",
    "phase": "2º turno da 2ª fase",
    "round": "2ª rodada",
    "opponent": "Comercial-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0
  },
  {
    "sheetId": 830,
    "date": "1988-09-14",
    "phase": "2º turno da 2ª fase",
    "round": "3ª rodada",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "goals": [
      {
        "name": "Maurinho"
      }
    ]
  },
  {
    "sheetId": 831,
    "date": "1988-09-17",
    "phase": "2º turno da 2ª fase",
    "round": "4ª rodada",
    "opponent": "Ferroviário-AL",
    "ha": "neutral",
    "gf": 2,
    "ga": 0
  },
  {
    "sheetId": 832,
    "date": "1988-09-21",
    "phase": "2º turno da 2ª fase",
    "round": "5ª rodada",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 2
  },
  {
    "sheetId": 833,
    "date": "1988-09-25",
    "phase": "2º turno da 2ª fase",
    "round": "6ª rodada",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 3,
    "ga": 1
  },
  {
    "sheetId": 834,
    "date": "1988-10-01",
    "phase": "2º turno da 2ª fase",
    "round": "7ª rodada",
    "opponent": "Cruzeiro-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "goals": [
      {
        "name": "Carlos Silva"
      },
      {
        "name": "Zé Pedro"
      }
    ]
  },
  {
    "sheetId": 835,
    "date": "1988-10-08",
    "phase": "2º turno da 2ª fase",
    "round": "8ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1
  },
  {
    "sheetId": 836,
    "date": "1988-10-16",
    "phase": "2º turno da 2ª fase",
    "round": "9ª rodada",
    "opponent": "CRB-AL",
    "ha": "neutral",
    "gf": 0,
    "ga": 0
  },
  {
    "sheetId": 837,
    "date": "1988-10-20",
    "phase": "Quadrangular",
    "round": "1ª rodada",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1
  },
  {
    "sheetId": 838,
    "date": "1988-10-23",
    "phase": "Quadrangular",
    "round": "2ª rodada",
    "opponent": "CRB-AL",
    "ha": "neutral",
    "gf": 1,
    "ga": 0,
    "goals": [
      {
        "name": "Ivan"
      }
    ]
  },
  {
    "sheetId": 839,
    "date": "1988-10-26",
    "phase": "Quadrangular",
    "round": "3ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0
  },
  {
    "sheetId": 840,
    "date": "1988-10-30",
    "phase": "Quadrangular",
    "round": "4ª rodada",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "goals": [
      {
        "name": "Carlos Silva"
      }
    ]
  },
  {
    "sheetId": 841,
    "date": "1988-11-02",
    "phase": "Quadrangular",
    "round": "5ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0
  },
  {
    "sheetId": 842,
    "date": "1988-11-06",
    "phase": "Quadrangular",
    "round": "6ª rodada",
    "opponent": "CRB-AL",
    "ha": "neutral",
    "gf": 0,
    "ga": 1
  },
  {
    "sheetId": 843,
    "date": "1988-11-10",
    "phase": "Fase final",
    "round": "1ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0
  },
  {
    "sheetId": 844,
    "date": "1988-11-13",
    "phase": "Fase final",
    "round": "2ª rodada",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1
  },
  {
    "sheetId": 845,
    "date": "1988-11-17",
    "phase": "Fase final",
    "round": "3ª rodada",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 5,
    "ga": 2,
    "goals": [
      {
        "name": "Café"
      },
      {
        "name": "Chico"
      },
      {
        "name": "Zé Pedro"
      },
      {
        "name": "Carlinhos Paulista"
      },
      {
        "name": "Carlos Silva"
      }
    ]
  },
  {
    "sheetId": 846,
    "date": "1988-11-20",
    "phase": "Fase final",
    "round": "4ª rodada",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1
  },
  {
    "sheetId": 847,
    "date": "1988-11-23",
    "phase": "Fase final",
    "round": "5ª rodada",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "goals": [
      {
        "name": "Paulo Marcos"
      },
      {
        "name": "Zé Pedro"
      }
    ]
  },
  {
    "sheetId": 848,
    "date": "1988-11-27",
    "phase": "Fase final",
    "round": "6ª rodada",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 2,
    "ga": 2
  }
];
