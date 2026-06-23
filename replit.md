# Portal Marujo

A maior base estatística do CSA (Centro Sportivo Alagoano). Comprehensive football statistics website covering all CSA matches, players, seasons, managers, and records in Brazilian Portuguese.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied via /api)
- `pnpm --filter @workspace/portal-marujo run dev` — run the frontend (port 25984, proxied via /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: portal-marujo, port 25984, preview path /)
- API: Express 5 (artifact: api-server, port 8080, prefix /api)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/`)
- Build: esbuild (CJS bundle)
- Router: wouter (frontend)
- Data fetching: TanStack Query + generated hooks from `@workspace/api-client-react`
- UI: shadcn/ui components, Tailwind CSS v4

## Where things live

- `lib/db/src/schema/` — Drizzle schema: players, matches, league_positions
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (summary, players, matches, seasons, opponents, managers, misc)
- `artifacts/portal-marujo/src/pages/` — React pages: Home, players/, matches/, seasons/, opponents/, managers/, goalkeepers/, stadiums/, competitions/, records/
- `artifacts/portal-marujo/src/components/layout/MainLayout.tsx` — sidebar + mobile nav

## Architecture decisions

- Contract-first API: OpenAPI spec is the source of truth; all hooks and Zod schemas are generated via Orval — never write them by hand.
- Shared DB lib: `@workspace/db` is used by the API server; frontend never touches the DB directly.
- Path-based routing: all artifacts share one domain. Frontend at `/`, API at `/api`. Vite uses relative URLs; no manual proxy config needed.
- CSA color scheme: primary blue (#1B3A6B), accent gold/yellow, white backgrounds.
- Tagline: "A maior base estatística do CSA."

## Product

- **Visão Geral**: Summary stats (total matches, win rate, goals, top scorer, most appearances, most common opponents)
- **Jogadores**: Player list + individual player pages with season-by-season stats
- **Partidas**: Match log with filters, plus records page (biggest wins/losses, streaks)
- **Temporadas**: Season-by-season overview + detailed season pages
- **Adversários**: Opponent head-to-head records
- **Técnicos**: Manager records and history
- **Goleiros**: Goalkeeper statistics
- **Estádios**: Stadiums and venue data
- **Competições**: Competition breakdown
- **Recordes**: All-time historical records

## Seeded Data

- 50 players (historical CSA squad 2017-2024)
- 50 opponents
- 10 stadiums, 10 competitions, 18 managers
- 224 matches across 2017-2024 seasons
- 92 player season stat rows
- 20 league position records (2005-2024)
- Key competitions: Série A (2019), Série B (2017, 2020, 2021), Série C (2018 champion, 2022, 2023, 2024), Copa do Brasil, Campeonato Alagoano, Copa do Nordeste

## User preferences

- All UI text in Brazilian Portuguese (pt-BR)
- CSA blue/white color scheme with gold accent

## Gotchas

- After changing DB schema, run `pnpm --filter @workspace/db run push` then restart api-server workflow.
- After changing the OpenAPI spec, run `pnpm --filter @workspace/api-spec run codegen` before editing frontend code.
- The api-server build bundles everything into `dist/index.mjs` (~2.2MB) via esbuild — this is expected.
- Do NOT run `pnpm dev` at the workspace root — use workflows or per-package commands.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
