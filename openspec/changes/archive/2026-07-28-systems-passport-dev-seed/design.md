## Context

Three real things checked directly before designing this, rather than guessed:

- **The real sign-in-without-an-inbox technique already exists**, in `buildings.test.ts`/
  `assets.test.ts`/`auth.test.ts`: POST `/api/auth/sign-in/magic-link`, read the token back from
  `schema.verification` (ordered by `createdAt desc`, matched by email inside the JSON `value`
  column), then GET `/api/auth/magic-link/verify?token=...`. Tests additionally `vi.mock` the
  `sendMagicLink` module so no real email goes out. This change reuses the same three-call
  sequence for the library's `signInOrCreateUser` helper, but deliberately does **not** mock the
  send step — see Decision 1.
- **The real schema fields needed already exist, unchanged from the draft:**
  `building.acquisitionChannel` (free `text`), `membership.metadata` (`jsonb`) — both confirmed
  directly in `api/src/db/building-schema.ts` and `membership-schema.ts`, not assumed from the
  earlier HTML draft. Neither is read or constrained anywhere else in the codebase today, so
  repurposing them for a "seeded" marker doesn't collide with any existing usage.
- **`diy-vs-pro-decision-helper`'s own proposal independently names the identical blocker**
  ("no building-claiming flow exists yet... this will show its 'no building yet' empty state for
  effectively every real account today") — real, corroborating evidence this isn't a
  systems-passport-specific need, not just an inference.

## Goals / Non-Goals

**Goals:**
- A reusable, idempotent library other per-feature seed scripts can import from, not just this
  one script.
- A real, correctly-shaped `User` row — created through the actual application auth path, not a
  hand-written insert that risks drifting from what better-auth actually expects.
- A documented, filterable convention for marking seed data using fields that already exist.
- A narrative test-plan doc proving the process is worth repeating, per Robin's own "test this
  once, adopt it going forward if it works" framing.

**Non-Goals:**
- No real building-claim/NFC-tag flow — that's separate, unscheduled, vision-level work named as
  a gap in both the systems-passport and diy-vs-pro-decision-helper proposals, not solved here.
- No changes to `systems-passport`'s own API/UI behavior or its existing `vitest` suite — this
  adds a parallel, manual/persistent path, not a replacement for automated test fixtures (which
  already work correctly with their own disposable, randomized-email pattern).
- No general test-fixture-factory for `vitest` itself — a different, already-solved problem.
- No production seed-data hiding mechanism (e.g., an app-level filter that excludes
  `acquisitionChannel = "seed"` rows from real users' views) — moot today with zero real users;
  named as a real follow-up once real signups exist, not designed here.

## Decisions

1. **`signInOrCreateUser` uses the real magic-link flow, unmocked.** Alternative considered:
   hand-insert `user`/`account` rows directly, matching the shape better-auth expects. Rejected —
   better-auth owns that schema's invariants, and a hand-written row risks silently drifting from
   what a real sign-up produces (session/account linkage, timestamps, provider fields). Going
   through the real path costs one real Resend email on first creation, explicitly accepted as a
   feature, not a flaw: it's a free, incidental confirmation the real email path works, which the
   existing test suite's `vi.mock` never actually exercises.

2. **Idempotent lookup by natural key, not the tests' random-UUID-suffix pattern.** `vitest`
   fixtures use `` `owner-${randomUUID()}@example.com` `` because every test run needs guaranteed
   isolation. This is the opposite case — a long-lived dev fixture meant to persist and be
   re-run safely — so `signInOrCreateUser` looks up by exact email first and only runs the
   sign-in flow if no `user` row exists yet; `createBuilding`/`createProperty` look up by a fixed
   slug (`"robin-home"`) the same way.

3. **Seed marking reuses existing fields, adds no schema.** `building.acquisitionChannel =
   "seed"`, `membership.metadata = { seeded: true }`. `stake` and `asset` have no equivalent free
   field today — deliberately not adding one for two tables with zero real query pressure to
   filter by yet (no real users exist to filter *from*). If that changes, both rows are always
   reachable by joining back to their seeded `building`/`membership`, so nothing here blocks
   adding a real filter later.

4. **Directory shape is the template for every future feature**, not a one-off: `api/scripts/
   dev-seed/lib.ts` (shared helpers) + `api/scripts/<feature>/seed.ts` (per-feature script,
   composing the shared helpers plus whatever's feature-specific) + `docs/features/<feature>/
   test-plan.md` (narrative doc). `diy-vs-pro-decision-helper` needs zero new seed logic when its
   turn comes — it reads the same owner+building precondition this script already creates.

5. **The test-plan doc complements, not replaces, the automated suite.** `buildings.test.ts`/
   `assets.test.ts` already cover the owner/non-owner/unauthenticated matrix correctly with real
   disposable fixtures — this doc isn't re-specifying those. It documents the manual,
   persistent-account verification path (the one the original proposal's task 5.1/5.2 did once,
   ad hoc, via Playwright) so it's repeatable and narrated, not re-derived from memory each time.

## Risks / Trade-offs

- **One real email sent on first run** → accepted per Decision 1; harmless (goes to Robin's own
  inbox), and re-running the script after the account exists is a no-op for this step.
- **No production-safe hiding mechanism for seed data yet** → acceptable today (zero real users);
  explicitly flagged as a real open item once real signups exist, not silently deferred.
- **`RESEND_API_KEY` must be a real, working key in `api/.env` for the seed script to run** — if
  unset or invalid, `signInOrCreateUser` fails at the send step. Documented in tasks.md as a
  precondition to check, not silently caught/swallowed.

## Migration Plan

No database migration — reads/writes existing tables only.

## Open Questions

- Whether/how to hide seed-marked data from real users once real signups exist — real, named,
  not designed here (see Non-Goals).
- Whether every future per-feature seed script gets its own `docs/features/<feature>/
  test-plan.md`, or whether a lighter-weight shared doc is enough once the pattern is proven —
  Robin's own call once this one has been used for real.
