## 1. Event, EventRecipient (`event-log`)

- [x] 1.1 Create `api/src/db/event-schema.ts` with the `event` table per
      `specs/event-log/spec.md`, including the `subject_type`, `urgency`, and `delivery_status`
      `CHECK` constraints. **Use `text` for `actor_user_id`, not `uuid`** — design.md's Context
      section found and corrected a real type error in the source design doc; do not follow the
      doc's literal `uuid` typing. Confirmed: `actor_user_id: text("actor_user_id")`, matching
      `user.id`'s real type.
- [x] 1.2 Create `api/src/db/event-recipient-schema.ts` with the `event_recipient` table,
      `ON DELETE CASCADE` against `event.id`. **Use `text` for `recipient_user_id`, not
      `uuid`**, same correction as 1.1. Confirmed: `recipientUserId: text("recipient_user_id")`.
- [x] 1.3 Register both files in `api/drizzle.config.ts`'s `schema` array.

## 2. Relations wiring

- [x] 2.1 Add Drizzle `relations()` definitions in `api/src/db/relations.ts` for `event` ↔
      `event_recipient` (one-to-many).
- [x] 2.2 Document, in a code comment on `event-schema.ts`, that `subject_type`/`subject_id` is
      intentionally NOT wired as a Drizzle relation — matching the established pattern from
      `asset-schema.ts`/`stake-schema.ts`/`job-schema.ts`.

## 3. Migration and verification

- [x] 3.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field
      lists before applying — specifically confirm `actor_user_id` and `recipient_user_id`
      generated as `text` columns, not `uuid`. Confirmed in the generated
      `0009_event_log_schema.sql`: both columns are `text`. No `geography` columns in this
      change, so the drizzle-kit quoting bug from earlier changes didn't apply — generated SQL
      matched design.md exactly on first pass, no hand-fixing needed.
- [x] 3.2 Add the indexes named in design.md: `event` (`created_at DESC`,
      `(subject_type, subject_id)`, partial on `delivery_status != 'delivered'`),
      `event_recipient` (`(recipient_user_id, created_at DESC)`, `event_id`, partial on
      `read_at IS NULL`).
- [x] 3.3 Apply the migration to the dev database. Verify directly with `psql \d` against both
      new tables — all columns (including the corrected `text` type on both user-reference
      columns), FKs, CHECK constraints, and indexes match design.md. Confirmed live: both
      `actor_user_id` and `recipient_user_id` are `text` in the real dev DB, every CHECK/FK/index
      matches.
- [x] 3.4 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 4. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 4.1 Add `event-schema.test.ts` (real-DB, no mocking) covering: an event persists with
      `actor_user_id` null, an invalid `subject_type` is rejected, `delivery_status` defaults to
      `pending`, an invalid `delivery_status` is rejected, an invalid `urgency` is rejected.
- [x] 4.2 Add `event-recipient-schema.test.ts` covering: multiple recipients per event, a fresh
      recipient row has `read_at` null, two recipients of the same event can have independent
      read states, cascade deletion when the parent `event` is deleted.

## 5. Verification

- [x] 5.1 Confirm, against the real dev database, the full chain works end to end: insert a
      `job`, an `event` referencing it (`subject_type = 'job'`), and two `event_recipient` rows
      with different `recipient_user_id`/`read_at` states — all in one connected scenario. Ran
      directly via `psql` inside a transaction (rolled back, no dev-DB residue): all seven
      inserts succeeded, the event's `subject_type`/`subject_id` correctly resolved to the real
      job row, and both recipients persisted with independent read states (one read, one
      unread).
