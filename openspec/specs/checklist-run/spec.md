# checklist-run

## Purpose
One execution of a `checklist-template` against a `Building`, performed by a `Membership`,
pinned to the exact template version used (`ChecklistRun`), with one answered-item row per
question (`ChecklistResult`) carrying a `condition_status` verdict richer than the old bare
boolean `passed`. Deliberately not related to `Job`/`Claim` — neither design doc names that
connection, so none is invented here.

## Requirements

### Requirement: ChecklistRun Postgres table
The system SHALL provide a `checklist_run` table with fields: `id` (uuid, primary key),
`building_id` (uuid, not null, foreign key to `building.id`, `ON DELETE RESTRICT`),
`membership_id` (uuid, not null, foreign key to `membership.id`, `ON DELETE RESTRICT`),
`checklist_template_id` (uuid, not null, foreign key to `checklist_template.id`, `ON DELETE
RESTRICT`), `checklist_template_version` (integer, not null), `completed_at` (timestamptz,
nullable), `overall_status` (text, nullable, `CHECK (overall_status IN ('in_progress', 'clean',
'issues_found') OR overall_status IS NULL)`), `created_at` (timestamptz, not null, default now).

#### Scenario: A run pins the exact template version used
- **WHEN** a `checklist_run` row is inserted with `checklist_template_id` referencing a template
  currently at `version = 3` and `checklist_template_version = 2`
- **THEN** the row persists with `checklist_template_version = 2`, independent of the
  template's current `version`

#### Scenario: A run can be in progress with no completed_at yet
- **WHEN** a `checklist_run` row is inserted with `completed_at` null
- **THEN** the row persists successfully

#### Scenario: An invalid overall_status value is rejected
- **WHEN** a `checklist_run` row is inserted or updated with `overall_status` set to a value
  other than `in_progress`, `clean`, `issues_found`, or null
- **THEN** the database rejects the write with a constraint violation

#### Scenario: A Building cannot be deleted while it has ChecklistRuns
- **WHEN** a `DELETE` is issued against a `building` row that has one or more `checklist_run`
  rows referencing it
- **THEN** the database rejects the delete with a foreign key restriction violation

### Requirement: ChecklistResult Postgres table
The system SHALL provide a `checklist_result` table with fields: `id` (uuid, primary key),
`checklist_run_id` (uuid, not null, foreign key to `checklist_run.id`, `ON DELETE CASCADE`),
`checklist_template_item_id` (uuid, not null, foreign key to `checklist_template_item.id`, `ON
DELETE RESTRICT`), `asset_id` (uuid, nullable, foreign key to `asset.id`, `ON DELETE
RESTRICT`), `condition_status` (text, not null, `CHECK (condition_status IN
('inspected_acceptable', 'not_inspected', 'not_present', 'safety_concern', 'repair_needed',
'defect_follow_up'))`), `recommended_action` (text, nullable), `notes` (text, nullable).

#### Scenario: A result can apply to the building as a whole
- **WHEN** a `checklist_result` row is inserted with `asset_id` null
- **THEN** the row persists successfully

#### Scenario: A result traces back to the exact item it answered
- **WHEN** a `checklist_result` row is inserted with `checklist_template_item_id` referencing an
  existing `checklist_template_item.id`
- **THEN** the row persists successfully and that reference is independently queryable

#### Scenario: An invalid condition_status is rejected
- **WHEN** a `checklist_result` row is inserted with `condition_status` set to a value outside
  the six defined values
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: ChecklistResult rows are deleted when their ChecklistRun is deleted
- **WHEN** a `checklist_run` row with one or more `checklist_result` rows is deleted
- **THEN** those `checklist_result` rows are also removed
