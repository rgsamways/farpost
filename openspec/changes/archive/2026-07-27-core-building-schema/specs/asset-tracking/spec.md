## ADDED Requirements

### Requirement: Asset Postgres table with polymorphic subject
The system SHALL provide an `asset` table with fields: `id` (uuid, primary key), `subject_type`
(text, not null, `CHECK (subject_type IN ('property', 'building', 'unit'))`), `subject_id` (uuid,
not null — not a database foreign key, since it may point at `property.id`, `building.id`, or
`unit.id` depending on `subject_type`), `asset_id` (text, nullable — an external/local reference
code), `asset_type` (text, nullable), `label` (text, nullable), `manufacturer` (text, nullable),
`model` (text, nullable), `serial_number` (text, nullable), `warranty_expiry_date` (date,
nullable), `installed_date` (date, nullable), `condition_status` (text, nullable), `photo_urls`
(text array, nullable), `condition_notes` (text array, nullable), `compliance` (jsonb, nullable),
`created_at` (timestamptz, not null, default now).

#### Scenario: Asset can attach directly to a Property
- **WHEN** an `asset` row is inserted with `subject_type = 'property'` and `subject_id` equal to
  an existing `property.id`
- **THEN** the row persists successfully, with no `building` or `unit` involved

#### Scenario: Asset can attach to a Building
- **WHEN** an `asset` row is inserted with `subject_type = 'building'` and `subject_id` equal to
  an existing `building.id`
- **THEN** the row persists successfully

#### Scenario: Asset can attach to a Unit
- **WHEN** an `asset` row is inserted with `subject_type = 'unit'` and `subject_id` equal to an
  existing `unit.id`
- **THEN** the row persists successfully

#### Scenario: An invalid subject_type is rejected
- **WHEN** an `asset` row is inserted with `subject_type` set to any value other than `property`,
  `building`, or `unit`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: Asset carries manufacturer and warranty detail
- **WHEN** an `asset` row is inserted with `manufacturer`, `model`, `serial_number`, and
  `warranty_expiry_date` populated
- **THEN** all four values persist and are independently readable, supporting the systems-
  passport feature's need for this detail
