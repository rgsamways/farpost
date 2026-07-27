# billing-subscription

## Purpose
A uniform, per-account recurring subscription (currently: $12/year, billed as a single annual
charge and marketed as "$1/month"), attached directly to `user_id` with no `Membership`/role
scoping — matching the canonical cross-project billing doc's own explicit decision to drop
Farpost's old per-role subscription tier ladder for this rebuild.

## Requirements

### Requirement: BillingSubscription Postgres table
The system SHALL provide a `billing_subscription` table with fields: `id` (uuid, primary key),
`user_id` (text, not null, foreign key to `user.id`, `ON DELETE RESTRICT`), `interval` (text,
not null, `CHECK (interval IN ('monthly', 'annual'))`), `price_cents` (integer, not null),
`status` (text, not null, `CHECK (status IN ('active', 'canceled', 'past_due'))`, default
`'active'`), `period_number` (integer, not null, default `1`), `current_period_start`
(timestamptz, not null), `current_period_end` (timestamptz, not null), `period_charged_cents`
(integer, not null), `canceled_at` (timestamptz, nullable), `stripe_subscription_id` (text,
nullable), `stripe_customer_id` (text, nullable), `created_at` (timestamptz, not null, default
now). The table SHALL carry a partial unique constraint on `user_id` WHERE `status = 'active'`.

#### Scenario: A subscription persists with default status and period_number
- **WHEN** a `billing_subscription` row is inserted without specifying `status` or
  `period_number`
- **THEN** the persisted row has `status = 'active'` and `period_number = 1`

#### Scenario: A second active subscription for the same user is rejected
- **WHEN** a `billing_subscription` row with `status = 'active'` is inserted for a `user_id`
  that already has an active `billing_subscription` row
- **THEN** the database rejects the insert with a uniqueness violation

#### Scenario: A second canceled subscription for the same user is allowed
- **WHEN** a `billing_subscription` row with `status = 'canceled'` is inserted for a `user_id`
  that already has a canceled `billing_subscription` row
- **THEN** both rows persist, since the partial unique constraint only applies to `active` rows

#### Scenario: An invalid interval is rejected
- **WHEN** a `billing_subscription` row is inserted with `interval` set to a value other than
  `monthly` or `annual`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: An invalid status is rejected
- **WHEN** a `billing_subscription` row is inserted with `status` set to a value other than
  `active`, `canceled`, or `past_due`
- **THEN** the database rejects the insert with a constraint violation

#### Scenario: canceled_at is nullable
- **WHEN** a `billing_subscription` row is inserted without specifying `canceled_at`
- **THEN** the row persists successfully with `canceled_at` null

#### Scenario: A subscription is rejected when its User does not exist
- **WHEN** a `billing_subscription` row is inserted with a `user_id` that does not reference an
  existing `user` row
- **THEN** the database rejects the insert with a foreign key violation
