/** Campeonato Alagoano 1978 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA vice-campeão 1978; CRB campeão; decisão em 31/01/1979 permanece na season 1978.
 * Cabeçalhos 2º/3º turno na fonte indicam 1976 por erro tipográfico.
 * Técnico: Paulistinha (Wassil Barbosa na decisão).
 * Soma dos placares listados: J28 V18 E7 D3 GP53 GC12.
 * Classificação da fonte (tabela): GP56 GC10.
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1978;

/**
 * @typedef {{
 *   date: string;
 *   phase: string;
 *   opponent: string;
 *   ha: "home"|"away";
 *   gf: number;
 *   ga: number;
 *   stadium: string;
 *   referee?: string|null;
 *   attendance?: number|null;
 *   revenue?: number|null;
 *   revenueText?: string|null;
 *   manager?: string|null;
 *   starters?: string[];
 *   entered?: string[];
 *   subs?: { out: string; in: string; minute?: number|null }[];
 *   goals?: {
 *     name: string;
 *     minute?: number|null;
 *     penalty?: boolean;
 *     ownGoal?: boolean;
 *     ownGoalDirection?: "for"|"against";
 *     side?: "csa"|"opponent";
 *   }[];
 *   note?: string;
 *   excludeFromStats?: boolean;
 *   officialResult?: "win"|"draw"|"loss";
 * }} Game
 */

