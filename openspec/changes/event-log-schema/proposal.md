## Why

`docs/core-schema-full-design-2026-07-27.md` revived `Event`/`EventRecipient` — a table the old
system genuinely depended on for reputation computation, notification fan-out, and admin audit,
which the fresh 28-table draft had dropped entirely — but it has no schema yet. Its polymorphic
subject (`Building`/`Claim`/`Job`) now points at real, built tables for the first time, and
nothing else in the schema built so far gives Farpost a real notification-fan-out or
reputation-timeline foundation. `docs/core-building-model.md`'s own reputation confirmation
("a read-only, on-the-fly timeline of factual events... never stored or scored") depends
directly on this table existing.

## What Changes

- Creates `Event` — a single append-only record of something that happened (`event_type`, e.g.
  `"CLAIM.SUBMITTED"`), who did it (`actor_user_id`, nullable — null means system-generated),
  what it's about (the `Building`/`Claim`/`Job` polymorphic subject), and its delivery/fan-out
  state.
- Creates `EventRecipient` — replaces the old model's jsonb `relevance` list with its own real,
  independently-queryable table: which users an event is relevant to, why, and whether each has
  read it — a per-recipient fact, not a single global flag.
- **Real correction found and applied, not just transcribed:** the design doc's own field list
  literally types `actor_user_id`/`recipient_user_id` as `uuid` — checked against the actual
  built `user` table (`api/src/db/auth-schema.ts`) and confirmed that's wrong; `user.id` is
  `text` (better-auth's own convention), matching every other already-built table's user
  reference (`Job.requesterUserId`, `Stake.userId`, `WorkRequestAttempt.candidateUserId`, etc.).
  Both columns are specced here as `text`, not `uuid`.
- Continues every established convention: `text` + `CHECK` over native `ENUM`, `ON DELETE
  RESTRICT` by default (`EventRecipient → Event` is the one `CASCADE`, since a recipient row is
  a pure child of its event).

## Capabilities

### New Capabilities
- `event-log`: `Event` (the append-only fact record) and `EventRecipient` (per-recipient
  relevance/read-state), together forming the fan-out/audit/reputation-source foundation.

### Modified Capabilities
None — nothing existing changes shape. Reads `building-record` (`Building`), `claim-intake`
(`Claim`), and `job-record` (`Job`) without modifying them.

## Impact

- **New:** Drizzle schema files and a migration for `event` and `event_recipient` — two tables.
- **Reads, doesn't modify:** `building`, `claim`, `job` (poly targets), `user` (FK target).
- **Not affected:** no application/route code yet — schema-only, same scope discipline as every
  prior schema change.
- **Unlocks:** a real reputation-timeline feature (read-only, computed over `Event` + `Stake`,
  per `core-building-model.md`'s already-settled decision) and a real notification-fan-out
  mechanism become buildable once this exists — neither was possible before, since nothing
  tracked "something happened, who does it matter to."
