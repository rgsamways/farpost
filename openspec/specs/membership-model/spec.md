# membership-model

## Purpose
Platform-wide role/capability holding for a `User` (`Membership`), validated against a curated,
admin-editable role taxonomy (`RoleType`). A `User` can hold any number of roles; `RoleType` is an
optional, curated taxonomy `Membership.role` soft-validates against at the application layer, not
a hard database enum or foreign key.

## Requirements

### Requirement: Membership Postgres table
The system SHALL provide a `membership` table with fields: `id` (uuid, primary key), `user_id`
(text, foreign key to the better-auth `user` table, not null), `role` (text, not null, soft-
validated against `role_type.key` at the application layer, not a database foreign key), `status`
(text, not null, `CHECK (status IN ('pending', 'active', 'suspended', 'revoked'))`, default
`'active'`), `granted_at` (timestamptz, not null, default now), `revoked_at` (timestamptz,
nullable), `metadata` (jsonb, nullable). A `User` SHALL be able to hold any number of
`Membership` rows.

#### Scenario: A user can hold multiple memberships
- **WHEN** a user has two `Membership` rows with different `role` values
- **THEN** both rows persist without conflict

#### Scenario: Membership status defaults to active
- **WHEN** a `Membership` row is inserted without specifying `status`
- **THEN** the persisted row has `status = 'active'`

#### Scenario: An invalid status value is rejected
- **WHEN** an insert or update sets `Membership.status` to a value outside `pending`, `active`,
  `suspended`, `revoked`
- **THEN** the database rejects the write with a constraint violation

### Requirement: No more than one active grant of the same role per user
The system SHALL enforce, via a partial unique index on `(user_id, role)` WHERE `status =
'active'`, that a single user cannot hold two simultaneously-active `Membership` rows for the
same `role`. A historical (revoked) grant of the same role, followed by a new active grant, SHALL
remain permitted.

#### Scenario: Duplicate active role grant is rejected
- **WHEN** a user already has an active `Membership` with `role = 'agent'` and a second active
  `Membership` with `role = 'agent'` is inserted for the same user
- **THEN** the database rejects the second insert with a uniqueness violation

#### Scenario: A revoked-then-regranted role is permitted
- **WHEN** a user's `role = 'agent'` `Membership` is set to `status = 'revoked'`, and a new
  `Membership` with `role = 'agent'` and `status = 'active'` is inserted for the same user
- **THEN** both rows persist — the new insert is not blocked by the historical revoked row

### Requirement: RoleType Postgres table
The system SHALL provide a `role_type` table with fields: `key` (text, primary key),
`display_name` (text, not null), `tier` (text, nullable), `status` (text, nullable — the
taxonomy entry's own lifecycle state, distinct from `tier`), `privacy_default` (text, nullable),
`reputation_eligible` (boolean, not null, default false), `default_subscriptions` (text array,
nullable), `copy_template_ref` (text, nullable), `hub_config` (text, nullable), `source` (text,
nullable), `created_at` (timestamptz, not null, default now), `promoted_at` (timestamptz,
nullable), `curator_id` (text, nullable, foreign key to the better-auth `user` table). `RoleType`
SHALL be an optional, Farpost-only curation layer — `Membership.role` SHALL remain insertable
with any text value regardless of whether a matching `role_type.key` row exists.

#### Scenario: Membership.role is not constrained by a database foreign key to RoleType
- **WHEN** a `Membership` row is inserted with a `role` value that has no matching `role_type.key`
  row
- **THEN** the insert succeeds — validation against `RoleType` happens at the application layer,
  not the database

#### Scenario: RoleType entries are independently manageable
- **WHEN** a `role_type` row is inserted, updated, or its `status` changed
- **THEN** no `Membership` row referencing that `role` value as text is affected
