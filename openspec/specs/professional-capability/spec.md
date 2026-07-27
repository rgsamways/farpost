# professional-capability

## Purpose
The professional-capability layer on top of `Membership`: a public-facing professional identity
(`ProfessionalProfile`), service-area/capacity eligibility for dispatch (`DispatchCapability`),
and credential/licensing tracking (`ComplianceRecord`). All three attach to an existing
`Membership` row rather than duplicating identity concerns already owned by `membership-model`.

## Requirements

### Requirement: ProfessionalProfile Postgres table
The system SHALL provide a `professional_profile` table with fields: `membership_id` (uuid,
primary key, foreign key to `membership.id`, `ON DELETE RESTRICT`), `first_name` (text, not
null), `last_name` (text, not null), `company` (text, nullable), `slug` (text, unique, not
null), `phone` (text, nullable), `service_area` (jsonb, nullable), `visibility` (jsonb,
nullable), `stripe_customer_id` (text, nullable), `underwriting_digest_enabled` (boolean, not
null, default false), `extra` (jsonb, nullable), `years_in_business` (integer, nullable),
`bio_text` (text, nullable). The table SHALL NOT include `average_rating` or `review_count`
columns.

#### Scenario: A profile persists with a unique slug
- **WHEN** a `professional_profile` row is inserted with a `slug` already used by another row
- **THEN** the database rejects the insert with a uniqueness violation

#### Scenario: A profile requires an existing Membership
- **WHEN** a `professional_profile` row is inserted with a `membership_id` that does not exist
  in `membership`
- **THEN** the database rejects the insert with a foreign key violation

#### Scenario: A Membership cannot be deleted while it has a ProfessionalProfile
- **WHEN** a `DELETE` is issued against a `membership` row that has a `professional_profile` row
  referencing it
- **THEN** the database rejects the delete with a foreign key restriction violation

#### Scenario: No rating columns exist to write to
- **WHEN** application code attempts to construct an insert or update referencing an
  `average_rating` or `review_count` column on `professional_profile`
- **THEN** the database rejects the statement because no such column exists

### Requirement: DispatchCapability Postgres table
The system SHALL provide a `dispatch_capability` table with fields: `membership_id` (uuid,
primary key, foreign key to `membership.id`, `ON DELETE RESTRICT`), `eligible` (boolean, not
null, default false), `base_lat` (numeric, nullable), `base_lng` (numeric, nullable),
`service_radius_km` (numeric, nullable), `service_postal_prefixes` (text array, nullable),
`max_drive_minutes` (integer, nullable), `capabilities` (text array, nullable),
`capacity_current` (integer, not null, default 0), `capacity_max` (integer, nullable).

#### Scenario: Dispatch eligibility defaults to false
- **WHEN** a `dispatch_capability` row is inserted without specifying `eligible`
- **THEN** the persisted row has `eligible = false`

#### Scenario: A DispatchCapability requires an existing Membership
- **WHEN** a `dispatch_capability` row is inserted with a `membership_id` that does not exist in
  `membership`
- **THEN** the database rejects the insert with a foreign key violation

### Requirement: ComplianceRecord Postgres table
The system SHALL provide a `compliance_record` table with fields: `id` (uuid, primary key),
`membership_id` (uuid, not null, foreign key to `membership.id`, `ON DELETE RESTRICT`),
`credential_type` (text, not null), `reference_number` (text, nullable), `expiry_date` (date,
nullable), `verification_status` (text, not null, `CHECK (verification_status IN ('pending',
'verified', 'expired', 'rejected'))`), `issuing_authority` (text, nullable),
`verification_document_url` (text, nullable), `renewal_reminder_sent_at` (timestamptz,
nullable), `created_at` (timestamptz, not null, default now).

#### Scenario: A Membership can hold multiple compliance records
- **WHEN** a `membership` row has two `compliance_record` rows with different
  `credential_type` values
- **THEN** both rows persist without conflict

#### Scenario: An invalid verification_status is rejected
- **WHEN** a `compliance_record` row is inserted or updated with `verification_status` set to a
  value outside `pending`, `verified`, `expired`, `rejected`
- **THEN** the database rejects the write with a constraint violation
