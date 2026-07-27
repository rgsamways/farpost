## 1. Project scaffolding

- [x] 1.1 Create `api/package.json` (`"name": "api"`, `"type": "module"`) with scripts matching Vocare's real pattern: `dev` (`tsx watch src/index.ts`), `build` (`tsc`), `start` (`node dist/index.js`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`)
- [x] 1.2 Install dependencies: `fastify`, `@fastify/cors`, `drizzle-orm`, `pg`, `dotenv`; devDependencies: `typescript`, `tsx`, `drizzle-kit`, `@types/node`, `@types/pg`, `vitest`
- [x] 1.3 Add `api/tsconfig.json` matching Vocare's real config (ES2022/NodeNext, strict, `rootDir: src`, `outDir: dist`, excludes `*.test.ts`)

## 2. Local Postgres

- [x] 2.1 Add `api/docker-compose.yml`: `postgres:16-alpine`, user/password/db all `farpost`, host port `5435` (Vocare already uses 5434, the native install uses 5432), named volume for data persistence
- [x] 2.2 Add `api/.env.example`: `DATABASE_URL=postgres://farpost:farpost@localhost:5435/farpost`, `PORT=3001`, `WEB_URL=http://localhost:3000`
- [x] 2.3 Verify `docker compose up -d` actually starts a reachable Postgres instance on port 5435

## 3. Drizzle setup

- [x] 3.1 Create `api/src/db/schema.ts` — genuinely empty for now, a comment noting real tables arrive with `wire-better-auth`
- [x] 3.2 Create `api/src/db/client.ts` (`dotenv/config`, `drizzle-orm/node-postgres`, `pg.Pool` from `DATABASE_URL`)
- [x] 3.3 Create `api/drizzle.config.ts` (dialect `postgresql`, schema path, `out: "./drizzle"`, `dbCredentials.url` from `DATABASE_URL`)
- [x] 3.4 Run `drizzle-kit generate` against the empty schema and confirm it produces a valid (even if trivial) migration
- [x] 3.5 Run the generated migration against the real local Postgres instance and confirm it applies cleanly

## 4. Fastify app

- [x] 4.1 Build `api/src/app.ts`'s `buildApp()` factory: Fastify instance with logging enabled, `@fastify/cors` registered with `origin: process.env.WEB_URL`, `credentials: true`
- [x] 4.2 Add the `/health` route: runs a real `SELECT 1` against the database, returns a response reflecting both server and database health, and reflects a real failure if the database is unreachable
- [x] 4.3 Build `api/src/index.ts`: loads `dotenv/config`, calls `buildApp()`, listens on `process.env.PORT` and host `0.0.0.0`

## 5. Tests and verification

- [x] 5.1 Test: `/health` returns healthy status when Postgres is reachable (via `fastify.inject()`, requires the local Docker Postgres running — document this prerequisite in `api/README.md`)
- [x] 5.2 Test: CORS headers are present for the configured `WEB_URL` origin and absent for an unconfigured origin
- [x] 5.3 `npm run build`, `npm run typecheck`, `npm test` all pass (with `docker compose up -d` running first)
- [x] 5.4 Manual verification: start the server with `npm run dev`, confirm `GET http://localhost:3001/health` returns a real healthy response with Postgres up, and confirm it correctly reports unhealthy with Postgres stopped
