## Why

Robin wants a uniform $1/month (billed as one $12/year charge) account subscription, gating
some not-yet-decided set of paid niceties. `docs/core-schema-full-design-2026-07-27.md`'s
`BillingSubscription` sketch summarizes this, but the actual canonical design lives in a
different repo (`c:\dev\robinsamways\docs\core-billing-model.md`, a portable billing model
shared with Vocare) — checking it directly turned up real field differences worth correcting
before building, not re-deriving from the summary.

Scope deliberately narrowed, per Robin's direct instruction: `FulfillmentFee` (the marketplace
per-job fee) and the credit-pack pattern are **not** part of this change — Robin wants to try
fulfillment fees only if usage patterns actually call for it, and credit packs have no concrete
plan yet either. Both stay real, undecided future work, not silently dropped.

## What Changes

- Add `billing_subscription`: one row per active/historical subscription, attached directly to
  `user_id` (better-auth's `user.id`) — no `Membership` scoping, matching the canonical doc's own
  explicit, deliberate decision ("every account in every project... no role-scoping").
- **Field list corrected against the canonical doc**, not Farpost's own schema-summary doc:
  - Real fields the summary doc omitted: `interval` (text: monthly/annual), `price_cents`
    (integer), `stripe_customer_id` (text, nullable), `canceled_at` (timestamptz, nullable).
  - `status` gets a real, concrete 3-value vocabulary from the canonical doc:
    `active`/`canceled`/`past_due` — not invented here.
  - `plan` (from the summary doc's field list) is **dropped** — there is only one uniform
    $12/year plan across the whole platform, so a `plan` column would carry no real information.
  - `cancel_at_period_end` (boolean, from the summary doc) is **replaced** by `canceled_at`
    (timestamptz) — matches the canonical doc's actual cancellation flow
    (`cancel_at_period_end: true` is a Stripe API call, not a field this table needs to store
    separately; `canceled_at` records when cancellation actually happened, which the real
    prorated-refund calculation in the canonical doc depends on).
- **One deliberate deviation from the canonical doc, flagged, not silent:** the canonical
  package's `id` field is a generic `text` primary key (portable across whatever ID scheme each
  project prefers). This schema uses `uuid` with `defaultRandom()` instead, matching every one
  of Farpost's other 24 tables — internal consistency with this schema's own established
  convention, not a correction to the canonical doc.

## Capabilities

### New Capabilities
- `billing-subscription`: a uniform, per-account recurring subscription (currently: $12/year,
  billed as a single annual charge), independent of `Membership`/role.

### Modified Capabilities
- None.

## Impact

- New table: `billing_subscription` (`api/src/db/billing-subscription-schema.ts`).
- New FK: `billing_subscription.user_id → user.id` (`ON DELETE RESTRICT`).
- Real DB-level uniqueness: partial unique on `user_id` WHERE `status = 'active'` — one active
  subscription per user, enforced at the database, matching the relationships doc's own already
  designed constraint.
- No Stripe integration, no webhook handlers, no entitlement-checking logic, no feature-gating —
  schema only. The canonical doc's own framing applies here too: "does this user have an active
  row in `billing_subscription`" is a derived question the application layer answers later, not
  a stored field.
- `FulfillmentFee` and credit-pack tables explicitly out of scope for this change.
