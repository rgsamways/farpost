## Context

`docs/core-schema-full-design-2026-07-27.md`'s "Building provenance" section sketches all three
tables' field lists (see proposal.md for the full list). `docs/core-building-model.md` (line 136)
states these three were "normalized out of Mongo's embedded lists in the prior draft" — meaning
real, working equivalents existed in the old system, not a fresh invention.

Per [[feedback_check_archive_when_schema_docs_disagree]] / [[feedback_research_real_world_definition_before_schema]],
the old archived system (`c:\dev\archives\farpost`) was checked before finalizing fields.
Findings from `app/models/building.py`, `app/schemas/building.py`,
`openspec/specs/building-decay-model/spec.md`, and `docs/specs/farpost-scout-spec.md`:

- The old `Building` document embedded all three concepts directly, untyped: `contributions:
  list[dict]`, `fact_staleness: dict[str, FactStaleness]` (keyed by category, a real Pydantic
  sub-model: `last_documented_at: date`, `half_life_months: int`, `next_stale_at: date`,
  `notified_at: Optional[datetime]`), and `scout_visits: list[dict]` (completely unenforced —
  no photo, notes, or GPS field ever appeared in code).
- **`category` had a real, known 8-value vocabulary** (`foundation`, `roof`, `electrical`,
  `plumbing`, `mechanical`, `exterior`, `interior`, `site` — from the old
  `FACT_STALENESS_HALF_LIFE_MONTHS` config table) **but was deliberately never DB/schema
  enforced.** The archived `building-decay-model` spec states plainly: "an unrecognized category
  never blocks either write path." This is a real, documented design intent, not an oversight.
- **The staleness decay concept was real and fully implemented**, not aspirational: a daily
  `check_fact_decay` scheduler job found `fact_staleness[category].next_stale_at < now()` with
  `notified_at IS NULL`, notified the owner once, and reset on re-confirmation. `next_stale_at`
  was explicitly documented as "a cached scheduling aid, never trusted for display" — the read
  path always recomputed from `last_documented_at`. This maps directly onto a Postgres
  `GENERATED ALWAYS AS` column, making that same guarantee airtight at the database level instead
  of trusting every write path to recompute it by hand (exactly the generated-column
  recommendation already in the relationships/indexes doc).
- The old `Contribution`'s real fields (`ContributionIn`/`ContributionOut` in
  `app/schemas/building.py`): `field`, `field_original`, `field_diff`, `category`, `visit_date`,
  `role`, `professional_slug`, `visibility`, `created_at`, `preening_failed`. No `membership_id`,
  `payload` jsonb, or `confidence_level` ever existed — those are genuinely new. The new design
  doc's rejection of a `previous_value` field ("Contribution is already append-only... the
  previous value is simply the prior row") directly resolves what the old `field_diff`/
  `field_original` pair existed to capture — confirmed consistent, not re-litigated.
- **`role` on the old `Contribution` has no equivalent in the new design doc's field list** — a
  real gap, not a deliberate omission (nothing in either design doc explains dropping it).
- **No `review_status`/moderation workflow ever existed.** The old system instead ran an
  AI-driven "preening" pass (Claude Haiku, `app/services/preening.py`) that rewrote evaluative
  language to observational language, with a `preening_failed` flag and `field_original`/
  `field_diff` audit trail if a professional rejected the rewrite — a real integrity mechanism,
  but not a human review/verification workflow. `review_status`'s vocabulary
  (pending/verified/flagged/rejected) is genuinely invented for this rebuild.
- **`ScoutVisit.photo_urls`/`gps_accuracy_m` have zero historical precedent** — grepped for
  `gps_accuracy`/`photo_urls` in the archive, zero hits. Building-level lat/lng existed as a
  lookup key (already covered by the already-built `Building.location` geography column); no
  per-visit GPS field ever existed.

## Goals / Non-Goals

**Goals:**
- Normalize the old system's three untyped embedded concepts into real, independently-queryable
  tables — same fix already applied to `Unit`/`Asset`/`Stake`.
- Ground `category`'s (non-)constraint, the generated-column approach, and the real
  `contributor_role` gap in actual historical evidence.

**Non-Goals:**
- No `check_fact_decay` scheduler/notification job — this change is the data model only, same
  discipline as every prior cluster.
