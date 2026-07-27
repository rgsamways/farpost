## 1. Reconcile with existing code before adding anything new

- [x] 1.1 Confirm `api/src/db/membership-schema.ts` and its passing test
      (`membership-schema.test.ts`, from the archived `wire-better-auth` change) are the
      baseline — do not recreate the `membership` table from scratch.
- [x] 1.2 Add a database-level `CHECK` constraint on `membership.status` (the four values already
      enforced only at the TypeScript level via Drizzle's `text(..., { enum: [...] })`) so a
      direct SQL write or a future migration bypassing the ORM can't set an invalid value. This
      is additive — no existing behavior changes, the TS-level typing stays as-is.

## 2. Extensions and shared infrastructure

- [x] 2.1 Add a custom SQL migration enabling the `postgis` and `pg_trgm` extensions
      (`CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS pg_trgm;`).
- [x] 2.2 Add a custom SQL migration creating the shared `set_updated_at()` trigger function.

## 3. RoleType schema (`membership-model` capability)

- [x] 3.1 Create `api/src/db/role-type-schema.ts` with the `role_type` table per
      `specs/membership-model/spec.md`, following `membership-schema.ts`'s existing conventions
      (file-per-table, `pgTable`, plain `text` for soft-validated fields).
- [x] 3.2 Add the partial unique index on `membership (user_id, role) WHERE status = 'active'`
      per `specs/membership-model/spec.md`'s "no duplicate active role grant" requirement.
- [x] 3.3 Register `role-type-schema.ts` in `drizzle.config.ts`'s `schema` array.

## 4. Property, Building, Unit schema (`building-record` capability)

- [x] 4.1 Create `api/src/db/property-schema.ts` with the `property` table per
      `specs/building-record/spec.md`, including the `geography` columns (SRID 4326) for
      `boundary`/`centroid` and a GIN index on `external_ids`.
- [x] 4.2 Create `api/src/db/building-schema.ts` with the `building` table, including all five
      paired type+age structural fields, the `property_id` foreign key
      (`onDelete: "restrict"`), and the partial unique index on `nfc_tag_id`. Confirm no
      `owner_name`/`owner_email`/`owner_phone` columns exist.
- [x] 4.3 Create `api/src/db/unit-schema.ts` with the `unit` table, the `building_id` foreign key
      (`onDelete: "restrict"`), and its own partial unique index on `nfc_tag_id`.
- [x] 4.4 Register all three files in `drizzle.config.ts`'s `schema` array.

## 5. Asset schema (`asset-tracking` capability)

- [x] 5.1 Create `api/src/db/asset-schema.ts` with the `asset` table per
      `specs/asset-tracking/spec.md`, including the `subject_type`/`subject_id` polymorphic
      pair (with the `CHECK` constraint on `subject_type`, no foreign key on `subject_id`) and
      the manufacturer/model/serial_number/warranty_expiry_date fields.
- [x] 5.2 Register the file in `drizzle.config.ts`'s `schema` array.

## 6. Stake schema (`stake-registry` capability)

- [x] 6.1 Create `api/src/db/stake-schema.ts` with the `stake` table per
      `specs/stake-registry/spec.md`, including the `CHECK` constraints on `subject_type`,
      `status`, and `verification_method`.
- [x] 6.2 Add the compound index on `(subject_type, subject_id, status)` and the separate
      compound index on `(user_id, status)` — explicitly do not add a plain index on `user_id`
      alone, per the design's deliberate friction against subject-less lookups.
- [x] 6.3 Register the file in `drizzle.config.ts`'s `schema` array.

## 7. Relations wiring

- [x] 7.1 Add Drizzle `relations()` definitions for `property` ↔ `building` ↔ `unit` (one-to-many
      chains) so query code can use Drizzle's relational query API instead of hand-written joins.
- [x] 7.2 Document, in a code comment on `asset-schema.ts` and `stake-schema.ts`, that
      `subject_type`/`subject_id` is intentionally NOT wired as a Drizzle relation — it's
      resolved at the application layer per subject type, matching the "not a real enforced FK"
      note already in `core-schema-relationships-and-indexes-2026-07-27.md`.

## 8. Migration and verification

- [x] 8.1 Run `drizzle-kit generate` and review the generated SQL against
      `core-schema-relationships-and-indexes-2026-07-27.md`'s indexing plan before applying.
      Found and fixed a real drizzle-kit bug: its native-type allowlist has `geometry` but not
      `geography`, so it double-quoted the `geography(...)` column types as bogus identifiers —
      hand-fixed in `0003_core_building_schema.sql`, documented in `geography-types.ts`.
- [x] 8.2 Apply the migration to the dev database. Also discovered and fixed a real infra gap:
      the dev Postgres container (`postgres:16-alpine`) had no PostGIS installed at all — swapped
      `api/docker-compose.yml` to `postgis/postgis:16-3.4` (same data volume, no data lost) before
      the extensions migration could succeed.
- [x] 8.3 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean before moving to tests.

## 9. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [x] 9.1 Add `role-type-schema.test.ts` covering: a `Membership.role` value with no matching
      `RoleType.key` row still inserts successfully (real-DB test, matching
      `membership-schema.test.ts`'s existing pattern — no mocking).
- [x] 9.2 Add `membership-schema.test.ts` coverage for the new partial unique constraint: a
      second active grant of the same role is rejected; a revoked-then-regranted role succeeds.
- [x] 9.3 Add `property-schema.test.ts`, `building-schema.test.ts`, `unit-schema.test.ts`
      covering: unique slug enforcement, the `property_id`/`building_id` foreign keys, the
      `ON DELETE RESTRICT` behavior (deleting a `Property` with a `Building` fails), the
      partial-unique `nfc_tag_id` constraint on both `building` and `unit`, and that a
      `Building` row persists correctly with paired type+age fields.
- [x] 9.4 Add `asset-schema.test.ts` covering all three `subject_type` values persisting
      correctly and an invalid `subject_type` being rejected.
- [x] 9.5 Add `stake-schema.test.ts` covering: a null-`user_id` unclaimed stake with
      `contact_snapshot`, the `pending_verification` → `active` transition, an invalid `status`/
      `verification_method` being rejected, and — the most important scenario — a `subject_type:
      'unit'` stake persisting correctly (the fourth, newly-added subject type).
