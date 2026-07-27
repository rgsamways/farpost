## 1. Database schema

- [x] 1.1 Create `api/src/db/auth-schema.ts` — `user`, `session`, `account`, `verification` tables matching better-auth's own required shape (ported from Vocare's real schema, minus `entitlementStatus`/`dateOfBirth`/`country`/`paidAt` — Farpost's `user` table carries none of that)
- [x] 1.2 Create `api/src/db/membership-schema.ts` — the `membership` table (id, userId FK, role text, status enum, grantedAt, revokedAt, metadata jsonb) per `core-user-model.md`
- [x] 1.3 Update `api/src/db/client.ts` to merge `auth-schema.ts` and `membership-schema.ts` into the exported schema
- [x] 1.4 Generate and apply the migration for both new schema files against the local Postgres instance

## 2. better-auth server config

- [x] 2.1 Add `better-auth` dependency to `api/package.json`
- [x] 2.2 Build `api/src/auth/auth.ts`: drizzle adapter, magic-link plugin (5-minute expiry, sign-up enabled), 30-day sliding session, email/password and social providers both disabled — no `additionalFields`, no `databaseHooks`
- [x] 2.3 Build `api/src/auth/send-magic-link.ts` against the Resend SDK, matching Vocare's real pattern

## 3. Fastify integration

- [x] 3.1 Build `api/src/auth/fastify-plugin.ts`: the `/api/auth/*` catch-all, body-parser neutralization scoped to that route, `reply.hijack()` plus manually-written CORS headers, explicit `OPTIONS` handling
- [x] 3.2 Register the auth plugin in `api/src/app.ts`
- [x] 3.3 Add `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` to `api/.env.example` (values left blank except `RESEND_FROM_EMAIL=Farpost <hello@farpost.ca>`, confirmed directly by Robin — the rest Robin provisions himself, not fabricated placeholders)

## 4. Client-side wiring

- [x] 4.1 Add `better-auth` to `web/package.json`, build `web/src/lib/auth-client.ts` (`createAuthClient` + `magicLinkClient()`, `basePath: "/api/auth"`)
- [x] 4.2 Build a session-to-DOM-attribute bootstrap component (`useSession()` → sets/removes `data-signed-in` on `<html>`), mounted once in `layout.tsx` alongside `SettingsBootstrap`

## 5. Tests and verification

- [x] 5.1 Test: requesting a magic link for a new email and completing sign-in creates exactly one user, with no additional required fields
- [x] 5.2 Test: the `/api/auth/*` catch-all returns a real better-auth response and correct CORS headers (mock `sendMagicLink`, matching Vocare's real test pattern — requires the local Postgres running)
- [x] 5.3 Test: `Membership`'s `role` column accepts arbitrary text, not just a fixed set of values
- [x] 5.4 `npm run build`, `npm run typecheck`, `npm test` pass in `api/`; `npm run build`, `npm run lint`, `npm test` pass in `web/`
- [x] 5.5 Report plainly whether real end-to-end magic-link email delivery was verified — it can't be without a real `RESEND_API_KEY`, so say so rather than imply it was checked if it wasn't
