## 1. ChecklistTemplate, ChecklistTemplateItem (`checklist-template`)

- [x] 1.1 Create `api/src/db/checklist-template-schema.ts` with the `checklist_template` table
      per `specs/checklist-template/spec.md`, including the `status` `CHECK` constraint and the
      `(name, version)` `UNIQUE` constraint per design.md's added-business-rule decision.
- [x] 1.2 Create `api/src/db/checklist-template-item-schema.ts` with the
      `checklist_template_item` table, `ON DELETE RESTRICT` against `checklist_template.id`, and
      a plain index on `checklist_template_id`.
- [x] 1.3 Register both files in `api/drizzle.config.ts`'s `schema` array.

## 2. ChecklistRun, ChecklistResult (`checklist-run`)

- [x] 2.1 Create `api/src/db/checklist-run-schema.ts` with the `checklist_run` table per
      `specs/checklist-run/spec.md`, including the `overall_status` `CHECK` constraint per
      design.md's judgment call (`in_progress`/`clean`/`issues_found`), and `ON DELETE
      RESTRICT` against `building.id`/`membership.id`/`checklist_template.id`.
- [x] 2.2 Create `api/src/db/checklist-result-schema.ts` with the `checklist_result` table,
      `ON DELETE CASCADE` against `checklist_run.id`, `ON DELETE RESTRICT` against
      `checklist_template_item.id` and `asset.id`, and the `condition_status` `CHECK`
      constraint.
- [x] 2.3 Register both files in `drizzle.config.ts`'s `schema` array.

## 3. Relations wiring

- [x] 3.1 Add Drizzle `relations()` definitions in `api/src/db/relations.ts` for
      `checklist_template` ↔ `checklist_template_item` (one-to-many), `checklist_run` ↔
      `checklist_result` (one-to-many), and the plain FK relations `checklist_run` →
      `building`/`membership`/`checklist_template`, `checklist_result` →
      `checklist_template_item`/`asset`. Also added `checklistRuns: many(...)` to the existing
      `buildingRelations`/`membershipRelations` blocks and a new `assetRelations` (asset had no
      relations wired at all before this change) — all real single-target FKs, same reasoning as
      `claimRelations` from `job-dispatch-schema`.
- [x] 3.2 Confirm no relation is added between `checklist_run`/`checklist_result` and
      `job`/`claim` — deliberately out of scope per design.md's Non-Goals; do not add one
      speculatively. Confirmed: no such relation exists in `relations.ts`, and a comment there
      states why.

## 4. Migration and verification

- [x] 4.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field
      lists and index decisions before applying. No `geography` columns in this change, so the
      known drizzle-kit quoting bug from the previous two changes didn't apply here — generated
      SQL matched design.md exactly on first pass. Also added an undocumented custom migration
      (`0008_attach_checklist_template_updated_at_trigger.sql`) attaching the shared
      `set_updated_at()` trigger to `checklist_template`, same gap/pattern as `building`/`job` in
      the prior two changes (design.md says `updated_at` is trigger-maintained; no task explicitly
      named the attachment step).
- [x] 4.2 Add the indexes named in design.md: `checklist_template_item`
      (`checklist_template_id`), `checklist_run` (`building_id`, `membership_id`,
      `checklist_template_id`), `checklist_result` (`checklist_run_id`, `asset_id`,
      `checklist_template_item_id`).
- [x] 4.3 Apply the migration to the dev database. Verify directly with `psql \d` against every
      new table — all columns, FKs, CHECK constraints, and indexes match design.md.
- [x] 4.4 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 5. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 5.1 Add `checklist-template-schema.test.ts` (real-DB, no mocking) covering: `status`
      defaults to `draft`, an invalid `status` is rejected, a duplicate `(name, version)` pair
      is rejected, a template persists with `curator_id` null.
- [x] 5.2 Add `checklist-template-item-schema.test.ts` covering: multiple ordered items per
      template, deleting a template with items is rejected, an item requires an existing
      template.
- [x] 5.3 Add `checklist-run-schema.test.ts` covering: `checklist_template_version` persists
      independently of the template's current `version`, a run persists with `completed_at`
      null, an invalid `overall_status` is rejected, deleting a building with runs is rejected.
- [x] 5.4 Add `checklist-result-schema.test.ts` covering: a result with `asset_id` null
      persists, a result correctly references its `checklist_template_item_id`, an invalid
      `condition_status` is rejected, cascade deletion when the parent `checklist_run` is
      deleted.

## 6. Verification

- [x] 6.1 Confirm, against the real dev database, the full chain works end to end: insert a
      `checklist_template` with two `checklist_template_item` rows, a `checklist_run` against a
      real `building`/`membership` pinning that template's version, and two
      `checklist_result` rows (one per item, one with a real `asset_id` and one with `asset_id`
      null) — all in one connected scenario, not just isolated per-table tests. Ran directly via
      `psql` inside a transaction (rolled back, no dev-DB residue): all eleven inserts succeeded
      and every row read back correctly linked, including the pinned `checklist_template_version
      = 2` on a template whose own current `version` column is unrelated, and both result rows
      (one with a real `asset_id`, one null) correctly scoped to their own
      `checklist_template_item_id`.
