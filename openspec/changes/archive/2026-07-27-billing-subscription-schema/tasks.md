## 1. BillingSubscription (`billing-subscription`)

- [x] 1.1 Create `api/src/db/billing-subscription-schema.ts` with the `billing_subscription`
      table per `specs/billing-subscription/spec.md`, including the `interval`/`status` `CHECK`
      constraints and the partial unique constraint on `user_id` WHERE `status = 'active'`.
      **`user_id` is `text`, not `uuid`** — references the better-auth `user.id` column, same
      convention as every other `*_user_id` column already built (`event.actor_user_id`,
      `stake.user_id`, etc.). **No `plan` field, no `cancel_at_period_end` boolean** — use
      `interval`/`price_cents` and `canceled_at` per design.md Decisions 3–4; do not add the
      summary doc's original fields back in. Confirmed: `userId: text(...)`, no `plan` column,
      no `cancelAtPeriodEnd` column.
- [x] 1.2 Register the file in `api/drizzle.config.ts`'s `schema` array and in `api/src/db/
      client.ts`'s `schema` export.

## 2. Relations wiring

- [x] 2.1 Add a `billingSubscriptionRelations` (one `user`, from better-auth's `auth-schema.ts`)
      in `api/src/db/relations.ts`. Check whether a `userRelations` already exists to add a
      `many(billingSubscription)` to — if not, adding just the one-directional relation from
      `billing_subscription` is sufficient, matching how other user-referencing tables
      (`event`, `stake`) are wired. Confirmed: `userRelations` exists in `auth-schema.ts`
      (sessions/accounts only) — no other user-referencing table adds itself there, so only the
      one-directional `billingSubscriptionRelations` was added, matching that pattern.

## 3. Migration and verification

- [x] 3.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field list
      before applying — confirm `interval`/`status` CHECK constraints, the partial unique
      constraint, and that `user_id` generated as `text`, not `uuid`. Confirmed in
      `0012_billing_subscription_schema.sql`: `user_id` is `text`, both CHECK constraints and the
      partial unique index all match design.md exactly on first pass. No `geography` columns in
      this change, so the drizzle-kit quoting bug didn't apply.
- [x] 3.2 Apply the migration to the dev database. Verify directly with a live query against
      `information_schema.columns`/`pg_constraint`/`pg_indexes` (not just Drizzle's TypeScript
      layer) — all columns, the FK, both CHECK constraints, and the partial unique index match
      design.md exactly. Confirmed live: all 13 columns, both CHECK constraints, the
      `ON DELETE RESTRICT` FK, and the partial unique index (`WHERE status = 'active'`) all
      match.
- [x] 3.3 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 4. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 4.1 Add `billing-subscription-schema.test.ts` (real-DB, no mocking) covering: a
      subscription persists with `status` defaulting to `active` and `period_number` defaulting
      to `1`, a second `active` subscription for the same `user_id` is rejected, a second
      `canceled` subscription for the same `user_id` is allowed (proving the constraint is
      genuinely partial, not a blanket unique), an invalid `interval` is rejected, an invalid
      `status` is rejected, `canceled_at` is nullable, a subscription referencing a nonexistent
      `user_id` is rejected.

## 5. Verification

- [x] 5.1 Confirm, against the real dev database, a connected scenario: insert a real `user`
      row, then a `billing_subscription` row for it with `interval = 'annual'`, `price_cents =
      1200`, confirm it persists; attempt a second `active` row for the same user in a
      savepoint and confirm it's rejected with the exact uniqueness violation, then roll back to
      the savepoint and insert a second row for the same user with `status = 'canceled'`,
      confirming it succeeds. Ran directly via `psql` inside a transaction (rolled back, no
      dev-DB residue): first `active` row persisted; a second `active` row for the same
      `user_id`, attempted via savepoint, correctly failed with
      `duplicate key value violates unique constraint "billing_subscription_user_id_active_idx"`;
      rolled back to the savepoint; a `canceled` row for the same `user_id` then persisted
      alongside the original `active` row — final state confirmed as exactly one `active` +
      one `canceled` row for the user.
