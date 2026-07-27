## Context

Every field in this change was designed in `docs/core-schema-full-design-2026-07-27.md`'s
"New: Event + EventRecipient" section, with relationship/index detail in
`docs/core-schema-relationships-and-indexes-2026-07-27.md`'s "Reconciled: Event and
ChecklistTemplate" section (the authoritative, final version — the earlier interim indexing-plan
table row for `Event` in that same doc used stale field names inherited from the pre-reconciliation
draft, `processed`/`read_by_admin`, which don't exist on the final table; the reconciled section
at the bottom is what this design follows).

Checked against the real archived old system before speccing, per the standing
[[feedback_check_archive_when_schema_docs_disagree]] practice — `c:\dev\archives\farpost\
farpost-api\app\models\event.py` confirms every "replaces"/"new" claim in the full-design doc
holds up: the old `Event.actor_id` really was a raw string (professional slug, claim id, or
literal `"system"`), `building_slug`/`claim_id`/`professional_slug` really were three separate
nullable columns, `processed: bool` really was a bare boolean, and `relevance: list[RelevanceTag]`
really was an embedded jsonb list with no independent query path.

**One real error found in the design doc itself, not just a gap** — checked against the actual
built schema, not just re-read more carefully: `core-schema-full-design-2026-07-27.md`'s own
field table types `Event.actor_user_id` and `EventRecipient.recipient_user_id` as `uuid`. The
real `user` table (`api/src/db/auth-schema.ts`, built in `wire-better-auth`) has `id: text`, not
uuid — better-auth's own convention, already correctly followed by every other user-referencing
column built so far (`job.requesterUserId`, `stake.userId`, `workRequestAttempt.
candidateUserId`, `jobAttachment.uploadedByUserId`, `checklistTemplate.curatorId`). Both columns
are specced here as `text`. This is a literal type error in the design doc, not a judgment call
— fixed here, not left as an open question.

## Goals / Non-Goals

**Goals:**
- Real Drizzle/Postgres tables for `Event` and `EventRecipient` — every field, CHECK constraint,
  and index from the two design docs, translated exactly (with the `actor_user_id`/
  `recipient_user_id` type correction above).
- Continue every established Postgres convention: `text` + `CHECK` over native `ENUM`, `ON
  DELETE RESTRICT` by default with `CASCADE` only where named, the append-only "mark, don't
  mutate" shape already established for `Stake`.

**Non-Goals:**
- No application code — no event-emission call sites, no fan-out logic, no reputation-timeline
  query, no admin-audit UI. This change makes the *shape* real, nothing reads or writes it yet.
