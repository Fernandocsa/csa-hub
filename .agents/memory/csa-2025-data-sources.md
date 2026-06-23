---
name: CSA 2025 data sources
description: Where each 2025 competition's match data came from, and what Alagoano matches had to be derived vs confirmed.
---

## Data Sources by Competition

- **Série C 2025 (19 matches)**: ESPN Brasil `/futebol/equipe/partidas/_/id/4573` — fully static HTML, all scores/dates/venues verified.
- **Copa do Brasil 2025 (6 matches)**: ESPN Brasil same source — all confirmed.
- **Copa Nordeste 2025 (9 matches, groups+QF+SF)**: Olympics.com Copa Nordeste 2025 table page — all confirmed.
- **Copa Nordeste Classificatória / Pré-Copa (2 matches)**: AI webSearch confirmed: CSA 1-0 Barcelona de Ilhéus (Jan 4), CSA 1-0 Maracanã-CE (Jan 8), both HOME at Rei Pelé.
- **Campeonato Alagoano (11 matches)**:
  - Group confirmed: vs Murici (2-0 H W), vs CRB (3-2 A W), vs Coruripe (1-1 A D), vs ASA (0-0 H D), vs Penedense (0-2 A L)
  - Group derived: vs CSE (2-0 H W) — date estimated Feb 5
  - SF confirmed: ASA 1-0 CSA (A L, Feb 8 Ida), CSA 1-0 ASA (H W, Feb 22 Volta — CSA lost on penalties but OGol counts as W in 90min)
  - Copa Brasil Elim L1 confirmed (AI): CSA 0-0 CSE (H D, Apr 2)
  - Copa Brasil Elim L2 derived: CSE 0-2 CSA (A W, Apr 6)
  - Repescagem derived: CSA 3-0 Penedense (H W, Feb 26) — opponent and date estimated

## OGol Verification (confirmed totals, season 2025)

47J total: 21V 13E 13D, 64 gols marcados, 43 sofridos.

By competition:
- Alagoano: 11J 6V 3E 2D 14-6 ✓
- Série C: 19J 5V 7E 7D 21-23 ✓
- Nordeste Classif: 2J 2V 0E 0D 2-0 ✓
- Copa do Brasil: 6J 3V 2E 1D 11-5 ✓
- Copa do Nordeste: 9J 5V 1E 3D 16-9 ✓

## Key facts for 2025

- Manager: Higo Magalhães (id=10), updated start_year=2024, end_year=2025
- CSA home stadium: Estádio Rei Pelé (id=1)
- 19 new opponents added (Anápolis, Ypiranga, Maringá, Tombense, São Bernardo, Floresta, Guarani, Caxias do Sul, Retrô, Itabaiana, Ituano, Brusque, Boavista, Tuna Luso, Ferroviário, Juazeirense, Barcelona de Ilhéus, Maracanã-CE, Penedense)
- New competition: "Copa Nordeste Classificatória" added

**Why:** OGol is JS-rendered and not scrapable. ESPN Brasil is the best static source for national competitions. For Alagoano, AI webSearch is the best option and scores were derived from OGol totals.
