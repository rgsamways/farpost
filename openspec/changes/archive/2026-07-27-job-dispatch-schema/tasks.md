## 1. ProfessionalProfile, DispatchCapability, ComplianceRecord (`professional-capability`)

- [x] 1.1 Create `api/src/db/professional-profile-schema.ts` with the `professional_profile`
      table per `specs/professional-capability/spec.md`, following `membership-schema.ts`'s
      existing conventions. Confirm no `average_rating`/`review_count` columns exist.
- [x] 1.2 Create `api/src/db/dispatch-capability-schema.ts` with the `dispatch_capability` table.
- [x] 1.3 Create `api/src/db/compliance-record-schema.ts` with the `compliance_record` table,
      including the `verification_status` `CHECK` constraint per design.md's judgment call
      (`pending`/`verified`/`expired`/`rejected`).
- [x] 1.4 Register all three files in `api/drizzle.config.ts`'s `schema` array.

## 2. Job, JobNotes, JobAttachment, JobCostBreakdown (`job-record`)

- [x] 2.1 Create `api/src/db/job-schema.ts` with the `job` table per
      `specs/job-record/spec.md`, including the nine-value `status` `CHECK` (with `'cancelled'`
      added per design.md), the `priority` `CHECK`, and the `subject_type` `CHECK`.
- [x] 2.2 Create `api/src/db/job-notes-schema.ts`, `api/src/db/job-attachment-schema.ts`,
      `api/src/db/job-cost-breakdown-schema.ts` — all `ON DELETE CASCADE` against `job.id` per
      design.md's cascade decision.
- [x] 2.3 Register all four files in `drizzle.config.ts`'s `schema` array.

## 3. WorkRequestAttempt (`dispatch-attempt`)

- [x] 3.1 Create `api/src/db/work-request-attempt-schema.ts` with the `work_request_attempt`
      table per `specs/dispatch-attempt/spec.md`, `ON DELETE CASCADE` against `job.id`, the
      `response` `CHECK` constraint. Real issue found: design.md's literal partial-index
      predicate (`responded_at IS NULL AND timeout_at > now()`) is not legal Postgres — partial
      index predicates must be immutable, and `now()` is STABLE. Narrowed the index predicate to
      `responded_at IS NULL` only; the `timeout_at > now()` half becomes a runtime filter for
      whatever dispatch-timeout sweep reads this table.
- [x] 3.2 Register the file in `drizzle.config.ts`'s `schema` array.

## 4. Claim (`claim-intake`)

