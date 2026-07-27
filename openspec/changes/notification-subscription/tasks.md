## 1. NotificationSubscription (`notification-subscription`)

- [ ] 1.1 Create `api/src/db/notification-subscription-schema.ts` with the
      `notification_subscription` table per `specs/notification-subscription/spec.md`, including
      the `anchor_type` and `frequency_preference` `CHECK` constraints, nullable `anchor_value`,
      and the `channels` text array defaulting to `'{}'`.
- [ ] 1.2 Register the file in `api/drizzle.config.ts`'s `schema` array and in `api/src/db/
      client.ts`'s `schema` export, matching the pattern used by every prior schema file.

## 2. Relations wiring

- [ ] 2.1 Add `notification_subscription: many(notificationSubscription)` to the existing
      `membershipRelations` in `api/src/db/relations.ts`, same shape as `complianceRecords`.
- [ ] 2.2 Add `notificationSubscriptionRelations` (one `membership`), same shape as
      `complianceRecordRelations`.
- [ ] 2.3 Confirm no relation is added from `notification_subscription` to `event` — this is a
      deliberate, documented gap (design.md Decision 4): subscriptions are matched against
      future events by value at fan-out time, not linked to a specific event row.

## 3. Migration and verification

- [ ] 3.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field
      list before applying — confirm `anchor_type`/`frequency_preference` CHECK constraints,
      `anchor_value` nullability, and `channels` default all generated correctly.
- [ ] 3.2 Add the indexes named in the relationships doc: `membership_id`, and a compound index
      on `(event_type, anchor_type, anchor_value)` — add it partial on `active = true`, since an
      inactive subscription should never match the fan-out query (this partial predicate isn't
      in the original relationships doc; it's a direct application of the same "index for the
      real query shape" discipline used on `Stake`/`ComplianceRecord`/`WorkRequestAttempt`).
- [ ] 3.3 Apply the migration to the dev database. Verify directly with a live query against
      `information_schema.columns`/`pg_constraint`/`pg_indexes` (not just Drizzle's TypeScript
      layer) — all columns, the FK, both CHECK constraints, and both indexes match design.md.
- [ ] 3.4 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 4. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [ ] 4.1 Add `notification-subscription-schema.test.ts` (real-DB, no mocking) covering: a
      building-anchored subscription persists, a postal-code-anchored subscription persists, a
      global (`anchor_type = 'all'`) subscription persists with `anchor_value` null, an invalid
      `anchor_type` is rejected, `frequency_preference` defaults to `immediate`, an invalid
      `frequency_preference` is rejected, `active` defaults to `true`, a subscription referencing
      a nonexistent `membership_id` is rejected, and deleting a `membership` with an active
      subscription is rejected (FK restrict).

## 5. Verification

- [ ] 5.1 Confirm, against the real dev database, a connected scenario: insert a `membership`,
      then a `notification_subscription` row anchored to a real building for a real event type
      — confirm it persists and is findable by the exact `(event_type, anchor_type,
      anchor_value)` tuple a fan-out query would use.
