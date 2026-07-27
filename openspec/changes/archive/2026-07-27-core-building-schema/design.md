## Context

This is the rebuild's first real schema change — nothing exists in `api/` yet beyond
better-auth's own scaffolded tables. The design itself isn't new work: it was closed out over a
dedicated `openspec-explore` session and lives in three docs this change implements directly
rather than re-deriving:

- `docs/core-building-model.md` — `Property`/`Building`/`Unit`/`Asset`/`Stake`: full field lists,
  the four-tier hierarchy, two hard `Stake` rules, the ownership-representation fix, the
  tagging/claiming/renter resolution, the verification ladder, worked examples.
- `docs/core-schema-full-design-2026-07-27.md` — final `Membership`/`RoleType` field lists (the
  "Identity extension" section; every other section of that doc is out of scope here).
- `docs/core-schema-relationships-and-indexes-2026-07-27.md` — the FK graph, cascade rules, and
  indexing plan for every table in scope.

`Membership`'s shape itself originates one level up, in `docs/core-user-model.md`
(robinsamways.ca repo) — a shared cross-project identity pattern, not a Farpost-specific
invention. This change implements Farpost's own concrete Postgres/Drizzle version of it
alongside the Farpost-specific building cluster.

Stack: Fastify + Drizzle ORM + Postgres + better-auth (`CLAUDE.md`). No staging environment
exists (`project_farpost_deployment_model` — dev or live, no middle tier), so this migration
targets dev first, live once verified.

## Goals / Non-Goals

**Goals:**
- Implement `Membership`, `RoleType`, `Property`, `Building`, `Unit`, `Asset`, and `Stake` as
  real Drizzle schema + a runnable Postgres migration.
- Encode the two `Stake` hard rules and the cascade/delete discipline as real database
  constraints (`CHECK`, `FOREIGN KEY ... ON DELETE RESTRICT`), not just documented conventions —
  the whole point of writing them into a migration instead of leaving them as prose.
- Establish the Postgres conventions (`text`+`CHECK` over native `ENUM`, `updated_at` trigger,
  `postgis`+`pg_trgm` extensions, real `UNIQUE` constraints) that every later schema change in
  this repo should also follow, not just this one.

