# Core schema — relationships, indexes, and other Postgres concepts

**What this file is:** the connective-tissue pass over the full ~30-table schema (the original
28-table draft plus `Unit`, plus two new tables — `Event` and `ChecklistTemplate` — identified
during the per-table field research). Where `docs/core-object-field-research-2026-07-27.md`
answers "what fields does each table need," this answers "how do they connect, what gets
indexed, and what other Postgres-level decisions need making." Written directly (not via
research agents) because relationships and indexes are inherently cross-table — they need the
whole graph held at once, not independent per-table research.

**Status:** draft, pending final reconciliation once the `Event`/`ChecklistTemplate` research
returns (their exact fields may adjust the relationship lines involving them). Everything else
below is final.

---

## Relationship graph

Grouped by cluster. `→` means "has a foreign key to." `(poly)` marks the recurring
`subject_type`+`subject_id` pattern, which is **not a real, enforced database foreign key** —
Postgres can't constrain "this uuid points at whichever table `subject_type` names." That's a
deliberate, repeated tradeoff in this schema (five tables now use it: `Stake`, `Job`,
`FulfillmentFee`, `Asset`, and the new `Event`), not an oversight — see "Polymorphic integrity"
below for how to live with it.

**Identity core**
- `Membership → User` (many-to-one)
- `ProfessionalProfile → Membership` (one-to-one, PK is `membership_id`)
- `DispatchCapability → Membership` (one-to-one, PK is `membership_id`)
- `ComplianceRecord → Membership` (many-to-one)
- `RoleType` — standalone; `Membership.role` and `Job.target_role` validate against it at the
  application layer, not via a real FK (it's a curated taxonomy over a plain-text column, on
  purpose — see `core-user-model.md`'s role-taxonomy decision)

**Building cluster**
- `Building → Property` (many-to-one)
- `Unit → Building` (many-to-one)
- `Asset (poly) → Property | Building | Unit`
- `Stake → User` (many-to-one, nullable — an `unclaimed` stake has no user yet)
- `Stake (poly) → Property | Building | Unit | Asset`

**Building provenance**
- `ScoutVisit → Building`, `ScoutVisit → Membership`
- `Contribution → Building`, `Contribution → Membership`
- `FactStaleness → Building`

**Job cluster**
- `Job → User` (twice: `requester_user_id`, `assignee_user_id` nullable)
- `Job (poly) → Claim | Building | Property | Asset`
- `JobNotes → Job` (one-to-one)
- `JobAttachment → Job` (many-to-one)
- `JobCostBreakdown → Job` (one-to-one)
- `WorkRequestAttempt → Job`, `WorkRequestAttempt → User` (candidate)
- `Claim → Building` (many-to-one, nullable — a claim's property is its own intake-time
  snapshot; only linked once the address resolves to a tracked `Building`)

**Checklist cluster**
- `ChecklistTemplate` — standalone (new; exact shape pending research)
- `ChecklistRun → Building`, `ChecklistRun → Membership`, `ChecklistRun → ChecklistTemplate`
  (new FK — replaces the old, ambiguous `sequence_id`)
- `ChecklistResult → ChecklistRun`, `ChecklistResult → Asset` (nullable — a result can apply to
  the building as a whole)

**Billing / marketplace**
- `BillingSubscription → User`
- `FulfillmentFee (poly) → Job` (today; the polymorphism exists for future subject types),
  `FulfillmentFee → User` (payer)

**Product / notification / suite**
- `NotificationSubscription → Membership`
- `ProductFeedback → Membership`
- `ProductFeedbackInsight` — standalone; a computed aggregate over `ProductFeedback`, not a
  row-level relationship (see "Materialized views" below)
- `EngineInstallation` — standalone
- `EngineActivityLink → Membership`, `EngineActivityLink → EngineInstallation` (by `engine_key`),
  `EngineActivityLink (poly) → Job | Claim`

**New: Event** (exact shape pending research, but the connection point is settled) —
`(poly) → Building | Claim | Job | ...`, `actor` → `User` (nullable; null means "system"). This
replaces the old model's three separate nullable columns (`building_slug`/`claim_id`/
`professional_slug`) with the same polymorphic pair everything else already uses — a real
anti-pattern (multiple nullable "which thing is this about" columns) already caught and fixed
once elsewhere in this schema, not repeated here.

