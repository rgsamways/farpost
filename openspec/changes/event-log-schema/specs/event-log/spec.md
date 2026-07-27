## ADDED Requirements

### Requirement: Event Postgres table
The system SHALL provide an `event` table with fields: `id` (uuid, primary key), `event_type`
(text, not null), `actor_user_id` (text, nullable, foreign key to the better-auth `user` table,
`ON DELETE RESTRICT` — null means a system-generated event), `actor_role` (text, nullable),
`subject_type` (text, not null, `CHECK (subject_type IN ('building', 'claim', 'job'))`),
`subject_id` (uuid, not null — not a database foreign key, since the target table depends on
`subject_type`), `payload` (jsonb, nullable), `urgency` (text, not null, `CHECK (urgency IN
('normal', 'high'))`, default `'normal'`), `delivery_status` (text, not null, `CHECK
(delivery_status IN ('pending', 'processing', 'delivered'))`, default `'pending'`),
`delivered_at` (timestamptz, nullable), `created_at` (timestamptz, not null, default now).

#### Scenario: An event persists with a null actor for a system-generated event
- **WHEN** an `event` row is inserted with `actor_user_id` null
- **THEN** the row persists successfully

#### Scenario: An invalid subject_type is rejected
- **WHEN** an `event` row is inserted with `subject_type` set to any value other than
  `building`, `claim`, or `job`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: Delivery status defaults to pending
- **WHEN** an `event` row is inserted without specifying `delivery_status`
- **THEN** the persisted row has `delivery_status = 'pending'`

#### Scenario: An invalid delivery_status is rejected
- **WHEN** an `event` row is inserted or updated with `delivery_status` set to a value other
  than `pending`, `processing`, `delivered`
- **THEN** the database rejects the write with a constraint violation

#### Scenario: An invalid urgency value is rejected
- **WHEN** an `event` row is inserted with `urgency` set to a value other than `normal` or
  `high`
- **THEN** the database rejects the insert with a constraint violation

### Requirement: EventRecipient Postgres table
The system SHALL provide an `event_recipient` table with fields: `id` (uuid, primary key),
`event_id` (uuid, not null, foreign key to `event.id`, `ON DELETE CASCADE`),
`recipient_user_id` (text, not null, foreign key to the better-auth `user` table, `ON DELETE
RESTRICT`), `recipient_role` (text, nullable), `reason` (text, nullable), `read_at`
(timestamptz, nullable), `created_at` (timestamptz, not null, default now).

#### Scenario: An event can fan out to multiple recipients
- **WHEN** three `event_recipient` rows are inserted with the same `event_id` and different
  `recipient_user_id` values
- **THEN** all three persist, each independently addressable

#### Scenario: A recipient row starts unread
- **WHEN** an `event_recipient` row is inserted without specifying `read_at`
- **THEN** the persisted row has `read_at` null

#### Scenario: Read state is per-recipient, not global
- **WHEN** one of two `event_recipient` rows for the same `event_id` has `read_at` set and the
  other does not
- **THEN** both rows persist independently, each reflecting its own read state

#### Scenario: EventRecipient rows are deleted when their Event is deleted
- **WHEN** an `event` row with one or more `event_recipient` rows is deleted
- **THEN** those `event_recipient` rows are also removed
