## Why

`docs/core-schema-full-design-2026-07-27.md` closed out the Checklist cluster the same session as
the building and Job/dispatch clusters, but it has no schema yet. It's a self-contained cluster —
it depends only on `Building`/`Asset` (built in `core-building-schema`) and `Membership` (built
the same change), not on anything still undesigned — so there's no sequencing reason to leave it
on paper any longer. It also closes a real, confirmed gap: the archived old system's
`ChecklistResult` was a bare embedded `{asset_id, passed: bool, notes}` sub-document with no
reference to any reusable question set at all — `sequence_id` on the old `ChecklistRun` was
checked directly against that real code and confirmed to be nothing more than a free-text
grouping label, never a template reference (already recorded in
[[project_full_relational_schema_2026-07-27]]). This change makes a defined, versioned, reusable
checklist a real thing for the first time.

## What Changes

- Creates `ChecklistTemplate` and `ChecklistTemplateItem` — genuinely new tables, not present in
  the original 28-table draft. A template is a named, versioned, curated set of ordered
  questions (e.g. "Electrical Safety Checklist"), each item scoped to the asset types it applies
  to.
- Creates `ChecklistRun` — a single execution of a template against a `Building`, performed by a
  `Membership`, pinned to the exact template version used (so a run stays traceable even after
  its template evolves).
- Creates `ChecklistResult` — one row per question answered during a run, replacing the old
  boolean `passed` with a richer `condition_status` vocabulary (already fixed in the full-design
  pass: `inspected_acceptable`/`not_inspected`/`not_present`/`safety_concern`/`repair_needed`/
  `defect_follow_up`), and tracing back to the exact `ChecklistTemplateItem` it answered.
- Continues every established convention: `text` + `CHECK` over native `ENUM`, `ON DELETE
  RESTRICT` by default (`ChecklistResult → ChecklistRun` is the one `CASCADE`, since a result is
  meaningless without its run), the shared `set_updated_at()` trigger on `ChecklistTemplate`.

## Capabilities

### New Capabilities
- `checklist-template`: `ChecklistTemplate` (a named, versioned, curated question set) and
  `ChecklistTemplateItem` (its ordered items, each scoped to applicable asset types).
- `checklist-run`: `ChecklistRun` (one execution of a template against a Building) and
  `ChecklistResult` (one answered item within a run, with a condition-status verdict).

### Modified Capabilities
None — nothing existing changes shape. Reads `building-record` (`Building`), `asset-tracking`
(`Asset`), and `membership-model` (`Membership`) without modifying them.

## Impact

- **New:** Drizzle schema files and a migration for `checklist_template`,
  `checklist_template_item`, `checklist_run`, `checklist_result` — four tables.
- **Reads, doesn't modify:** `building`, `asset`, `membership`, `user` (FK targets).
- **Not affected:** no application/route code yet — schema-only, same scope discipline as
  `core-building-schema` and `job-dispatch-schema`.
- **Unlocks:** a real inspection/verification pass can eventually be recorded against a `Job` or
  `Claim`-driven site visit, and the systems-passport/risk-awareness/health-score features
  (#8/#9/#10 in `docs/farpost-feature-catalog-signup-features.md`) gain a real, versioned source
  of inspection-grade data to eventually read from, instead of only owner-self-reported `Asset`
  fields.