/** @type {Game[]} */
export const GAMES = [
  {
    "date": "1978-08-05",
    "phase": "1º turno",
    "opponent": "São Sebastião-AL",
    "ha": "home",
    "gf": 6,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 1548,
    "revenue": 32960,
    "revenueText": "Cr$ 32.960,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Beto",
      "Timbó",
      "Zezinho",
      "Válter",
      "Peu",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Élcio"
      },
      {
        "name": "Élcio"
      },
      {
        "name": "Élcio"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Hélio"
      }
    ]
  },
  {
    "date": "1978-08-13",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Sebastião Canuto",
    "attendance": 8893,
    "revenue": 229450,
    "revenueText": "Cr$ 229.450,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Peu",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Válter"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Válter"
      }
    ],
    "goals": [
      {
        "name": "Gabriel",
        "minute": 11
      },
      {
        "name": "Gabriel",
        "minute": 44
      }
    ]
  },
  {
    "date": "1978-08-16",
    "phase": "1º turno",
    "opponent": "Canavieiro-AL",
    "ha": "home",
    "gf": 6,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 2836,
    "revenue": 59900,
    "revenueText": "Cr$ 59.900,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Válter",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Zezinho",
      "Peu"
    ],
    "subs": [
      {
        "out": "Olímpio",
        "in": "Zezinho"
      },
      {
        "out": "Válter",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Élcio"
      },
      {
        "name": "Élcio"
      },
      {
        "name": "Peu"
      },
      {
        "name": "Peu"
      },
      {
        "name": "Timbó"
      },
      {
        "name": "Gabriel"
      }
    ],
    "note": "Fonte também indica Geraldo→Válter; omitido por conflito com Válter titular no meio."
  },
  {
    "date": "1978-08-20",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 5474,
    "revenue": 118600,
    "revenueText": "Cr$ 118.600,00",
    "manager": "Paulistinha",
    "note": "Expulsões Zé Preta (CSA); Orlandinho (São Domingos)"
  },
  {
    "date": "1978-08-27",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Juca Sampaio",
    "referee": "Sebastião Canuto",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Válter",
      "Zé Preta",
      "Timbó",
      "Olímpio",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Geraldo",
      "Peu"
    ],
    "subs": [
      {
        "out": "Válter",
        "in": "Geraldo"
      },
      {
        "out": "Alberto",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Soareste",
        "minute": 27
      },
      {
        "name": "Élcio",
        "minute": 38,
        "penalty": true
      },
      {
        "name": "Élcio",
        "minute": 78
      }
    ]
  },
  {
    "date": "1978-09-03",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 12841,
    "revenue": 302541,
    "revenueText": "Cr$ 302.541,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Peu",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Zezinho",
      "Válter"
    ],
    "subs": [
      {
        "out": "Olímpio",
        "in": "Zezinho"
      },
      {
        "out": "Luís Carlos",
        "in": "Válter"
      }
    ],
    "note": "Gol Silva (CRB) 21'"
  },
  {
    "date": "1978-09-07",
    "phase": "Quadrangular do 1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "revenue": 220000,
    "revenueText": "Cr$ 220.000,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Válter",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Peu",
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Soareste",
        "in": "Peu"
      },
      {
        "out": "Hélio",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Peu"
      }
    ]
  },
  {
    "date": "1978-09-10",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Carlos Costa",
    "attendance": 10429,
    "revenue": 315575,
    "revenueText": "Cr$ 315.575,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Válter",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Alberto",
      "Soareste",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Ricardo",
      "Peu"
    ],
    "subs": [
      {
        "out": "Luís Carlos",
        "in": "Ricardo"
      },
      {
        "out": "Élcio",
        "in": "Peu"
      }
    ],
    "note": "Gols Joãozinho Paulista e Jorge da Sorte (CRB)"
  },
  {
    "date": "1978-09-13",
    "phase": "Quadrangular do 1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Patota",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Betinho",
      "Alberto",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Soareste"
    ],
    "entered": [
      "Geraldo"
    ],
    "subs": [
      {
        "out": "Patota",
        "in": "Geraldo"
      }
    ],
    "goals": [
      {
        "name": "Élcio"
      }
    ],
    "note": "Gol Rato Branco (Ferroviário) 81'"
  },
  {
    "date": "1978-09-17",
    "phase": "2º turno",
    "opponent": "São Sebastião-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio José Nivaldo",
    "referee": "José Teles",
    "revenue": 34990,
    "revenueText": "Cr$ 34.990,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Betinho",
      "Luís Carlos",
      "Gabriel",
      "Élcio",
      "Peu"
    ],
    "entered": [
      "Soareste",
      "Válter"
    ],
    "subs": [
      {
        "out": "Luís Carlos",
        "in": "Soareste"
      },
      {
        "out": "Soareste",
        "in": "Válter"
      }
    ],
    "goals": [
      {
        "name": "Élcio"
      },
      {
        "name": "Peu"
      }
    ]
  },
  {
    "date": "1978-09-27",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 2558,
    "revenue": 59986,
    "revenueText": "Cr$ 59.986,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Válter",
      "Alberto",
      "Peu",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Ricardo"
    ],
    "subs": [
      {
        "out": "Hélio",
        "in": "Ricardo"
      }
    ],
    "goals": [
      {
        "name": "Élcio"
      },
      {
        "name": "Élcio"
      },
      {
        "name": "Zezinho"
      }
    ],
    "note": "Gol Ézio (ASA); expulsão Geraldo (CSA)"
  },
  {
    "date": "1978-10-01",
    "phase": "2º turno",
    "opponent": "Canavieiro-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "Pelópidas Argolo",
    "revenue": 20150,
    "revenueText": "Cr$ 20.150,00",
    "manager": "Paulistinha",
    "goals": [
      {
        "name": "Hélio",
        "minute": 36
      },
      {
        "name": "Élcio",
        "minute": 83
      },
      {
        "name": "Peu",
        "minute": 89
      }
    ]
  },
  {
    "date": "1978-10-04",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "revenue": 37450,
    "revenueText": "Cr$ 37.450,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Válter",
      "Luís Carlos",
      "Peu",
      "Ênio Oliveira",
      "Gabriel",
      "Hélio"
    ],
    "entered": [
      "Olímpio",
      "Alberto"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Olímpio"
      },
      {
        "out": "Válter",
        "in": "Alberto"
      }
    ],
    "goals": [
      {
        "name": "Hélio"
      },
      {
        "name": "Buá",
        "ownGoal": true,
        "ownGoalDirection": "for"
      },
      {
        "name": "Alberto"
      }
    ],
    "note": "Gol Moadir (Penedense); expulsão Moadir; Buá contra"
  },
  {
    "date": "1978-10-08",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "manager": "Paulistinha",
    "note": "Só placar na fonte"
  },
  {
    "date": "1978-10-08",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "attendance": 12720,
    "revenue": 290890,
    "revenueText": "Cr$ 290.890,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Jorge Siri",
      "Betinho",
      "Gabriel",
      "Élcio",
      "Ênio Oliveira"
    ],
    "entered": [
      "Peu",
      "Hélio"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Peu"
      },
      {
        "out": "Gabriel",
        "in": "Hélio"
      }
    ],
    "goals": [
      {
        "name": "Gabriel",
        "minute": 69
      }
    ],
    "note": "Expulsões Flávio/Marcos/Deco (CRB); Ênio Oliveira (CSA); CRB simulou contusões"
  },
  {
    "date": "1978-10-19",
    "phase": "Quadrangular do 2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Teles",
    "attendance": 6441,
    "revenue": 194630,
    "revenueText": "Cr$ 194.630,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Olímpio",
      "Alberto",
      "Betinho",
      "Jorge Siri",
      "Gabriel",
      "Élcio",
      "Hélio"
    ],
    "entered": [
      "Peu",
      "Soareste"
    ],
    "subs": [
      {
        "out": "Betinho",
        "in": "Peu"
      },
      {
        "out": "Peu",
        "in": "Soareste"
      }
    ],
    "goals": [
      {
        "name": "Hélio",
        "minute": 60
      },
      {
        "name": "Élcio",
        "minute": 75
      }
    ],
    "note": "Disputa nacionalidade árbitro; Pinguela demitido (ASA)"
  },
  {
    "date": "1978-10-22",
    "phase": "Quadrangular do 2º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Teles",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Alberto",
      "Peu",
      "Jorge Siri",
      "Gabriel",
      "Hélio",
      "Ênio Oliveira"
    ],
    "entered": [
      "Soareste"
    ],
    "subs": [
      {
        "out": "Peu",
        "in": "Soareste"
      }
    ],
    "goals": [
      {
        "name": "Gabriel"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Jorge Siri"
      }
    ]
  },
  {
    "date": "1978-10-29",
    "phase": "Quadrangular do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Teles",
    "attendance": 15587,
    "revenue": 481660,
    "revenueText": "Cr$ 481.660,00",
    "manager": "Paulistinha",
    "starters": [
      "Tião",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Olímpio",
      "Alberto",
      "Jorge Siri",
      "Betinho",
      "Gabriel",
      "Élcio",
      "Ênio Oliveira"
    ],
    "entered": [
      "Soareste",
      "Hélio"
    ],
    "subs": [
      {
        "out": "Betinho",
        "in": "Soareste"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Hélio"
      }
    ],
    "goals": [
      {
        "name": "Jorge Siri",
        "minute": 3
      }
    ],
    "note": "Gol Joãozinho Paulista (CRB) 44'; CSA campeão do 2º turno"
  },
  {
    "date": "1978-11-05",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Everaldo Holanda",
    "attendance": 1714,
    "revenue": 35110,
    "revenueText": "Cr$ 35.110,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Zezinho",
      "Alberto",
      "Almir",
      "Betinho",
      "Jorge Siri",
      "Hélio",
      "Ênio Oliveira"
    ],
    "entered": [
      "Peu"
    ],
    "subs": [
      {
        "out": "Jorge Siri",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Almir",
        "minute": 45
      },
      {
        "name": "Ênio Oliveira",
        "minute": 71,
        "penalty": true
      }
    ]
  },
  {
    "date": "1978-11-08",
    "phase": "3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 1730,
    "revenue": 34690,
    "revenueText": "Cr$ 34.690,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Válter",
      "Alberto",
      "Jorge Siri",
      "Almir",
      "Ênio Oliveira",
      "Hélio",
      "Soareste"
    ],
    "entered": [
      "Betinho",
      "Peu"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Betinho"
      },
      {
        "out": "Almir",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Ênio Oliveira"
      }
    ]
  },
  {
    "date": "1978-11-12",
    "phase": "3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "attendance": 3563,
    "revenue": 77750,
    "revenueText": "Cr$ 77.750,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Válter",
      "Alberto",
      "Jorge Siri",
      "Almir",
      "Ênio Oliveira",
      "Gabriel",
      "Soareste"
    ],
    "entered": [
      "Peu",
      "Betinho"
    ],
    "subs": [
      {
        "out": "Almir",
        "in": "Peu"
      },
      {
        "out": "Soareste",
        "in": "Betinho"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "penalty": true
      },
      {
        "name": "Machado",
        "ownGoal": true,
        "ownGoalDirection": "for"
      }
    ],
    "note": "Árbitro passou mal 15'; substituído por Ronaldo Nunes"
  },
  {
    "date": "1978-11-19",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 2863,
    "revenue": 61160,
    "revenueText": "Cr$ 61.160,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Válter",
      "Alberto",
      "Jorge Siri",
      "Almir",
      "Ênio Oliveira",
      "Hélio",
      "Soareste"
    ],
    "entered": [
      "Luís Carlos",
      "Gabriel"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Luís Carlos"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Gabriel"
      }
    ],
    "goals": [
      {
        "name": "Hélio",
        "minute": 80
      }
    ],
    "note": "Expulsão Orlandinho (São Domingos)"
  },
  {
    "date": "1978-11-26",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 2,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "José Roberto Wright",
    "revenue": 246000,
    "revenueText": "Cr$ 246.000,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Zé Preta",
      "Timbó",
      "Olímpio",
      "Betinho",
      "Jorge Siri",
      "Luís Carlos",
      "Ênio Oliveira",
      "Almir",
      "Soareste"
    ],
    "entered": [
      "Beto",
      "Hélio"
    ],
    "subs": [
      {
        "out": "Timbó",
        "in": "Beto"
      },
      {
        "out": "Betinho",
        "in": "Hélio"
      }
    ],
    "goals": [
      {
        "name": "Almir"
      },
      {
        "name": "Hélio"
      }
    ],
    "note": "Gols Freitas (ASA) x2; expulsões Jorge Siri/Geraldo/Olímpio (CSA); Haroldo/Marcos Itabaiana (ASA); ASA pagou arbitragem"
  },
  {
    "date": "1978-12-03",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Teles",
    "revenue": 221950,
    "revenueText": "Cr$ 221.950,00",
    "manager": "Paulistinha",
    "note": "Expulsão Timbó (CSA)"
  },
  {
    "date": "1978-12-10",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "manager": "Paulistinha",
    "note": "Só placar na fonte"
  },
  {
    "date": "1978-12-13",
    "phase": "Quadrangular do 3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Walquir Pimentel",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Geraldo",
      "Beto",
      "Timbó",
      "Zezinho",
      "Alberto",
      "Almir",
      "Jorge Siri",
      "Gabriel",
      "Hélio",
      "Soareste"
    ],
    "entered": [
      "Luís Carlos",
      "Ênio Oliveira"
    ],
    "subs": [
      {
        "out": "Almir",
        "in": "Luís Carlos"
      },
      {
        "out": "Gabriel",
        "in": "Ênio Oliveira"
      }
    ],
    "goals": [
      {
        "name": "Jorge Siri",
        "minute": 69
      }
    ],
    "note": "Gols Freitas 39', Icinho 90' (ASA); expulsão Jorge Siri; ASA pagou arbitragem"
  },
  {
    "date": "1978-12-17",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Teles",
    "revenue": 380630,
    "revenueText": "Cr$ 380.630,00",
    "manager": "Paulistinha",
    "starters": [
      "Carlos",
      "Válter",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Soareste",
      "Alberto",
      "Almir",
      "Gabriel",
      "Hélio",
      "Ênio Oliveira"
    ],
    "entered": [
      "Luís Carlos",
      "Peu"
    ],
    "subs": [
      {
        "out": "Soareste",
        "in": "Luís Carlos"
      },
      {
        "out": "Gabriel",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira"
      }
    ],
    "note": "Gol Joãozinho Paulista (CRB)"
  },
  {
    "date": "1979-01-31",
    "phase": "Decisão do campeonato",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luís Carlos Félix",
    "attendance": 17518,
    "revenue": 575600,
    "revenueText": "Cr$ 575.600,00",
    "manager": "Wassil Barbosa",
    "starters": [
      "Carlos",
      "Beto",
      "Timbó",
      "Zé Preta",
      "Zezinho",
      "Alberto",
      "Luís Carlos",
      "Élcio",
      "Jorge Siri",
      "Hélio",
      "Soareste"
    ],
    "entered": [
      "Peu",
      "Gabriel"
    ],
    "subs": [
      {
        "out": "Élcio",
        "in": "Peu"
      },
      {
        "out": "Hélio",
        "in": "Gabriel"
      }
    ],
    "note": "CRB campeão apesar CSA 43 PG vs CRB 41; critério desempate não detalhado na fonte"
  }
];
