/** Campeonato Alagoano 1975 — jogos do CSA (fonte do usuário).
 * Placar sempre na visão CSA (gf/ga).
 * CSA tricampeão de turnos 1975; técnico Laerte Dória.
 * Jogo de 25/05/1975 (Guarany) anulado — excludeFromStats; remarcação em 04/06.
 * Contagem oficial (exclui anulado): J24 V21 E2 D1 GP66 GC7.
 * Lista completa: J25 (inclui jogo anulado nos placares brutos).
 * ownGoalDirection: "for" = GPF; "against" = gol contra sofrido.
 * Minutos: 1ºT = N; 2ºT = 45+N; ex.: 53' do 2ºT = 98.
 */
export const COMPETITION_NAME = "Campeonato Alagoano";
export const SEASON = 1975;

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
    "manager": "Laerte Dória",
    "date": "1975-04-06",
    "phase": "1ª fase do 1º turno",
    "opponent": "Dínamo-AL",
    "ha": "away",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "attendance": 1589,
    "revenue": 11366,
    "revenueText": "Cr$ 11.366,00",
    "goals": [
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Misso"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Ademir"
      }
    ]
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-04-13",
    "phase": "1ª fase do 1º turno",
    "opponent": "Canavieiro-AL",
    "ha": "away",
    "gf": 0,
    "ga": 2,
    "stadium": "Manoel Moreira",
    "referee": "Petrúcio Bezerra",
    "note": "Única derrota do CSA; gols Misso e Bira (Canavieiro); expulsões Valdeci (CSA) e Geo (Canavieiro)"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-04-20",
    "phase": "1ª fase do 1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-04-27",
    "phase": "1ª fase do 1º turno",
    "opponent": "Penedense-AL",
    "ha": "away",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Alfredo Leahy",
    "referee": "Pedro Rufino",
    "goals": [
      {
        "name": "Hélio"
      },
      {
        "name": "Ademir"
      },
      {
        "name": "Misso"
      }
    ]
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-01",
    "phase": "1ª fase do 1º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Rufino",
    "goals": [
      {
        "name": "Jorge Siri",
        "minute": 59
      }
    ]
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-04",
    "phase": "Quadrangular do 1º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 2,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Carlos Costa",
    "attendance": 12149,
    "revenue": 122555,
    "revenueText": "Cr$ 122.555,00",
    "starters": [
      "Rafael",
      "Espinoza",
      "Valmir",
      "Zé Preta",
      "Valdeci",
      "Maurício",
      "Soareste",
      "Muçurica",
      "Ênio Oliveira",
      "Hélio",
      "Ademir"
    ],
    "entered": [
      "Jorge Nunes"
    ],
    "subs": [
      {
        "out": "Ênio Oliveira",
        "in": "Jorge Nunes"
      }
    ],
    "goals": [
      {
        "name": "Hélio"
      },
      {
        "name": "Espinoza"
      }
    ],
    "note": "Gol Ari (CRB); expulsão Soareste"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-07",
    "phase": "Quadrangular do 1º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Rufino",
    "attendance": 5500,
    "revenue": 40941,
    "revenueText": "Cr$ 40.941,00",
    "goals": [
      {
        "name": "Ferretti"
      },
      {
        "name": "Ênio Oliveira"
      }
    ],
    "note": "Expulsão Vergetti (Ferroviário); Ferretti estreante"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-11",
    "phase": "Quadrangular do 1º turno",
    "opponent": "ASA-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "attendance": 3619,
    "revenue": 25663,
    "revenueText": "Cr$ 25.663,00",
    "starters": [
      "Rafael",
      "Espinoza",
      "Valmir",
      "Zé Preta",
      "Valdeci",
      "Maurício",
      "Paulo Sérgio",
      "Ferretti",
      "Ênio Oliveira",
      "Hélio",
      "Sérgio"
    ],
    "entered": [
      "Tadeu",
      "Soareste"
    ],
    "subs": [
      {
        "out": "Valdeci",
        "in": "Tadeu"
      },
      {
        "out": "Maurício",
        "in": "Soareste"
      }
    ],
    "goals": [
      {
        "name": "Ferretti",
        "minute": 7
      },
      {
        "name": "Hélio",
        "minute": 71
      },
      {
        "name": "Ênio Oliveira",
        "minute": 75
      }
    ]
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-21",
    "phase": "1ª fase do 2º turno",
    "opponent": "CSE-AL",
    "ha": "home",
    "gf": 12,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "attendance": 1558,
    "revenue": 11695,
    "revenueText": "Cr$ 11.695,00",
    "starters": [
      "Rafael",
      "Espinoza",
      "Valmir",
      "Zé Preta",
      "Tadeu",
      "Maurício",
      "Soareste",
      "Ênio Oliveira",
      "Jorge Nunes",
      "Hélio",
      "Sérgio"
    ],
    "entered": [
      "Mendes",
      "Valdeci"
    ],
    "subs": [
      {
        "out": "Espinoza",
        "in": "Mendes"
      },
      {
        "out": "Tadeu",
        "in": "Valdeci"
      }
    ],
    "goals": [
      {
        "name": "Hélio"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Soareste"
      },
      {
        "name": "Soareste"
      },
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Jorge Nunes"
      },
      {
        "name": "Jorge Nunes"
      },
      {
        "name": "Tadeu"
      },
      {
        "name": "Maurício"
      },
      {
        "name": "Sérgio"
      }
    ],
    "note": "Maior goleada do Trapichão até então"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-25",
    "phase": "2º turno (jogo anulado)",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "revenue": 17133,
    "revenueText": "Cr$ 17.133,00",
    "goals": [
      {
        "name": "Hélio"
      },
      {
        "name": "Maurício"
      }
    ],
    "excludeFromStats": true,
    "note": "Partida interrompida por falta de energia; remarcada em 04/06/1975"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-05-29",
    "phase": "1ª fase do 2º turno",
    "opponent": "Santa Cruz-AL",
    "ha": "away",
    "gf": 4,
    "ga": 1,
    "stadium": "Estádio Argemiro Cavalcante"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-01",
    "phase": "1ª fase do 2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 6,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "attendance": 3988,
    "revenue": 30015,
    "revenueText": "Cr$ 30.015,00",
    "goals": [
      {
        "name": "Ferretti"
      },
      {
        "name": "Ferretti"
      },
      {
        "name": "Ferretti"
      },
      {
        "name": "Ferretti"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Hélio"
      }
    ],
    "note": "Gol Alberto pênalti (Ferroviário); expulsão Ênio (Ferroviário)"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-04",
    "phase": "1ª fase do 2º turno",
    "opponent": "Guarany-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 2191,
    "revenue": 16804,
    "revenueText": "Cr$ 16.804,00",
    "goals": [
      {
        "name": "Hélio"
      },
      {
        "name": "Jorge Nunes"
      }
    ],
    "note": "Remarcação do jogo anulado em 25/05/1975"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-08",
    "phase": "1ª fase do 2º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 20387,
    "revenue": 218905,
    "revenueText": "Cr$ 218.905,00",
    "starters": [
      "Rafael",
      "Tadeu",
      "Geraldo",
      "Zé Preta",
      "Valdeci",
      "Roberto Menezes",
      "Soareste",
      "Sérgio Galocha",
      "Ênio Oliveira",
      "Ferretti",
      "Hélio"
    ],
    "entered": [
      "Jorge Nunes"
    ],
    "subs": [
      {
        "out": "Sérgio Galocha",
        "in": "Jorge Nunes"
      }
    ],
    "goals": [
      {
        "name": "Ferretti"
      }
    ],
    "note": "Expulsão Ademir (CRB)"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-11",
    "phase": "Quadrangular do 2º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Rubens Cerqueira",
    "goals": [
      {
        "name": "Torino"
      },
      {
        "name": "Ferretti"
      }
    ],
    "note": "Expulsão Ferretti; jogo preliminar"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-15",
    "phase": "Quadrangular do 2º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 1,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "attendance": 6031,
    "revenue": 45961,
    "revenueText": "Cr$ 45.961,00",
    "goals": [
      {
        "name": "Torino"
      }
    ],
    "note": "Gol Alcides (Penedense)"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-18",
    "phase": "Quadrangular do 2º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 0,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "José de Assis Aragão",
    "attendance": 8343,
    "revenue": 92660,
    "revenueText": "Cr$ 92.660,00"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-06-29",
    "phase": "1ª fase do 3º turno",
    "opponent": "Guarany-AL",
    "ha": "away",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Túlio Jatobá",
    "attendance": 1970,
    "revenue": 15120,
    "revenueText": "Cr$ 15.120,00",
    "goals": [
      {
        "name": "Ênio Oliveira"
      },
      {
        "name": "Ênio Oliveira"
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
    "manager": "Laerte Dória",
    "date": "1975-07-06",
    "phase": "1ª fase do 3º turno",
    "opponent": "ASA-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Coaracy da Mata (Fumeirão)",
    "referee": "Edvaldo Bonfim",
    "starters": [
      "Rafael",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Valdeci",
      "Roberto Menezes",
      "Soareste",
      "Jorge Nunes",
      "Ferretti",
      "Hélio",
      "Ênio Oliveira"
    ],
    "entered": [
      "Misso",
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Jorge Nunes",
        "in": "Misso"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Jorge Siri"
      }
    ],
    "goals": [
      {
        "name": "Ênio Oliveira",
        "minute": 58
      }
    ],
    "note": "Técnico do ASA irritado com a arbitragem"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-07-13",
    "phase": "1ª fase do 3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 2,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Antônio Morais",
    "attendance": 3819,
    "revenue": 28537,
    "revenueText": "Cr$ 28.537,00",
    "goals": [
      {
        "name": "Misso"
      },
      {
        "name": "Ferretti",
        "penalty": true
      }
    ],
    "note": "Expulsão Luiz Bodão (Penedense)"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-07-20",
    "phase": "1ª fase do 3º turno",
    "opponent": "CSE-AL",
    "ha": "away",
    "gf": 4,
    "ga": 0,
    "stadium": "Estádio Édson Amaro",
    "referee": "Antônio Morais",
    "goals": [
      {
        "name": "Torino"
      },
      {
        "name": "Zé Preta"
      },
      {
        "name": "Hélio"
      },
      {
        "name": "Ênio Oliveira"
      }
    ],
    "note": "Expulsão Marcos Costa (CSE)"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-07-27",
    "phase": "1ª fase do 3º turno",
    "opponent": "CRB-AL",
    "ha": "home",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 15201,
    "revenue": 138625,
    "revenueText": "Cr$ 138.625,00",
    "starters": [
      "Rafael",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Rogério",
      "Roberto Menezes",
      "Soareste",
      "Ênio Oliveira",
      "Hélio",
      "Ferretti",
      "Torino"
    ],
    "entered": [
      "Sérgio Galocha",
      "Misso"
    ],
    "subs": [
      {
        "out": "Soareste",
        "in": "Sérgio Galocha"
      },
      {
        "out": "Ênio Oliveira",
        "in": "Misso"
      }
    ],
    "goals": [
      {
        "name": "Major",
        "minute": 70
      }
    ]
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-07-30",
    "phase": "Quadrangular do 3º turno",
    "opponent": "Penedense-AL",
    "ha": "home",
    "gf": 3,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Pedro Rufino",
    "attendance": 3814,
    "revenue": 28936,
    "revenueText": "Cr$ 28.936,00",
    "goals": [
      {
        "name": "Ferretti"
      },
      {
        "name": "Natal"
      },
      {
        "name": "Ênio Oliveira"
      }
    ]
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-08-03",
    "phase": "Quadrangular do 3º turno",
    "opponent": "Ferroviário-AL",
    "ha": "home",
    "gf": 3,
    "ga": 1,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "goals": [
      {
        "name": "Valdeci"
      },
      {
        "name": "Torino"
      },
      {
        "name": "Ênio Oliveira"
      }
    ],
    "note": "Gol Ventilador (Ferroviário); jogo preliminar"
  },
  {
    "manager": "Laerte Dória",
    "date": "1975-08-06",
    "phase": "Quadrangular do 3º turno",
    "opponent": "CRB-AL",
    "ha": "away",
    "gf": 1,
    "ga": 0,
    "stadium": "Estádio Rei Pelé (Trapichão)",
    "referee": "Sebastião Canuto",
    "attendance": 13604,
    "revenue": 147578,
    "revenueText": "Cr$ 147.578,00",
    "starters": [
      "Rafael",
      "Natal",
      "Geraldo",
      "Zé Preta",
      "Rogério",
      "Roberto Menezes",
      "Soareste",
      "Torino",
      "Ênio Oliveira",
      "Ferretti",
      "Sérgio"
    ],
    "entered": [
      "Jorge Siri"
    ],
    "subs": [
      {
        "out": "Ênio Oliveira",
        "in": "Jorge Siri"
      }
    ],
    "goals": [
      {
        "name": "Ferretti",
        "minute": 51
      }
    ]
  }
];
