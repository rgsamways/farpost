## Why

`core-building-schema` built the identity-extension and building cluster
(`Membership`/`RoleType`/`Property`/`Building`/`Unit`/`Asset`/`Stake`), but the actual
work-dispatch mechanic — a requester asking for work, a professional getting matched and doing
it — has no schema at all yet, even though its fields were fully designed the same session as
the building cluster (`docs/core-schema-full-design-2026-07-27.md`,
`docs/core-schema-relationships-and-indexes-2026-07-27.md`). This is Farpost's actual marketplace
core, deliberately deferred by that change's own proposal rather than abandoned. Building it now
turns the second closed-out design pass into real, buildable schema, the same way
`core-building-schema` did for the first.

## What Changes

- Creates `ProfessionalProfile`, `DispatchCapability`, `ComplianceRecord` — the professional-
  capability layer on top of `Membership` (one-to-one profile/dispatch-eligibility rows, plus a
  many-per-membership credential/licensing record; e.g. WSIB, ESA of Ontario).
- Creates `Job`, `JobNotes`, `JobAttachment`, `JobCostBreakdown` — the work record itself: a
  polymorphic subject (`Building`/`Property`/`Asset`/`Claim`), its lifecycle timestamps
  (scheduled/accepted/arrived/completed/approved/cancelled), a two-party (requester/assignee)
  notes extension, attachments, and a cost breakdown that distinguishes an estimate from an
  actual invoice and includes real Canadian tax fields.
- Creates `WorkRequestAttempt` — the per-candidate dispatch-offer record (who was offered this
  job, when, whether they accepted/declined/timed out), deliberately scoped to Farpost's actual
  current dispatch model, not ride-share-scale real-time proximity matching.
- Creates `Claim` — the insurance-claim intake record that a `Job` can optionally originate from
  (`Job.subject_type = 'claim'`), carrying the insurer-facing fields (file number, peril type,
  damage types, adjuster assignment) this platform's original inspection-dispatch use case needs.
- Establishes the "mark historical, don't delete" lifecycle discipline for every table here that
  carries a `status` (`Job`, `Claim`, `ComplianceRecord`) — `ON DELETE RESTRICT` on real FKs,
  `ON DELETE CASCADE` only for pure 1:1/child extensions (`JobNotes`, `JobCostBreakdown`,
  `JobAttachment`, `WorkRequestAttempt`).
- **Explicitly excludes**, same deferred-not-abandoned treatment: the `Checklist` cluster
  (`ChecklistTemplate`/`ChecklistTemplateItem`/`ChecklistRun`/`ChecklistResult`), billing
  (`FulfillmentFee`/`BillingSubscription`), `Event`/`EventRecipient`, product/notification
  (`NotificationSubscription`/`ProductFeedback`/`ProductFeedbackInsight`), `EngineInstallation`/
  `EngineActivityLink`, and building-provenance (`FactStaleness`/`Contribution`/`ScoutVisit`) —
  all already designed, none needed for this cluster's own tables to be internally coherent.

## Capabilities

### New Capabilities
- `professional-capability`: `ProfessionalProfile` (public-facing professional identity),
  `DispatchCapability` (service-area/capacity eligibility), `ComplianceRecord`
  (credential/licensing tracking) — all layered on an existing `Membership` row.
- `job-record`: the `Job` work record itself plus its `JobNotes`/`JobAttachment`/
  `JobCostBreakdown` extensions.
- `dispatch-attempt`: `WorkRequestAttempt`, the per-candidate offer/response record for a `Job`.
- `claim-intake`: `Claim`, the insurance-claim record a `Job` can originate from.

### Modified Capabilities
None — nothing existing changes shape. `Job`'s polymorphic subject reads `building-record` and
`asset-tracking`'s tables without modifying them.

## Impact

- **New:** Drizzle schema files and a migration for `professional_profile`, `dispatch_capability`,
  `compliance_record`, `job`, `job_notes`, `job_attachment`, `job_cost_breakdown`,
  `work_request_attempt`, `claim` — nine tables total.
- **Reads, doesn't modify:** `membership` (FK target for the professional-capability layer),
  `user` (FK target for `Job.requester_user_id`/`assignee_user_id`, `WorkRequestAttempt.
  candidate_user_id`), `building`/`property`/`asset` (poly targets for `Job.subject_id` and
  `Claim.building_id`).
- **Not affected:** no application/route code yet — this change is schema-only, same as
  `core-building-schema`. No UI reads or writes any of these tables until a later change.
- **Unlocks:** the actual dispatch/marketplace feature build can start once this is archived;
  also unblocks `Checklist` (reads `Building`/`Asset`, not `Job`, so it doesn't strictly depend on
  this — but was sequenced after it in the schema-cluster build order).
