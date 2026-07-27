# Core schema — full design, remaining tables

**What this file is:** the final, curated field list for every table in Farpost's schema *except*
`User`/`Membership`-as-a-concept (see `core-user-model.md`, robinsamways.ca repo) and
`Property`/`Building`/`Unit`/`Asset`/`Stake` (see `docs/core-building-model.md`, this repo).
Together with those two docs and `docs/core-schema-relationships-and-indexes-2026-07-27.md`
(the cross-table FK/index/Postgres-concepts pass), this is the complete relational design —
every table, every field, how they connect, what's indexed.

**Status:** closed out 2026-07-27. Informed by a real-world/industry-standard research pass per
table (per the now-standing rule in `feedback_research_real_world_definition_before_schema` —
sources cited inline where a specific finding drove a decision), then curated against
everything already decided this session — several proposed additions were deliberately
rejected as over-scoped for what Farpost actually needs; those are called out explicitly, not
silently dropped.

**Supersedes:** the `MEMBERSHIP`/`JOB`/`CLAIM`/`COMPLIANCE_RECORD`/`DISPATCH_CAPABILITY`/
`CHECKLIST_RUN`/`CHECKLIST_RESULT`/`PROFESSIONAL_PROFILE`/`FULFILLMENT_FEE`/
`BILLING_SUBSCRIPTION`/`FACT_STALENESS`/`CONTRIBUTION`/`SCOUT_VISIT`/`NOTIFICATION_SUBSCRIPTION`/
`PRODUCT_FEEDBACK`/`PRODUCT_FEEDBACK_INSIGHT`/`ENGINE_INSTALLATION`/`ENGINE_ACTIVITY_LINK`
sections of `docs/farpost-schema-draft.html` (v19) — same as `core-building-model.md` already
did for the Building cluster. `RoleType` is unchanged from that draft (research confirmed it's
already right) but is included here for completeness. Two tables are entirely new: `Event` (+
`EventRecipient`) and `ChecklistTemplate` (+ `ChecklistTemplateItem`) — neither existed in the
28-table draft.

---

## Identity extension

### Membership
Unchanged from the prior draft — real: `id`, `user_id` (FK → User), `role` (text, soft-validated
against `RoleType`), `status` (pending/active/suspended/revoked), `granted_at`, `revoked_at`,
`metadata` (jsonb). **Rejected addition:** a `granted_by` audit column (and the equivalent on
several other tables) — see the new `Event` table below; centralizing "who did what, when" there
is the better fix than scattering `*_by` columns across a dozen tables.

### RoleType
Unchanged — `key` (PK), `display_name`, `tier`, `status`, `privacy_default`,
`reputation_eligible`, `default_subscriptions` (text[]), `copy_template_ref`, `hub_config`,
`source`, `created_at`, `promoted_at`, `curator_id`. **Rejected addition:** `verification_required`/
`license_type`/`regulatory_jurisdiction` — this would re-accumulate exactly the kind of
role-specific complexity `ComplianceRecord` already exists to generalize away (per the real,
already-settled correction that pulled Contractor's compliance fields out of a dedicated table
and into `ComplianceRecord`, attachable to any `Membership`). Licensing/regulatory facts belong
there, not on the taxonomy itself.

### ProfessionalProfile
`membership_id` (PK/FK), `first_name`, `last_name`, `company`, `slug`, `phone`, `service_area`,
`visibility` (jsonb), `stripe_customer_id`, `underwriting_digest_enabled`, `extra` (jsonb).
**Added**, from real marketplace-profile research (Thumbtack/Houzz/Angi all standard on this):
`years_in_business` (integer, nullable), `bio_text` (text, nullable). **Rejected:** a dedicated
`background_check_status` field — routes through `ComplianceRecord` instead
(`credential_type: "background_check"`), same reasoning as the `RoleType` rejection above. **Hard
rule reconfirmed, not just kept:** no `average_rating`/`review_count` field, ever — Farpost's real
reputation model is computed on read from `Event`+`Stake` (see "Reputation, confirmed" below),
never a stored score.

### DispatchCapability
Unchanged — `membership_id` (PK/FK), `eligible`, `base_lat`, `base_lng`, `service_radius_km`,
`service_postal_prefixes` (text[]), `max_drive_minutes`, `capabilities` (text[]),
`capacity_current`, `capacity_max`. Real refinements (`working_hours_start`/`end`, skill tiers,
recurring availability schedules) are deliberately deferred with the rest of the `Job`/dispatch
cluster to its own later design session — no near-term feature reads this table yet.

