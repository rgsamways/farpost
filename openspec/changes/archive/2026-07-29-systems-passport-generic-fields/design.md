## Context

The `asset` table (`api/src/db/asset-schema.ts`) already had manufacturer, model, serial number,
installed date, warranty expiry, condition status/notes, and photo URLs — all of it accepted by
`POST`/`PATCH /api/assets` — but `web/src/app/features/systems-passport/page.tsx` only ever
rendered a label and a condition dropdown. The gap was purely UI: the data model already
supported this, nothing in the backend needed rethinking.

## Goals / Non-Goals

**Goals:**
- Surface every generic `Asset` field on the tracked-systems card as an editable input.
- Add the two generic fields real systems tracking is missing without one: `location` (which
  unit of a multi-instance system this is, e.g. "basement" vs "attic") and `lastServicedDate`
  (distinct from `installedDate` — a furnace gets serviced annually, it isn't reinstalled).
- Give every date field a consistent, unambiguous entry pattern.

**Non-Goals:**
- File/image upload for `photoUrls` — kept as a plain comma-separated URL field for now; a real
  upload widget is a separate change.
- Surfacing the `compliance` jsonb column — it has no defined shape yet, so there's nothing
  concrete to build a form around. Deferred until a real use case defines its structure.
- Making `assetType` editable inline — reclassifying an asset's type has implications elsewhere
  (e.g. future dispatch-capability matching) out of scope for a field-surfacing change.

## Decisions

- **Segmented MM/DD/YYYY date input over a native `<input type="date">` or free-text field.**
  Matches Robin's explicit direction to reuse Vocare's `SegmentedDateInput` pattern (itself
  patterned after Stripe's date entry). Rationale carried over from Vocare: positional boxes
  sidestep MM/DD vs DD/MM locale ambiguity, and the auto-advance-on-complete-segment interaction
  is already proven there. Ported into Farpost's own Tailwind conventions rather than copying
  Vocare's plain CSS classes, since Farpost has no shared component package with Vocare.
- **Commit-on-complete-or-explicit-clear, not commit-on-every-keystroke.** Vocare's original
  fires `onChange("")` on every incomplete intermediate state (fine there, since it only updates
  local form state ahead of a submit). Here `onChange` triggers a real `PATCH` request, so firing
  it on a mid-edit incomplete date would transiently null out a saved value before the new one is
  complete. Changed to: commit only on a fully valid date, or on all three segments being empty
  (an explicit clear).
- **Save-on-blur for free text, save-on-complete for dates/selects.** Consistent with the
  existing condition-dropdown behavior already shipped in `systems-passport`; avoids a PATCH per
  keystroke for manufacturer/model/serial/location/notes/photos.
- **Two-column field grid per card, uncontrolled text inputs.** `max-w-3xl` center column has
  room for two fields per row without crowding. Text inputs use `defaultValue` (uncontrolled)
  rather than binding to React state on every keystroke, since nothing else on the page needs to
  react to an in-progress edit — the `asset` state array is only overwritten with the server's
  own response after a save.

## Risks / Trade-offs

- [Comma-separated `photoUrls` text field is a weak substitute for real photo capture, and
  someone could paste a non-URL string] → Acceptable for now per the photo-upload Non-Goal above;
  no validation added since there's no upload flow yet to validate against.
- [This change was implemented before this proposal was written — see the Process Note in
  `proposal.md`] → No code risk from this specifically (everything was typechecked and
  browser-verified live before being documented), but it's a process deviation worth naming
  rather than obscuring.

## Migration Plan

`api/drizzle/0013_lazy_cobalt_man.sql` adds two nullable columns to `asset` — purely additive,
no backfill needed, no rollback complexity. Applied to local dev via `drizzle-kit migrate`;
production applies it automatically on next deploy via the existing
`drizzle-kit migrate && npm run start` Railway start command.
