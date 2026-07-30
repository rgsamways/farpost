## Why

The `asset` table already stored most of a tracked system's generic detail (manufacturer,
model, serial number, installed date, warranty expiry, condition notes, photo URLs), but the
Systems Passport page only ever exposed a bare condition dropdown — every other field had no way
in or out through the UI. Robin wants to fill out that screen with the generic properties every
tracked system (roof, furnace, HVAC, water heater, ...) can usefully carry, not just condition.

## What Changes

- Add two new generic `Asset` fields: `location` (text — e.g. "basement", "attic") and
  `lastServicedDate` (date), extending the existing manufacturer/model/serial/installed/warranty
  set.
- The Systems Passport tracked-systems page now surfaces every generic `Asset` field as an
  editable input (manufacturer, model, serial number, location, installed date, last serviced
  date, warranty expiry, condition, condition notes, photo URLs), not just condition.
- Introduce a reusable `SegmentedDateInput` component (positional MM/DD/YYYY boxes) for every
  date field on the page, ported from Vocare's own component of the same name (itself patterned
  after Stripe's date-entry UX) — avoids locale-ambiguous free-text date entry.
- Redesign the tracked-system card as a two-column field grid instead of a single sparse column,
  to use the page's available center-column width.

## Capabilities

### New Capabilities
(none — this fills out the existing `systems-passport` and `asset-tracking` capabilities rather
than introducing a new one)

### Modified Capabilities
- `asset-tracking`: the `asset` table gains `location` (text, nullable) and
  `last_serviced_date` (date, nullable) columns.
- `systems-passport`: the update-asset endpoint accepts the two new fields; a new requirement
  covers the tracked-systems page surfacing every generic `Asset` field as an editable form
  field, using segmented month/day/year inputs for dates.

## Impact

- `api/src/db/asset-schema.ts`, `api/src/routes/assets.ts`
- `api/drizzle/0013_lazy_cobalt_man.sql` (new migration)
- `web/src/app/features/systems-passport/page.tsx`
- `web/src/components/SegmentedDateInput.tsx` (new)

## Process note

Written after implementation, not before it — this change was built directly in this session
without a proposal or a CLI handoff, which is a deviation from `docs/standard-methodology.md`
rule 6 ("a planning role and a building role are different sessions"). Logged here and in the
drift-audit entry for this change rather than silently backfilling the record. The code itself
was typechecked and browser-verified (real sign-in, edit, reload, persistence check) before this
proposal was written.
