## Why

Every schema built today (25 tables, 8 clusters) has zero application logic on top of it — the
API is one health-check endpoint. Robin wants something feature-like to actually look at.
`docs/farpost-feature-catalog-signup-features.md` names systems passport (#8) as the strongest
first candidate: schema-ready (`Asset` already exists), and the foundation other features
(#5 maintenance timeline, #9 risk awareness, #10 health score) read from. This change builds it
full-stack — real API endpoints plus a real page — rather than API-only, since "something to
look at" is the explicit goal.

## What Changes

- Add Farpost's first protected API routes: list/add/update a building's tracked systems
  (`Asset` rows scoped to a building), and a small owned-buildings listing endpoint to support
  the "which building" selector every owner-facing feature needs.
- Add Farpost's first session-auth helper (`getSessionUser`), ported from Vocare's real, proven
  pattern (`c:\dev\vocare\backend\src\auth\session.ts`) rather than invented fresh — a shared
  helper wrapping `auth.api.getSession()`, called explicitly at the top of each protected
  handler with a manual `401` on failure, matching Vocare's actual convention (no Fastify
  preHandler/decorator).
- Add a reusable owner-authorization check: does the current user have an active `Stake`
  (`role = 'owner'`, `status = 'active'`) on the subject being read/written. Every future
  owner-scoped route reuses this, not just this one.
- Add a real page at `/features/systems-passport` — lists a building's tracked systems (roof,
  furnace, water heater, etc.), lets the owner add/update one. Client-side session-gated,
  matching the existing `account`/`settings` pages' established pattern
  (`authClient.useSession()` + redirect), not a server-component auth pattern.
- Add one new nav entry (`Features` group → `Systems Passport`) to `DrawerNav.tsx`'s
  `NAV_GROUPS` — intentionally just this one entry, not the full 11-feature nav the routing
  decision doc describes; that's separate future work once more features exist.

## Capabilities

### New Capabilities
- `systems-passport`: an owner can view and maintain a list of their building's tracked
  systems/equipment, each with condition, install date, warranty, and photos.

### Modified Capabilities
- None. `Asset`, `Building`, `Stake`, `Property` schemas are read/written, not changed.

## Impact

- New API files: `api/src/auth/session.ts` (session helper), `api/src/authz/building-access.ts`
  (owner-Stake check), `api/src/routes/buildings.ts`, `api/src/routes/assets.ts`, registered in
  `api/src/app.ts`.
- New web files: `web/src/app/features/systems-passport/page.tsx`, `web/src/lib/api-client.ts`
  (a small fetch wrapper carrying `credentials: 'include'` + `NEXT_PUBLIC_API_URL`, the first of
  its kind in this codebase — everything so far has only called the auth API directly via
  `authClient`).
- One nav entry added to `web/src/components/DrawerNav.tsx`.
- **Real gap surfaced, not silently worked around:** there is currently no way for a real user
  to actually become a building's owner — no NFC-tag claim flow, no manual claim UI, nothing
  creates a `Stake` row at all yet. This change cannot build that (it's a whole separate,
  vision-level flow). End-to-end verification will use a direct dev-DB insert (a real
  `building` + an `active`/`owner` `stake` row for the test account), the same way schema
  clusters have been verified all day — not a stand-in for the real claim flow, which stays a
  known, named gap.
- No changes to `FulfillmentFee`, notification delivery, or any other still-unbuilt process.
