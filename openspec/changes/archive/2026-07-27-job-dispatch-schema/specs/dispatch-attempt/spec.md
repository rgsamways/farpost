## ADDED Requirements

### Requirement: WorkRequestAttempt Postgres table
The system SHALL provide a `work_request_attempt` table with fields: `id` (uuid, primary key),
`job_id` (uuid, not null, foreign key to `job.id`, `ON DELETE CASCADE`), `candidate_user_id`
(text, not null, foreign key to the better-auth `user` table, `ON DELETE RESTRICT`),
`attempt_number` (integer, not null), `dispatched_at` (timestamptz, not null, default now),
`timeout_at` (timestamptz, not null), `responded_at` (timestamptz, nullable), `response` (text,
nullable, `CHECK (response IN ('accepted', 'declined', 'timeout') OR response IS NULL)`),
`decline_reason` (text, nullable).

#### Scenario: A Job can have multiple dispatch attempts
- **WHEN** two `work_request_attempt` rows are inserted with the same `job_id` and
  `attempt_number` values `1` and `2`
- **THEN** both rows persist, each independently addressable

#### Scenario: An attempt starts with no response
- **WHEN** a `work_request_attempt` row is inserted without specifying `response` or
  `responded_at`
- **THEN** both fields persist as null

#### Scenario: An invalid response value is rejected
- **WHEN** a `work_request_attempt` row sets `response` to a value other than `accepted`,
  `declined`, `timeout`, or null
- **THEN** the database rejects the write with a constraint violation

#### Scenario: A decline can carry a reason
- **WHEN** a `work_request_attempt` row is updated with `response = 'declined'` and
  `decline_reason` set to a non-empty string
- **THEN** both fields persist and are independently readable

#### Scenario: Attempts are deleted when their Job is deleted
- **WHEN** a `job` row with one or more `work_request_attempt` rows is deleted
- **THEN** those `work_request_attempt` rows are also removed
