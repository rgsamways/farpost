## Context

`docs/core-schema-full-design-2026-07-27.md`'s "Product, notification, and suite-linkage"
section sketches `NotificationSubscription` as: `id`, `membership_id` (FK), `event_type`,
`anchor_type`, `anchor_value`, `channels` (text[]), `active`, `created_at`, plus an added
`frequency_preference` (text: immediate/daily_digest/weekly_digest/never). The relationships doc
names its index as "likely the single most performance-critical index in the whole schema" —
the fan-out engine's core "which subscriptions match this new event" query.

Per [[feedback_check_archive_when_schema_docs_disagree]] / [[feedback_research_real_world_definition_before_schema]],
the old archived system (`c:\dev\archives\farpost`) was checked before finalizing field types,
since `anchor_type`/`anchor_value`'s real vocabulary wasn't pinned down in either design doc.
Findings from `app/models/subscription.py`, `app/services/fanout.py`, and
`app/routers/professionals.py`:

- The old `Subscription` model's fields are a near-exact match to the new design doc, right down
  to the same compound index shape: `professional_id`, `professional_role`, `event_type`,
  `anchor_type`, `anchor_value`, `channels: list[str] = ["hub"]`, `active`, `created_at`.
- `anchor_type` had exactly three real values in production use: `"building"` (inspectors/
  agents/brokers scoped to one building via `building_slug`), `"postal_code"` (contractors,
  matched by a 3-character prefix), and `"all"`/`"*"` (adjusters seeded globally for every
  claim). This is a real, confirmed vocabulary — not invented for this rebuild.
- `anchor_value` used a magic string (`"*"`) to mean "no specific anchor, applies to everything"
  when `anchor_type = "all"`.
- **`channels` was real schema but functionally dead.** It always defaulted to `["hub"]` and was
  never set to anything else or read/branched on anywhere in the old codebase. Actual email/SMS
  sending (`app/services/notifications.py`, Twilio + Resend) was hardcoded per workflow step
  (e.g. `notify_adjuster_claim_received`) and completely decoupled from `Subscription.channels`.
  So "multi-channel delivery driven by subscription preference" never actually existed — it was
  aspirational scaffolding.
- A separate `ProfessionalNotification` model (`app/models/professional_notification.py`) held
  the *delivered* notification record: `professional_id`, `event_id`, `event_type`,
  `building_slug`, `claim_id`, `copy`, `read`, `created_at`, with a 90-day TTL index. This is
  functionally what the already-built `EventRecipient` table now covers (per-recipient
  read-state, minus the TTL). Confirms no third table is needed here.
- `RoleType.default_subscriptions` existed as genuinely dead code — a field with a comment in
  `professionals.py` explicitly flagging "zero read sites anywhere in the codebase." Not carried
  forward; `role_type` (already built) gets no equivalent field.
- No historical precedent exists for `frequency_preference` — it's a new-for-this-rebuild
  addition, grounded instead in real notification-preference-center conventions generally (per
  the design doc's own note), not in old Farpost code.

## Goals / Non-Goals

**Goals:**
- Give `Membership`s a real, queryable way to express "notify me when event type X happens
  about building/area Y" — the standing rule a future fan-out process matches against.
- Ground `anchor_type`'s vocabulary and `anchor_value`'s nullability in real historical evidence,
  not a fresh guess.

**Non-Goals:**
- No fan-out/matching engine, no actual notification delivery (email/SMS/push) — this change is
  the data model only, exactly like `event-log-schema` shipped `Event`/`EventRecipient` without
  building the process that populates `EventRecipient` rows.
- No `channels`-driven multi-channel dispatch logic — the field is carried forward as an honest
  preference-capture column, not a working feature; the old system never actually built this
  either, so nothing is being removed or regressed.
- No change to `Event`, `EventRecipient`, `Membership`, or `RoleType`.

## Decisions

1. **`anchor_type` gets a real `CHECK` constraint: `building` / `postal_code` / `all`.** Directly
   sourced from the old system's actual production usage, not the new design doc's silence on
   the exact vocabulary. This is the same "text + CHECK, not native enum" pattern used
   everywhere else in this schema.

2. **`anchor_value` is nullable, used only when `anchor_type` is `building` or `postal_code`;
   null when `anchor_type = 'all'`.** Deliberate improvement over the old system's `"*"` magic
   string for the same case — avoids a string comparison standing in for a real null check,
   consistent with this schema's own established preference for explicit nulls over sentinel
   values (see `Event.actor_user_id`'s null-means-system-generated pattern).

3. **`membership_id` FK, `ON DELETE RESTRICT`.** Matches this schema's universal default;
   subscriptions aren't a pure child extension of `Membership` the way `JobNotes` is of `Job`,
   so no cascade.

4. **No FK from `notification_subscription` to `event`.** A subscription is a standing rule
   matched against *future* events by value, not a link to a specific event row — matching the
   relationships doc's own framing of this as a runtime query ("which subscriptions match this
   new event"), not a stored relationship. Confirmed this is the right shape, not a missed FK.

5. **`channels` (text[]) and `frequency_preference` (text, `CHECK`-constrained) both carried
   forward from the design doc as-is**, with the dead-in-practice history noted above recorded
   here rather than silently repeated. Kept because the new rebuild's event-log foundation is
   real (unlike the old system's decoupled hardcoded notifications), so the preference actually
   has something real to eventually drive — just not yet, and not as part of this change.
   `channels` defaults to `'{}'::text[]` (empty), not the old system's default `["hub"]` — since
   no real channel/delivery concept exists yet in this rebuild, defaulting to a specific named
   channel would imply functionality that isn't there; `frequency_preference` defaults to
   `'immediate'`, matching the old system's implicit always-on behavior (no digest/never options
   ever existed there).

6. **No `default_subscriptions` field added to `role_type`.** The old system's equivalent field
   was confirmed genuinely dead code (zero read sites). Not repeating unused scaffolding.

7. **No separate "delivered notification" table.** `EventRecipient` (already built) is confirmed
   sufficient to replace the old system's `ProfessionalNotification` — this change adds only the
   subscription/rule side.

## Risks / Trade-offs

- **`channels`/`frequency_preference` are speculative until a real fan-out process exists** →
  Mitigation: explicitly documented as preference-capture only, not a working feature, in both
  this design doc and the proposal — avoids the old system's mistake of let a field imply
  functionality that was never actually wired up, by naming the gap plainly instead.
- **Prefix-style event-type matching (the old system's `"CLAIM.*"` wildcard convention) is not
  designed here** → the new `Event.event_type` values seen so far (`"CLAIM.SUBMITTED"`,
  `"INSPECTION.COMPLETED"`) suggest the same category-prefix pattern will eventually be wanted,
  but solving that query-matching problem belongs to the future fan-out engine's own design, not
  this schema-only change. Flagged as an open question below rather than guessed at.

## Migration Plan

Standard additive migration — one new table, one new FK, no existing table altered. No rollback
complexity beyond dropping the new table.

## Open Questions

- Whether `event_type` matching at fan-out time will need prefix/wildcard semantics (like the
  old system's `"CLAIM.*"`) or exact-match only — left for whoever designs the fan-out process,
  not decided here.
- Whether `channels`' allowed values should eventually get their own `CHECK` constraint once a
  real delivery engine exists and the real channel set is known — deliberately left an
  unconstrained `text[]` for now, matching its current "not really used yet" status.
