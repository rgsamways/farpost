## ADDED Requirements

### Requirement: feature_usage_event Postgres table
The system SHALL provide a `feature_usage_event` table with fields: `id` (uuid, primary key),
`user_id` (text, not null, foreign key to the better-auth `user` table), `feature_slug` (text,
not null — soft-validated against the application's feature registry, not a database foreign
key), `event_type` (text, not null, `CHECK (event_type IN ('checked',
'routed_to_professional'))`), `metadata` (jsonb, nullable), `created_at` (timestamptz, not null,
default now).

#### Scenario: A checked event persists
- **WHEN** a `feature_usage_event` row is inserted with `feature_slug = 'diy-vs-pro'` and
  `event_type = 'checked'`
- **THEN** the row persists successfully

#### Scenario: An invalid event_type is rejected
- **WHEN** a `feature_usage_event` row is inserted with `event_type` set to any value other than
  `checked` or `routed_to_professional`
- **THEN** the database rejects the insert with a constraint violation

### Requirement: /features/[slug] route resolves registered features and 404s unknown ones
The system SHALL serve `/features/<slug>` via a dynamic route that looks up `slug` in an
application-level feature registry. A registered slug SHALL render that feature's page. An
unregistered slug SHALL render a real not-found response, not a blank or broken page.

#### Scenario: A registered slug renders its feature
- **WHEN** a signed-in user navigates to `/features/diy-vs-pro`
- **THEN** the DIY-vs-pro decision helper page renders

#### Scenario: An unregistered slug 404s
- **WHEN** a user navigates to `/features/not-a-real-feature`
- **THEN** the response is a not-found page, not an error or blank screen

### Requirement: Access requires an active building Stake
The DIY-vs-pro decision helper SHALL be available only to a signed-in user who holds at least one
`stake` row with `subjectType = 'building'` and `status = 'active'` for their own `user_id`,
regardless of that stake's `role`. A signed-in user with no such stake SHALL see an explicit
empty state explaining that a claimed building is required, not a broken or partial tool.

#### Scenario: A user with an active building stake can use the tool
- **WHEN** a signed-in user with a `stake` row (`subjectType = 'building'`, `status = 'active'`,
  matching `user_id`) visits `/features/diy-vs-pro`
- **THEN** the decision-tree tool renders and is usable

#### Scenario: A user with no active building stake sees an explicit empty state
- **WHEN** a signed-in user with no `stake` row matching `subjectType = 'building'` and
  `status = 'active'` for their `user_id` visits `/features/diy-vs-pro`
- **THEN** the page shows an explanation that a claimed building is required, not the tool itself

### Requirement: Curated category decision tree produces a DIY or professional verdict
The system SHALL provide a curated decision tree covering the categories electrical, plumbing,
roofing, and structural. Each path through the tree SHALL end in a terminal verdict of `diy` or
`pro`, each carrying a plain-language `reasoning` string. The tree SHALL be static application
content, not free-text/NLP interpretation of the user's problem description.

#### Scenario: Completing a category's questions reaches a terminal verdict
- **WHEN** a user selects a category and answers its branching questions to a terminal node
- **THEN** the result is either `verdict: "diy"` or `verdict: "pro"`, with a non-empty `reasoning`
  string

#### Scenario: An unanswered question does not produce a verdict
- **WHEN** a user has selected a category but not yet answered all questions on their current
  path
- **THEN** no verdict is shown

### Requirement: A pro verdict records a routed event and shows a placeholder hand-off
When a completed path's verdict is `pro`, the system SHALL record a `feature_usage_event` row
with `event_type = 'routed_to_professional'` and SHALL display a hand-off message that states
professional matching is not yet available, without linking to or implying a working
professional-matching flow.

#### Scenario: Reaching a pro verdict records the event
- **WHEN** a user's path through the tree ends in `verdict: "pro"`
- **THEN** a `feature_usage_event` row with `event_type = 'routed_to_professional'` is recorded
  for that user

#### Scenario: The hand-off message does not imply a real match
- **WHEN** a `pro` verdict is displayed
- **THEN** the shown message states that professional matching is coming soon and contains no
  link or button that initiates a real match

### Requirement: Reaching any verdict records a checked event
Reaching a terminal verdict (either `diy` or `pro`) SHALL record a `feature_usage_event` row with
`event_type = 'checked'` for the signed-in user, independent of whether a `routed_to_professional`
event is also recorded.

#### Scenario: A diy verdict records a checked event only
- **WHEN** a user's path through the tree ends in `verdict: "diy"`
- **THEN** a `feature_usage_event` row with `event_type = 'checked'` is recorded, and no
  `routed_to_professional` row is recorded for that check

#### Scenario: A pro verdict records both a checked and a routed event
- **WHEN** a user's path through the tree ends in `verdict: "pro"`
- **THEN** both a `checked` row and a `routed_to_professional` row are recorded for that check

### Requirement: Per-user usage stats are visible on the feature page
The DIY-vs-pro decision helper page SHALL display, for the signed-in user, their own count of
`checked` events and their own count of `routed_to_professional` events for `feature_slug =
'diy-vs-pro'`. No sitewide aggregate stat SHALL be displayed by this change.

#### Scenario: A returning user sees their own usage counts
- **WHEN** a signed-in user with 3 prior `checked` events and 1 prior `routed_to_professional`
  event for `diy-vs-pro` visits the page
- **THEN** the page displays "3" and "1" respectively, scoped to that user's own events only