- [x] 4.1 Create `api/src/db/claim-schema.ts` with the `claim` table per
      `specs/claim-intake/spec.md`, including the `geography` `coordinates` column (SRID 4326,
      reusing `geography-types.ts`'s `geographyPoint`), `ON DELETE RESTRICT` against
      `building.id`. Confirm no `status` column is added, per design.md's resolved
      inconsistency.
- [x] 4.2 Register the file in `drizzle.config.ts`'s `schema` array.

## 5. Relations wiring

- [x] 5.1 Add Drizzle `relations()` definitions in `api/src/db/relations.ts` for `job` ↔
      `job_notes` / `job_attachment` / `job_cost_breakdown` / `work_request_attempt`
      (one-to-one/one-to-many chains), and `professional_profile` ↔ `membership`,
      `dispatch_capability` ↔ `membership`, `compliance_record` ↔ `membership`.
- [x] 5.2 Documented `Job.subject_type`/`subject_id` as intentionally not wired as a Drizzle
      relation (comment on job-schema.ts, matching asset/stake's established pattern) —
      **deviated from this task's literal wording for `Claim.building_id`**: that column is a
      real, single-target, nullable foreign key, not a polymorphic pair. There's no
      application-layer resolution step it needs — Drizzle relations handle optional `one()`
      relations natively (same shape as `building` ↔ `property`, which is already wired). Leaving
      it unwired would have been consistency-for-its-own-sake, not a correctness need, so
      `claimRelations` wires `claim.buildingId → building.id` for real. Explained inline in both
      `claim-schema.ts` and `relations.ts`.

## 6. Migration and verification

- [x] 6.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field
      lists and the indexing-plan section before applying — watch specifically for the same
      `geography`-column quoting bug `core-building-schema` found in `drizzle-kit`, since
      `claim.coordinates` uses the same custom type. **Bug reproduced exactly as expected** —
      `"coordinates" "geography(Point,4326)"` in the generated `0005_job_dispatch_schema.sql`,
      hand-fixed the same way (strip the outer quotes). Also added an undocumented custom
      migration (`0006_attach_job_updated_at_trigger.sql`) attaching the shared
      `set_updated_at()` trigger to `job` — design.md/spec.md both say `job.updated_at` is
      "trigger-maintained" but no task explicitly called out the attachment step; same gap
      existed for `building` in `core-building-schema` and was handled the same way there.
- [x] 6.2 Add the indexes named in design.md's Decisions section: `job` (`requester_user_id`,
      `assignee_user_id`, `(subject_type, subject_id)`, partial on active-state `status`),
      `work_request_attempt` (`job_id`, `candidate_user_id`, partial on outstanding offers),
      `claim` (`building_id`, `insurer_file_number`, GiST on `coordinates`),
      `compliance_record` (`membership_id`, partial on non-null `expiry_date`). **Real issue
      found:** design.md's literal `work_request_attempt` predicate (`responded_at IS NULL AND
      timeout_at > now()`) is not a legal Postgres partial-index predicate — predicates must be
      immutable and `now()` is STABLE. Narrowed to `responded_at IS NULL`; documented in
      `work-request-attempt-schema.ts` and task 3.1 above.
- [x] 6.3 Apply the migration to the dev database. Verified directly with `psql \d` against every
      new table — all columns, FKs, CHECK constraints, indexes, and the `job` trigger match.
- [x] 6.4 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 7. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 7.1 Add `professional-profile-schema.test.ts`, `dispatch-capability-schema.test.ts`,
      `compliance-record-schema.test.ts` (real-DB, no mocking) covering: unique `slug`
      enforcement, `membership_id` FK requirement and delete-restriction, `eligible` defaulting
      to false, an invalid `verification_status` being rejected.
- [x] 7.2 Add `job-schema.test.ts` covering: `status` defaults to `pending`, an invalid `status`
      is rejected, `status = 'cancelled'` persists alongside `cancelled_at`, an invalid
      `subject_type` is rejected, a `job` with `assignee_user_id` null persists, an invalid
      `priority` is rejected.
- [x] 7.3 Add `job-notes-schema.test.ts`, `job-attachment-schema.test.ts`,
      `job-cost-breakdown-schema.test.ts` covering: cascade deletion when the parent `job` is
      deleted, multiple attachments per job, an invalid `breakdown_type` being rejected.
- [x] 7.4 Add `work-request-attempt-schema.test.ts` covering: multiple attempts per job with
      increasing `attempt_number`, a fresh attempt has null `response`/`responded_at`, an
      invalid `response` is rejected, `decline_reason` persists alongside a `declined` response,
      cascade deletion when the parent `job` is deleted.
- [x] 7.5 Add `claim-schema.test.ts` covering: a claim persists with `building_id` null, linking
      an existing claim to a building by updating `building_id`, deleting a building with a
      linked claim is rejected, `damage_types` and `damage_description` persist independently,
      two `job` rows can reference the same `claim.id`.

## 8. Verification

- [x] 8.1 Confirm, against the real dev database, that the full FK chain works end to end:
      insert a `user`, a `membership`, a `professional_profile`/`dispatch_capability` on it, a
      `job` naming that user as assignee, a `work_request_attempt` against that job, and a
      `job_cost_breakdown` — all in one connected scenario, not just isolated per-table tests.
      Ran directly via `psql` inside a transaction (rolled back, no dev-DB residue): all seven
      inserts succeeded and every row read back correctly linked — `user` → `membership` →
      `professional_profile`/`dispatch_capability` → `job` (assignee = that user) →
      `work_request_attempt` → `job_cost_breakdown`. No FK, CHECK, or trigger surprises.
