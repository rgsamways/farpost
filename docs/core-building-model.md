# Core Building model — Property / Building / Unit / Asset / Stake

**What this file is:** Farpost's own equivalent of `docs/core-user-model.md` (which lives in
the robinsamways.ca repo) — a closed-out design doc for the core objects `core-user-model.md`
itself explicitly declined to design in depth: "doesn't design Farpost's `Stake` pattern in
depth — it's already well-built; this doc just clarifies how it relates to the new Membership
layer." That's this doc's actual job, plus the objects `Stake` points at. Unlike User/Membership
and Billing, these are Farpost-specific domain objects, not a shared cross-project library — this
doc lives here, not in robinsamways.ca, on purpose.

**Status:** designed and closed out with Robin directly, 2026-07-27, via an `openspec-explore`
session. Supersedes the `BUILDING`/`PROPERTY`/`ASSET`/`STAKE` sections of
`docs/farpost-schema-draft.html` (v19, 2026-07-25) — that file never actually re-examined those
four entities under fresh eyes (its own changelog and "open questions" section are entirely about
`Job`/`Claim`/`ProfessionalProfile`; nothing in it ever questioned Building/Property/Asset). This
doc is that missing pass. `farpost-schema-draft.html` is left in place as historical record, with
a pointer added at the top.

**Grounded in real prior work, not designed from a blank page:** the archived `farpost-legacy`
repo (`c:\dev\archives\farpost`) has a real, hard-won design history for `Stake`
(`openspec/changes/archive/2026-07-14-stake-core-migration/design.md`) and a real, unbuilt
proposal for ownership verification (`docs/lightbulbs/farpost-lb-owner-identity-verification.md`)
— both cited by name below, not paraphrased from memory.

---

## The hierarchy

```
PROPERTY  (the land/parcel — civic address, boundary, zoning, dimensions)
   │
   └── BUILDING  (1+ per property — a structure; carries what it structurally IS)
          │
          └── UNIT  (0+ per building — an individually-occupiable space)

ASSET attaches to any of the three above (polymorphic — see below), not just Building.

STAKE is the cross-cutting relationship layer: who (a User) relates to what
(a Property, Building, Unit, or Asset), and how.
```

Four real tiers, not three — this doc's main structural correction to the prior draft is
promoting `Unit` from "never designed" to a first-class table, because it's what actually
resolves the multi-unit/rental scenario (see "Units, tagging, and who gets a say" below), and
because the old `stake-core-migration` design already flagged it as a real open question it
never answered: *"whether a `Unit` tier is needed between `Building` and `Asset` for multi-unit
buildings/condos"* — this doc answers yes.

---

## Property

The land/parcel a building sits on. Every `Building` belongs to exactly one `Property`; a
`Property` can hold more than one `Building` (a house plus a detached garage or shed are two
separate `Building` rows on one `Property`).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text | |
| `external_ids` | jsonb | Bulk-ingestion source IDs (e.g. a NAR `LOC_GUID`, a municipal parcel ID) — how a `Property` row can trace back to whatever government dataset originally seeded it. |
| `civic_address` | text | The 911/civic-numbered address for the parcel itself. |
| `boundary` | geography (Polygon, SRID 4326, GiST index) | Parcel boundary, when available from a real source. |
| `centroid` | geography (Point) | Fallback when no boundary polygon exists yet. |
| `dimensions` | jsonb | Lot size, frontage, depth — deliberately loose/free-form for now, per Robin's own framing that this is "a pretty easy thing to describe" with "low weight relevance to much of everything else." Not worth over-specifying columns before a real feature needs a specific one. |
| `zoning` | text | Soft-validated later against a taxonomy the same way `Membership.role`/`Job.target_role` are, if that ever becomes worth curating. Free text for now. |
| `cultural_historical_notes` | text | Heritage designation, historical relevance — named directly by Robin as a real category to capture, not inferred. |
| `created_at` | timestamptz | |