### ComplianceRecord
`id`, `membership_id` (FK), `credential_type`, `reference_number`, `expiry_date`, **renamed**
`status` → `verification_status` (clarity — this was ambiguous against a hypothetical "is the
credential itself active" reading), `created_at`. **Added:** `issuing_authority` (text — e.g.
"WSIB", "ESA of Ontario"; real professional-licensing-tracking practice, and needed the moment
`background_check_status` above routes through here), `verification_document_url` (text,
nullable), `renewal_reminder_sent_at` (timestamptz, nullable — mirrors `Stake`'s own field of the
same name and purpose exactly).

---

## Job cluster (deferred build, not deferred design — same treatment as everything else)

### Job
Unchanged core shape — `id`, `requester_user_id` (FK), `target_role`, `assignee_user_id` (FK,
nullable), `subject_type`/`subject_id` (poly), `description`, `accepted_at`, `arrived_at`,
`completed_at`, `approved_at`, `scope_notes`, `report_url`, `status`, `metadata` (jsonb),
`created_at`, `updated_at`. **Added**, real field-service-management gaps: `scheduled_at`
(timestamptz, nullable), `cancelled_at` (timestamptz, nullable), `cancellation_reason` (text,
nullable), `priority` (text: low/medium/high/urgent). **Rejected:** renaming the `status`
vocabulary to generic FSM terms (new/assigned/en_route/etc.) — Farpost's current vocabulary was
already deliberately checked against two real legacy enums (`ClaimStatus`/`JobStatus`) in a prior
design pass; relitigating it against generic industry terminology for its own sake isn't worth
the churn.

### JobNotes
Unchanged — `job_id` (PK/FK), `requester_notes`, `assignee_notes`. **Rejected:** expanding to a
multi-row `JobNoteEntry` table for threaded, multi-party notes — real architectural expansion
with no current feature requiring it; the existing two-party shape matches `Job`'s own generic
requester/assignee model and should stay until proven insufficient.

### JobAttachment
`id`, `job_id` (FK), `doc_type`, `label`, `url`, `uploaded_at`. **Added:** `uploaded_by_user_id`
(FK → User), `mimetype` (text). `doc_type` moves from pure free text to the same soft-validation
pattern already used for `Membership.role`/`Job.target_role` (validated against a small
Farpost-curated list, not a hard enum).

### JobCostBreakdown
`job_id` (PK/FK), `labour_hours`, `labour_rate`, `materials`, `equipment`, `travel`, `total`,
`measurement_notes`. **Added**, genuine compliance gap: `tax_rate` (numeric), `tax_amount`
(numeric) — Canadian GST/PST isn't optional. **Added:** `breakdown_type` (text:
estimate/actual) — resolves a real ambiguity (is this a quote or a final invoice?) that the
current single-table shape doesn't distinguish. Deposit/markup/line-item detail deliberately
deferred — real, but not needed until Farpost's actual payment-collection flow exists.

### WorkRequestAttempt
Unchanged core — `id`, `job_id` (FK), `candidate_user_id` (FK), `attempt_number`, `dispatched_at`,
`timeout_at`, `responded_at`, `response`. **Added:** `decline_reason` (text, nullable) — cheap,
real dispatch-analytics value. **Explicitly rejected:** `eta_minutes_to_job`, `distance_km`,
`candidate_ranking_score`, `response_duration_seconds` — these are real fields in ride-share-scale
dispatch systems (Uber-style real-time proximity matching), which is not what Farpost's dispatch
is or is likely to become soon. Revisit only if real-time proximity-based dispatch becomes an
actual feature, not preemptively.

