## Context

Read directly from Vocare's real, working backend (`c:\dev\vocare\backend`, `c:\dev\vocare\docker-compose.yml`) before writing anything here — this is proven, running code, not a pattern recalled from documentation about Fastify/Drizzle in the abstract.

## Goals / Non-Goals

**Goals:**
- Reuse Vocare's real structure as closely as possible: `buildApp()` factory pattern (testable via `fastify.inject()`, no real network listener needed in tests), `dotenv/config` loaded per-file rather than a central config module, the same dependency set and script names.
- Prove the Postgres connection and migration workflow actually work, not just that files exist.

**Non-Goals:**
- No better-auth, no `Membership`/domain schema, no routes beyond `/health`. This is infrastructure only.
- No monorepo/workspace tooling — `api/` stands alone the same way `web/` already does in this repo; no root `package.json` orchestrating both.

## Decisions

### 1. Structure and dependencies copied from Vocare's real, working setup

`buildApp()` in `src/app.ts` builds and returns the Fastify instance (CORS registered, routes registered) without listening; `src/index.ts` is the only file that calls `.listen()`. This is what makes Vocare's own `app.test.ts` able to test routes via `.inject()` with no real port bound — reusing it rather than inventing a different testing shape. Dependencies match Vocare's real `package.json` versions where they're infrastructure (`fastify`, `@fastify/cors`, `drizzle-orm`, `pg`, `dotenv`, `drizzle-kit`, `typescript`, `tsx`, `vitest`) — not the app-specific ones (`@anthropic-ai/sdk`, `stripe`, `resend`, `better-auth` itself waits for the next change).

### 2. Local Postgres: Docker Compose, port 5435

Mirrors Vocare's own `docker-compose.yml` almost exactly (`postgres:16-alpine`, named volume, dedicated user/password/db all `farpost`) — the only real difference is the host port. Vocare already claims `5434`; the native PostgreSQL 18 install (confirmed present on this machine) already claims the default `5432`. `5435` avoids colliding with either.

### 3. Migrations: `drizzle-kit generate` + a committed `drizzle/` folder, not `push`

Vocare's real repo has versioned, committed SQL migration files (`drizzle/0000_*.sql` onward) rather than using `drizzle-kit push` to sync schema directly. Reusing that workflow rather than the faster-but-unversioned alternative — migration files are auditable and match what's already proven at Vocare's own real scale. With `src/db/schema.ts` starting genuinely empty, the first generated migration will itself be trivial (possibly a no-op) — that's expected, not a bug; real tables arrive with `wire-better-auth`.

### 4. `/health` checks real database connectivity, not just process liveness

Vocare's own `/health` only confirms the Fastify process is up (`{ status: "ok", app: "Vocare" }`), no DB round-trip. This change's whole purpose is proving the Postgres/Drizzle wiring actually works, so `/health` here runs a real `SELECT 1` against the database and reports connectivity explicitly (`{ status: "ok", db: "connected" }` on success). This is a deliberate improvement over the reference, not a deviation from it — Vocare's own health check didn't need to prove DB wiring because by the time it existed, the DB connection was already known-good; Farpost's doesn't have that history yet.

**Trade-off this creates, accepted deliberately:** the automated test for `/health` now needs the real Docker Postgres running to pass, unlike Vocare's DB-free version. See Risks below.

## Risks / Trade-offs

- **[Risk]** `/health`'s test now has an external dependency (the Docker Postgres container must be running) that Vocare's equivalent test never needed. → **Mitigation:** document the `docker compose up -d` prerequisite plainly (a `README.md` note in `api/`), and make the failure mode clear if Postgres isn't running (Fastify/Drizzle's own connection error, not a confusing unrelated failure) rather than silently mask it.
- **[Risk]** Committed migration files mean forgetting to run `drizzle-kit generate` after a schema change leaves the migration history out of sync with `schema.ts`. → **Mitigation:** not solved here (same risk Vocare already carries), just inherited knowingly rather than introduced blind.
