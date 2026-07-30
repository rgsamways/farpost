## 1. Schema + API

- [x] 1.1 Add `location` (text) and `lastServicedDate` (date) columns to `asset-schema.ts`
- [x] 1.2 Accept both fields in `POST`/`PATCH /api/assets` body schemas and interfaces
- [x] 1.3 Generate migration (`0013_lazy_cobalt_man.sql`) and apply to local dev
- [x] 1.4 Confirm production picks up the migration automatically via the existing
      `drizzle-kit migrate && npm run start` Railway start command (no manual prod step needed)

## 2. Segmented date input component

- [x] 2.1 Port Vocare's `SegmentedDateInput` (positional MM/DD/YYYY boxes) into Farpost's own
      Tailwind conventions
- [x] 2.2 Change commit behavior from "fire on every incomplete keystroke" to "fire only on a
      complete valid date or an explicit full clear" — the Farpost version drives a real `PATCH`
      per change, unlike Vocare's local-only form state

## 3. Systems Passport page

- [x] 3.1 Surface every generic `Asset` field per tracked-system card: label, manufacturer,
      model, serial number, location, installed date, last serviced date, warranty expiry,
      condition, condition notes, photo URLs
- [x] 3.2 Redesign the card as a two-column field grid
- [x] 3.3 Save-on-blur for free text fields, save-on-complete for date/select fields

## 4. Verification

- [x] 4.1 Typecheck both `api` and `web` (pre-existing unrelated failures in `Header.test.tsx`
      confirmed via `git diff` to predate this change)
- [x] 4.2 Real signed-in browser session (per the `run` skill's magic-link-token technique):
      edited manufacturer/location/last-serviced-date on a live asset, reloaded the page, and
      confirmed all three persisted through the real `PATCH` → reload round trip

## 5. Retroactive documentation (process note)

- [x] 5.1 Write this proposal/design/specs/tasks set after the fact, since the change was built
      directly in a Chat session without a prior proposal or CLI handoff — a deviation from
      `docs/standard-methodology.md` rule 6
- [x] 5.2 Log the deviation in `docs/drift-audit-log.md` and `docs/farpost-story.md`
- [x] 5.3 Sync specs to `openspec/specs/` and archive this change
