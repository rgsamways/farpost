## 1. FactStaleness, Contribution, ScoutVisit

- [ ] 1.1 Create `api/src/db/fact-staleness-schema.ts` with the `fact_staleness` table per
      `specs/fact-staleness/spec.md`, including the `UNIQUE (building_id, category)` constraint,
      the `source_method`/`source_confidence_level` `CHECK` constraints, and `next_stale_at` as a
      `GENERATED ALWAYS AS ((last_documented_at + (half_life_months || ' months')::interval)::date)
      STORED` column. **`category` gets no `CHECK` constraint** — deliberate, grounded in the old
      system's own documented intent (design.md Decision 1); do not add one.
- [ ] 1.2 Create `api/src/db/contribution-schema.ts` with the `contribution` table per
      `specs/contribution/spec.md`, including `contributor_role` (the real gap found against the
      old system, design.md Decision 5), the `confidence_level`/`review_status`/`source_method`
      `CHECK` constraints. Same no-`CHECK`-on-`category` rule as `fact_staleness`.
- [ ] 1.3 Create `api/src/db/scout-visit-schema.ts` with the `scout_visit` table per
      `specs/scout-visit/spec.md`, including `photo_urls` defaulting to an empty array.
- [ ] 1.4 Register all three files in `api/drizzle.config.ts`'s `schema` array and in
      `api/src/db/client.ts`'s `schema` export.

## 2. Relations wiring

- [ ] 2.1 Add `factStalenesses: many(factStaleness)`, `contributions: many(contribution)`, and
      `scoutVisits: many(scoutVisit)` to the existing `buildingRelations` in
      `api/src/db/relations.ts` (create `buildingRelations` if it doesn't already exist).
- [ ] 2.2 Add `contributions: many(contribution)` and `scoutVisits: many(scoutVisit)` to the
      existing `membershipRelations`.
- [ ] 2.3 Add the corresponding `one(building)`/`one(membership)` relation definitions for all
      three new tables.

## 3. Migration and verification

- [ ] 3.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field list
      before applying — specifically confirm the `next_stale_at` generated-column expression is
      valid Postgres and produces the expected date arithmetic, and that `UNIQUE (building_id,
      category)` on `fact_staleness` generated correctly.
- [ ] 3.2 Add the indexes named in the relationships doc: `fact_staleness` (`building_id`;
      partial on `next_stale_at` — model the predicate on the old system's real sweep query,
      `WHERE notified_at IS NULL`, not just "for the staleness sweep" in the abstract),
      `contribution` (`building_id`, `membership_id`), `scout_visit` (`building_id`,
      `membership_id`).
- [ ] 3.3 Apply the migration to the dev database. Verify directly with a live query against
      `information_schema.columns`/`pg_constraint`/`pg_indexes` (not just Drizzle's TypeScript
      layer) — all columns (including the generated `next_stale_at`), FKs, CHECK constraints,
      the `UNIQUE` constraint, and indexes match design.md. Specifically confirm the generated
      column computes correctly with a real insert (e.g. `last_documented_at = '2026-01-01'`,
      `half_life_months = 12` → `next_stale_at = '2027-01-01'`).
- [ ] 3.4 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 4. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [ ] 4.1 Add `fact-staleness-schema.test.ts` (real-DB, no mocking) covering: a row persists with
      a correctly computed `next_stale_at`, a second row for the same `(building_id, category)`
      is rejected, an invalid `source_method` is rejected, an out-of-range
      `source_confidence_level` is rejected, a row referencing a nonexistent `building_id` is
      rejected.
- [ ] 4.2 Add `contribution-schema.test.ts` covering: a row persists with `contributor_role`
      null, `review_status` defaults to `pending`, an invalid `review_status` is rejected, an
      out-of-range `confidence_level` is rejected, two contributions for the same building and
      category persist independently, a row referencing a nonexistent `building_id`/
      `membership_id` is rejected.
- [ ] 4.3 Add `scout-visit-schema.test.ts` covering: a row persists with an empty `photo_urls`
      array by default, a row persists with multiple `photo_urls` values in order,
      `gps_accuracy_m` is nullable, a row referencing a nonexistent `building_id`/`membership_id`
      is rejected.

## 5. Verification

- [ ] 5.1 Confirm, against the real dev database, a connected scenario: insert a `building`, a
      `membership`, a `fact_staleness` row for category `'roof'`, a `contribution` row for the
      same building and category, and a `scout_visit` row for the same building — all in one
      connected scenario, confirming the real `(building_id, category)` uniqueness on
      `fact_staleness` while `contribution` allows multiple rows for the same pair.
