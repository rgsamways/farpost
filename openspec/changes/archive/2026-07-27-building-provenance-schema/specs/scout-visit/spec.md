## ADDED Requirements

### Requirement: ScoutVisit Postgres table
The system SHALL provide a `scout_visit` table with fields: `id` (uuid, primary key),
`building_id` (uuid, not null, foreign key to `building.id`, `ON DELETE RESTRICT`),
`membership_id` (uuid, not null, foreign key to `membership.id`, `ON DELETE RESTRICT`),
`photo_urls` (text array, not null, default `'{}'`), `notes` (text, nullable), `visited_at`
(timestamptz, not null, default now), `gps_accuracy_m` (numeric, nullable).

#### Scenario: A scout visit persists with no photos
- **WHEN** a `scout_visit` row is inserted without specifying `photo_urls`
- **THEN** the persisted row has `photo_urls` equal to an empty array

#### Scenario: A scout visit persists with multiple photos
- **WHEN** a `scout_visit` row is inserted with three `photo_urls` values
- **THEN** the row persists with all three values, in order

#### Scenario: gps_accuracy_m is nullable
- **WHEN** a `scout_visit` row is inserted without specifying `gps_accuracy_m`
- **THEN** the row persists successfully with `gps_accuracy_m` null

#### Scenario: A scout visit is rejected when its Building does not exist
- **WHEN** a `scout_visit` row is inserted with a `building_id` that does not reference an
  existing `building` row
- **THEN** the database rejects the insert with a foreign key violation

#### Scenario: A scout visit is rejected when its Membership does not exist
- **WHEN** a `scout_visit` row is inserted with a `membership_id` that does not reference an
  existing `membership` row
- **THEN** the database rejects the insert with a foreign key violation