- No AI "preening" pass or equivalent language-rewriting mechanism — out of scope for a schema
  change; if a future change wants this, it's a real, separate design decision.
- No change to `Building` or `Membership`.

## Decisions

1. **`category` gets no `CHECK` constraint on either `fact_staleness` or `contribution`.**
   Directly grounded in the old system's own explicit documented intent ("an unrecognized
   category never blocks either write path") — not a fresh call. The known 8-value vocabulary
   (`foundation`/`roof`/`electrical`/`plumbing`/`mechanical`/`exterior`/`interior`/`site`) is
   real and worth documenting here for future reference, but stays soft/advisory, matching this
   schema's own established "text field for things that need to evolve" philosophy.

2. **`fact_staleness` gets a real `UNIQUE (building_id, category)` constraint.** The old
   `dict[str, FactStaleness]` shape enforced exactly one entry per category per building
   implicitly; this makes that same real business rule explicit at the database level. A new
   fact for an existing category is an `UPDATE`/upsert on the same row, not a new row — matching
   the old system's "reset on re-confirmation" behavior.

3. **`next_stale_at` is a `GENERATED ALWAYS AS ((last_documented_at + (half_life_months ||
   ' months')::interval)::date) STORED` column**, not application-maintained. Directly
   implements the old system's own stated guarantee ("never trusted stale") at the database
   level instead of trusting every write path to recompute it correctly.

4. **`last_documented_at` stays a `date`, not `timestamptz`**, matching the old system's real
   type — a documentation date, not a precise instant.

5. **`contributor_role` (text, nullable) added to `contribution`**, filling the real gap found
   against the old system's `role` field. Same denormalized-cache pattern and rationale as
   `Event.actor_role`/`EventRecipient.recipient_role` — avoids a join on every read, accepted as
   the same deliberate, cheap drift risk already accepted elsewhere in this schema.

6. **`review_status` kept as an invented vocabulary, flagged for sign-off** — confirmed no
   historical precedent exists (the old system's real integrity mechanism was AI preening, not
   human review), so this is a genuinely new design decision, not a carried-forward feature.
   Same treatment as `ComplianceRecord.verification_status`/`ChecklistRun.overall_status`.

7. **Old `field`/`field_original`/`field_diff`/`visibility`/`preening_failed` are not carried
   forward.** `payload` (jsonb) replaces `field`; the diff/original pair is resolved by
   `Contribution`'s own append-only shape (design doc's own reasoning, confirmed consistent
   above); `visibility` and `preening_failed` have no confirmed real vocabulary/behavior to
   ground a decision on and no obvious equivalent need in the current design — left out rather
   than guessed at, flagged as an open question below.

8. **`ScoutVisit.photo_urls`/`gps_accuracy_m` kept, explicitly flagged as new-for-this-rebuild**,
   not a carried-forward feature — grounded instead in Farpost's own stated field-verified-data
   business model (per the source design doc's own reasoning), which is a legitimate basis even
   without old-system precedent.

9. **All three tables' `building_id`/`membership_id` FKs are `ON DELETE RESTRICT`**, matching
   this schema's universal default — none of these are pure child extensions the way `JobNotes`
   is of `Job`.

## Risks / Trade-offs

- **`category` being unconstrained text means a typo silently creates a new, disconnected
  staleness/contribution category** → Mitigation: this is the old system's own accepted
  trade-off, not a new risk introduced here; the known 8-value vocabulary is documented in this
  design doc for future reference by whoever builds validation UI/logic at the application layer.
- **No moderation workflow exists for `review_status`, so it may sit permanently `pending`
  in practice** → Mitigation: already flagged as needing Robin's real sign-off before being
  depended on, consistent with the other invented-vocabulary flags elsewhere in this schema.

## Migration Plan

Standard additive migration — three new tables, four new FKs, no existing table altered. No
rollback complexity beyond dropping the new tables.

## Open Questions

- Whether `visibility` (public/private, or some other real vocabulary) is still a needed concept
  on `Contribution` — no real historical vocabulary was confirmed, so nothing was invented; left
  for a future pass if a real need surfaces.
- Whether an equivalent to the old AI "preening" integrity mechanism (or a human review
  workflow to actually populate `review_status` beyond `pending`) is wanted at all — a real
  product decision, not a schema one, deliberately not answered here.
