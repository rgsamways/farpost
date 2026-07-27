## Why

Nothing exists yet on the backend — the rebuild's stack decision (Fastify + Drizzle + Postgres + better-auth) has been documented since before this rebuild started, but no `api/` directory, no database, no server has actually been built. `wire-better-auth` and everything after it needs real infrastructure to land on; this change is that infrastructure, with no auth yet.

## What Changes

- Scaffold a new Fastify + TypeScript backend at `api/`, mirroring Vocare's real, working structure (`c:\dev\vocare\backend`) — read directly, not guessed at.
- Local Postgres via Docker Compose, on its own port distinct from Vocare's (5434) and the native PostgreSQL install (5432).
- Drizzle ORM wired to that Postgres instance, with a real (if currently empty) migration workflow proven to work end-to-end.
- A `/health` route that checks real database connectivity, not just that the Fastify process is up.
- No auth, no `Membership` table, no app-specific schema yet — this change proves the plumbing works; `wire-better-auth` builds on top of it.

## Capabilities

### New Capabilities
- `fastify-backend`: the running Fastify server, its Postgres connection, and its migration tooling — the foundation every later backend capability builds on.

### Modified Capabilities
(none)

## Impact

- New `api/` directory: `package.json`, `tsconfig.json`, `drizzle.config.ts`, `docker-compose.yml`, `.env.example`, `src/app.ts`, `src/index.ts`, `src/db/client.ts`, `src/db/schema.ts`.
- No impact on `web/` — the frontend doesn't call this API yet (no routes exist for it to call besides `/health`).
- No auth, billing, or domain tables in this change — deliberately out of scope, per the sequencing already agreed (`scaffold-fastify-backend` → `wire-better-auth` → `sign-in-and-account-pages`).
