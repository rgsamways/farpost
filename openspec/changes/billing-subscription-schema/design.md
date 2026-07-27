## Context

`docs/core-schema-full-design-2026-07-27.md`'s `BillingSubscription` sketch is a summary,
referencing `core-billing-model.md` for the real shape. That file does not exist anywhere in
this repo or its archive — it lives in a separate, actively-maintained repo,
`c:\dev\robinsamways\docs\core-billing-model.md`, a portable billing design shared across
Robin's projects (Vocare and Farpost). Read directly rather than trusted secondhand, per
[[feedback_check_archive_when_schema_docs_disagree]]'s broader principle (check the real source
when a summary doc's field list is ambiguous or possibly stale) — applied here to a live sibling
project's canonical doc instead of an old archived codebase, same discipline either way.

**Real findings from the canonical doc, resolving real gaps in Farpost's own summary:**
- The subscription attaches directly to `userId`, uniformly, with **no role/Membership
  scoping** — a deliberate, explicit decision Robin made 2026-07-24 overriding an earlier draft
  that tried to preserve Farpost's old "base platform stays free forever" framing. That framing
  is superseded for this rebuild, not preserved.
- Real field list: `id`, `userId`, `interval` (`monthly`/`annual`), `priceCents`, `status`
  (`active`/`canceled`/`past_due`), `periodNumber`, `currentPeriodStart`, `currentPeriodEnd`,
  `periodChargedCents`, `canceledAt`, `stripeSubscriptionId`, `stripeCustomerId`, `createdAt`.
  Farpost's own schema-summary doc had `plan` and `cancel_at_period_end` instead of `interval`/
  `priceCents`/`stripeCustomerId`/`canceledAt` — a real drift between the summary and its own
  cited source, not a deliberate Farpost-specific change (nothing explains the difference).
- **The "$1/month" framing is already resolved, not an open product question:** Stripe has no
  native "$1/month" recurring primitive that matches the real desired behavior; the canonical
  doc's actual mechanism is one $12/year Stripe charge, with "$1/month" used purely as marketing
  copy. `interval` still supports a genuine `monthly` value for portability/future use, but
  Farpost's real day-one behavior is annual-only billing.
- **Two real patterns exist in the canonical doc that Farpost's own schema-summary doc never
  mentions at all**: a postpaid `FulfillmentFee`-style pattern (already partially covered
  elsewhere in Farpost's own docs) and a prepaid credit-pack pattern (`creditPackTable` +
  `creditPackConsumptionTable`) that Farpost's own unbuilt "tokens" idea explicitly matches.
  **Deliberately excluded from this change per Robin's direct instruction** (2026-07-27): both
  stay real, undecided future work — Robin wants to try `FulfillmentFee` only if usage patterns
  call for it, and has no concrete plan for credit packs yet.
- `periodNumber`/`periodChargedCents`/the whole prorated-refund calculation exist to support a
  real, specific cancellation policy (year one non-refundable past month one; year two-plus
  refunds unused days as a fraction of what was actually charged) — not needed for the schema
  itself, but explains why `canceledAt` (a real timestamp) is the right field, not a boolean.

## Goals / Non-Goals

**Goals:**
- Build exactly one table, `billing_subscription`, matching the canonical cross-project design
  doc's real field list — correcting the drift in Farpost's own schema-summary doc rather than
  perpetuating it.
- Keep this schema portable-in-spirit with the canonical doc (same field meanings, same
  vocabulary) while keeping Farpost's own internal PK convention (`uuid`, not the canonical
  package's generic `text`).

**Non-Goals:**
- No Stripe integration (Product/Price/Subscription creation, webhook handling for
  `invoice.paid`/cancellation), no refund-calculation logic, no entitlement/feature-gating
  logic — all real, separate future work once "what niceties" is actually decided.
- No `FulfillmentFee` table, no credit-pack tables — explicitly out of scope per Robin's
  direction, not a design gap.
- No change to `Membership`, `RoleType`, or the better-auth `user` table.

## Decisions

1. **Attaches to `user_id` (better-auth's `user.id`), not `Membership`.** Directly matches the
   canonical doc's own explicit, deliberate decision — no role-scoping, no per-Membership
   subscription. A user with multiple `Membership` rows (e.g. both an owner and a professional)
   still has exactly one `billing_subscription`.

2. **`status` gets a real 3-value `CHECK` constraint: `active`/`canceled`/`past_due`.** Sourced
   directly from the canonical doc, not invented — no `trialing` value, matching the confirmed
   absence of any trial period for this flat-fee model.

3. **`plan` is dropped; `interval`/`price_cents` take its place.** There is only one plan
   ($12/year) across the whole platform today — a `plan` text column would carry no real
   information and risks implying tier differentiation that doesn't exist. `interval`/
   `price_cents` are the canonical doc's actual fields and remain meaningful if a genuine
   monthly-interval option is ever offered.

4. **`canceled_at` (timestamptz, nullable) replaces `cancel_at_period_end` (boolean).** The
   canonical doc's real cancellation flow doesn't need a stored "will cancel at period end" flag
   — that's a live Stripe API call, checked against Stripe directly when needed. What the
   application-layer refund calculation (`computeCancellationRefundCents`) actually needs stored
   is *when* cancellation happened, to compute days-used/days-remaining — a real timestamp, not
   a boolean.

5. **`id` is `uuid`, `defaultRandom()`, not the canonical package's generic `text`.** A
   deliberate deviation, not a correction — every one of Farpost's other 24 tables uses this
   convention; matching it here is internal consistency, not a claim that the canonical doc's
   `text` choice is wrong for its own portable-package context.

6. **`user_id` gets `ON DELETE RESTRICT`** against the better-auth `user` table, matching every
   other `*_user_id`/`user_id` FK already built in this schema (`event.actor_user_id`,
   `stake.user_id`, etc.).

7. **Real `UNIQUE` partial index: `user_id` WHERE `status = 'active'`.** Already named in
   `docs/core-schema-relationships-and-indexes-2026-07-27.md` — enforces "one active subscription
   per user" at the database level, not just application logic.

## Risks / Trade-offs

- **No entitlement/feature-gating exists yet, so this table alone doesn't make "$1/month
  niceties" real** → Mitigation: explicitly out of scope here, same discipline as every prior
  schema-only cluster; flagged plainly so it isn't mistaken for a finished feature.
- **`FulfillmentFee`/credit-pack omission means this change doesn't fully implement the
  canonical doc** → Mitigation: this is Robin's explicit, informed choice (not an oversight),
  recorded here so a future session doesn't "helpfully" try to complete the canonical doc's
  full scope without being asked.

## Migration Plan

Standard additive migration — one new table, one new FK, no existing table altered. No rollback
complexity beyond dropping the new table.

## Open Questions

- What the "$1/month niceties" actually are — explicitly not decided by Robin yet, not a schema
  question, deliberately left open.
- Whether/when `FulfillmentFee` or credit packs get built — left to a future change, triggered
  by real usage signal per Robin's own framing, not a timeline decided here.