**Not fully spec'd, on purpose:** this table's exact field list is intentionally light. Nothing
in the current feature queue (`docs/farpost-feature-catalog-signup-features.md`) reads
`Property`-specific fields yet — the near-term features are all `Building`-scoped. Real
substance to add later once a professional-facing feature actually needs it (Robin's own
flag: "some of the professional roles will get features that bring up and need to interact
with 'property' just as much as 'building'").

---

## Building

A structure on a `Property`. Carries what the building structurally **is** — the "look it up in
a dictionary" test Robin proposed: a roof isn't something a building *contains*, it's something
a building *has*, the same way `year_built` is.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → `Property` | Required — a building always sits on a property. |
| `slug` | text | |
| `nfc_tag_id` | text, nullable | See "Units, tagging, and who gets a say" below — a building-level tag is optional, not universal. |
| `address` | text | |
| `postal_code` / `postal_prefix` | text | |
| `location` | geography (Point) | |
| `building_type` | text | |
| `acquisition_channel` | text | How this row entered the system — bulk ingestion, a scout visit, an owner-initiated claim. |
| `status` | text | |
| `activated_at` | timestamptz | |
| `activation_count` | integer | |
| `neighbourhood_notes` | text | |
| `roof_type` | text | |
| `roof_installed_year` | integer, nullable | **New.** The type field existed before; the age half was missing — exactly the gap Feature #5 (personalized maintenance timeline) needs filled. |
| `foundation_type` | text | |
| `foundation_updated_year` | integer, nullable | **New.** |
| `electrical_type` | text | |
| `electrical_updated_year` | integer, nullable | **New.** |
| `plumbing_type` | text | |
| `plumbing_updated_year` | integer, nullable | **New.** |
| `heating_type` | text | |
| `heating_installed_year` | integer, nullable | **New.** |
| `year_built` | integer | The building's own original construction year — kept distinct from the five paired fields above since any of those systems can be replaced independently of when the building itself was built. |
| `owner_controls` | jsonb | Owner-set visibility/privacy toggles, ported from the prior draft unchanged. |
| `created_at` / `updated_at` | timestamptz | |

**Removed from the prior draft:** `owner_name`, `owner_email`, `owner_phone`. See "Ownership
representation" below — these duplicated a fact `Stake` already has a real, purpose-built field
for.

---

## Unit

**New table**, not present in the prior draft. An individually-occupiable space inside a
`Building` — an apartment, a condo unit, a rented suite. Zero-to-many per building; a
single-family home simply has none.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `building_id` | uuid FK → `Building` | Required. |
| `nfc_tag_id` | text, nullable | Independent of the building's own tag — see below. |
| `unit_label` | text | e.g. "Unit 3B", "Apt 2", "Suite 100". |
| `unit_type` | text, nullable | Residential/commercial/etc., for mixed-use buildings. |
| `created_at` | timestamptz | |

Normalized as a real table rather than a jsonb array on `Building`, for the same reason
`ScoutVisit`/`Contribution`/`FactStaleness` already got normalized out of Mongo's embedded
lists in the prior draft: a `Unit` needs its own identity, its own optional tag, its own
`Stake` rows (occupants), and its own `Asset` rows — a jsonb blob can't carry any of that.

---

## Asset

**Polymorphic**, correcting this session's own earlier draft (which had proposed a required
`building_id` plus an optional `unit_id`). A real asset can belong to the property itself with
no building involved at all — a well, a septic system, a fence, a driveway — so `Asset` follows
the same recurring "who/what, in what relationship, to what" pattern this schema already uses
three times (`Membership`, `Stake`, `Job`), rather than bolting on multiple nullable foreign
keys.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `subject_type` | text — `"property" \| "building" \| "unit"` | |
| `subject_id` | uuid | Polymorphic target, same convention as `Stake.subject_id` — not a real enforced FK. |
| `asset_id` | text | External/local reference code. |
| `asset_type` | text | |
| `label` | text | |
| `installed_date` | date | |
| `photos` | text[] | |
| `condition_notes` | text[] | |
| `compliance` | jsonb | |
| `created_at` | timestamptz | |

```
subject_type="property"  →  well, septic, fence, driveway, in-ground pool
subject_type="building"  →  a boiler shared across every unit
subject_type="unit"      →  this unit's own water heater, in-unit appliances
```

