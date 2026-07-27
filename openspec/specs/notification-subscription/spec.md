# notification-subscription

## Purpose
A standing, queryable rule ("notify this Membership when this event type happens about this
building/area") that a future fan-out process reads to decide who becomes an `EventRecipient`.
`anchor_type`'s vocabulary and `anchor_value`'s nullable-when-global shape are grounded in the
old system's real production usage, not invented fresh. No relation to `Event` — a subscription
is matched against future events by value at fan-out time, not linked to a specific event row.

## Requirements

### Requirement: NotificationSubscription Postgres table
The system SHALL provide a `notification_subscription` table with fields: `id` (uuid, primary
key), `membership_id` (uuid, not null, foreign key to `membership.id`, `ON DELETE RESTRICT`),
`event_type` (text, not null), `anchor_type` (text, not null, `CHECK (anchor_type IN
('building', 'postal_code', 'all'))`), `anchor_value` (text, nullable — null when `anchor_type =
'all'`, populated when `anchor_type` is `'building'` or `'postal_code'`), `channels` (text array,
not null, default `'{}'`), `active` (boolean, not null, default `true`), `frequency_preference`
(text, not null, `CHECK (frequency_preference IN ('immediate', 'daily_digest', 'weekly_digest',
'never'))`, default `'immediate'`), `created_at` (timestamptz, not null, default now).

#### Scenario: A building-anchored subscription persists
- **WHEN** a `notification_subscription` row is inserted with `anchor_type = 'building'` and a
  non-null `anchor_value`
- **THEN** the row persists successfully

#### Scenario: A postal-code-anchored subscription persists
- **WHEN** a `notification_subscription` row is inserted with `anchor_type = 'postal_code'` and
  a non-null `anchor_value`
- **THEN** the row persists successfully

#### Scenario: A global subscription persists with a null anchor_value
- **WHEN** a `notification_subscription` row is inserted with `anchor_type = 'all'` and
  `anchor_value` null
- **THEN** the row persists successfully

#### Scenario: An invalid anchor_type is rejected
- **WHEN** a `notification_subscription` row is inserted with `anchor_type` set to any value
  other than `building`, `postal_code`, or `all`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: frequency_preference defaults to immediate
- **WHEN** a `notification_subscription` row is inserted without specifying
  `frequency_preference`
- **THEN** the persisted row has `frequency_preference = 'immediate'`

#### Scenario: An invalid frequency_preference is rejected
- **WHEN** a `notification_subscription` row is inserted with `frequency_preference` set to a
  value other than `immediate`, `daily_digest`, `weekly_digest`, or `never`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: active defaults to true
- **WHEN** a `notification_subscription` row is inserted without specifying `active`
- **THEN** the persisted row has `active = true`

#### Scenario: A subscription is rejected when its Membership does not exist
- **WHEN** a `notification_subscription` row is inserted with a `membership_id` that does not
  reference an existing `membership` row
- **THEN** the database rejects the insert with a foreign key violation

#### Scenario: Deleting a Membership with active subscriptions is rejected
- **WHEN** a `membership` row with one or more `notification_subscription` rows is deleted
- **THEN** the database rejects the delete with a foreign key violation
