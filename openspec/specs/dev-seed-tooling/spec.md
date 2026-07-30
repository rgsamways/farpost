# dev-seed-tooling

## Purpose
A reusable, idempotent way to stand up a real owner account with a real building/asset chain in
the dev database, plus a documented per-feature test-plan convention. Built to close a real gap
found retroactively on `systems-passport` (its own verification used a one-off, unpreserved
dev-DB insert) and confirmed by `diy-vs-pro-decision-helper`'s own proposal naming the identical
blocker — every owner-scoped feature needs the same precondition: a real account with an active
owner `Stake` on a real `Building`. `api/scripts/dev-seed/lib.ts`'s helpers are meant to be
imported by every future per-feature seed script, not duplicated.

## Requirements

### Requirement: Idempotent owner account seeding
The system SHALL provide a reusable `signInOrCreateUser(email)` helper that returns an existing
`User` row matching `email` if one exists, and otherwise creates one via the real magic-link
sign-in flow (not a direct table insert). The system SHALL be safe to call more than once for
the same email without creating a duplicate `User` row or re-sending a sign-in email once the
account already exists.

#### Scenario: First run creates a real account
- **WHEN** `signInOrCreateUser("rgsamways@gmail.com")` is called and no matching `User` row
  exists
- **THEN** a real magic-link sign-in completes and a `User` row exists with that email

#### Scenario: Re-running is a no-op for account creation
- **WHEN** `signInOrCreateUser("rgsamways@gmail.com")` is called and a matching `User` row
  already exists
- **THEN** no new `User` row is created and no sign-in email is sent

### Requirement: Idempotent owner/building fixture
The system SHALL provide reusable helpers to create a `Property`, a `Building` linked to it, and
an active `owner` `Stake` linking a given user to that building, looked up by a fixed slug rather
than a random one, so repeated runs reuse the same rows instead of duplicating them.

#### Scenario: First run creates the building fixture
- **WHEN** the building-fixture helper is called with a user id and no `Building` with the
  target slug exists
- **THEN** a `Property`, a `Building` referencing it, and an active `owner` `Stake` linking the
  user to that `Building` are created

#### Scenario: Re-running reuses the existing fixture
- **WHEN** the building-fixture helper is called again for the same user and slug
- **THEN** the existing `Property`/`Building`/`Stake` rows are reused and no duplicates are
  created

### Requirement: Seed-data marking convention
The system SHALL mark every row created by dev-seed tooling as seed data using existing fields —
`building.acquisitionChannel = "seed"` and `membership.metadata = { seeded: true }` — without
adding new schema.

#### Scenario: Seeded building is marked
- **WHEN** the building-fixture helper creates a new `Building`
- **THEN** its `acquisitionChannel` field is set to `"seed"`

#### Scenario: Seeded membership is marked
- **WHEN** a `Membership` role is granted via the seed library
- **THEN** its `metadata` field includes `{ "seeded": true }`

### Requirement: Systems-passport seed script
The system SHALL provide a single command (`npm run seed:systems-passport` in `api/`) that grants
`rgsamways@gmail.com` an `admin` `Membership`, an `owner` `Membership`, an owned `Building` (via
the fixture helper), and at least two `Asset` rows on that building, using only the shared
dev-seed library — no logic duplicated from it.

#### Scenario: Running the script leaves a testable passport
- **WHEN** `npm run seed:systems-passport` is run against an empty dev database
- **THEN** `rgsamways@gmail.com` can sign in, see the seeded building auto-selected on
  `/features/systems-passport`, and see at least two systems already listed