### Claim
Unchanged core — `id`, `building_id` (FK, nullable), `insurer_file_number`,
`property_postal_code`, `property_type`, `property_address`, `site_contact_name`,
`site_contact_phone`, `coordinates` (geography), `damage_types` (text[] — **kept as a categorical
array**, not collapsed to a single free-text field as one research pass suggested; the tags are
useful for filtering and a narrative description is a genuinely separate, additional need), `
urgency`, `response_window_hours`, `repeat_property`, `prior_claims_at_address`, `closed_at`.
**Added**, real IBC/insurance-industry gaps: `peril_type` (text — the cause of loss: fire/water/
wind/theft/etc., distinct from `damage_types`' description of what got damaged),
`estimated_loss_amount` (numeric), `deductible` (numeric), `adjuster_assigned_at` (timestamptz,
nullable), `damage_description` (text, nullable — the narrative companion to the categorical
`damage_types` tags). **No `status` column, confirmed deliberate, not an oversight** — checked
directly against the real archived system (`farpost-api/app/models/claim.py`/`enums.py`,
2026-07-27) after `core-schema-relationships-and-indexes-2026-07-27.md` was found to loosely list
`Claim` among "tables carrying a lifecycle status." The old `Claim.status: ClaimStatus`
(`new/dispatched/accepted/in_progress/documented/approved/closed/failed`) was retired on purpose
when `Job` generalized past claim-dispatch: every value except `CLOSED` maps onto the identical
`Job.status` value, `CLOSED` maps onto `Claim.closed_at`, `FAILED` maps onto `Job.status =
'exhausted'`. **Tabled, not resolved:** this mapping only gives one clean answer when a `Claim`
has exactly one `Job` — this schema deliberately allows more than one (the follow-up-inspection
case), and "what's this claim's status across multiple Jobs" has no designed answer yet. Revisit
for real if that case ever actually happens; see `job-dispatch-schema`'s design.md for the full
trace.

---

## Checklist cluster — including two new tables

The old draft's `CHECKLIST_RUN.sequence_id` turned out, on checking the archived system's real
code, to be nothing more than a free-text grouping identifier — never a reference to any kind of
reusable checklist definition. Real-world research (home-inspection software, ISO 9001 audit
practice, SaaS checklist tools) was unanimous: a "checklist" without a defined, versioned,
reusable set of items is a real gap, not a stylistic choice. Two new tables close it.

### ChecklistTemplate (new)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | e.g. "Electrical Safety Checklist" |
| `description` | text, nullable | |
| `version` | integer | One name, many versions — a run pins to the exact version it used. |
| `status` | text: draft/active/deprecated | |
| `asset_types` | text[] | Which asset types this template applies to. |
| `curator_id` | text FK → User | Mirrors `RoleType.curator_id` exactly — same curation pattern reused, not invented fresh. |
| `created_at` / `updated_at` | timestamptz | |

**Rejected from the research pass:** an `organization_id` field — Farpost has no multi-tenant
Organization concept anywhere (already settled, see `core-user-model.md`'s Organization-plugin
rejection); adding it here would contradict that directly. Also rejected: `effective_from`/
`effective_to` scheduled-rollout timestamps — the `status` enum already covers the practical need
without adding time-based activation logic before anything requires it.

### ChecklistTemplateItem (new)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `checklist_template_id` | uuid FK → ChecklistTemplate | |
| `sequence` | integer | Display/execution order. |
| `category` | text, nullable | e.g. "Panel Inspection" — groups items within a template. |
| `title` | text | The actual check, e.g. "Verify main breaker is rated correctly." |
| `description` | text, nullable | Extended guidance. |
| `expected_asset_types` | text[] | Item only surfaces if the building/unit actually has a matching asset. |
| `recommended_action_on_fail` | text, nullable | Default text for `ChecklistResult.recommended_action` when this item fails. |
| `created_at` | timestamptz | |

**Simplified from the research pass:** items use the one shared `condition_status` vocabulary
(below), not a per-item customizable enum — one fixed vocabulary system-wide is simpler and just
as expressive for what Farpost actually needs.

### ChecklistRun
`id`, `building_id` (FK), `membership_id` (FK — who performed it; already answers "who," so no
separate `created_by_user_id` is needed), `completed_at`, `created_at`. **`sequence_id` removed,
replaced with:** `checklist_template_id` (FK → ChecklistTemplate), `checklist_template_version`
(integer — denormalized pin of the version actually used, so a run stays traceable even after the
template evolves). **Added:** `overall_status` (text, nullable — a session-level summary,
distinct from each item's own result).

### ChecklistResult
`id`, `checklist_run_id` (FK), `asset_id` (FK, nullable — a result can apply to the building as a
whole). **`passed` (boolean) replaced with** `condition_status` (text: inspected_acceptable/
not_inspected/not_present/safety_concern/repair_needed/defect_follow_up — richer than pass/fail,
matches the equivalent enum already added to `Asset`). **Added:** `checklist_template_item_id`
(FK → ChecklistTemplateItem — closes the loop: every result traces back to the exact question it
answered), `recommended_action` (text, nullable — defaults from the template item, overridable by
the inspector), `notes` (unchanged). **Rejected:** ISO-9001-style `severity_level`/
`finding_category` fields — that's manufacturing-audit-grade rigor; `condition_status` +
`recommended_action` + `notes` is proportionate for a home/building vetting pass.

---

## Building provenance

### FactStaleness
`id`, `building_id` (FK), `category`, `last_documented_at`, `half_life_months`, `notified_at`
(kept as a single field — mirrors `Stake.renewal_reminder_sent_at`'s own proven shape; rejecting
the research pass's suggestion to extract this into a separate alerts table as unnecessary
complexity for what's currently one boolean-ish fact). **`next_stale_at` becomes a Postgres
`GENERATED ALWAYS AS` column** (`last_documented_at + half_life_months * interval '1 month'`,
`STORED`) instead of an application-maintained field — see the relationships/indexes doc; this
makes the doc's own "recomputed on every write, never trusted stale" promise airtight at the
database level. **Added**, the genuinely valuable finding from this cluster's research:
`source_method` (text: field_visit/professional_audit/permit_record/form_submission) and
`source_confidence_level` (integer 1–5) — enables a confidence-aware decay model (a professional
audit should stay "fresh" longer than a homeowner's own form entry), a real upgrade to the "living
record" concept central to Farpost's own stated vision.

### Contribution
`id`, `building_id` (FK), `membership_id` (FK), `category`, `payload` (jsonb), `created_at`.
**Added:** `confidence_level` (integer 1–5), `review_status` (text: pending/verified/flagged/
rejected), `source_method` (text — same vocabulary as `FactStaleness` above). **Rejected:** a
`previous_value` field for change-lineage — `Contribution` is already append-only (each
contribution is its own row), so the "previous value" is simply the prior row in the same
category; storing it again would duplicate what the table's own shape already gives for free.

### ScoutVisit
`id`, `building_id` (FK), `membership_id` (FK), `photo_urls` (text[]), `notes`, `visited_at`.
**Added:** `gps_accuracy_m` (numeric, nullable) — genuinely matches Farpost's own field-verified-
data-moat business model (accuracy of a field capture is directly a business asset, not just a
nice-to-have). Weather conditions, observer confidence, and visit-purpose tagging are reasonable
but deferred as longtail.

---

## Marketplace & billing

### FulfillmentFee
`id`, `subject_type`/`subject_id` (poly — today only `Job`, kept polymorphic for future subject
types per the existing design), `payer_id` (FK), `fee_cents`, `invoice_id`, `paid_at`,
`collected`, `created_at`. **Added:** `currency` (text, default `CAD`), `fee_percentage`
(numeric, nullable — audit/reconciliation value alongside the flat `fee_cents`),
`refund_status` (text: none/pending/approved/refunded), `refund_amount_cents` (integer,
nullable). **Reconfirmed, not changed:** `invoice_id` stays a pure reference — never re-store
anything Stripe's own Invoice/Charge objects already own.

### BillingSubscription
`id`, `user_id` (FK), `plan`, `period_number`, `period_charged_cents`, `current_period_start`,
`current_period_end`, `status`, `cancel_at_period_end`, `created_at`. **Added:**
`stripe_subscription_id` (text, nullable) — a real reference gap if this table is meant to sync
to actual Stripe subscriptions, consistent with the same reference-not-duplicate discipline.
**Deliberately deferred:** trial/dunning fields (`trial_end_date`, `payment_method_id`,
`dunning_status`) — real SaaS-standard fields, but Farpost's actual billing model (a flat
$12/year charge, per `core-billing-model.md`) has no trials or payment-retry flow to support yet.
**Reconfirmed:** no `next_billing_date` field — it's `current_period_end`; storing a derived value
separately only invites drift.

---

## Product, notification, and suite-linkage

### NotificationSubscription
`id`, `membership_id` (FK), `event_type`, `anchor_type`, `anchor_value`, `channels` (text[]),
`active`, `created_at`. **Added:** `frequency_preference` (text: immediate/daily_digest/
weekly_digest/never) — real, standard on every notification-preference-center reviewed, and
cheap. Quiet-hours and unsubscribe-token compliance fields deferred until real volume/compliance
need exists.

### ProductFeedback
`id`, `membership_id` (FK), `role`, `feature_key`, `free_text_raw`, `free_text_normalized`
(jsonb), `dismissed`, `created_at`. **`responses` (jsonb) gets one field promoted out of it:**
`score` (integer, nullable) — becomes a real column instead of buried in jsonb, so it's actually
queryable/aggregable, matching the same "don't bury a queryable fact in jsonb" correction applied
elsewhere this session (`Event.relevance`, below). Sentiment/language/context fields are real but
depend on NLP infrastructure that doesn't exist yet — deferred.

### ProductFeedbackInsight
Unchanged fields, but **implementation note, not a schema change:** this is a pure computed
aggregate over `ProductFeedback` and is a strong candidate for a Postgres `MATERIALIZED VIEW`
rather than a hand-populated table — see the relationships/indexes doc. **Added:** `actioned_at`
(timestamptz, nullable), `resolution_note` (text, nullable) — closes the loop between feedback and
whether it actually drove a real product change, which matters for how the team treats feedback
from day one, not just as a data-structure nicety.

### EngineInstallation
`id`, `engine_key`, `config` (jsonb), `installed_at`. **`enabled` (boolean) replaced with**
`uninstalled_at` (timestamptz, nullable — null means still installed) — matches `Stake`'s own
`established_at`/`ended_at` lifecycle convention rather than a bare boolean, and preserves real
install/uninstall history instead of just current state.

### EngineActivityLink
`id`, `membership_id` (FK), `context_type`/`context_id` (poly), `engine_key` (FK), `
external_session_id`, `external_summary` (jsonb), `created_at`. **Added:** `synced_at`
(timestamptz), `sync_status` (text: ok/stale/not_found/error) — the "foreign reference, not a
copy" pattern this table already uses needs a staleness signal, or a deleted/changed external
record goes silently undetected.

---

## New: Event + EventRecipient

The fresh 28-table draft dropped a table the old system actually depended on for three real
things at once: computing professional reputation as a read-only timeline (never a stored
rating — see below), fanning out notifications, and admin audit trails. Reviving it, translated
into this schema's own established patterns rather than copied from the old Mongo shape.

### Event (new)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_type` | text | e.g. `"CLAIM.SUBMITTED"`, `"INSPECTION.COMPLETED"`. |
| `actor_user_id` | uuid FK → User, nullable | Null means a system-generated event. The old model's `actor_id` was a raw string (professional slug, claim id, or `"system"`) — a real FK is correct here since the actor, when there is one, is always a platform User. |
| `actor_role` | text, nullable | Denormalized cache of the actor's role at event time — avoids a join on every read; accepted as a deliberate, cheap drift risk. |
| `subject_type` / `subject_id` | text / uuid (poly) | Replaces the old model's three separate nullable columns (`building_slug`/`claim_id`/`professional_slug`) with the same polymorphic pair every other cross-cutting table already uses. |
| `payload` | jsonb | Event-specific context. |
| `urgency` | text: normal/high | Kept from the old model's own naming — no real reason to rename it. |
| `delivery_status` | text: pending/processing/delivered | Replaces the old boolean `processed` — more expressive for the same cost. |
| `delivered_at` | timestamptz, nullable | |
| `created_at` | timestamptz | |

**Deliberately rejected:** `idempotency_key`, payload `data_version`, and a partitioned
`sequence_id` for cross-event ordering — real patterns in production event-sourcing/message-queue
architectures, but that's not what this table is being asked to do yet. Add them if a real
duplicate-delivery bug ever actually happens, not speculatively.

### EventRecipient (new)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_id` | uuid FK → Event | |
| `recipient_user_id` | uuid FK → User | |
| `recipient_role` | text | Denormalized, same reasoning as `Event.actor_role`. |
| `reason` | text, nullable | e.g. `"building_owner"`, `"assigned_inspector"` — replaces the old model's inline `relevance` list. |
| `read_at` | timestamptz, nullable | Replaces the old model's single global `read_by_admin` boolean — read state is inherently per-recipient, not per-event. |
| `created_at` | timestamptz | |

This is the one real structural change in this whole new-table pass: the old model's `relevance`
field (a jsonb list of `{role, reason, building_slug, subject_slug}`) becomes its own table
instead. Reasoning, confirmed by real notification-system research (Novu/Knock-style production
fan-out design): "which events are relevant to professional X, and have they read them" needs to
be an indexed, independently-queryable question, not a scan-and-deserialize-jsonb one — the exact
same correction already made to `ProductFeedback.score` in this same pass.

---

## Reputation, confirmed — no new table needed

Checked directly against the archived system's real, already-built design
(`professional-reputation-timeline` spec) before assuming a `Review`/`Rating` table was needed:
Farpost's reputation model is **explicitly a read-only, computed-on-request timeline over `Event`
+ `Stake`, never a stored score.** ("Computes a professional's reputation as a read-only, on-the-
fly timeline of factual events and building relationships (never stored or scored)" — the
archived spec's own stated purpose.) This directly confirms the earlier decision to keep
`average_rating`/`review_count` off `ProfessionalProfile` — there's no ratings table to aggregate
from because ratings were a deliberately rejected concept, not a missing table. `Event` (above)
is what a future reputation-timeline feature would query; nothing further needs designing here
until that feature is actually built.
