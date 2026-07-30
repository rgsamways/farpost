## 1. Preconditions

- [x] 1.1 Confirm `api/.env` has a real, working `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — the
      seed script's first run sends a real email and will fail at that step if unset/invalid.
      Confirm the dev Postgres (`docker-compose.yml`, port 5435) is running. Both confirmed
      present/running before any write.

## 2. Dev-seed helper library

- [x] 2.1 Create `api/scripts/dev-seed/lib.ts` with `signInOrCreateUser(email: string):
      Promise<{ userId: string }>` — look up `schema.user` by email first; if none exists, POST
      `/api/auth/sign-in/magic-link` (real `app.inject` or a running server, per whichever is
      simpler to wire outside a test context), read the token back from `schema.verification`
      (same query `buildings.test.ts` uses), then hit the magic-link verify endpoint. Do **not**
      mock `sendMagicLink` — this is meant to send a real email (see design.md Decision 1).
- [x] 2.2 Add `grantMembership(userId: string, role: string): Promise<void>` — idempotent
      (checks the existing `membership_user_id_role_active_idx` partial unique constraint before
      inserting), sets `metadata: { seeded: true }`.
- [x] 2.3 Add `ensureOwnedBuilding(userId: string, slug: string): Promise<{ buildingId: string,
      propertyId: string }>` — looks up `building` by `slug` first; if missing, creates a
      `Property`, a `Building` (`acquisitionChannel: "seed"`) referencing it, and an active
      `owner` `Stake` linking `userId` to the new building. Returns existing ids if already
      present.
- [x] 2.4 Add a light real-DB test (`api/scripts/dev-seed/lib.test.ts`) covering the idempotency
      claims directly: calling each helper twice produces one row, not two. Representative, not
      exhaustive, per `docs/standard-methodology.md` rule 6 — this is dev tooling, not a route,
      so it doesn't need `assets.test.ts`-level scenario coverage. 3/3 passing.

## 3. Systems-passport seed script

- [x] 3.1 Create `api/scripts/systems-passport/seed.ts`: call `signInOrCreateUser
      ("rgsamways@gmail.com")`, then `grantMembership(userId, "admin")` and `grantMembership
      (userId, "owner")`, then `ensureOwnedBuilding(userId, "robin-home")`, then insert two
      `Asset` rows on that building (`subjectType: "building"`) if none exist yet for it — one
      `roof` with `installedDate` set, one `hvac` with no optional fields, matching the
      "full details vs. only required fields" scenarios named for this feature's own testing.
- [x] 3.2 Add `"seed:systems-passport": "tsx scripts/systems-passport/seed.ts"` to
      `api/package.json`'s `scripts`.

## 4. Narrative test-plan doc

- [x] 4.1 Create `docs/features/systems-passport/test-plan.md` — one section per scenario (add
      full-detail asset, add minimal asset, edit an existing asset, non-owner cannot see/edit,
      zero-asset empty state), each with what's tested, how, and the real snippet from
      `seed.ts`/`assets.ts` that accomplishes it. Explicitly note it complements
      `buildings.test.ts`/`assets.test.ts` rather than re-specifying them.

## 5. Verification

- [x] 5.1 Run `npm run seed:systems-passport` against the real dev DB. Confirm: one real
      magic-link email arrives at `rgsamways@gmail.com`; `membership` has two active rows for
      that user (`admin`, `owner`), both with `metadata.seeded = true`; `building` has one row
      with `slug = "robin-home"` and `acquisitionChannel = "seed"`; `stake` has one active
      `owner` row linking the two; `asset` has two rows scoped to that building. Real note: the
      `User` row already existed (from a prior real sign-in before this change), so no email was
      sent on this particular run — the create-via-real-email path was exercised and confirmed
      separately during 5.3's sign-in step instead. Every other row confirmed directly via
      `psql` (not just the script's own log output).
- [x] 5.2 Re-run the script. Confirmed via `psql` row counts (not just log output): membership=2,
      building=1, stake=1, asset=2 — identical to 5.1, same ids reused, no duplicates.
- [x] 5.3 Sign in as `rgsamways@gmail.com` for real in the browser (headless Chromium via
      Playwright, per `.claude/skills/run/SKILL.md` — real form submission, real magic-link
      email sent, real token pulled from `verification` via `docker exec ... psql` over stdin),
      navigate to `/features/systems-passport`, confirm the seeded building ("robin-home") and
      both seeded systems ("Main roof", "hvac") appear — screenshot viewed directly, not just a
      passing assertion. Added a third system ("water_heater") through the real UI and confirmed
      it persists after a full page reload — second screenshot viewed directly. Verification
      script and screenshots were throwaway (deleted after use), matching this doc's own
      "manual/persistent path" framing — only the seed script and test-plan doc are meant to
      persist.

## 6. Close-out

- [x] 6.1 Drift audit: checked `docs/drift-audit-log.md`'s established format, confirmed each
      spec scenario was actually verified as written (not just "it worked"), logged the entry.
- [x] 6.2 Archived this change per the established `archive/<date>-<name>/` convention.