This is the object Robin flagged as the actual foundation for the "systems passport" feature
(#8 in the feature catalog) and, by extension, the personalized maintenance timeline (#5) — both
read `Asset` rows, not `Building`'s own type/age fields, for anything that isn't a structural
"what the building is" fact.

---

## Stake

Ported forward from the prior draft largely as-is — real archival evidence
(`stake-core-migration`'s design.md and spec) confirms it was already a well-designed pattern,
not something that needed a redesign. Two real lessons from that history are worth stating as
hard rules here, since the current draft carries the fields but not the reasoning behind them.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | text FK → User, nullable | Nullable on purpose — an `unclaimed` stake has no user yet. |
| `subject_type` | text — `"property" \| "building" \| "unit" \| "asset"` | **`"unit"` is new** — resolves `stake-core-migration`'s own long-standing open question about a Unit tier. |
| `subject_id` | uuid | |
| `role` | text | `"owner" \| "occupant"/"tenant"` (**new**) `\| "manages" \| "adjuster" \| "inspector" \| "contractor" \| "agent" \| "broker" \| ...` — soft-validated against `RoleType`, same as `Membership.role`. |
| `kind` | text | `"verified_owner" \| "ownership" \| "underwrites" \| "client_policy_holder" \| "dispatched_claim" \| "performed_inspection" \| "performed_remediation" \| "manages_listing"` — plus a new occupancy-flavored value (exact name not finalized, see open items). |
| `status` | text | `"pending" \| "active" \| "historical" \| "pending_verification" \| "unclaimed" \| "disputed"` |
| `weight` | numeric, nullable | Future co-ownership/priority — carried forward schema-only, as it was in the prior design. |
| `verification_method` | text, nullable | `"self_asserted" \| "admin_reviewed" \| "external_id_matched"` — see the verification ladder below. |
| `contact_snapshot` | jsonb, nullable | **Now actually load-bearing, not just schema-only.** Holds a pre-claim suspected owner's name/email/phone — this is the field that replaces `Building.owner_name`/`owner_email`/`owner_phone`. |
| `verified_at` | timestamptz | |
| `renewal_date` | date | |
| `renewal_reminder_sent_at` | timestamptz | |
| `established_at` | timestamptz | |
| `ended_at` | timestamptz | |

### Hard rule 1 — `subject_type`/`subject_id` is the target, `user_id` is the person, never blurred

The prior system's real `stake-core-migration` design hit a genuine self-contradiction
mid-implementation: some requirements drafted `subject_slug` to mean "the building," others
drafted it to mean "the acting person" — the same "one field, two meanings" disease this
rebuild's whole identity-model correction exists to prevent, one level down. **Rule going
forward: `subject_type`/`subject_id` always identifies what the stake is *about*. `user_id`
always identifies *who holds it*. Never let a future requirement or route repurpose one to mean
the other, even temporarily.**

### Hard rule 2 — access checks filter on both subject AND user, never one alone

The blurred-meaning bug above produced a real, live security hole: `_assert_verified_owner`
checked only "does this user have *an* active verified-owner stake anywhere," not "...on *this*
building" — so any verified owner could access *any* building's owner-only routes. **Rule going
forward: every access check against `Stake` must filter on both the subject and the user
together. A subject-only or user-only filter is a bug, not a shortcut.**

### `role` vs. `kind` — two different axes, kept separate on purpose

`role` describes what the acting party **is** (adjuster, inspector, contractor, agent, broker,
owner, occupant). `kind` describes what the **relationship** actually is (underwrites,
manages_listing, verified_owner, dispatched_claim). These were deliberately kept as two
separate fields in the prior design rather than one — worth documenting explicitly here so a
future session doesn't flatten them back into one field without knowing why they're apart.

---

## Ownership representation — the fix for `Building.owner_name/email/phone`

The prior draft carried `owner_name`/`owner_email`/`owner_phone` directly on `Building`. Real
archival evidence shows this duplicates a fact `Stake` was already purpose-built to hold:
`contact_snapshot` (jsonb) plus `status: "unclaimed"` exist specifically to represent "who we
believe owns this building, before they've signed up or been verified." This is the exact
CLAUDE.md guard-rail scenario — the same fact recorded two different ways — caught with real
evidence rather than a guess.

```
BEFORE (prior draft)                    AFTER (this doc)
─────────────────────                   ─────────────────
BUILDING                                 STAKE
  owner_name          same fact,          subject_type: "building"
  owner_email     ──►  modeled twice ──►  role: "owner"
  owner_phone                             status: "unclaimed"
                                          contact_snapshot: {name, email, phone}
                                          user_id: null  ← until claimed
```

A property manager's relationship is a separate `Stake` (`role: "manages"`) on the `Building` —
acting on behalf of an owner across every unit, not per-unit.

---

## Units, tagging, and who gets a say

The hardest thread this session worked through, prompted by Robin's own property-manager
example: does a multi-unit building get one tag, or does each unit get its own?

**Resolution: tag placement is a hardware/rollout decision, independent of who gets to claim
anything.** Both `Building` and `Unit` can optionally carry their own `nfc_tag_id`. A
single-family home only ever uses the `Building` one. A triplex could have a tag at the main
entrance for building-wide facts (roof, foundation, exterior) and a separate tag on each unit's
own door for what's inside that specific unit — a real, physical, per-property choice, not
something the schema should force one way.

**Claiming stays gated to ownership, regardless of tag placement.** Claiming a `Building` or a
`Unit` puts the claimant through the verification ladder below and produces a `verified_owner`-
track `Stake`. A renter never claims anything.

**Renters get real standing on a separate, lower-trust track — not a claim.** A renter's
relationship is an ordinary `Stake` on their `Unit` (`role: "occupant"`/`"tenant"`,
`subject_type: "unit"`) — a real fact, enough to unlock unit-scoped feature value (their own
systems-passport view, their own maintenance reminders), but it never touches the tag-claim
mechanism and never implies ownership. This is what actually resolves "renters want it tagged
too but aren't owners, by definition": they don't need to claim anything to get real value: a
Stake is a much lower bar than a verified ownership claim.

---

## Ownership verification ladder

Not designed from scratch — recovered from a real, unbuilt proposal already sitting in the
archive: `docs/lightbulbs/farpost-lb-owner-identity-verification.md` (2026-07-13, "Captured,
not yet specced").

- **Baseline, strong signal:** a mailed physical NFC tag or a scout visit — proves the claimant
  actually controls the physical address, not just their own identity. Populates
  `Stake.verification_method = "admin_reviewed"`.
- **Fast-track complement, not a replacement:** third-party ID verification (Stripe Identity,
  Persona, Onfido, Veriff) — faster, but only proves *identity*, not *residence* (a license's
  printed address can be stale or a different unit). Populates
  `Stake.verification_method = "external_id_matched"`.
- **Liability note carried forward:** government ID is high-sensitivity PII — "verify, don't
  store" (pipe through the vendor, keep only a pass/fail token) avoids Farpost taking on raw-ID
  storage/retention/breach-notification liability directly, but the vendor relationship still
  needs disclosure to users.

---

## Worked examples

**Single-family home.** One `Property`, one `Building`, zero `Unit` rows. Owner claims via a
mailed NFC tag on the `Building`. Roof/foundation/electrical/plumbing/heating ages live directly
on `Building`. A furnace gets its own `Asset` (`subject_type="building"`).

**Multi-unit rental building (Robin's property-manager example).** One `Property`, one
`Building`, several `Unit` rows. The owner holds a `verified_owner` `Stake` on the `Building`.
The property manager holds a `manages` `Stake` on the `Building`. Each renter holds an
`occupant` `Stake` on their own `Unit` — no tag-claim involved. A shared boiler is a
`Building`-scoped `Asset`; each unit's own water heater is a `Unit`-scoped `Asset`.

**Vacant or unclaimed land with a well.** A `Property` exists (from bulk ingestion or a scout
visit) with no claimed `Building` yet. The well is still a real, trackable `Asset`
(`subject_type="property"`) — ownership of the land itself, and of that asset, can be
represented as an `unclaimed` `Stake` with a `contact_snapshot` even before anyone signs up.

---

## Still open — not blocking, worth tracking

1. **Property's exact field list beyond the categories above** — dimensions/zoning/cultural-
   historical fields are named but not spec'd to column-level detail. Revisit once a real
   professional-facing feature needs a specific one.
2. **Exact `kind` value(s) for occupancy** — an `occupant`/`tenant` `role` is settled; the
   matching `kind` value(s) (e.g. `"leases"` vs. `"resides"`, and whether those need to differ)
   aren't finalized.
3. **Property-level ownership vs. building-level ownership, when they're the same person (the
   common case).** Does a `Property`-scoped ownership `Stake` imply ownership of every
   `Building` on it, or does each `Building` always need its own separate ownership `Stake` even
   when it's obviously the same owner? Matters for keeping the common single-family-home case
   (one property, one building) a one-claim flow rather than requiring two. Not resolved here.
4. **Wave-0 bulk-seed data source.** The prior system used a Hastings County OpenData pull to
   pre-seed addresses/buildings for later claiming. The 2026-07-12 gov-data-inventory research
   (`project_canada_gov_data_inventory_2026-07-12` memory) found a broader, more current set of
   real options (NAR, NRCan building footprints) — which source(s) actually feed Wave 0 for this
   rebuild isn't decided.
5. **ID-verification vendor pick and disclosure copy** — the ladder's shape is settled; which
   vendor (Stripe Identity/Persona/Onfido/Veriff) and what consent/disclosure language looks
   like at claim time isn't.
6. **Overlap with `docs/lightbulbs/farpost-lb-building-document-library.md`.** That lightbulb
   wants a building-level, not-job-scoped document store (manuals, warranties, deeds) — separate
   from `Asset`'s own `photos`/`condition_notes`. Whether documents attach to a specific `Asset`
   row or need their own generic, polymorphic attachment table (mirroring `Job`'s own
   `JOB_ATTACHMENT` pattern) isn't decided; worth resolving together when that lightbulb is
   picked up, not assumed here.
