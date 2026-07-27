## ADDED Requirements

### Requirement: Property Postgres table
The system SHALL provide a `property` table with fields: `id` (uuid, primary key), `slug` (text,
unique, not null), `external_ids` (jsonb, nullable — bulk-ingestion source identifiers, e.g. an
Ontario Property Identification Number), `civic_number` (text, nullable), `address` (text,
nullable), `boundary` (geography Polygon, SRID 4326, nullable), `centroid` (geography Point, SRID
4326, nullable), `dimensions` (jsonb, nullable), `zoning_code` (text, nullable),
`zoning_description` (text, nullable), `historical_designation` (text, nullable), `created_at`
(timestamptz, not null, default now).

#### Scenario: Property persists with a unique slug
- **WHEN** a `Property` row is inserted with a `slug` value already used by another `Property` row
- **THEN** the database rejects the insert with a uniqueness violation

#### Scenario: Property is insertable with no boundary or building yet
- **WHEN** a `Property` row is inserted with `boundary`, `centroid`, and `external_ids` all null
- **THEN** the row persists successfully

### Requirement: Building Postgres table
The system SHALL provide a `building` table with fields: `id` (uuid, primary key), `property_id`
(uuid, not null, foreign key to `property.id`, `ON DELETE RESTRICT`), `slug` (text, unique, not
null), `nfc_tag_id` (text, nullable), `address` (text, nullable), `postal_code` (text, nullable),
`postal_prefix` (text, nullable), `location` (geography Point, SRID 4326, nullable),
`building_type` (text, nullable), `acquisition_channel` (text, nullable), `status` (text,
nullable), `activated_at` (timestamptz, nullable), `activation_count` (integer, not null, default
0), `neighbourhood_notes` (text, nullable), `roof_type` (text, nullable), `roof_installed_year`
(integer, nullable), `foundation_type` (text, nullable), `foundation_updated_year` (integer,
nullable), `electrical_type` (text, nullable), `electrical_updated_year` (integer, nullable),
`plumbing_type` (text, nullable), `plumbing_updated_year` (integer, nullable), `heating_type`
(text, nullable), `heating_installed_year` (integer, nullable), `year_built` (integer, nullable),
`owner_controls` (jsonb, nullable), `created_at` (timestamptz, not null, default now),
`updated_at` (timestamptz, not null, default now, maintained by trigger). The `building` table
SHALL NOT include `owner_name`, `owner_email`, or `owner_phone` columns.

#### Scenario: Building requires an existing Property
- **WHEN** a `Building` row is inserted with a `property_id` that does not exist in `property`
- **THEN** the database rejects the insert with a foreign key violation

#### Scenario: A Property cannot be deleted while it has Buildings
- **WHEN** a `DELETE` is issued against a `property` row that has one or more `building` rows
  referencing it
- **THEN** the database rejects the delete with a foreign key restriction violation

#### Scenario: A structural attribute persists with both type and age
- **WHEN** a `Building` row is inserted with `roof_type = 'asphalt_shingle'` and
  `roof_installed_year = 2015`
- **THEN** both values persist and are independently readable

#### Scenario: Owner contact fields have no column to write to
- **WHEN** application code attempts to construct an insert or update referencing an
  `owner_name`, `owner_email`, or `owner_phone` column on `building`
- **THEN** the database rejects the statement because no such column exists

### Requirement: Unit Postgres table
The system SHALL provide a `unit` table with fields: `id` (uuid, primary key), `building_id`
(uuid, not null, foreign key to `building.id`, `ON DELETE RESTRICT`), `nfc_tag_id` (text,
nullable), `unit_label` (text, not null), `unit_type` (text, nullable), `created_at` (timestamptz,
not null, default now).

#### Scenario: A Building can have zero Units
- **WHEN** a `Building` row exists with no `unit` rows referencing it
- **THEN** this is a valid, ordinary state (e.g. a single-family home)

#### Scenario: A Building can have multiple Units
- **WHEN** three `unit` rows are inserted with the same `building_id`
- **THEN** all three persist, each independently addressable

#### Scenario: A Building cannot be deleted while it has Units
- **WHEN** a `DELETE` is issued against a `building` row that has one or more `unit` rows
  referencing it
- **THEN** the database rejects the delete with a foreign key restriction violation

### Requirement: nfc_tag_id uniqueness on Building and Unit
The system SHALL enforce, via a partial unique index WHERE `nfc_tag_id IS NOT NULL`, that no two
`building` rows share the same `nfc_tag_id`, and separately that no two `unit` rows share the
same `nfc_tag_id`. Multiple rows with `nfc_tag_id IS NULL` (not yet tagged) SHALL remain
permitted.

#### Scenario: Duplicate tag on two Buildings is rejected
- **WHEN** a `building` row with `nfc_tag_id = 'tag-123'` already exists and a second `building`
  row is inserted with the same `nfc_tag_id`
- **THEN** the database rejects the second insert with a uniqueness violation

#### Scenario: Multiple untagged Buildings are permitted
- **WHEN** several `building` rows are inserted with `nfc_tag_id` left null
- **THEN** all inserts succeed
