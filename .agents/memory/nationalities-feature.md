---
name: Nationalities feature
description: How nationalities and flags are stored and displayed for players in Portal Marujo
---

# Nationalities Feature

## Storage
- `players` table has two columns: `nationality` (text) and `nationality_flag` (text, added July 2025)
- No separate nationalities table — flag emoji stored directly in the player row
- Default: `nationality = 'Brasil'`, `nationality_flag = '🇧🇷'` (set for 454 players)

## Foreign players (15 total)
Colômbia 🇨🇴: Pablo Armero (199), Andrés Escobar (170), Daniel Angulo (92), Ray Vanegas (321)
Argentina 🇦🇷: Cristian Maidana (168), Jonathan Gómez (192), Héctor Canteros (289)
Paraguai 🇵🇾: Rodolfo Gamarra (191), Héctor Bustamante (172), Eduardo Echeverría (126), Richard Franco (221), Julián Benítez (502, no season stats)
Equador 🇪🇨: John Mercado (304)
Chile 🇨🇱: Matías Cavalleri (431)
Camarões 🇨🇲: Cedric (40) — was already in DB before this feature

## Ambiguous player: Escobar (ID 75)
A player named only "Escobar" (ID 75) exists in the DB — different from Andrés Escobar (ID 170).
Could be a Brazilian Escobar, not matched to any foreign player. Set to Brasil by default. Report delivered to user.

## API endpoints added
- GET /players/foreign — non-Brazilian players with period in CSA
- GET /players/nationalities — distinct nationalities with counts/stats
- GET /players/by-nationality/:country — players of a specific nationality (URL-encoded)

## Frontend
- Flags shown only for non-Brazilian players (null check: `nationality !== 'Brasil'`)
- PlayerFlag component: `artifacts/portal-marujo/src/components/PlayerFlag.tsx` (not yet used — inline flag pattern used instead via `(p as any).nationalityFlag`)
- New pages: `/jogadores/estrangeiros` and `/jogadores/estrangeiros/:country`
- Sidebar: "Estrangeiros" added under Jogadores

**Why:** flags only for non-Brazilians keeps Brazilian-heavy lists clean; applying to everyone would add visual noise since 97% are Brazilian.
