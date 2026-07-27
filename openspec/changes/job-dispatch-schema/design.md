## Context

Every field in this change was already designed in `docs/core-schema-full-design-2026-07-27.md`
and `docs/core-schema-relationships-and-indexes-2026-07-27.md` — this design doc's job is to
translate that prose into exact, buildable Drizzle/Postgres shapes the way `core-building-schema`
did, not to redesign anything. Where those two docs left a genuine gap (see Decisions below),
that gap is named explicitly rather than silently filled.

Two real inconsistencies surfaced while doing that translation, worth stating up front since
they're exactly the kind of thing `core-building-schema`'s own drift-audit process is meant to
catch before it reaches a migration:

1. `core-schema-relationships-and-indexes-2026-07-27.md`'s cascade-behavior section lists `Claim`
   among tables carrying "a lifecycle `status`" — but neither that doc nor
   `core-schema-full-design-2026-07-27.md`'s own curated `Claim` field list (nor the original
   `farpost-schema-draft.html` ER diagram) actually includes a `status` column on `Claim`. Its
   only lifecycle signal anywhere in either doc is `closed_at` (confirmed "correct as a separate
   claim-specific event, unchanged" in the draft's own v12 note). **Checked directly against the
   real archived system, not just resolved by re-reading the docs more carefully** (`c:\dev\
   archives\farpost\farpost-api\app\models\claim.py` / `enums.py`): the old `Claim` document
   really did have its own `status: ClaimStatus` field (`new/dispatched/accepted/in_progress/
   documented/approved/closed/failed`). It wasn't overlooked in the redesign — the draft's own
   v11–v12 notes describe deliberately retiring it once `Job` was generalized past claim-dispatch:
   every `ClaimStatus` value except `CLOSED` maps onto the identical `Job.status` value (that's
   literally where six of `Job.status`'s eight words come from), `CLOSED` maps onto
   `Claim.closed_at`, and `FAILED` maps onto `Job.status = 'exhausted'`. So the relationships
   doc's mention is genuinely stale language left over from before that consolidation, not a
   design intent that got dropped — no `Claim.status` column is added here, with real historical
   evidence behind that call now, not just an inference from silence.
2. `Job`'s new `cancelled_at`/`cancellation_reason` fields (added in the full-design pass) have
   no corresponding value in `Job.status`'s own vocabulary (`pending | dispatched | accepted |
   in_progress | documented | approved | paid | exhausted` — the exact list confirmed against
   `farpost-schema-draft.html`'s v12 note, which checked it directly against the real archived
   `ClaimStatus`/`JobStatus` enums). A cancelled job needs to be identifiable via `status`, not
   just via `cancelled_at` being non-null, or status-filtered queries (the indexing plan's own
   "partial on `status` for active states") silently miss cancelled jobs. Resolved by adding
   `'cancelled'` as a ninth `status` value — exactly the scenario the schema's own text+`CHECK`
   strategy (over native `ENUM`) was chosen to make cheap.

## Goals / Non-Goals

**Goals:**
- Real Drizzle/Postgres tables for `ProfessionalProfile`, `DispatchCapability`,
  `ComplianceRecord`, `Job`, `JobNotes`, `JobAttachment`, `JobCostBreakdown`,
  `WorkRequestAttempt`, `Claim` — every field, CHECK constraint, and index from the two design
  docs, translated exactly.
- Continue every Postgres convention `core-building-schema` established: `text` + `CHECK` over
  native `ENUM`, the shared `set_updated_at()` trigger, `ON DELETE RESTRICT` by default with
  `CASCADE` only for pure 1:1/child extensions, real `UNIQUE` constraints for business rules.

**Non-Goals:**
- No application code, no routes, no UI — schema only, same scope discipline as
  `core-building-schema`.
- No `Checklist`/billing/`Event`/product-notification/`EngineInstallation` tables — designed, but
  out of scope per this change's own proposal.
- No dispatch *logic* (matching algorithm, timeout sweeps, notification fan-out) — this change
  makes the data structures those features will eventually read/write real, nothing more.
- No Row-Level Security policies — `core-schema-relationships-and-indexes-2026-07-27.md` flags
  RLS as "worth real consideration, not just app-layer checks" but explicitly does not design the
  policies; still not designed here, left as a genuinely open follow-on.

## Decisions

**Decision: `ProfessionalProfile`/`DispatchCapability` fields and nullability, translated from
the draft ER diagram plus the full-design doc's stated additions.**
- `professional_profile`: `membership_id` (uuid, PK, FK → `membership.id`, `ON DELETE
  RESTRICT`), `first_name` (text, not null), `last_name` (text, not null), `company` (text,
  nullable), `slug` (text, unique, not null), `phone` (text, nullable), `service_area` (jsonb,
  nullable), `visibility` (jsonb, nullable), `stripe_customer_id` (text, nullable),
  `underwriting_digest_enabled` (boolean, not null, default false), `extra` (jsonb, nullable),
  `years_in_business` (integer, nullable), `bio_text` (text, nullable).
- `dispatch_capability`: `membership_id` (uuid, PK, FK → `membership.id`, `ON DELETE RESTRICT`),
  `eligible` (boolean, not null, default false), `base_lat`/`base_lng` (numeric, nullable),
  `service_radius_km` (numeric, nullable), `service_postal_prefixes` (text array, nullable),
  `max_drive_minutes` (integer, nullable), `capabilities` (text array, nullable),
  `capacity_current` (integer, not null, default 0), `capacity_max` (integer, nullable).

**Decision: `ComplianceRecord.verification_status` gets a concrete four-value vocabulary — not
specified anywhere in either design doc, decided here.**
Neither doc gives `verification_status`'s literal values (the full-design doc only says the
column was *renamed* from `status`, not what it contains). Chosen: `pending`, `verified`,
`expired`, `rejected` — matches the plain lifecycle a credential/licensing record actually goes
through, mirrors the `pending`/`active`-style shape already used elsewhere (`Stake.status`,
`Job.status`), and `expired` is derivable independently from `expiry_date` but kept as an
explicit state so a query doesn't need to compute "is this expired" from a date comparison every
time. Flagged here explicitly since it's a genuine judgment call, not a transcription.

**Decision: `Job.status` gains a ninth value, `'cancelled'`, alongside the eight already
confirmed against the real archived `ClaimStatus`/`JobStatus` enums.** See Context above.

**Decision: `Job.subject_type` is `CHECK (subject_type IN ('claim', 'building', 'property',
'asset'))`.** Matches the relationship graph's stated poly targets (`Job (poly) → Claim |
Building | Property | Asset`) exactly — no `unit` target, since no design doc or relationship
line ever names `Job → Unit`.

**Decision: `Job`, `JobNotes`, `JobAttachment`, `JobCostBreakdown`, `WorkRequestAttempt`, `Claim`
field lists and types**, combining the original draft ER diagram's "unchanged" fields with the
full-design doc's stated additions verbatim:
- `job`: `id` (uuid, PK), `requester_user_id` (text, not null, FK → `user.id`, `ON DELETE
  RESTRICT`), `target_role` (text, not null, soft-validated against `role_type.key`, no FK —
  same pattern as `Membership.role`), `assignee_user_id` (text, nullable, FK → `user.id`, `ON
  DELETE RESTRICT`), `subject_type` (text, not null, CHECK per above), `subject_id` (uuid, not
  null, no FK — poly), `description` (text, not null), `accepted_at`/`arrived_at`/
  `completed_at`/`approved_at`/`scheduled_at`/`cancelled_at` (timestamptz, all nullable),
  `cancellation_reason` (text, nullable), `scope_notes` (text, nullable), `report_url` (text,
  nullable), `status` (text, not null, CHECK as above, default `'pending'`), `priority` (text,
  not null, CHECK IN `('low','medium','high','urgent')`, default `'medium'`), `metadata` (jsonb,
  nullable), `created_at`/`updated_at` (timestamptz, not null, default now — `updated_at`
  trigger-maintained).
- `job_notes`: `job_id` (uuid, PK, FK → `job.id`, `ON DELETE CASCADE`), `requester_notes` (text,
  nullable), `assignee_notes` (text, nullable).
- `job_attachment`: `id` (uuid, PK), `job_id` (uuid, not null, FK → `job.id`, `ON DELETE
  CASCADE`), `doc_type` (text, not null, soft-validated against a small Farpost-curated list per
  the full-design doc, no FK), `label` (text, nullable), `url` (text, not null),
  `uploaded_by_user_id` (text, not null, FK → `user.id`, `ON DELETE RESTRICT`), `mimetype` (text,
  nullable), `uploaded_at` (timestamptz, not null, default now).
- `job_cost_breakdown`: `job_id` (uuid, PK, FK → `job.id`, `ON DELETE CASCADE`), `labour_hours`/
  `labour_rate`/`materials`/`equipment`/`travel`/`total`/`tax_rate`/`tax_amount` (numeric, all
  nullable), `breakdown_type` (text, not null, CHECK IN `('estimate', 'actual')`),
  `measurement_notes` (text, nullable).
- `work_request_attempt`: `id` (uuid, PK), `job_id` (uuid, not null, FK → `job.id`, `ON DELETE
  CASCADE`), `candidate_user_id` (text, not null, FK → `user.id`, `ON DELETE RESTRICT`),
  `attempt_number` (integer, not null), `dispatched_at` (timestamptz, not null, default now),
  `timeout_at` (timestamptz, not null), `responded_at` (timestamptz, nullable), `response` (text,
  nullable, CHECK IN `('accepted', 'declined', 'timeout')` OR NULL), `decline_reason` (text,
  nullable).
- `claim`: `id` (uuid, PK), `building_id` (uuid, nullable, FK → `building.id`, `ON DELETE
  RESTRICT`), `insurer_file_number`/`property_postal_code`/`property_type`/`property_address`/
  `site_contact_name`/`site_contact_phone`/`urgency`/`peril_type`/`damage_description` (text, all
  nullable), `coordinates` (geography Point, SRID 4326, nullable), `damage_types` (text array,
  nullable), `response_window_hours`/`prior_claims_at_address` (integer, nullable),
  `repeat_property` (boolean, not null, default false), `estimated_loss_amount`/`deductible`
  (numeric, nullable), `adjuster_assigned_at`/`closed_at` (timestamptz, nullable).

**Decision: cascade behavior follows `core-schema-relationships-and-indexes-2026-07-27.md`'s
house rule exactly** — `ON DELETE RESTRICT` on every real FK except the pure 1:1/child
extensions the doc names explicitly (`JobNotes`, `JobCostBreakdown`, `JobAttachment`,
`WorkRequestAttempt`, all `ON DELETE CASCADE` against `job.id`). `Claim.building_id` and every
`user_id`/`membership_id` FK in this change is `RESTRICT`.

**Decision: indexes, taken directly from the indexing-plan table.** `job`:
`requester_user_id`, `assignee_user_id`, `(subject_type, subject_id)`, partial on `status` for
active states (`status IN ('pending','dispatched','accepted','in_progress')` — the plan's own
"active states" phrase, made concrete here since it names none explicitly). `work_request_
attempt`: `job_id`, `candidate_user_id`, partial on outstanding offers (`responded_at IS NULL AND
timeout_at > now()`). `claim`: `building_id`, `insurer_file_number`, GiST on `coordinates`.
`compliance_record`: `membership_id`, partial on `expiry_date` for soon-to-expire credentials
(`expiry_date IS NOT NULL` — the plan doesn't give an exact window; a bare "has an expiry" filter
keeps the index usable without inventing an arbitrary day count no doc specifies).

## Risks / Trade-offs

- **[Risk]** `ComplianceRecord.verification_status`'s vocabulary was invented here, not sourced
  from a design doc — a real judgment call that could be wrong.
  → **Mitigation:** flagged plainly above and in proposal.md rather than silently decided;
  cheap to change later since it's `text` + `CHECK`, not a native enum.
- **[Risk]** `Job.subject_id`/`Claim.building_id`-style polymorphic and optional FKs carry the
  same accepted integrity gap already named for `Stake`/`Asset` in `core-building-schema` —
  nothing in Postgres stops a `Job.subject_id` from pointing at a row that no longer exists.
  → **Mitigation:** accepted per the relationships doc's own explicit call ("a deliberate,
  repeated tradeoff... worth a periodic integrity-check job once real data volume exists").
- **[Risk]** Adding `'cancelled'` to `Job.status` is a real, if small, deviation from the exact
  vocabulary the draft doc says was already checked against production enums.
  → **Mitigation:** additive only (no existing value removed or renamed), and the gap it closes
  (a cancelled job with no matching status) is a real, demonstrable one, not a style preference.

## Open Questions

- Real RLS policies for the `Stake`-style "filter subject AND user together" pattern — flagged as
  worth doing in the relationships doc, still not designed. Worth its own follow-on decision
  once `Job`/`Stake` are both real and a first access-control bug (or audit) makes it concrete.
- Whether `ComplianceRecord.verification_status`'s invented vocabulary above is the right one —
  worth Robin's explicit sign-off before this becomes load-bearing for a real credentialing flow.
- **Tabled deliberately, not resolved:** the `Claim.status`-via-`Job.status` mapping above only
  produces one clean answer when a `Claim` has exactly one `Job`. This schema already allows more
  than one (the follow-up-inspection case) — the old design notes flagged this exact tension
  themselves and left it open rather than forcing an answer prematurely. If a real workflow ever
  needs "what's this claim's status" as a single value across multiple Jobs, that's a genuine
  design question for whenever it actually happens (a real aggregation rule, or reviving a
  claim-level `status` after all) — not something to guess at now with zero real usage to ground
  it. Flagged here strongly on purpose: this is the second time a schema-level ambiguity only
  resolved cleanly by checking real archived code instead of re-deriving an answer from the
  design docs' own prose — worth remembering that pattern for whatever the next one turns out to
  be, not just this specific case.
