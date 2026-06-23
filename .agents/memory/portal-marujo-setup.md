---
name: Portal Marujo Setup
description: CSA football stats site — stack conventions, data model, and seeded data summary
---

## Stack
- Frontend: React + Vite, wouter router, TanStack Query, shadcn/ui, Tailwind CSS v4
- API: Express 5, port 8080, prefix /api
- DB: PostgreSQL + Drizzle ORM, schema in lib/db/src/schema/
- Generated hooks: lib/api-client-react (Orval from lib/api-spec/openapi.yaml)
- Colors: CSA blue #1B3A6B (primary), gold accent, white background

## Key Conventions
- Contract-first: edit openapi.yaml → run codegen → use generated hooks. Never hand-write hooks.
- All UI text in pt-BR.
- Frontend never touches DB directly — only via /api routes.

## Data Model (DB tables)
- players, player_season_stats
- matches (includes scorers text field, home_away, result, competition_id, manager_id, stadium_id)
- opponents, managers, stadiums, competitions
- league_positions

## Seeded Data (as of initial setup)
- 50 players (CSA 2017-2024 historical squads)
- 50 opponents, 10 stadiums, 10 competitions, 18 managers
- 224 matches across 2017-2024 (all competitions)
- 92 player_season_stats rows
- 20 league_positions rows (2005-2024)

**Why:** Provides realistic historical data for all stat pages without requiring live data import.

## Manager IDs (important for match seeding)
1=Moisés, 2=Argel, 3=Marcelo Cabo, 4=Mozart, 5=Roberto F, 6=Léo Condé, 7=Dado, 8=Márcio, 9=Daniel, 10=Higo, 11=Luizinho, 12=Sérgio, 13=Jonilson, 14=Nedo, 15=Carpegiani/Guto, 16=Evandro, 17=Felipe

## Competition IDs
1=Série A, 2=Série B, 3=Série C, 4=Copa Brasil, 5=Alagoano, 6=Copa Nordeste

## Stadium IDs
1=Rei Pelé (CSA home ground)