### Cascade / delete behavior

Farpost's established discipline — proven on `Stake` ("no deletes... stakes are never deleted,"
per its own spec) — is **mark historical, don't delete**. That should extend as a house rule to
every table carrying a lifecycle `status`, not just `Stake`: `Membership`, `Job`, `Claim`,
`ComplianceRecord`, `BillingSubscription`. Concretely:

- **`ON DELETE RESTRICT`** on every real (non-polymorphic) FK by default — a `Property` with
  `Building` rows, a `Job` with `WorkRequestAttempt` rows, etc. should refuse to be deleted, not
  silently cascade. If something needs removing, it gets a `status`/`ended_at` change, not a
  `DELETE`.
- **`ON DELETE CASCADE`** only for rows that are pure, meaningless-without-their-parent
  extensions: `JobNotes`, `JobCostBreakdown` (both already 1:1 extensions of `Job`),
  `ChecklistResult` (meaningless without its `ChecklistRun`), `JobAttachment`,
  `WorkRequestAttempt`. These follow their parent's lifecycle exactly; if a `Job` row is ever
  genuinely purged (test-data cleanup, not real production deletion), its notes/cost breakdown/
  attachments/attempts should go with it.
- **Polymorphic integrity is an accepted, deliberate gap** — a `Stake`/`Asset`/`Job`/
  `FulfillmentFee`/`Event` row can end up pointing at a `subject_id` whose row no longer exists
  (or never did, from a data-entry bug) with nothing in Postgres to catch it, since
  `subject_type`+`subject_id` isn't a real FK. This is the direct cost of using this pattern five
  times instead of five separate nullable FK columns each — worth accepting deliberately (the
  original schema draft's own callout already flags this: "not a real enforced FK, dotted lines
  here to say so"), but worth a periodic integrity-check job once real data volume exists, not
  assumed away.

---

## Indexing plan

Grounded in what Farpost's own features actually need to query, not "index every column."

| Table | Index | Why |
|---|---|---|
| `Stake` | `(subject_type, subject_id, status)`, `(user_id, status)` | Already designed, from real history — carried forward unchanged. |
| `Stake` | Partial: `(renewal_date)` WHERE `renewal_reminder_sent_at IS NULL` | The daily renewal-reminder sweep's exact query shape. |
| `Building` | `property_id`; unique partial on `nfc_tag_id` WHERE NOT NULL; GiST on `location`; `postal_prefix` | FK lookup, tag-uniqueness (see "Unique constraints" below), regional search, geospatial. |
| `Unit` | `building_id`; unique partial on `nfc_tag_id` WHERE NOT NULL | Same tag-uniqueness rule extends to units. |
| `Asset` | `(subject_type, subject_id)` | "All assets for this building/unit/property" is the core query — the systems-passport feature reads this directly. |
| `Property` | GiST on `boundary` and `centroid`; GIN on `external_ids` (jsonb) | Geospatial lookups; "find property by PIN" needs to query inside the jsonb. |
| `Membership` | `user_id`; partial unique on `(user_id, role)` WHERE `status = 'active'` | Prevents two simultaneously-active grants of the same role for one person, while still allowing a historical revoked-then-regranted pair — a real constraint, not just a lookup index. |
| `Job` | `requester_user_id`, `assignee_user_id`, `(subject_type, subject_id)`, partial on `status` for active states | Matches Job's own generic "who requested/is assigned/about what" query shape. |
| `WorkRequestAttempt` | `job_id`, `candidate_user_id`; partial on outstanding offers (`responded_at IS NULL AND timeout_at > now()`) | The dispatch-timeout sweep's exact shape. |
| `Claim` | `building_id`, `insurer_file_number`, GiST on `coordinates` | Direct lookups + geospatial. |
| `ComplianceRecord` | `membership_id`; partial on `expiry_date` for soon-to-expire credentials | Mirrors `Stake`'s own renewal-sweep pattern — same shape, different table. |
| `ChecklistRun` | `building_id`, `membership_id`, `checklist_template_id` | FK lookups. |
| `ChecklistResult` | `checklist_run_id`, `asset_id` | FK lookups. |
| `FactStaleness` | `building_id`; partial on `next_stale_at` for the staleness sweep | Direct sweep-query shape. |
| `Contribution`, `ScoutVisit` | `building_id`, `membership_id` | FK lookups. |
| `NotificationSubscription` | `membership_id`; `(event_type, anchor_type, anchor_value)` | The second one is likely the single most performance-critical index in the whole schema — "which subscriptions match this new event" is the fan-out engine's core query, run once per event. |
| `ProductFeedback` | `membership_id`, `feature_key` | Direct lookups. |
| `ProductFeedbackInsight` | Unique on `(feature_key, role, period_start, period_end)` | It's a computed aggregate per period — this constraint prevents a recompute job from ever double-inserting the same period. |
| `BillingSubscription` | Partial unique on `user_id` WHERE `status = 'active'` | One active subscription per user, enforced at the DB level. |
| `FulfillmentFee` | `(subject_type, subject_id)`, `payer_id`; partial on `collected = false` | FK lookups + "what's still owed" queries. |
| `Event` (new) | `created_at DESC`, `(subject_type, subject_id)`, partial on `processed = false`, partial on `read_by_admin = false` | Carries forward the old model's own real indexes (it already had `created_at DESC` and a processed-style pattern) — these were proven against real usage once already. |
| `EngineActivityLink` | `membership_id`, `engine_key`, `(context_type, context_id)` | FK lookups. |

---

## Other Postgres concepts worth deciding now

**Enum strategy: `text` + `CHECK` constraint, not native Postgres `ENUM` types.** This schema
already deliberately keeps `role`/`kind` as plain text (soft-validated against `RoleType` at the
app layer) specifically so new values don't require a schema migration. For fields that genuinely
*are* fixed (`Stake.status`, `Job.status`, the proposed `Asset.condition_status`), native Postgres
`ENUM` types are the wrong tool anyway — `ALTER TYPE ... ADD VALUE` can't run inside a transaction
in older Postgres and is generally painful to evolve. A `text` column with a `CHECK (status IN
(...))` constraint gets the same DB-level validation without that migration pain, and it's a
one-line change to add a value later. Recommend this uniformly, not native enums, anywhere in the
schema.

**`updated_at` via a shared trigger, not application code.** A single `set_updated_at()` trigger
function, applied `BEFORE UPDATE` on every table that has the column, catches direct SQL/migration
writes that bypass the ORM — more reliable than trusting every write path to remember to set it.

**Extensions to enable:** `postgis` (already implied by every `geography` column — `Building.
location`, `Property.boundary`/`centroid`, `Claim.coordinates` — confirm it's in the actual
migration, not just assumed) and **`pg_trgm`**, newly recommended here — a GIN trigram index is
what actually makes partial/fuzzy address and name search (`ILIKE '%main st%'`) use an index
instead of a full table scan. Worth having from the start given search is close to the platform's
whole point.

**Row-level security is worth real consideration, not just app-layer checks.** Farpost's access
model is fundamentally "does this user have an active `Stake` on this specific subject" — and the
old system had a real, live security bug where an application-layer check for exactly this got it
wrong (checked *a* verified-owner stake existed, not one on *this* building). Postgres native RLS
policies mirroring the two `Stake` hard rules (filter on subject AND user together) would catch
that same class of bug at the database level even if application code made the identical mistake
again — genuine defense-in-depth given this exact failure has already happened once for real.
Not designing the actual policies here, but flagging this as worth a real decision, not an
afterthought.

**`ProductFeedbackInsight` is a materialized view candidate, not necessarily a hand-maintained
table.** It's explicitly a periodic computed aggregate over `ProductFeedback`. A Postgres
`MATERIALIZED VIEW`, refreshed on a schedule (`REFRESH MATERIALIZED VIEW CONCURRENTLY`), is the
native tool for exactly this shape — worth using instead of a table some cron job writes rows
into, unless there's a real reason to want it as an independently-writable table (e.g. manual
`actioned_at`/`resolution_note` edits from the earlier field-research pass — if those need to be
hand-edited by a person, it has to stay a real table, not a view. Flagging the tension, not
resolving it here.).

