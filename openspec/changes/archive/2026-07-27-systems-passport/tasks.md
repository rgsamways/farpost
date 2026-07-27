## 1. Session and authorization helpers

- [x] 1.1 Create `api/src/auth/session.ts` with `getSessionUser(request: FastifyRequest)`,
      ported from Vocare's real pattern (`c:\dev\vocare\backend\src\auth\session.ts`): convert
      Fastify's Node-style headers to a Web `Headers` object, call
      `auth.api.getSession({ headers })`, return `result?.user ?? null`. Adjust only the
      `auth.js` import path — do not redesign the header-conversion logic. Read Vocare's real
      file directly and ported it verbatim (only the import path changed), not reconstructed
      from description.
- [x] 1.2 Create `api/src/authz/building-access.ts` with `assertBuildingOwner(userId: string,
      buildingId: string): Promise<boolean>` — queries `stake` for `subject_type = 'building'`,
      `subject_id = buildingId`, `user_id = userId`, `role = 'owner'`, `status = 'active'`.

## 2. API routes

- [x] 2.1 Create `api/src/routes/buildings.ts` with `GET /api/buildings` per
      `specs/systems-passport/spec.md`: call `getSessionUser`, `401` if none; query buildings
      joined through an active `owner` `Stake` for that user.
- [x] 2.2 Create `api/src/routes/assets.ts` with `GET /api/buildings/:buildingId/assets`,
      `POST /api/buildings/:buildingId/assets`, and `PATCH /api/assets/:assetId` per
      `specs/systems-passport/spec.md`. Use Fastify's native `schema` option for request body
      validation (no new dependency — `zod` is not in `api/package.json`). `PATCH` must look up
      the existing asset's real `subject_type`/`subject_id` before calling
      `assertBuildingOwner` — never trust a client-supplied building id for authorization on an
      existing row.
- [x] 2.3 Register both route files in `api/src/app.ts`.

## 3. Frontend

- [x] 3.1 Create `web/src/lib/api-client.ts` with a small `apiFetch(path, options)` wrapper:
      `fetch` against `${process.env.NEXT_PUBLIC_API_URL}${path}` with `credentials: 'include'`.
      This is the first non-auth API caller in this codebase — keep it minimal, not a generic
      SDK layer.
- [x] 3.2 Create `web/src/app/features/systems-passport/page.tsx`: `"use client"`, gated by
      `authClient.useSession()` + redirect to `/sign-in` if no session, matching
      `account/page.tsx`'s exact pattern. Fetches `GET /api/buildings`; for the common
      single-building case, auto-selects it; if more than one, a simple selector. Fetches and
      lists that building's assets via `GET /api/buildings/:buildingId/assets`; a simple form to
      add one via `POST`; inline editing (at minimum `condition_status`) via `PATCH`.
- [x] 3.3 Add one entry to `web/src/components/DrawerNav.tsx`'s `NAV_GROUPS`: a new `Features`
      heading with a single link (`{ href: "/features/systems-passport", label: "Systems
      Passport" }`). Do not scaffold placeholder links for the other 10 features.

## 4. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 4.1 Add `api/src/routes/buildings.test.ts` (real-DB, no mocking, real session cookies via
      better-auth's test helpers if available, otherwise direct `auth.api` calls) covering: an
      owner sees their building, a non-owner sees an empty list, an unauthenticated request gets
      `401`. Used a real magic-link sign-in flow via `app.inject`, matching `auth.test.ts`'s
      established pattern — **not** Vocare's own actual route-test convention (Vocare mocks
      `getSessionUser` directly in `anchors.test.ts`/etc.), since this task explicitly says
      "no mocking" for the session layer too. Flagged since it's a deliberate deviation from
      Vocare's real test pattern, even though the app-code pattern (`getSessionUser` itself) was
      ported verbatim.
- [x] 4.2 Add `api/src/routes/assets.test.ts` covering: an owner lists/adds/updates assets on
      their building, a non-owner is `403`'d on list/add/update, an unauthenticated request is
      `401`'d, a `PATCH` on a nonexistent asset is `404`, a `POST` missing `assetType` is
      rejected with a validation error not a raw DB error.

## 5. Verification

- [x] 5.1 Since no building-claim flow exists yet (a real, named gap — see design.md), insert a
      real test `building` and an `active`/`owner` `stake` row directly into the dev DB for a
      real test account. Confirm, end to end, in an actual browser: sign in, navigate to
      `/features/systems-passport`, see the building auto-selected, add a system, see it appear,
      edit its condition, see the change persist on reload. Ran via a real headless-Chromium
      Playwright session against both dev servers (real magic-link sign-in through the actual
      `/sign-in` form, token pulled from the dev DB's `verification` table since no real inbox
      exists, same technique the test suite already uses) — not `app.inject`, not a mocked
      session. Screenshots confirm the building auto-selected ("123 Verify St"), the "roof"
      system appearing after Add, its condition changing to "Needs repair", and that value
      surviving a full page reload. **Real bug found and fixed, not a script issue**:
      `@fastify/cors` defaults to `methods: 'GET,HEAD,POST'` — the browser's real PATCH request
      was blocked by CORS preflight (`Method PATCH is not allowed by
      Access-Control-Allow-Methods`), something `app.inject`-based tests can't catch since they
      bypass real browser CORS enforcement entirely. Fixed by adding an explicit `methods:
      ["GET", "POST", "PATCH"]` to the `@fastify/cors` registration in `app.ts`.
- [x] 5.2 Confirm `GET /api/buildings` for a second, unrelated test account (no `Stake`) returns
      an empty list, and that account cannot read or write the first account's building's assets
      via direct API calls (not just UI-hidden — verify the API itself rejects it). Confirmed via
      the same Playwright session's second browser context (its own real sign-in, no stake):
      `GET /api/buildings` returned `200 []`, `GET .../assets` and `POST .../assets` against the
      first account's real building both returned `403` — checked with real `fetch`-equivalent
      requests carrying that account's own real session cookie, not just confirming the UI hides
      the button.
