## 1. FactStaleness, Contribution, ScoutVisit

- [x] 1.1 Create `api/src/db/fact-staleness-schema.ts` with the `fact_staleness` table per
      `specs/fact-staleness/spec.md`, including the `UNIQUE (building_id, category)` constraint,
      the `source_method`/`source_confidence_level` `CHECK` constraints, and `next_stale_at` as a
      `GENERATED ALWAYS AS ((last_documented_at + (half_life_months || ' months')::interval)::date)
      STORED` column. **`category` gets no `CHECK` constraint** — deliberate, grounded in the old
      system's own documented intent (design.md Decision 1); do not add one. Confirmed: no CHECK
      on `category`; `UNIQUE (building_id, category)` added via `unique(...)`.
- [x] 1.2 Create `api/src/db/contribution-schema.ts` with the `contribution` table per
      `specs/contribution/spec.md`, including `contributor_role` (the real gap found against the
      old system, design.md Decision 5), the `confidence_level`/`review_status`/`source_method`
      `CHECK` constraints. Same no-`CHECK`-on-`category` rule as `fact_staleness`. Confirmed: no
      CHECK on `category` here either.
- [x] 1.3 Create `api/src/db/scout-visit-schema.ts` with the `scout_visit` table per
      `specs/scout-visit/spec.md`, including `photo_urls` defaulting to an empty array.
- [x] 1.4 Register all three files in `api/drizzle.config.ts`'s `schema` array and in
      `api/src/db/client.ts`'s `schema` export.

## 2. Relations wiring

- [x] 2.1 Add `factStalenesses: many(factStaleness)`, `contributions: many(contribution)`, and
      `scoutVisits: many(scoutVisit)` to the existing `buildingRelations` in
      `api/src/db/relations.ts` (create `buildingRelations` if it doesn't already exist).
      `buildingRelations` already existed; added to it.
- [x] 2.2 Add `contributions: many(contribution)` and `scoutVisits: many(scoutVisit)` to the
      existing `membershipRelations`.
- [x] 2.3 Add the corresponding `one(building)`/`one(membership)` relation definitions for all
      three new tables.

## 3. Migration and verification

- [x] 3.1 Run `drizzle-kit generate` and review the generated SQL against design.md's field list
      before applying — specifically confirm the `next_stale_at` generated-column expression is
      valid Postgres and produces the expected date arithmetic, and that `UNIQUE (building_id,
      category)` on `fact_staleness` generated correctly. **Real Postgres limitation found, not a
      Drizzle bug:** design.md's literal expression (`(half_life_months || ' months')::interval`)
      failed to apply with "generation expression is not immutable" — the text→interval cast is
      STABLE, not IMMUTABLE (depends on `IntervalStyle`), and Postgres requires generated-column
      expressions to be fully immutable. Fixed by rewriting as
      `half_life_months * interval '1 month'` (pure numeric interval scaling, immutable),
      confirmed against a real temp table to produce the identical result before touching the
      real schema. `UNIQUE (building_id, category)` generated correctly on the first pass.
- [x] 3.2 Add the indexes named in the relationships doc: `fact_staleness` (`building_id`;
      partial on `next_stale_at` — model the predicate on the old system's real sweep query,
      `WHERE notified_at IS NULL`, not just "for the staleness sweep" in the abstract),
      `contribution` (`building_id`, `membership_id`), `scout_visit` (`building_id`,
      `membership_id`).
- [x] 3.3 Apply the migration to the dev database. Verify directly with a live query against
      `information_schema.columns`/`pg_constraint`/`pg_indexes` (not just Drizzle's TypeScript
      layer) — all columns (including the generated `next_stale_at`), FKs, CHECK constraints,
      the `UNIQUE` constraint, and indexes match design.md. Specifically confirm the generated
      column computes correctly with a real insert (e.g. `last_documented_at = '2026-01-01'`,
      `half_life_months = 12` → `next_stale_at = '2027-01-01'`). Confirmed live: real insert with
      those exact values produced `next_stale_at = '2027-01-01'`, matching the spec's own worked
      example exactly. Also confirmed `category` carries no CHECK constraint on either
      `fact_staleness` or `contribution` (absent from `pg_constraint`, as required).
- [x] 3.4 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 4. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 4.1 Add `fact-staleness-schema.test.ts` (real-DB, no mocking) covering: a row persists with
      a correctly computed `next_stale_at`, a second row for the same `(building_id, category)`
      is rejected, an invalid `source_method` is rejected, an out-of-range
      `source_confidence_level` is rejected, a row referencing a nonexistent `building_id` is
      rejected.
- [x] 4.2 Add `contribution-schema.test.ts` covering: a row persists with `contributor_role`
      null, `review_status` defaults to `pending`, an invalid `review_status` is rejected, an
      out-of-range `confidence_level` is rejected, two contributions for the same building and
      category persist independently, a row referencing a nonexistent `building_id`/
      `membership_id` is rejected.
- [x] 4.3 Add `scout-visit-schema.test.ts` covering: a row persists with an empty `photo_urls`
      array by default, a row persists with multiple `photo_urls` values in order,
      `gps_accuracy_m` is nullable, a row referencing a nonexistent `building_id`/`membership_id`
      is rejected.

## 5. Verification

- [x] 5.1 Confirm, against the real dev database, a connected scenario: insert a `building`, a
      `membership`, a `fact_staleness` row for category `'roof'`, a `contribution` row for the
      same building and category, and a `scout_visit` row for the same building — all in one
      connected scenario, confirming the real `(building_id, category)` uniqueness on
      `fact_staleness` while `contribution` allows multiple rows for the same pair. Ran directly
      via `psql` inside a transaction (rolled back, no dev-DB residue): building + membership +
      one `fact_staleness('roof')` row inserted; a second `fact_staleness` row for the exact same
      `(building_id, 'roof')` pair was attempted via a savepoint and correctly rejected with
      `duplicate key value violates unique constraint "fact_staleness_building_id_category_unique"`,
      then rolled back to the savepoint; two `contribution` rows for that same `(building,
      'roof')` pair both persisted independently; one `scout_visit` row for the same building
      persisted. Confirms the real, live behavioral difference the spec calls for — not just
      that the constraints exist, but that they enforce/permit exactly what design.md says.
