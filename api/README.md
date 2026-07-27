# Farpost API

Fastify + Drizzle ORM + Postgres backend. No auth yet — see `wire-better-auth`.

## Prerequisites

- Node.js
- Docker Desktop (for local Postgres)

## Setup

```bash
cp .env.example .env
docker compose up -d   # starts Postgres on localhost:5435
npm install
npx drizzle-kit migrate
npm run dev
```

`GET http://localhost:3001/health` should return `{ "status": "ok", "db": "connected" }`.

## Tests need Postgres running

`npm test` hits a real database connection via `/health` (design.md Decision 4 —
this backend's whole purpose is proving the Postgres/Drizzle wiring works, not
just that the Fastify process is up). Run `docker compose up -d` first, or the
tests fail with a database connection error rather than a passing/skipped
result.

## Migrations

Schema lives in `src/db/schema.ts`. After changing it:

```bash
npx drizzle-kit generate   # writes a new file under drizzle/
npx drizzle-kit migrate    # applies pending migrations to the local database
```

Migration files are committed, not synced directly via `drizzle-kit push`.
