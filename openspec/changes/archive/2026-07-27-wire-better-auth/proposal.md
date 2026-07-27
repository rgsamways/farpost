## Why

`scaffold-fastify-backend` proves the server/database plumbing works but has no identity at all. This change wires real authentication — better-auth's magic-link flow, per the already-established stack decision — onto that foundation, and builds the `Membership` table that Farpost's own identity model deliberately uses instead of stuffing app-specific fields onto better-auth's `user` table.

## What Changes

- Real better-auth server config: magic-link plugin, Drizzle/Postgres adapter, 30-day sliding session — ported from Vocare's real, working reference (`c:\dev\robinsamways\docs\handoff-2026-07-26-vocare-better-auth-reference.md`), not guessed at.
- The Fastify catch-all integration at `/api/auth/*`, including both real gotchas: neutralizing Fastify's own body parser for that route, and manually writing CORS headers onto the raw response since `reply.hijack()` bypasses Fastify's normal header pipeline.
- **No age gate, no `pendingSignups` staging table, no required fields before account creation** — confirmed directly via the robinsamways.ca session: Vocare's age/content gating is a Vocare-specific requirement tied to its own practice-engine content, not a stated Farpost one. Farpost's signup is the plain "sign in creates your account automatically" flow.
- No `additionalFields` on `user` at all. Farpost's own identity data lives on a new `Membership` table instead, per the already-resolved shared identity design (`docs/core-user-model.md`).
- Client-side `authClient` (magic-link plugin) in `web/`, plus a small reactive bootstrap that sets the `data-signed-in` attribute `mobile-app-shell`'s header already expects, from real session state.

## Capabilities

### New Capabilities
- `better-auth`: real magic-link authentication, session management, and the `Membership` table that carries Farpost's own identity data.

### Modified Capabilities
(none)

## Impact

- `api/`: new `src/auth/auth.ts`, `src/auth/fastify-plugin.ts`, `src/auth/send-magic-link.ts`, `src/db/auth-schema.ts` (better-auth's own tables, no Vocare-specific fields), `src/db/membership-schema.ts`.
- `api/src/app.ts`: registers the auth Fastify plugin.
- `web/`: new `src/lib/auth-client.ts`, a new session-to-DOM-attribute bootstrap component mounted in `layout.tsx`.
- **New external dependency, not something this change can provision itself**: real magic-link emails need a real sender (Vocare uses Resend). Robin needs to supply a `RESEND_API_KEY` and a verified sending domain before magic links can actually deliver — the code and its tests work with a mocked send function regardless (matching Vocare's own real test pattern), but real end-to-end email delivery can't be verified without it.
