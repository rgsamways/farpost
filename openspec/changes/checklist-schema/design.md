## Context

Every field in this change was designed in `docs/core-schema-full-design-2026-07-27.md`'s
Checklist cluster section and `docs/core-schema-relationships-and-indexes-2026-07-27.md`'s
relationship graph/indexing plan/cascade rules — this doc translates that prose into exact
Drizzle/Postgres shapes, following the same discipline as `core-building-schema` and
`job-dispatch-schema`.

Checked against the real archived old system before speccing, per the now-standing
[[feedback_check_archive_when_schema_docs_disagree]] practice — not because the two design docs
disagreed here, but to confirm the full-design doc's own characterization of what changed is
accurate rather than assumed. `c:\dev\archives\farpost\farpost-api\app\models\checklist_run.py`
confirms it: the real old `ChecklistRun` embedded a list of `ChecklistResult` sub-documents
(`{asset_id: str, passed: bool, notes: Optional[str]}`) directly inside itself — no separate
collection, no template reference of any kind, `sequence_id` was the run's only "what is this a
checklist for" signal and was genuinely just a free-text label. Every "replaced"/"new" claim in
the full-design doc holds up against the real code, not just against its own prose.

## Goals / Non-Goals

**Goals:**
- Real Drizzle/Postgres tables for `ChecklistTemplate`, `ChecklistTemplateItem`, `ChecklistRun`,
  `ChecklistResult` — every field, CHECK constraint, and index from the two design docs,
  translated exactly.
- Continue every established Postgres convention: `text` + `CHECK` over native `ENUM`, `ON
  DELETE RESTRICT` by default with `CASCADE` only where the relationships doc names it
  explicitly, the shared `set_updated_at()` trigger.

**Non-Goals:**
- No application code, no routes, no UI — schema only.
- No actual checklist content (real electrical/plumbing/roofing/structural question sets) — that
  content-authoring pass is separate from making the *shape* real, same distinction already made
  for `diy-vs-pro-decision-helper`'s parked decision-tree content.
- No wiring between `ChecklistRun` and `Job`/`Claim` — the design docs never named that
  relationship (a `ChecklistRun` connects to `Building`/`Membership` only), so none is invented
  here. A future change can add it if a real workflow needs "this checklist run happened as part
  of this job," but nothing today asks for it.

## Decisions

**Decision: field lists and types, translated from the full-design doc's tables/prose exactly.**
- `checklist_template`: `id` (uuid, PK), `name` (text, not null), `description` (text,
  nullable), `version` (integer, not null, default `1`), `status` (text, not null, `CHECK
  (status IN ('draft', 'active', 'deprecated'))`, default `'draft'`), `asset_types` (text array,
  nullable), `curator_id` (text, nullable, FK → `user.id`, `ON DELETE RESTRICT` — mirrors
  `role_type.curator_id`'s own nullable shape), `created_at`/`updated_at` (timestamptz, not
  null, default now — `updated_at` trigger-maintained, same pattern as `building`/`job`).
- `checklist_template_item`: `id` (uuid, PK), `checklist_template_id` (uuid, not null, FK →
  `checklist_template.id`, `ON DELETE RESTRICT` — the relationships doc's own explicit call: "a
  template with a published version's items shouldn't disappear out from under historical
  runs"), `sequence` (integer, not null), `category` (text, nullable), `title` (text, not
  null), `description` (text, nullable), `expected_asset_types` (text array, nullable),
  `recommended_action_on_fail` (text, nullable), `created_at` (timestamptz, not null, default
  now).
- `checklist_run`: `id` (uuid, PK), `building_id` (uuid, not null, FK → `building.id`, `ON
  DELETE RESTRICT`), `membership_id` (uuid, not null, FK → `membership.id`, `ON DELETE
  RESTRICT` — who performed it), `checklist_template_id` (uuid, not null, FK →
  `checklist_template.id`, `ON DELETE RESTRICT`), `checklist_template_version` (integer, not
  null — denormalized pin of the version actually used), `completed_at` (timestamptz, nullable
  — null while a run is still in progress), `overall_status` (text, nullable, `CHECK
  (overall_status IN ('in_progress', 'clean', 'issues_found') OR overall_status IS NULL)`),
  `created_at` (timestamptz, not null, default now).
