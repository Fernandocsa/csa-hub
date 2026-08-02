/** Campeonato Alagoano 1979 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA 4º colocado em 1979; CRB campeão; regulamento do superturno define os quatro primeiros.
 * Técnicos: Vassil Barbosa → Hélio Miranda → Zé Galego.
 * Soma dos placares listados: J34 V19 E6 D9 GP67 GC33.
 * Classificação final da fonte: GP67 GC32 (diferença de 1 gol contra).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1979;

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
    "date": "1979-03-25",
    "phase": "1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "revenue": 77930,
    "revenueText": "Cr$ 77.930,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Beto",
      "Haroldo",
      "Paulo",
      "Zezinho",
      "Jorge Siri",
      "Luís Carlos",
      "Peu",
      "Paulinho",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Hélio",
      "Cláudio"
    ],
    "subs": [
      {
        "out": "Zezinho",
        "in": "Hélio"
      },
      {
        "out": "Paulinho",
        "in": "Cláudio"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 57
      },
      {
        "name": "Gilmar",
        "minute": 69
      },
      {
        "name": "Peu",
        "minute": 87
      }
    ],
    "note": "Gol Zezinho (Ferroviário) 12'"
  },
  {
    "date": "1979-04-01",
    "phase": "1º turno",
    "opponent": "São Domingos-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "revenue": 101700,
    "revenueText": "Cr$ 101.700,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Gilmar"
      },
      {
        "name": "Gilmar"
      },
      {
        "name": "Ênio Oliveira"
      }
    ]
  },
  {
    "date": "1979-04-08",
    "phase": "1º turno",
    "opponent": "Capelense-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Manoel Moreira",
    "referee": "João Vilela",
    "attendance": 30000,
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Cláudio"
    ],
    "subs": [
      {
        "out": "Soareste",
        "in": "Cláudio"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Gilmar"
      },
      {
        "name": "Peu"
      }
    ]
  },
  {
    "date": "1979-04-11",
    "phase": "1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "revenue": 71290,
    "revenueText": "Cr$ 71.290,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Alberto"
    ],
    "subs": [
      {
        "out": "Jorge Siri",
        "in": "Alberto"
      }
    ],
    "note": "ASA revoltado com anulação de gol de Freitas"
  },
  {
    "date": "1979-04-15",
    "phase": "1º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "revenue": 39420,
    "revenueText": "Cr$ 39.420,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Hélio",
      "Alberto",
      "Peu",
      "Luís Carlos",
      "Cláudio",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Peu"
      },
      {
        "name": "Gilmar"
      },
      {
        "name": "Gilmar"
      },
      {
        "name": "Cláudio"
      }
    ],
    "note": "Gol Gilberto (CSE)"
  },
  {
    "date": "1979-04-22",
    "phase": "1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José Teles",
    "attendance": 12272,
    "revenue": 292760,
    "revenueText": "Cr$ 292.760,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Beto",
      "Haroldo",
      "Zezinho",
      "Alberto",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Paulo",
      "Soareste"
    ],
    "subs": [
      {
        "out": "Peu",
        "in": "Paulo"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Soareste"
      }
    ],
    "note": "Gols Mundinho e Jorge da Sorte; expulsões Beto e Zezinho (CSA)"
  },
  {
    "date": "1979-04-29",
    "phase": "Quadrangular do 1º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Paulo",
      "Haroldo",
      "Evaristo",
      "Alberto",
      "Soareste",
      "Peu",
      "Jorge Siri",
      "Gilmar",
      "Caneta"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Jorge Siri",
        "penalty": true
      }
    ],
    "note": "Gol Rosalvinho (Penedense)"
  },
  {
    "date": "1979-05-03",
    "phase": "Quadrangular do 1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "revenue": 128020,
    "revenueText": "Cr$ 128.020,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Geraldo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Alberto",
      "Soareste",
      "Jorge Siri",
      "Paulinho",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Evaristo",
      "Peu"
    ],
    "subs": [
      {
        "out": "Geraldo",
        "in": "Evaristo"
      },
      {
        "out": "Soareste",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Paulinho"
      }
    ],
    "note": "Gol Freitas (ASA)"
  },
  {
    "date": "1979-05-06",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "revenue": 390040,
    "revenueText": "Cr$ 390.040,00",
    "manager": "Vassil Barbosa",
    "starters": [
      "Dida",
      "Evaristo",
      "Beto",
      "Paulo",
      "Zezinho",
      "Soareste",
      "Jorge Siri",
      "Alex",
      "Paulinho",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Cláudio",
      "Peu"
    ],
    "subs": [
      {
        "out": "Paulinho",
        "in": "Cláudio"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Peu"
      }
    ],
    "note": "Gol Alberto (CRB) 70'; expulsões Soareste/Beto (CSA); Silva (CRB)"
  },
  {
    "date": "1979-05-13",
    "phase": "2º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 0,
    "ga": 1,
    "stadium": "Estádio Juca Sampaio",
    "referee": "Sebastião Canuto",
    "manager": "Hélio Miranda",
    "starters": [
      "Dida",
      "Geraldo",
      "Haroldo",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Alex",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Peu"
    ],
    "entered": [
      "Cláudio",
      "Paulinho"
    ],
    "subs": [
      {
        "out": "Jorge Siri",
        "in": "Cláudio"
      },
      {
        "out": "Peu",
        "in": "Paulinho"
      }
    ],
    "note": "Gol Gilberto (CSE) 49'"
  },
  {
    "date": "1979-05-20",
    "phase": "2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "away",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "revenue": 66630,
    "revenueText": "Cr$ 66.630,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Dida",
      "Geraldo",
      "Haroldo",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Alex",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Paulinho",
      "Peu"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Paulinho"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Gilmar"
      },
      {
        "name": "Jorge Siri"
      }
    ],
    "note": "Gol Zezinho (Ferroviário)"
  },
  {
    "date": "1979-05-30",
    "phase": "2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 2047,
    "revenue": 44560,
    "revenueText": "Cr$ 44.560,00",
    "manager": "Hélio Miranda",
    "goals": [
      {
        "name": "Gilmar"
      },
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Beto"
      },
      {
        "name": "Peu"
      }
    ],
    "note": "Gol Dado (Penedense)"
  },
  {
    "date": "1979-06-02",
    "phase": "2º turno",
    "opponent": "São Sebastião-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "manager": "Hélio Miranda",
    "goals": [
      {
        "name": "Jorge Siri",
        "minute": 42
      }
    ]
  },
  {
    "date": "1979-06-10",
    "phase": "2º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 2,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Arnaldo César Coelho",
    "revenue": 301000,
    "revenueText": "Cr$ 301.000,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Dida",
      "Geraldo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alex",
      "Luís Carlos",
      "Gilmar",
      "Ênio Oliveira",
      "Peu",
      "Ézio"
    ],
    "entered": [
      "Alberto",
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Alex",
        "in": "Alberto"
      },
      {
        "out": "Ézio",
        "in": "Jorge Siri"
      }
    ],
    "goals": [
      {
        "name": "Peu"
      },
      {
        "name": "Ézio"
      }
    ],
    "note": "Gols Carioca e Icinho (ASA); ASA custeou arbitragem"
  },
  {
    "date": "1979-06-17",
    "phase": "2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "revenue": 592840,
    "revenueText": "Cr$ 592.840,00",
    "manager": "Hélio Miranda",
    "goals": [
      {
        "name": "Peu"
      },
      {
        "name": "Radar"
      }
    ],
    "note": "Gol Galba (CRB); expulsões Alex/Geraldo (CSA); Mundinho (CRB); Silva (CRB) fratura braço"
  },
  {
    "date": "1979-06-24",
    "phase": "Quadrangular do 2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "revenue": 129000,
    "revenueText": "Cr$ 129.000,00",
    "manager": "Hélio Miranda",
    "goals": [
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Jorge Siri",
        "minute": 82
      }
    ],
    "note": "Gol Índio (CSE) 1ºT"
  },
  {
    "date": "1979-06-27",
    "phase": "Quadrangular do 2º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 4,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Carlos Félix",
    "attendance": 8943,
    "revenue": 302085,
    "revenueText": "Cr$ 302.085,00",
    "manager": "Hélio Miranda",
    "goals": [
      {
        "name": "Jorge Siri",
        "minute": 4
      },
      {
        "name": "Ézio",
        "minute": 44
      },
      {
        "name": "Ézio",
        "minute": 57
      },
      {
        "name": "Almir",
        "minute": 85
      }
    ],
    "note": "Gols ASA: Leônidas 25, Zeca 26, Canhoto 39; ASA custeou arbitragem"
  },
  {
    "date": "1979-07-01",
    "phase": "Quadrangular do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Carlos Félix",
    "attendance": 27415,
    "revenue": 970280,
    "revenueText": "Cr$ 970.280,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Geraldo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alex",
      "Luís Carlos",
      "Gilmar",
      "Jorge Siri",
      "Peu",
      "Ézio"
    ],
    "entered": [
      "Ênio Oliveira",
      "Almir"
    ],
    "subs": [
      {
        "out": "Alex",
        "in": "Ênio Oliveira"
      },
      {
        "out": "Ézio",
        "in": "Almir"
      }
    ],
    "note": "Expulsões Geraldo (CSA); Jorge da Sorte (CRB)"
  },
  {
    "date": "1979-07-04",
    "phase": "Decisão do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Walquir Pimentel",
    "attendance": 19402,
    "revenue": 717990,
    "revenueText": "Cr$ 717.990,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Alex",
      "Gilmar",
      "Luís Carlos",
      "Ênio Oliveira",
      "Peu",
      "Ézio"
    ],
    "entered": [
      "Zezinho",
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Alberto",
        "in": "Zezinho"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Jorge Siri"
      }
    ],
    "goals": [
      {
        "name": "Ézio",
        "minute": 25
      },
      {
        "name": "Gilmar",
        "minute": 42
      }
    ],
    "note": "CSA campeão do 2º turno"
  },
  {
    "date": "1979-07-15",
    "phase": "3º turno",
    "opponent": "São Sebastião-AL",
    "ha": "home",
    "gf": 7,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "manager": "Hélio Miranda",
    "note": "Só placar na fonte"
  },
  {
    "date": "1979-07-22",
    "phase": "3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 8101,
    "revenue": 196170,
    "revenueText": "Cr$ 196.170,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Alex",
      "Gilmar",
      "Luís Carlos",
      "Ênio Oliveira",
      "Radar",
      "Ézio"
    ],
    "entered": [
      "Peu",
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Gilmar",
        "in": "Peu"
      },
      {
        "out": "Ézio",
        "in": "Jorge Siri"
      }
    ]
  },
  {
    "date": "1979-07-28",
    "phase": "3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "attendance": 2371,
    "revenue": 51600,
    "revenueText": "Cr$ 51.600,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Haroldo",
      "Luizinho",
      "Belisco",
      "Almir",
      "Luís Carlos",
      "Ênio Oliveira",
      "Radar",
      "Ézio"
    ],
    "entered": [
      "Gilmar",
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Almir",
        "in": "Gilmar"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Jorge Siri"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Almir"
      },
      {
        "name": "Almir"
      },
      {
        "name": "Gilmar"
      }
    ],
    "note": "CSA comprou mando"
  },
  {
    "date": "1979-08-01",
    "phase": "3º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "revenue": 66440,
    "revenueText": "Cr$ 66.440,00",
    "manager": "Hélio Miranda",
    "goals": [
      {
        "name": "Gilmar",
        "minute": 8
      },
      {
        "name": "Gilmar",
        "minute": 9
      },
      {
        "name": "Ênio Oliveira",
        "minute": 88
      }
    ]
  },
  {
    "date": "1979-08-05",
    "phase": "3º turno",
    "opponent": "São Domingos-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Evaristo",
      "Paulo",
      "Haroldo",
      "Luizinho",
      "Alberto",
      "Gilmar",
      "Luís Carlos",
      "Jorge Siri",
      "Radar",
      "Ézio"
    ],
    "entered": [
      "Paulinho",
      "Peu"
    ],
    "subs": [
      {
        "out": "Jorge Siri",
        "in": "Paulinho"
      },
      {
        "out": "Radar",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Radar"
      },
      {
        "name": "Gilmar",
        "penalty": true
      },
      {
        "name": "Peu"
      },
      {
        "name": "Almir"
      }
    ]
  },
  {
    "date": "1979-08-12",
    "phase": "3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "revenue": 362230,
    "revenueText": "Cr$ 362.230,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alex",
      "Gilmar",
      "Luís Carlos",
      "Ênio Oliveira",
      "Peu",
      "Ézio"
    ],
    "entered": [
      "Alberto",
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Peu",
        "in": "Alberto"
      },
      {
        "out": "Ézio",
        "in": "Jorge Siri"
      }
    ],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 21
      },
      {
        "name": "Gilmar",
        "minute": 67
      },
      {
        "name": "Gilmar",
        "minute": 68
      }
    ],
    "note": "Gol Alberto (CRB) 65'"
  },
  {
    "date": "1979-08-15",
    "phase": "Quadrangular do 3º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Luiz Carlos Félix",
    "attendance": 4138,
    "revenue": 313125,
    "revenueText": "Cr$ 313.125,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Luís Carlos",
      "Gilmar",
      "Ézio",
      "Ênio Oliveira",
      "Peu",
      "Jorge Siri"
    ],
    "entered": [
      "Paulinho"
    ],
    "subs": [
      {
        "out": "Jorge Siri",
        "in": "Paulinho"
      }
    ],
    "goals": [
      {
        "name": "Gilmar"
      },
      {
        "name": "Gilmar"
      },
      {
        "name": "Peu"
      }
    ],
    "note": "ASA custeou arbitragem; fonte listava Gilmar duas vezes — Peu no ataque (marcou)"
  },
  {
    "date": "1979-08-19",
    "phase": "Quadrangular do 3º turno",
    "opponent": "Capelense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Evaristo",
      "Haroldo",
      "Beto",
      "Luizinho",
      "Alex",
      "Luís Carlos",
      "Gilmar",
      "Jorge Siri",
      "Almir",
      "Ézio"
    ],
    "entered": [
      "Alberto",
      "Peu"
    ],
    "subs": [
      {
        "out": "Alex",
        "in": "Alberto"
      },
      {
        "out": "Almir",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Ézio"
      },
      {
        "name": "Ézio"
      },
      {
        "name": "Peu"
      }
    ]
  },
  {
    "date": "1979-08-26",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "manager": "Hélio Miranda",
    "note": "Só placar na fonte"
  },
  {
    "date": "1979-08-30",
    "phase": "Superturno final",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Juarez Inácio",
    "attendance": 2489,
    "revenue": 81460,
    "revenueText": "Cr$ 81.460,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Alberto",
      "Zé Luiz",
      "Beto",
      "Evaristo",
      "Luís Carlos",
      "Gilmar",
      "Peu",
      "Ênio Oliveira",
      "Radar",
      "Jorge Siri"
    ],
    "entered": [
      "Alex",
      "Almir"
    ],
    "subs": [
      {
        "out": "Luís Carlos",
        "in": "Alex"
      },
      {
        "out": "Radar",
        "in": "Almir"
      }
    ],
    "goals": [
      {
        "name": "Zé Luiz",
        "minute": 4,
        "ownGoal": true,
        "ownGoalDirection": "against"
      },
      {
        "name": "Gilmar",
        "minute": 32,
        "penalty": true
      },
      {
        "name": "Zé Luiz",
        "minute": 87
      },
      {
        "name": "Almir",
        "minute": 98
      }
    ],
    "note": "Expulsões Alex (CSA) e Marcos (CSE)"
  },
  {
    "date": "1979-09-02",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Luiz Carlos Félix",
    "manager": "Hélio Miranda",
    "starters": [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alberto",
      "Peu",
      "Jorge Siri",
      "Ênio Oliveira",
      "Gilmar",
      "Ézio"
    ],
    "entered": [
      "Almir"
    ],
    "subs": [
      {
        "out": "Ézio",
        "in": "Almir"
      }
    ],
    "note": "Gols Jorge Luiz 31, Carioca 63; interrompida 84' falta energia; ASA custeou arbitragem"
  },
  {
    "date": "1979-09-09",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 3,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Arnaldo César Coelho",
    "revenue": 480000,
    "revenueText": "Cr$ 480.000,00",
    "manager": "Hélio Miranda",
    "starters": [
      "Valvir",
      "Geraldo",
      "Zé Luiz",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Peu",
      "Luís Carlos",
      "Jorge Siri",
      "Gilmar",
      "Ênio Oliveira"
    ],
    "entered": [
      "Almir",
      "Paulinho"
    ],
    "subs": [
      {
        "out": "Peu",
        "in": "Almir"
      },
      {
        "out": "Gilmar",
        "in": "Paulinho"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 42,
        "penalty": true
      }
    ],
    "note": "Gols Silva 16, Itamar 32, Silva 50 (CRB)"
  },
  {
    "date": "1979-09-16",
    "phase": "Superturno final",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 1,
    "ga": 2,
    "stadium": "Estádio Juca Sampaio",
    "referee": "Pelópidas Argolo",
    "manager": "Zé Galego",
    "starters": [
      "Samuel",
      "Luizinho",
      "Zé Luiz",
      "Paulo",
      "Evaristo",
      "Alberto",
      "Almir",
      "Belisco",
      "Ênio Oliveira",
      "Gilmar",
      "Ézio"
    ],
    "entered": [],
    "subs": [],
    "goals": [
      {
        "name": "Gilmar",
        "minute": 68
      }
    ],
    "note": "Gols Ailton 50, Geo 73 (CSE)"
  },
  {
    "date": "1979-09-19",
    "phase": "Superturno final",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pelópidas Argolo",
    "revenue": 132320,
    "revenueText": "Cr$ 132.320,00",
    "manager": "Zé Galego",
    "starters": [
      "Nego",
      "Paulo",
      "Zé Luiz",
      "Luizinho",
      "Cardoso",
      "Alberto",
      "Belisco",
      "Luís Carlos",
      "Jorge Siri",
      "Peu",
      "Ézio"
    ],
    "entered": [
      "Evaristo",
      "Almir",
      "Ênio Oliveira"
    ],
    "subs": [
      {
        "out": "Nego",
        "in": "Evaristo"
      },
      {
        "out": "Belisco",
        "in": "Almir"
      },
      {
        "out": "Jorge Siri",
        "in": "Ênio Oliveira"
      }
    ],
    "note": "Gols Freitas 53 e 61"
  },
  {
    "date": "1979-09-23",
    "phase": "Superturno final",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Arnaldo César Coelho",
    "attendance": 15331,
    "revenue": 531670,
    "revenueText": "Cr$ 531.670,00",
    "manager": "Zé Galego",
    "starters": [
      "Samuel",
      "Evaristo",
      "Zé Luiz",
      "Beto",
      "Luizinho",
      "Alberto",
      "Belisco",
      "Almir",
      "Ênio Oliveira",
      "Gilmar",
      "Ézio"
    ],
    "entered": [
      "Luís Carlos",
      "Peu"
    ],
    "subs": [
      {
        "out": "Belisco",
        "in": "Luís Carlos"
      },
      {
        "out": "Ézio",
        "in": "Peu"
      }
    ],
    "goals": [
      {
        "name": "Zé Luiz",
        "minute": 20,
        "ownGoal": true,
        "ownGoalDirection": "against"
      }
    ],
    "note": "Gol Silva (CRB) 2ºT"
  }
];
