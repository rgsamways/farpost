## Why

Farpost's identity-extension and building-record schema has been fully designed this session
(`docs/core-building-model.md`, `docs/core-schema-full-design-2026-07-27.md`,
`docs/core-schema-relationships-and-indexes-2026-07-27.md`) but nothing has been implemented —
the rebuild is still at the blank-slate stage per `CLAUDE.md`. The near-term owner-facing feature
queue (`docs/farpost-feature-catalog-signup-features.md`'s "buildable now" tier: personalized
maintenance timeline, seasonal maintenance reminders, DIY-vs-pro decision helper, home systems
passport) cannot start until this schema is real. Building it now turns three closed-out design
docs into an actual, buildable foundation.

## What Changes

- Creates `Membership` and `RoleType` — the platform-wide "what can this person generically do"
  layer (a User can hold any number of roles; `RoleType` is an optional, curated taxonomy
  `Membership.role` soft-validates against, not a hard enum).
- Creates `Property`, `Building`, and `Unit` — the physical hierarchy. `Property` is the land
  parcel; `Building` is a structure on it, carrying its own structural attributes (roof/
  foundation/electrical/plumbing/heating, each with a paired type + age field); `Unit` is an
  individually-occupiable space within a `Building` (zero-to-many, for multi-unit buildings).
- Creates `Asset` — a polymorphic registry of trackable equipment/systems, attachable to a
  `Property`, `Building`, or `Unit` (not a rigid `building_id` FK — a well or septic system can
  belong to a `Property` directly, with no `Building` involved).
- Creates `Stake` — the person-to-subject relationship registry (ownership, occupancy,
  professional relationships to a specific `Property`/`Building`/`Unit`/`Asset`), including the
  ownership-verification lifecycle (`pending_verification` → `active`, admin/scout-reviewed or
  third-party-ID-verified) and the tagging/claiming model for multi-unit buildings.
- Establishes the Postgres conventions this schema (and future ones) will follow: `text` +
  `CHECK` constraints instead of native `ENUM` types for fixed-vocabulary fields; a shared
  `updated_at` trigger rather than application-set timestamps; the `postgis` extension (SRID
  4326 + GiST indexes on every `geography` column) and `pg_trgm` (for address/name search); real
  `UNIQUE` constraints on tag/slug fields, not just indexes.
- **Explicitly excludes** the Job/dispatch/marketplace cluster (`Job`, `JobNotes`,
  `JobAttachment`, `JobCostBreakdown`, `WorkRequestAttempt`, `Claim`, `ComplianceRecord`,
  `DispatchCapability`, `ProfessionalProfile`), the checklist cluster, billing, product/
  notification, `Event`/`EventRecipient`, and `EngineInstallation`/`EngineActivityLink` — all
  already designed (same three docs) but deliberately deferred to their own later change, since
  no near-term feature needs them and the marketplace/dispatch side of the rebuild hasn't started.

## Capabilities

### New Capabilities
- `membership-model`: platform-wide role/capability holding for a `User` (`Membership`),
  validated against a curated, admin-editable role taxonomy (`RoleType`).
- `building-record`: the physical hierarchy — a land parcel (`Property`), one or more structures
  on it with their own structural attributes (`Building`), and individually-occupiable spaces
  within a building (`Unit`).
- `asset-tracking`: a polymorphic registry of trackable equipment/systems attached to a
  `Property`, `Building`, or `Unit`.
- `stake-registry`: the person-to-subject relationship model — ownership, occupancy, and
  professional relationships to a specific building-cluster subject, including the
  ownership-verification lifecycle and access-control rules.

### Modified Capabilities
None — nothing in this repo has been built yet for these tables to modify.

## Impact

- **New:** Drizzle schema files and the first real migration for the Fastify backend
  (`api/`) — `membership`, `role_type`, `property`, `building`, `unit`, `asset`, `stake` tables,
  plus the shared `updated_at` trigger function.
- **New infra requirement:** the `postgis` and `pg_trgm` Postgres extensions must be enabled
  before this migration runs.
- **Not affected:** no existing application code, since this is the rebuild's first real schema
  change — `better-auth`'s own tables (already scaffolded) are read, not modified.
- **Unlocks:** the four "buildable now" features can start real implementation once this change
  is archived.