**Non-Goals:**
- The Job/dispatch/marketplace cluster, checklist cluster, billing, product/notification,
  `Event`/`EventRecipient`, `EngineInstallation`/`EngineActivityLink` — all designed, all
  explicitly deferred (see proposal.md's "What Changes"). No table, migration, or Drizzle
  relation for any of them is created by this change.
- Row-level security policies — flagged as a real, worthwhile defense-in-depth option in
  `core-schema-relationships-and-indexes-2026-07-27.md`, but not designed to policy-level detail
  yet. Deferred to a follow-up, not blocking this change.
- Seed/ingestion data (NAR, NRCan, or any bulk address/parcel source) — this change creates
  empty tables with the right shape; populating them is a separate, later change.

## Decisions

**1. `role`/`kind`/`status`-style fields are Postgres `text` + `CHECK` constraints, not native
`ENUM` types.** Already decided in the relationships doc; restated here because it's the single
most repeated pattern in this migration (`Membership.status`, `Stake.role`/`kind`/`status`,
`Building.status`, `Asset.subject_type`, etc. — over a dozen fields). Native `ENUM`'s `ALTER TYPE
... ADD VALUE` can't run inside a transaction in older Postgres and is generally painful to
evolve; a `CHECK (status IN (...))` constraint gets the same validation with a one-line change to
add a value later. Alternative considered: native `ENUM` for genuinely fixed vocabularies (e.g.
`Building.status`) and `text`+`CHECK` only for soft-validated ones (`Membership.role`) — rejected
for consistency; mixing two enum strategies in one schema is its own source of confusion, and
`CHECK` costs nothing extra.
**Reconciled against real existing code, found while writing tasks.md:** `membership` already
exists (from the archived `wire-better-auth` change), and its `status` column already uses
Drizzle's `text(..., { enum: [...] })` — TypeScript-level type narrowing only, no database-level
constraint at all, a third option this decision hadn't considered because the table predates this
design session. Resolution: keep that TS-level typing as-is (it's real, tested, working code, not
worth churning), and *add* a `CHECK` constraint alongside it as a small, additive migration —
combining both rather than picking one over the other. Every new table in this change uses the
same combination (Drizzle's `enum` option for the TypeScript type, a `CHECK` constraint for the
database guarantee) from the start.

**2. `Stake`'s two hard rules become real constraints, not just documentation.** (a)
`subject_type`/`subject_id` is the target, `user_id` is the person — enforced by never giving
`subject_id` a foreign key to `users` under any `subject_type` value; there is no code path where
that's even representable. (b) Every access check must filter on subject AND user together —
this can't be a schema-level constraint (it's an application-code discipline), but the design
makes the correct query the *only* convenient one: the compound index is `(subject_type,
subject_id, status)` and `(user_id, status)`, not `(user_id)` alone, so a lookup that only
filters by user and forgets the subject doesn't get a clean index hit either — a small, deliberate
friction in the right direction. Alternative considered: a Postgres RLS policy enforcing this at
the database level — genuinely the stronger fix (see Risks below) but deferred, not designed to
policy-detail yet.

**3. `Asset` is polymorphic (`subject_type`/`subject_id`) from day one, not a `building_id` FK
with a later migration to add `Property`/`Unit` support.** Cheaper to build it right the first
time than to migrate a live `NOT NULL building_id` column later once real data exists. No
alternative seriously considered — this was already settled in `core-building-model.md` after
finding real property-level assets (wells, septic systems) that have no building at all.

**4. `Building.nfc_tag_id` and `Unit.nfc_tag_id` get partial `UNIQUE` constraints (`WHERE
nfc_tag_id IS NOT NULL`), not just an index.** Two buildings claiming the same physical tag is a
real, weird, hard-to-debug production bug if it's only caught in application code — worth a
database-level guarantee. Same reasoning applies to `Property.slug`, `Building.slug`.

**5. `FactStaleness` is out of scope for this change** (it's in the "building provenance"
cluster of `core-schema-full-design-2026-07-27.md`, not the building-record cluster this change
covers) — flagged here only to be explicit that `Building`'s own structural age fields
(`roof_installed_year` etc.) are plain columns in this change, with no generated-staleness
computation attached yet. That's `FactStaleness`'s job, in its own later change.

**6. `updated_at` via a single shared trigger function, applied to every table in this change
that has the column.** One `set_updated_at()` function, one `BEFORE UPDATE` trigger per table —
catches direct SQL/migration writes that bypass Drizzle, not just ORM-issued updates.

## Risks / Trade-offs

- **[Risk] Polymorphic `subject_type`/`subject_id` on `Asset` and `Stake` isn't a real, enforced
  foreign key** — a row can end up pointing at a `subject_id` whose target row doesn't exist
  (bad data, a bug, a future delete that shouldn't have happened). Mitigation: accepted
  deliberately, consistent with how this pattern is already used elsewhere in the broader
  design (`Job`, `FulfillmentFee`); worth a periodic integrity-check script once real data volume
  exists, not designed in this change.
- **[Risk] Application-layer bugs can still violate the "filter on subject AND user together"
  rule**, since it's not a database constraint — this is exactly the class of bug that caused a
  real security hole in the prior system (`_assert_verified_owner` checked for *any*
  verified-owner stake, not one on the specific building being accessed). Mitigation: the index
  design in Decision 2 makes the correct query path the natural one; a follow-up RLS-policy
  change would close this gap at the database level and should be prioritized once `Stake`-gated
  routes actually exist to protect.
- **[Trade-off] `text`+`CHECK` instead of native `ENUM` means Drizzle's own generated
  TypeScript types won't be as tightly literal-typed as a native enum column would give for
  free** — a minor developer-ergonomics cost for the migration flexibility gained. Mitigation:
  define the allowed-values lists once as TypeScript `as const` arrays alongside the schema and
  derive both the `CHECK` constraint and the application-level type from the same source, so they
  can't drift apart.
- **[Risk] No staging environment** (per `project_farpost_deployment_model`) means this migration
  runs against dev, gets verified, then runs against live directly — no dry-run environment
  between the two. Mitigation: acceptable per that memory's own reasoning (no real users exist
  yet, so live-environment risk is low), but worth remembering this changes once real user data
  exists in a later change.

## Migration Plan

1. Enable Postgres extensions: `postgis`, `pg_trgm`.
2. Create the shared `set_updated_at()` trigger function.
3. Create tables in dependency order: `role_type` → `membership` → `property` → `building` →
   `unit` → `asset` → `stake` (each after its FK targets exist).
4. Apply indexes per `core-schema-relationships-and-indexes-2026-07-27.md`'s table (compound and
   partial indexes, GiST on geography columns, GIN on `Property.external_ids`).
5. No data migration — every table starts empty. No rollback complexity beyond a standard
   down-migration dropping the tables in reverse dependency order.

## Open Questions

None blocking this change — see proposal.md's excluded scope and `core-building-model.md`'s own
"Still open" section (Property's field-level detail beyond what's already specified, the
occupancy `kind` value's exact name, property-vs-building ownership inheritance, Wave-0 bulk-seed
data source, ID-verification vendor pick) for what's still genuinely undecided but doesn't block
implementing this schema shape.
