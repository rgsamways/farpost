## Why

`Event`/`EventRecipient` (built and archived today, `event-log-schema`) can now record that
something happened and who was told — but nothing yet decides *who should be told* when a new
event occurs. `NotificationSubscription` is that missing piece: a standing, queryable rule set
("notify this Membership when this kind of event happens about this building/area") that a
future fan-out process reads to decide who becomes an `EventRecipient`. Building it now, right
after `Event`/`EventRecipient`, keeps the dependency fresh and closes the loop the event-log
cluster was explicitly built to support.

## What Changes

- Add a new `notification_subscription` table: one row per standing subscription rule, scoped to
  a `Membership`, matched against future events by `(event_type, anchor_type, anchor_value)`.
- `anchor_type` is constrained to a real, historically-confirmed three-value vocabulary
  (`building`, `postal_code`, `all`) — grounded against the old system's actual production usage
  (`c:\dev\archives\farpost\app\models\subscription.py`, `app/routers/professionals.py`), not
  invented fresh.
- `anchor_value` is nullable (used when `anchor_type = 'building'` or `'postal_code'`, null when
  `anchor_type = 'all'`) — a deliberate improvement over the old system's magic-string `"*"`
  convention for the same "applies to everything" case.
- `channels` (text array) and `frequency_preference` (text, constrained vocabulary) carried
  forward from the design doc as real preference-capture fields — with an explicit, honest
  caveat recorded in design.md: no actual multi-channel delivery engine exists yet in this
  rebuild (nor did it meaningfully exist in the old system — see design.md's grounding note).
  This table stores the preference; it does not itself send anything.
- No new "delivered notification" table — confirmed against the old system that
  `EventRecipient` (already built) is the correct, sufficient replacement for what the old
  system split across `Subscription` (the rule) and `ProfessionalNotification` (the delivered
  record).

## Capabilities

### New Capabilities
- `notification-subscription`: standing per-Membership rules for which `Event`s should notify
  which people, matched by event type and a building/area/global anchor.

### Modified Capabilities
- None. `Membership` and `Event`/`EventRecipient` are referenced but not changed.

## Impact

- New table: `notification_subscription` (`api/src/db/notification-subscription-schema.ts`).
- New FK: `notification_subscription.membership_id → membership.id` (`ON DELETE RESTRICT`).
- No FK to `Event` — subscriptions are matched against events at fan-out time by
  `(event_type, anchor_type, anchor_value)`, not linked to any specific event row.
- No fan-out/delivery engine is built as part of this change — schema only, matching the
  discipline already applied to every prior cluster (`checklist-schema`, `event-log-schema`,
  etc.): the data model ships first, the process that reads it is a separate, later change.
