# checklist-template

## Purpose
A named, versioned, curated question set (`ChecklistTemplate`) and its ordered items
(`ChecklistTemplateItem`), each scoped to the asset types it applies to. Closes a real gap
confirmed against the old system: the original `ChecklistRun` had no reusable, versioned
question-set reference at all — `sequence_id` was just a free-text grouping label.

## Requirements

### Requirement: ChecklistTemplate Postgres table
The system SHALL provide a `checklist_template` table with fields: `id` (uuid, primary key),
`name` (text, not null), `description` (text, nullable), `version` (integer, not null, default
`1`), `status` (text, not null, `CHECK (status IN ('draft', 'active', 'deprecated'))`, default
`'draft'`), `asset_types` (text array, nullable), `curator_id` (text, nullable, foreign key to
the better-auth `user` table, `ON DELETE RESTRICT`), `created_at` (timestamptz, not null,
default now), `updated_at` (timestamptz, not null, default now, maintained by trigger).

#### Scenario: A template persists with a default draft status
- **WHEN** a `checklist_template` row is inserted without specifying `status`
- **THEN** the persisted row has `status = 'draft'`

#### Scenario: An invalid status value is rejected
- **WHEN** a `checklist_template` row is inserted or updated with `status` set to a value
  outside `draft`, `active`, `deprecated`
- **THEN** the database rejects the write with a constraint violation

#### Scenario: No two templates share the same name and version
- **WHEN** a `checklist_template` row is inserted with a `name`/`version` pair already used by
  another `checklist_template` row
- **THEN** the database rejects the insert with a uniqueness violation

#### Scenario: A template can exist with no curator
- **WHEN** a `checklist_template` row is inserted with `curator_id` null
- **THEN** the row persists successfully

### Requirement: ChecklistTemplateItem Postgres table
The system SHALL provide a `checklist_template_item` table with fields: `id` (uuid, primary
key), `checklist_template_id` (uuid, not null, foreign key to `checklist_template.id`, `ON
DELETE RESTRICT`), `sequence` (integer, not null), `category` (text, nullable), `title` (text,
not null), `description` (text, nullable), `expected_asset_types` (text array, nullable),
`recommended_action_on_fail` (text, nullable), `created_at` (timestamptz, not null, default
now).

#### Scenario: A template can have multiple ordered items
- **WHEN** three `checklist_template_item` rows are inserted with the same
  `checklist_template_id` and `sequence` values `1`, `2`, `3`
- **THEN** all three persist, each independently addressable

#### Scenario: A ChecklistTemplate cannot be deleted while it has items
- **WHEN** a `DELETE` is issued against a `checklist_template` row that has one or more
  `checklist_template_item` rows referencing it
- **THEN** the database rejects the delete with a foreign key restriction violation

#### Scenario: An item requires an existing ChecklistTemplate
- **WHEN** a `checklist_template_item` row is inserted with a `checklist_template_id` that does
  not exist in `checklist_template`
- **THEN** the database rejects the insert with a foreign key violation
