## Why

`docs/core-building-model.md` names `FactStaleness`/`Contribution`/`ScoutVisit` as tables that
need to exist to support Farpost's central "living record, kept honest over time" claim — knowing
which facts about a building are getting stale, who contributed what, and what a field visit
actually captured. The old system had real, working equivalents of all three, embedded as
untyped lists/dicts on the `Building` document — normalizing them into real tables (as `Unit`,
`Asset`, and `Stake` already were) is the same fix already applied once this rebuild, not a new
pattern.

## What Changes

- Add `fact_staleness`: one row per `(building, category)`, tracking when a fact was last
  documented and when it should be considered stale again. `next_stale_at` is a Postgres
  `GENERATED ALWAYS AS` column, matching the old system's own explicit design intent (it was
  "a cached scheduling aid, never trusted for display" there too — this makes that guarantee
  airtight at the database level instead of application-maintained).
- Add `contribution`: one append-only row per submitted building fact, replacing the old
  system's untyped `list[dict]`. `category` is deliberately left an unconstrained free-text
  field, not a `CHECK`-constrained enum — directly grounded in the old system's own documented
  design intent ("an unrecognized category never blocks either write path", confirmed in the
  archived `building-decay-model` spec), not a fresh guess.
- Add `scout_visit`: one row per field visit to a building.
- Real gap found and filled, not invented: the old `Contribution`'s `role` field (the
  contributor's role at time of contribution) has no equivalent in the design doc's field list.
  Added `contributor_role` (text, nullable, denormalized) — the same established pattern as
  `Event.actor_role`/`EventRecipient.recipient_role`, applied here because the old system
  genuinely tracked this and the new design doc simply missed carrying it forward.
- Real constraint found and added: the old system's `fact_staleness` was a `dict` keyed by
  `category` on each `Building` — exactly one entry per category per building. Adds a real
  `UNIQUE (building_id, category)` constraint on `fact_staleness`, enforcing at the database
  level what the old dict-keyed shape enforced implicitly.
- `review_status` on `Contribution` (pending/verified/flagged/rejected) has **no historical
  precedent** — confirmed no moderation/review workflow ever existed in the old system (it had a
  different mechanism, an AI "preening" pass rewriting evaluative language, not a review
  workflow). Flagged in design.md as an invented vocabulary needing Robin's sign-off, same
  treatment as `ComplianceRecord.verification_status` and `ChecklistRun.overall_status`.
- `ScoutVisit.photo_urls`/`gps_accuracy_m` are also confirmed genuinely new — the old
  `scout_visits` list was completely unenforced with no photo or GPS field ever implemented.
  Kept as real, forward-looking fields (matching Farpost's own field-verified-data-moat business
  model) but flagged plainly as new-for-this-rebuild, not a carried-forward feature.

## Capabilities

### New Capabilities
- `fact-staleness`: per-building, per-category tracking of when a fact was last documented and
  when it should be considered stale again.
- `contribution`: an append-only record of a submitted building fact.
- `scout-visit`: a record of a field visit to a building.

### Modified Capabilities
- None. `Building` and `Membership` are referenced but not changed.

## Impact

- Three new tables: `fact_staleness`, `contribution`, `scout_visit`
  (`api/src/db/fact-staleness-schema.ts`, `api/src/db/contribution-schema.ts`,
  `api/src/db/scout-visit-schema.ts`).
- New FKs: all three `→ building.id` (`ON DELETE RESTRICT`); `contribution`/`scout_visit` also
  `→ membership.id` (`ON DELETE RESTRICT`).
- No new process/scheduler — the old system's real daily `check_fact_decay` sweep job that reads
  `fact_staleness` is not being rebuilt as part of this change; schema only, same discipline as
  every prior cluster.
