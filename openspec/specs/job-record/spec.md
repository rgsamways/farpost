# job-record

## Purpose
The work record itself: a requester asking for work against a polymorphic subject
(`Claim`/`Building`/`Property`/`Asset`), matched to an assignee, plus its notes/attachment/
cost-breakdown extensions. `status`/`priority`/`subject_type` are text+CHECK, not native enums,
so new values stay a cheap migration rather than a type-evolution problem.

## Requirements

### Requirement: Job Postgres table
The system SHALL provide a `job` table with fields: `id` (uuid, primary key),
`requester_user_id` (text, not null, foreign key to the better-auth `user` table, `ON DELETE
RESTRICT`), `target_role` (text, not null, soft-validated against `role_type.key` at the
application layer, not a database foreign key), `assignee_user_id` (text, nullable, foreign key
to `user`, `ON DELETE RESTRICT`), `subject_type` (text, not null, `CHECK (subject_type IN
('claim', 'building', 'property', 'asset'))`), `subject_id` (uuid, not null — not a database
foreign key, since the target table depends on `subject_type`), `description` (text, not null),
`accepted_at`, `arrived_at`, `completed_at`, `approved_at`, `scheduled_at`, `cancelled_at`
(timestamptz, all nullable), `cancellation_reason` (text, nullable), `scope_notes` (text,
nullable), `report_url` (text, nullable), `status` (text, not null, `CHECK (status IN
('pending', 'dispatched', 'accepted', 'in_progress', 'documented', 'approved', 'paid',
'exhausted', 'cancelled'))`, default `'pending'`), `priority` (text, not null, `CHECK (priority
IN ('low', 'medium', 'high', 'urgent'))`, default `'medium'`), `metadata` (jsonb, nullable),
`created_at` (timestamptz, not null, default now), `updated_at` (timestamptz, not null, default
now, maintained by trigger).

#### Scenario: A Job persists with a pending status by default
- **WHEN** a `job` row is inserted without specifying `status`
- **THEN** the persisted row has `status = 'pending'`

#### Scenario: An invalid status value is rejected
- **WHEN** a `job` row is inserted or updated with `status` set to a value outside the nine
  defined values
- **THEN** the database rejects the write with a constraint violation

#### Scenario: A cancelled Job is representable in status, not only via cancelled_at
- **WHEN** a `job` row is updated with `status = 'cancelled'` and `cancelled_at` set to the
  current time
- **THEN** the update persists and both fields reflect the new values

#### Scenario: An invalid subject_type is rejected
- **WHEN** a `job` row is inserted with `subject_type` set to any value other than `claim`,
  `building`, `property`, or `asset`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: A Job can exist with no assignee yet
- **WHEN** a `job` row is inserted with `assignee_user_id` null
- **THEN** the row persists successfully

#### Scenario: An invalid priority value is rejected
- **WHEN** a `job` row is inserted or updated with `priority` set to a value outside `low`,
  `medium`, `high`, `urgent`
- **THEN** the database rejects the write with a constraint violation

### Requirement: JobNotes Postgres table
The system SHALL provide a `job_notes` table with fields: `job_id` (uuid, primary key, foreign
key to `job.id`, `ON DELETE CASCADE`), `requester_notes` (text, nullable), `assignee_notes`
(text, nullable).

#### Scenario: JobNotes is deleted when its Job is deleted
- **WHEN** a `job` row with a corresponding `job_notes` row is deleted
- **THEN** the `job_notes` row is also removed, not left orphaned

### Requirement: JobAttachment Postgres table
The system SHALL provide a `job_attachment` table with fields: `id` (uuid, primary key),
`job_id` (uuid, not null, foreign key to `job.id`, `ON DELETE CASCADE`), `doc_type` (text, not
null, soft-validated against a small Farpost-curated list at the application layer, not a
database foreign key or CHECK), `label` (text, nullable), `url` (text, not null),
`uploaded_by_user_id` (text, not null, foreign key to `user`, `ON DELETE RESTRICT`), `mimetype`
(text, nullable), `uploaded_at` (timestamptz, not null, default now).

#### Scenario: A Job can have multiple attachments
- **WHEN** three `job_attachment` rows are inserted with the same `job_id`
- **THEN** all three persist, each independently addressable

#### Scenario: JobAttachment rows are deleted when their Job is deleted
- **WHEN** a `job` row with one or more `job_attachment` rows is deleted
- **THEN** those `job_attachment` rows are also removed

### Requirement: JobCostBreakdown Postgres table
The system SHALL provide a `job_cost_breakdown` table with fields: `job_id` (uuid, primary key,
foreign key to `job.id`, `ON DELETE CASCADE`), `labour_hours`, `labour_rate`, `materials`,
`equipment`, `travel`, `total`, `tax_rate`, `tax_amount` (numeric, all nullable),
`breakdown_type` (text, not null, `CHECK (breakdown_type IN ('estimate', 'actual'))`),
`measurement_notes` (text, nullable).

#### Scenario: A breakdown is identifiable as an estimate or an actual
- **WHEN** a `job_cost_breakdown` row is inserted with `breakdown_type = 'estimate'`
- **THEN** the row persists successfully and is distinguishable from an `'actual'` row for the
  same job

#### Scenario: An invalid breakdown_type is rejected
- **WHEN** a `job_cost_breakdown` row is inserted with `breakdown_type` set to any value other
  than `estimate` or `actual`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: JobCostBreakdown is deleted when its Job is deleted
- **WHEN** a `job` row with a corresponding `job_cost_breakdown` row is deleted
- **THEN** the `job_cost_breakdown` row is also removed