- No `NotificationSubscription` table — designed the same session as `Event`, but explicitly a
  separate capability (`docs/core-schema-full-design-2026-07-27.md`'s "Product, notification,
  and suite-linkage" section), out of scope here.
- No expansion of `Event.subject_type` beyond what the relationship graph explicitly names — see
  the Decisions section below.

## Decisions

**Decision: `Event.subject_type` is `CHECK (subject_type IN ('building', 'claim', 'job'))` —
the conservative reading of the relationship graph's own "..." ellipsis, not an expansion.**
`core-schema-relationships-and-indexes-2026-07-27.md` states the poly target as
"`Building | Claim | Job | ...`" — the trailing ellipsis signals the design intends this to stay
open-ended, but names only three concrete types. Rather than guessing which other subject types
(`Property`, `Asset`, `Unit`, `Stake`) might eventually apply, this follows the same discipline
already used for `Job.subject_type` in `job-dispatch-schema` (which excluded `Unit` despite it
being a real table, since no doc ever named `Job → Unit`): only include what's explicitly named.
Widening this list later is a one-line `CHECK` change, not a migration risk.

**Decision: field lists and types**, combining the full-design doc's field table with the
`actor_user_id`/`recipient_user_id` type correction from Context above:
- `event`: `id` (uuid, PK), `event_type` (text, not null), `actor_user_id` (text, nullable, FK →
  `user.id`, `ON DELETE RESTRICT`), `actor_role` (text, nullable — denormalized cache, accepted
  drift risk per the full-design doc's own note), `subject_type` (text, not null, CHECK per
  above), `subject_id` (uuid, not null, no FK — poly), `payload` (jsonb, nullable), `urgency`
  (text, not null, `CHECK (urgency IN ('normal', 'high'))`, default `'normal'`),
  `delivery_status` (text, not null, `CHECK (delivery_status IN ('pending', 'processing',
  'delivered'))`, default `'pending'`), `delivered_at` (timestamptz, nullable), `created_at`
  (timestamptz, not null, default now).
- `event_recipient`: `id` (uuid, PK), `event_id` (uuid, not null, FK → `event.id`, `ON DELETE
  CASCADE`), `recipient_user_id` (text, not null, FK → `user.id`, `ON DELETE RESTRICT`),
  `recipient_role` (text, nullable — denormalized cache, same reasoning as `actor_role`),
  `reason` (text, nullable — free text, e.g. `"building_owner"`, `"assigned_inspector"`, soft
  by design, not a CHECK-constrained vocabulary; the old `RelevanceTag.reason` had a real fixed
  set of values in practice, but neither design doc carries that vocabulary forward as a
  constraint, so none is invented here), `read_at` (timestamptz, nullable), `created_at`
  (timestamptz, not null, default now).

**Decision: cascade behavior** — `event_recipient → event` is `ON DELETE CASCADE` (the
relationships doc's own explicit call: "pure child row"). `event.actor_user_id` and
`event_recipient.recipient_user_id` are both `ON DELETE RESTRICT` against `user`, following the
house default — no doc names cascading a `User`'s deletion into their event history, and
deleting a user's audit trail as a side effect of deleting their account would be a real,
separate PIPEDA-adjacent decision (already flagged as unresolved in
`core-schema-relationships-and-indexes-2026-07-27.md`'s "never delete vs. Canadian privacy law"
tension), not one to make silently here.

**Decision: indexes, taken from the reconciled section exactly, not the earlier interim
indexing-plan row.** `event`: `created_at DESC`, `(subject_type, subject_id)`, partial on
`delivery_status != 'delivered'` (the still-outstanding-fan-out query). `event_recipient`:
`(recipient_user_id, created_at DESC)`, `event_id`, partial on `read_at IS NULL` (the "unread
notifications" query — this is the doc's own stated single most performance-critical index
shape carried over from the old model's real, proven indexes).

## Risks / Trade-offs

- **[Risk]** `Event.subject_id` carries the same accepted polymorphic-integrity gap already
  named for `Stake`/`Asset`/`Job` — nothing in Postgres stops it pointing at a row that no
  longer exists.
  → **Mitigation:** accepted per the relationships doc's own explicit, repeated call; same
  periodic-integrity-check follow-on already flagged twice before.
- **[Risk]** `EventRecipient.reason` has no CHECK-constrained vocabulary even though the old
  system's equivalent field (`RelevanceTag.reason`) had a real, working fixed set of values in
  production.
  → **Mitigation:** deliberately not carried forward as a constraint, since neither current
  design doc states it should be one — inventing a CHECK here would be adding structure neither
  doc asked for, the opposite mistake from the `verification_status`/`overall_status` gaps in
  prior changes. If a real reason to constrain it surfaces, that's a future, visible decision.
- **[Risk]** The `actor_user_id`/`recipient_user_id` type correction (uuid → text) means this
  change's schema doesn't literally match `core-schema-full-design-2026-07-27.md`'s field table
  as written.
  → **Mitigation:** the doc itself should be corrected to match reality, not the other way
  around — same principle already applied when `scaffold-fastify-backend`'s CORS requirement was
  corrected post-hoc rather than defended. Flagging this as a follow-up doc edit, not deferring
  the schema fix.

## Open Questions

- Whether `EventRecipient.reason` should eventually get a real curated vocabulary (the old
  system's `RelevanceTag.reason` values — `underwriting_input`/`verification_needed`/
  `client_conversation_needed`/`reputation_signal`/`condition_baseline_update`/
  `dispatch_candidate`/`generic_context` — are a real, tested starting point if so) — not
  resolved here, since neither current design doc calls for it.
- The PIPEDA "right to erasure" tension already flagged in
  `core-schema-relationships-and-indexes-2026-07-27.md` applies directly to `Event`/
  `EventRecipient` (a user's full activity history) — still not designed, carried forward as-is.
