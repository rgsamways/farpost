# claim-intake

## Purpose
The insurance-claim intake record a `Job` can optionally originate from
(`Job.subject_type = 'claim'`). Deliberately has no `status` column — confirmed against the real
archived system, the old `Claim.status` was retired once `Job` generalized past claim-dispatch,
with `closed_at` remaining as `Claim`'s only lifecycle signal.

## Requirements

### Requirement: Claim Postgres table
The system SHALL provide a `claim` table with fields: `id` (uuid, primary key), `building_id`
(uuid, nullable, foreign key to `building.id`, `ON DELETE RESTRICT`), `insurer_file_number`,
`property_postal_code`, `property_type`, `property_address`, `site_contact_name`,
`site_contact_phone`, `urgency`, `peril_type`, `damage_description` (text, all nullable),
`coordinates` (geography Point, SRID 4326, nullable), `damage_types` (text array, nullable),
`response_window_hours`, `prior_claims_at_address` (integer, nullable), `repeat_property`
(boolean, not null, default false), `estimated_loss_amount`, `deductible` (numeric, nullable),
`adjuster_assigned_at`, `closed_at` (timestamptz, nullable). The table SHALL NOT include a
`status` column — `closed_at` is the claim's only lifecycle signal.

#### Scenario: A Claim is insertable with no resolved Building yet
- **WHEN** a `claim` row is inserted with `building_id` null
- **THEN** the row persists successfully

#### Scenario: A Claim can be linked to a Building once its address resolves
- **WHEN** a `claim` row's `building_id` is updated from null to an existing `building.id`
- **THEN** the update persists successfully

#### Scenario: A Building cannot be deleted while it has linked Claims
- **WHEN** a `DELETE` is issued against a `building` row that has one or more `claim` rows
  referencing it via `building_id`
- **THEN** the database rejects the delete with a foreign key restriction violation

#### Scenario: damage_types and damage_description are independently populated
- **WHEN** a `claim` row is inserted with `damage_types = ['water', 'structural']` and
  `damage_description = 'Basement flooding from burst pipe, wall damage'`
- **THEN** both fields persist and are independently readable

#### Scenario: A Claim's closure is tracked without a status column
- **WHEN** a `claim` row's `closed_at` is set to the current time
- **THEN** the row persists successfully and no `status` column exists to also update

### Requirement: Multiple Jobs can reference one Claim
A `job` row with `subject_type = 'claim'` and `subject_id` equal to a `claim.id` SHALL be
insertable any number of times against the same `Claim` — a `Claim` has its own independent
identity, not a fixed one-to-one relationship with a single `Job`.

#### Scenario: Two Jobs reference the same Claim
- **WHEN** two `job` rows are inserted, both with `subject_type = 'claim'` and `subject_id`
  equal to the same existing `claim.id`
- **THEN** both `job` rows persist successfully
