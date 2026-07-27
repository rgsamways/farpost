## ADDED Requirements

### Requirement: FactStaleness Postgres table
The system SHALL provide a `fact_staleness` table with fields: `id` (uuid, primary key),
`building_id` (uuid, not null, foreign key to `building.id`, `ON DELETE RESTRICT`), `category`
(text, not null, no `CHECK` constraint — a known but unenforced vocabulary), `last_documented_at`
(date, not null), `half_life_months` (integer, not null), `next_stale_at` (date, `GENERATED
ALWAYS AS ((last_documented_at + (half_life_months || ' months')::interval)::date) STORED`),
`notified_at` (timestamptz, nullable), `source_method` (text, not null, `CHECK (source_method IN
('field_visit', 'professional_audit', 'permit_record', 'form_submission'))`),
`source_confidence_level` (integer, not null, `CHECK (source_confidence_level BETWEEN 1 AND
5)`). The table SHALL carry a `UNIQUE (building_id, category)` constraint.

#### Scenario: A fact_staleness row persists with a computed next_stale_at
- **WHEN** a `fact_staleness` row is inserted with `last_documented_at = '2026-01-01'` and
  `half_life_months = 12`
- **THEN** the persisted row has `next_stale_at = '2027-01-01'`, computed by the database

#### Scenario: A second row for the same building and category is rejected
- **WHEN** a `fact_staleness` row is inserted for a `(building_id, category)` pair that already
  has a row
- **THEN** the database rejects the insert with a uniqueness violation

#### Scenario: An invalid source_method is rejected
- **WHEN** a `fact_staleness` row is inserted with `source_method` set to a value other than
  `field_visit`, `professional_audit`, `permit_record`, or `form_submission`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: An out-of-range source_confidence_level is rejected
- **WHEN** a `fact_staleness` row is inserted with `source_confidence_level` outside the range 1
  to 5
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: A fact_staleness row is rejected when its Building does not exist
- **WHEN** a `fact_staleness` row is inserted with a `building_id` that does not reference an
  existing `building` row
- **THEN** the database rejects the insert with a foreign key violation
