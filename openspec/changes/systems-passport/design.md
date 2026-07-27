## Context

This is the first application-logic change since the rebuild's early scaffold work — everything
built today was schema-only. Three real things were checked directly before designing this,
rather than guessed:

- **Session-auth pattern**: Farpost has zero protected routes today (only `/health` and the
  better-auth catch-all). `api/src/auth/auth.ts` was explicitly ported from Vocare
  (`c:\dev\vocare`), so Vocare's own real, working protected-route pattern was checked directly.
  Vocare uses a shared `getSessionUser(request)` helper (`backend/src/auth/session.ts`) that
  converts Fastify's Node-style headers to a Web `Headers` object and calls better-auth's own
  `auth.api.getSession({ headers })` — not a Fastify plugin/decorator. Every protected handler
  in Vocare starts with `const user = await getSessionUser(request); if (!user) return
  reply.code(401).send({ error: "unauthenticated" })`, repeated explicitly per route, not wired
  in globally. Ported as-is, not reinvented.
- **Next.js 16 breaking changes**: `web/AGENTS.md` warns this Next.js version has real API
  differences from training data. Checked `node_modules/next/dist/docs/01-app/` directly:
  `params`/`searchParams` are `Promise`s in route components (`params: Promise<{ slug: string
  }>`, must `await params`) — relevant if a dynamic segment is ever added here, though this
  change's one route (`/features/systems-passport`) is static, no dynamic segment needed for v1.
- **Existing frontend auth pattern**: `web/src/app/account/page.tsx` and `settings/page.tsx`
  both use a client-side pattern (`"use client"`, `authClient.useSession()`, redirect to
  `/sign-in` if no session) — not a server-component/cookie-reading pattern. Followed here for
  consistency, not because it's the only valid Next.js 16 pattern.

**Real, honest gap found while scoping this, not solved here**: there is no way for a real user
to become a building's owner yet — no NFC-tag claim flow, no manual claim form, nothing creates
a `Stake` row. This change's owner-authorization check is real and correctly enforced, but has
no real building/stake to authorize against outside of a dev-inserted test row. Named plainly in
the proposal's Impact section; not this change's job to fix.

## Goals / Non-Goals

**Goals:**
- Ship Farpost's first real, protected, end-to-end feature: an owner can see and maintain a
  list of a building's tracked systems.
- Establish reusable patterns (session-auth helper, owner-authorization check, frontend API
  client) every future owner-scoped feature reuses, not just this one.

**Non-Goals:**
- No building-claim flow (creating a `Stake`) — real, separate, vision-level work.
- No document/photo upload infrastructure — `Asset.photoUrls` accepts URLs; this change doesn't
  build file upload. If photos matter for v1, they're pasted URLs, clearly a placeholder.
