## Why

Systems passport shipped and was verified end-to-end (`archive/2026-07-27-systems-passport`),
but its own proposal named a real, honest gap: no building-claim flow exists, so verification
used a one-off direct-DB insert of a test building + `Stake` for "a real test account" — real,
but not preserved anywhere as a reusable script, and not tied to Robin's own account. Robin hit
this exact wall directly trying to test the feature himself after the fact: no building exists
in the dev DB for his real account, so the passport has nothing to show.

This isn't a systems-passport-only problem. `diy-vs-pro-decision-helper` (next in the build
queue, already specced) names the identical blocker in its own proposal: "since no
building-claiming flow exists yet in the app, this will show its 'no building yet' empty state
for effectively every real account today." Every owner-scoped feature on the catalog (#1, #2,
#3, #5, #6, #9, #10 — 7 of the remaining 10) depends on the same missing precondition: a real
account with an active owner `Stake` on a real `Building`. Building a real building-claim/NFC
flow is separate, unscheduled, vision-level work (named as a non-goal in both proposals above) —
this change doesn't attempt that. It solves the narrower, immediate problem: a reusable,
persistent way to stand up that precondition in the dev database for manual and future automated
testing, without reaching for a one-off insert every time.

Robin's own stated intent: prove this process once against systems-passport (already built, so
there's a real feature to point it at immediately), then adopt it as a standing step for every
future feature if it works well — avoiding a "swing back around" retrofit like this one for
every feature going forward.

## What Changes

- Add a small, reusable dev-seed helper library (`api/scripts/dev-seed/lib.ts`): composable
  functions to sign in or create a real `User` (via the actual magic-link flow, not a raw
  insert), grant a `Membership` role, create a `Property`/`Building`, and create a `Stake`. Every
  future per-feature seed script is expected to import from this library rather than duplicate
  this logic.
- Add a per-feature seed script (`api/scripts/systems-passport/seed.ts`) that uses the library to
  give `rgsamways@gmail.com` an `admin` `Membership`, an `owner` `Membership`, a real `Property`
  + `Building`, an active `owner` `Stake` on it, and two starter `Asset` rows — wired into
  `api/package.json` as `npm run seed:systems-passport`. Idempotent: safe to re-run against a
  database that already has this data.
- Adopt a seed-data marking convention using fields that already exist, no schema change:
  `building.acquisitionChannel = "seed"` and `membership.metadata = { seeded: true }`. Documented
  here as the convention every future seed script follows, so seed data stays filterable later
  without retrofitting a new column once real users exist.
- Add a narrative test-plan document (`docs/features/systems-passport/test-plan.md`): one section
  per verification scenario (mirroring and extending the original proposal's 5.1/5.2 steps),
  each stating what's being tested, how, and the actual code snippet that does it — a
  human-readable companion to the automated `vitest` suite, not a replacement for it.

## Capabilities

### New Capabilities
- `dev-seed-tooling`: a reusable, idempotent way to stand up a real owner account with a real
  building/asset chain in the dev database, plus a documented per-feature test-plan convention.

### Modified Capabilities
- None. `systems-passport`'s own API/UI behavior is unchanged — this only adds tooling and docs
  around it.

## Impact

- New API-side files only: `api/scripts/dev-seed/lib.ts`, `api/scripts/systems-passport/seed.ts`,
  one new `package.json` script entry. No route, schema, or migration changes.
- New docs: `docs/features/systems-passport/test-plan.md`.
- **Real side effect, expected, not a bug:** running the seed script for the first time triggers
  a real magic-link email via Resend to `rgsamways@gmail.com` (the actual sign-in path, not
  mocked) — the same technique `buildings.test.ts`/`assets.test.ts` already use minus the
  `vi.mock` on the send step. Confirms the real email path works as a side benefit; re-running
  the script after the account exists does not re-trigger it.
- This same seed script, unmodified, also unblocks manual testing of `diy-vs-pro-decision-helper`
  once it's implemented — both features need the identical owner+building precondition.
