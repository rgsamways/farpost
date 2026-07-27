## ADDED Requirements

### Requirement: Stake Postgres table
The system SHALL provide a `stake` table with fields: `id` (uuid, primary key), `user_id` (text,
nullable, foreign key to the better-auth `user` table), `subject_type` (text, not null, `CHECK
(subject_type IN ('property', 'building', 'unit', 'asset'))`), `subject_id` (uuid, not null — not
a database foreign key, since the target table depends on `subject_type`), `role` (text, not
null, soft-validated against `role_type.key` at the application layer), `kind` (text, nullable),
`status` (text, not null, `CHECK (status IN ('pending', 'active', 'historical',
'pending_verification', 'unclaimed', 'disputed'))`), `weight` (numeric, nullable),
`verification_method` (text, nullable, `CHECK (verification_method IN ('self_asserted',
'admin_reviewed', 'external_id_matched') OR verification_method IS NULL)`), `contact_snapshot`
(jsonb, nullable), `verified_at` (timestamptz, nullable), `renewal_date` (date, nullable),
`renewal_reminder_sent_at` (timestamptz, nullable), `established_at` (timestamptz, not null,
default now), `ended_at` (timestamptz, nullable).

#### Scenario: Stake persists with a null user_id for an unclaimed record
- **WHEN** a `stake` row is inserted with `user_id` null and `status = 'unclaimed'`
- **THEN** the row persists successfully

#### Scenario: Stake subject_type includes unit
- **WHEN** a `stake` row is inserted with `subject_type = 'unit'` and `subject_id` equal to an
  existing `unit.id`
- **THEN** the row persists successfully

#### Scenario: An invalid status value is rejected
- **WHEN** a `stake` row is inserted or updated with `status` set to a value outside the six
  defined values
- **THEN** the database rejects the write with a constraint violation

#### Scenario: An invalid verification_method value is rejected
- **WHEN** a `stake` row sets `verification_method` to a value other than `self_asserted`,
  `admin_reviewed`, `external_id_matched`, or null
- **THEN** the database rejects the write with a constraint violation

### Requirement: subject identifies the target, user_id identifies the person
`Stake.subject_type` and `Stake.subject_id` together SHALL always identify the specific
building-cluster subject the stake is about. `Stake.user_id` SHALL always identify the person who
holds the stake. No application code path SHALL repurpose `subject_id` to hold a person
identifier or `user_id` to hold a subject identifier.

#### Scenario: A building-scoped stake's subject_id is the building, not the person
- **WHEN** a `stake` row represents "user X owns building Y"
- **THEN** `subject_type = 'building'` and `subject_id = Y`, and `user_id = X` — never the
  reverse

### Requirement: Compound indexes for subject and user lookups
The system SHALL provide a compound index on `(subject_type, subject_id, status)` and a separate
compound index on `(user_id, status)`. No index SHALL exist on `user_id` alone, so that a query
filtering only by user (without the subject) does not receive a clean, encouraged index path.

#### Scenario: Lookup by subject and status uses the compound index
- **WHEN** a query filters `stake` rows by `subject_type`, `subject_id`, and `status`
- **THEN** the query plan uses the `(subject_type, subject_id, status)` index

#### Scenario: Lookup by user and status uses the compound index
- **WHEN** a query filters `stake` rows by `user_id` and `status`
- **THEN** the query plan uses the `(user_id, status)` index

### Requirement: contact_snapshot represents a pre-claim suspected owner
`Stake.contact_snapshot` SHALL be usable to record a suspected owner's contact information
(name, email, phone) for a `stake` row with `status = 'unclaimed'` and `user_id` null, in place of
storing owner contact fields directly on `building`.

#### Scenario: An unclaimed building has a contact snapshot but no user
- **WHEN** a `stake` row is inserted with `subject_type = 'building'`, `status = 'unclaimed'`,
  `user_id` null, and `contact_snapshot = {"name": "...", "email": "...", "phone": "..."}`
- **THEN** the row persists successfully, and no `building` row needs any contact field to
  represent the same fact

### Requirement: Ownership verification lifecycle
A `stake` row representing an ownership claim SHALL support the status transition
`pending_verification` → `active`, with `verification_method` and `verified_at` set when the
transition occurs. `renewal_date` and `renewal_reminder_sent_at` SHALL be present as nullable
fields, ready for a future renewal-reminder feature to populate, without requiring a further
schema migration.

#### Scenario: A new ownership claim starts pending verification
- **WHEN** a `stake` row is inserted for a new ownership claim
- **THEN** it is valid for `status` to be `pending_verification` with `verified_at` null

#### Scenario: Verification transitions the stake to active
- **WHEN** a `pending_verification` `stake` row is updated to `status = 'active'`,
  `verification_method = 'admin_reviewed'`, and `verified_at` set to the current time
- **THEN** the update persists and all three fields reflect the new values

#### Scenario: renewal fields are nullable and unpopulated by default
- **WHEN** a `stake` row is inserted without specifying `renewal_date` or
  `renewal_reminder_sent_at`
- **THEN** both fields persist as null without error