- `checklist_result`: `id` (uuid, PK), `checklist_run_id` (uuid, not null, FK →
  `checklist_run.id`, `ON DELETE CASCADE`), `checklist_template_item_id` (uuid, not null, FK →
  `checklist_template_item.id`, `ON DELETE RESTRICT`), `asset_id` (uuid, nullable, FK →
  `asset.id`, `ON DELETE RESTRICT` — nullable since "a result can apply to the building as a
  whole"), `condition_status` (text, not null, `CHECK (condition_status IN
  ('inspected_acceptable', 'not_inspected', 'not_present', 'safety_concern', 'repair_needed',
  'defect_follow_up'))`), `recommended_action` (text, nullable), `notes` (text, nullable).

**Decision: `ChecklistRun.overall_status` gets an invented three-value vocabulary — not
specified in either design doc, decided here.** The full-design doc only says it's "a
session-level summary, distinct from each item's own result" and that it's nullable; it never
states what values it holds. Chosen: `in_progress`, `clean`, `issues_found` — deliberately
coarser than `ChecklistResult.condition_status`'s six values (a session-level rollup shouldn't
just duplicate the per-item vocabulary), and nullable stays meaningful for a run whose
`completed_at` hasn't been reached yet even before someone sets `overall_status` explicitly.
Flagged exactly like `ComplianceRecord.verification_status` was in `job-dispatch-schema` — a
real judgment call needing sign-off before it's load-bearing, not a transcription.

**Decision: `checklist_template (name, version)` gets a real `UNIQUE` constraint.** Not stated
explicitly in either design doc, but a direct application of the relationships doc's own
"real unique constraints, not just indexes, for business rules" principle — two templates
sharing the same name and version number would be a genuine data integrity failure (which one
did a given `ChecklistRun` actually pin to?), not just an unlikely coincidence to tolerate.

**Decision: `ChecklistTemplateItem.checklist_template_id` and
`ChecklistResult.checklist_template_item_id` both get a plain FK-lookup index**, following the
same modest pattern already used for `job_attachment.job_id` in `job-dispatch-schema` — not
explicitly named in the indexing plan table, but a direct, obvious "get every item for this
template" / "get every result that answered this exact question" query need.

**Decision: cascade behavior follows the relationships doc exactly** — `ChecklistResult →
ChecklistRun` is the only `ON DELETE CASCADE` in this change (the doc names it explicitly,
alongside `JobNotes`/`JobCostBreakdown`/`JobAttachment`/`WorkRequestAttempt`, as "meaningless
without its parent"). Every other FK here (`ChecklistTemplateItem → ChecklistTemplate`,
`ChecklistRun`'s three FKs, `ChecklistResult`'s other two FKs) is `RESTRICT`.

**Decision: indexes, taken from the indexing-plan table plus the two added FK-lookup indexes
above.** `checklist_run`: `building_id`, `membership_id`, `checklist_template_id`.
`checklist_result`: `checklist_run_id`, `asset_id`, plus `checklist_template_item_id` (added,
see above). `checklist_template_item`: `checklist_template_id` (added, see above).

## Risks / Trade-offs

- **[Risk]** `ChecklistRun.overall_status`'s vocabulary was invented here, not sourced from a
  design doc.
  → **Mitigation:** flagged plainly, same treatment as `ComplianceRecord.verification_status`;
  cheap to change later (`text` + `CHECK`, not a native enum).
- **[Risk]** No relationship exists between `ChecklistRun` and `Job`/`Claim`, even though the
  original motivating use case (an inspector visiting a building) is exactly the kind of thing a
  `Job` already represents.
  → **Mitigation:** deliberately not invented — neither design doc names this relationship, and
  guessing at it now risks the same kind of premature-coupling mistake `core-building-model.md`
  already corrected once (`Building.owner_*` fields duplicating `Stake`). If a real workflow
  needs it, that's a real, visible gap to design for when it's asked for, not before.
- **[Risk]** `(name, version)` uniqueness on `checklist_template` is a new constraint neither
  design doc explicitly calls for.
  → **Mitigation:** directly justified by the relationships doc's own stated principle for real
  unique constraints; low-risk since it only rejects a genuinely ambiguous state, never a valid
  one.

## Open Questions

- Whether `ChecklistRun`/`ChecklistResult` should eventually reference `Job`/`Claim` — tabled
  deliberately (see Risks above), not resolved. Revisit once a real inspection-dispatch workflow
  using the now-real `Job`/`Claim` tables is actually being built.
- Whether `ChecklistRun.overall_status`'s invented vocabulary is the right one — worth Robin's
  explicit sign-off before it's load-bearing, same as the still-open `ComplianceRecord.
  verification_status` question from `job-dispatch-schema`.
