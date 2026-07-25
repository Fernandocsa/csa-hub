# Threat Model

## Project Overview

Portal Marujo is a public-facing football statistics website for CSA (Centro Sportivo Alagoano). It is built with React + Vite (frontend), Express 5 (API server), and PostgreSQL via Drizzle ORM. The application is deployed publicly on Replit Autoscale at `https://csa-stats-hub.replit.app`. It has no user authentication — all read endpoints are public — but it does have an admin panel backed by a shared password for managing data (matches, players, seasons, etc.).

## Assets

- **Admin credentials** — `ADMIN_PASSWORD` and `SESSION_SECRET` environment variables. Compromise allows full database mutation (create, update, delete all match, player, and season data).
- **Database contents** — CSA match history, player records, and statistics. This is the core product asset; unauthorized writes corrupt or destroy it.
- **Application secrets** — `DATABASE_URL` (Postgres connection string), `SESSION_SECRET`. Leaking these grants direct database access.

## Trust Boundaries

- **Internet → Public API** — All read endpoints (`/api/players`, `/api/matches`, `/api/seasons`, etc.) are unauthenticated and intentionally public. No PII or sensitive data is served here.
- **Internet → Admin API** — Admin endpoints (`/api/admin/*`) require a Bearer token derived from `ADMIN_PASSWORD` and `SESSION_SECRET`. This is the primary security boundary separating public readers from admin writers.
- **API → PostgreSQL** — The API server is the only component with database access. Drizzle ORM is used throughout; queries are parameterized via the ORM.
- **Build-time / client** — The React frontend is a static bundle served by Vite. No secrets are embedded in the client bundle. Admin API calls originate from the browser with a Bearer token stored in client state.

## Scan Anchors

- Primary risk area: `artifacts/api-server/src/routes/admin.ts` — all admin write operations
- Admin login endpoint: `POST /api/admin/login`
- CORS config: `artifacts/api-server/src/app.ts` (line 28)
- All `/api/admin/*` routes require `requireAdmin` middleware (Bearer token check)
- Public read routes in `artifacts/api-server/src/routes/` — no auth, intentional
- Frontend admin panel: `artifacts/portal-marujo/src/` — client-side only, no security enforcement

## Threat Categories

### Spoofing / Authentication

The admin authentication model derives a deterministic HMAC token from `SESSION_SECRET` and `ADMIN_PASSWORD`. If either env var is not set in production, the fallback values (`"fallback-secret"` and `"admin"`) produce a predictable, publicly-derivable token. The login endpoint at `POST /api/admin/login` has no rate limiting, making it vulnerable to brute force if the password is weak or default. The token never expires and cannot be revoked without changing the environment variables.

**Required guarantees:**
- `ADMIN_PASSWORD` MUST be set to a strong, non-default value in production.
- `SESSION_SECRET` MUST be set to a cryptographically random value in production.
- The admin login endpoint MUST be rate-limited.
- Admin tokens SHOULD have an expiry mechanism.

### Tampering

All admin write operations (insert, update, delete of matches, players, stats, opponents, managers, competitions) are gated behind `requireAdmin`. Drizzle ORM is used for all DB queries — no raw string interpolation was found. CSV imports are also admin-only but have no size limits, which could lead to large payload processing.

### Information Disclosure

All read endpoints expose only football statistics — no PII, no secrets. Error messages return generic strings. Stack traces are not exposed. Database errors are logged server-side via pino but not returned to the client.

### Elevation of Privilege

No multi-role authorization exists. There is one privilege level (admin vs. public). Admin access provides full database write capability. The CORS policy (`cors()` with no options) permits any origin to make cross-origin requests, including to admin endpoints. Since admin auth uses Bearer tokens (not cookies), traditional CSRF is not applicable, but permissive CORS allows any web page to call the API with user-supplied tokens.

### Denial of Service

No rate limiting exists on any endpoint, including the admin login form. The CSV import endpoints accept arbitrary-length strings with no body size cap beyond Express's default JSON limit (typically 100 KB). Public read endpoints are unauthenticated and could be scraped or overwhelmed without rate limiting.
