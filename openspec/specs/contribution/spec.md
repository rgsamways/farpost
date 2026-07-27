# contribution

## Purpose
An append-only record of a submitted building fact, replacing the old system's untyped
`list[dict]` embedded on `Building`. `category` is deliberately unconstrained, matching the old
system's own documented design intent. `contributor_role` fills a real gap found against the old
system's `role` field.

## Requirements

### Requirement: Contribution Postgres table
The system SHALL provide a `contribution` table with fields: `id` (uuid, primary key),
`building_id` (uuid, not null, foreign key to `building.id`, `ON DELETE RESTRICT`),
`membership_id` (uuid, not null, foreign key to `membership.id`, `ON DELETE RESTRICT`),
`category` (text, not null, no `CHECK` constraint — same unenforced vocabulary as
`fact_staleness`), `payload` (jsonb, not null), `contributor_role` (text, nullable —
denormalized cache of the contributor's role at time of contribution), `confidence_level`
(integer, not null, `CHECK (confidence_level BETWEEN 1 AND 5)`), `review_status` (text, not
null, `CHECK (review_status IN ('pending', 'verified', 'flagged', 'rejected'))`, default
`'pending'`), `source_method` (text, not null, `CHECK (source_method IN ('field_visit',
'professional_audit', 'permit_record', 'form_submission'))`), `created_at` (timestamptz, not
null, default now).

#### Scenario: A contribution persists with a null contributor_role
- **WHEN** a `contribution` row is inserted with `contributor_role` null
- **THEN** the row persists successfully

#### Scenario: review_status defaults to pending
- **WHEN** a `contribution` row is inserted without specifying `review_status`
- **THEN** the persisted row has `review_status = 'pending'`

#### Scenario: An invalid review_status is rejected
- **WHEN** a `contribution` row is inserted with `review_status` set to a value other than
  `pending`, `verified`, `flagged`, or `rejected`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: An out-of-range confidence_level is rejected
- **WHEN** a `contribution` row is inserted with `confidence_level` outside the range 1 to 5
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: Multiple contributions for the same building and category persist independently
- **WHEN** two `contribution` rows are inserted with the same `building_id` and `category`
- **THEN** both rows persist as independent, addressable records

#### Scenario: A contribution is rejected when its Building does not exist
- **WHEN** a `contribution` row is inserted with a `building_id` that does not reference an
  existing `building` row
- **THEN** the database rejects the insert with a foreign key violation

#### Scenario: A contribution is rejected when its Membership does not exist
- **WHEN** a `contribution` row is inserted with a `membership_id` that does not reference an
  existing `membership` row
- **THEN** the database rejects the insert with a foreign key violation