- No maintenance-timeline logic (#5) — this change only builds #8, the data foundation #5 reads
  from later.
- No deletion of `Asset` rows — see Decision 6 below; deferred, not designed as a follow-up.

## Decisions

1. **Session helper ported from Vocare, not reinvented**: `api/src/auth/session.ts` exports
   `getSessionUser(request: FastifyRequest)`, identical in shape to Vocare's real version
   (header conversion + `auth.api.getSession`). Every new route handler calls it explicitly and
   returns a manual `401 { error: "unauthenticated" }` on failure — matches the proven pattern,
   not a new global auth mechanism.

2. **Owner-authorization is a reusable helper, not inline per-route logic**:
   `api/src/authz/building-access.ts` exports `assertBuildingOwner(userId: string, buildingId:
   string): Promise<boolean>` — queries `stake` for `subject_type = 'building'`, `subject_id =
   buildingId`, `user_id = userId`, `role = 'owner'`, `status = 'active'`. Every route in this
   change calls it and returns `403 { error: "forbidden" }` on `false`. Every future
   owner-scoped route (maintenance timeline, seasonal reminders, etc.) reuses this same helper —
   worth building once, correctly, now.

3. **Three routes, Fastify-native JSON schema validation** (no new dependency — no `zod` exists
   in `api/package.json` today, and Fastify's built-in `schema` option on route definitions
   covers this without adding one):
   - `GET /api/buildings` — returns buildings where the current user has an active `owner`
     `Stake`: `{ id, addressLine1 or slug, label }[]`. Scoped to owned buildings only, not a
     general buildings-listing endpoint.
   - `GET /api/buildings/:buildingId/assets` — returns all `Asset` rows where `subjectType =
     'building'` and `subjectId = buildingId`, after the owner check.
   - `POST /api/buildings/:buildingId/assets` — creates an `Asset` row (`subjectType =
     'building'`, `subjectId = buildingId`), after the owner check. Body: `assetType`, `label`,
     `manufacturer`, `model`, `serialNumber`, `warrantyExpiryDate`, `installedDate`,
     `conditionStatus`, `photoUrls`, `conditionNotes` — all optional except `assetType`.
   - `PATCH /api/assets/:assetId` — updates an existing `Asset` row. Looks up the asset first to
     get its real `subjectType`/`subjectId`, then applies the same owner check against that
     subject (not the request body) before allowing the update — never trust a client-supplied
     building id for an authorization decision on an existing row.

4. **`/api/buildings` returns only owner-`Stake` buildings, not all subject types `Asset`
   supports (`property`/`unit`)**: v1 scope is buildings only, matching the feature catalog's
   own baseline framing ("available to a building owner"). `Asset` itself stays fully
   polymorphic (already built); this change just doesn't expose property/unit-level assets
   through the API yet — a real, narrower v1 slice, not a schema limitation.

5. **Frontend: client-side session gating, not server-side.** `web/src/app/features/
   systems-passport/page.tsx` is `"use client"`, uses `authClient.useSession()` + redirect,
   matching `account`/`settings` exactly. A new `web/src/lib/api-client.ts` provides a thin
   `apiFetch(path, options)` wrapper (`fetch` with `credentials: 'include'` and
   `NEXT_PUBLIC_API_URL` as the base) — the first non-auth API caller in this codebase, so
   named plainly and kept minimal rather than building a generic API SDK layer speculatively.

6. **No delete endpoint for `Asset` in v1.** Unlike `Stake`/`Job`/`Claim`, `Asset` has no
   lifecycle `status`/`ended_at` field in its existing schema (already built, not something this
   change can silently add), so "remove an incorrectly-entered system" has no designed answer
   yet — real hard-delete vs. a future schema addition is a genuine open question, not decided
   here. v1 supports add and edit only.

7. **One nav entry, not the full 11-feature nav.** `DrawerNav.tsx`'s `NAV_GROUPS` gets a new
   `Features` group with exactly one link (`Systems Passport`) — building out all 11 slots now
   would be nav scaffolding with ten dead links, which reads worse than one real link in a
   sparse group.

## Risks / Trade-offs

- **No real way to test this against a real user's real building** → Mitigation: named plainly
  above; verification uses a direct dev-DB insert of a test building + active owner `Stake`,
  same discipline as every schema cluster's own real-DB test setup today. Not a substitute for
  the real claim flow, which stays a known, unscheduled gap.
- **`assertBuildingOwner` only checks `role = 'owner'`, not other roles that might legitimately
  need read access (e.g. a tenant, a professional with an open job)** → Acceptable for v1: the
  feature catalog's own baseline is "available to a building owner... no professional
  Membership required," so owner-only is the correct v1 scope, not an oversight to fix later
  without being asked.

## Migration Plan

No database migration — this change is application logic only, reading/writing existing tables.

## Open Questions

- Whether `Asset` deletion is ever needed, and if so, whether it's a real hard delete or a new
  lifecycle field — deliberately not decided here (Decision 6).
- When/how a real building-claim flow gets built — the named, real gap this change depends on
  but doesn't solve.