**Generated columns for derived facts.** `FactStaleness.next_stale_at` is documented as "recomputed
on every write, never trusted stale" — that's exactly what a Postgres `GENERATED ALWAYS AS
(last_documented_at + (half_life_months || ' months')::interval) STORED` column guarantees at the
database level, instead of relying on every application write path to remember to recompute it by
hand. Recommend making it a generated column rather than a plain stored value.

**Real unique constraints, not just indexes, for business rules.** `Building.nfc_tag_id` and
`Unit.nfc_tag_id` (partial unique WHERE NOT NULL — two buildings can't claim the same physical
tag), `Property.slug`, `Building.slug`, `ProfessionalProfile.slug` all need actual `UNIQUE`
constraints, not just a plain index — this enforces the business rule at the database level,
where a bug can't silently violate it, rather than only in application code.

**A real tension worth naming now, not solving now: "never delete" vs. Canadian privacy law.**
The `Stake` discipline of "no deletes, only mark historical" is right for almost everything in
this schema, but Canada's PIPEDA gives users a real right to request deletion of their personal
data. Those two principles are in genuine tension for anything touching `User`/`Membership`/
`Stake.contact_snapshot`. Not designed here — flagging it as a real, eventual requirement (an
actual "erase this user's PII" pathway, distinct from the normal status-based lifecycle) rather
than letting it surface as a surprise later.

---

## Reconciled: Event and ChecklistTemplate

Both new tables' final field lists are in `docs/core-schema-full-design-2026-07-27.md`. Their
relationship/index implications, folded back into this doc:

- **`Event`** — `actor_user_id → User` (nullable), `(poly) subject_type/subject_id → Building |
  Claim | Job | ...`. Indexes: `created_at DESC`, `(subject_type, subject_id)`, partial on
  `delivery_status != 'delivered'`.
- **`EventRecipient`** (new, replaces the old model's jsonb `relevance` list — confirmed the
  right call per real notification-fan-out research, same "don't bury a queryable fact in jsonb"
  correction applied to `ProductFeedback.score`) — `event_id → Event` (`ON DELETE CASCADE`, pure
  child row), `recipient_user_id → User`. Indexes: `(recipient_user_id, created_at DESC)`,
  `event_id`, partial on `read_at IS NULL` (the "unread notifications" query).
- **`ChecklistTemplate`** — standalone, `curator_id → User`.
- **`ChecklistTemplateItem`** (new) — `checklist_template_id → ChecklistTemplate`
  (`ON DELETE RESTRICT` — a template with a published version's items shouldn't disappear out
  from under historical runs; templates get deprecated via `status`, not deleted).
- **`ChecklistRun`** — `checklist_template_id → ChecklistTemplate` replaces the old, ambiguous
  `sequence_id` column entirely.
- **`ChecklistResult`** — gains `checklist_template_item_id → ChecklistTemplateItem`, indexed
  alongside its existing `checklist_run_id`/`asset_id` indexes.

Everything in this doc is now final — no further reconciliation pending.
