## Context

This is the first change to build a real `/features/[slug]` page and the first to write
application code that reads `stake-registry`. Nothing about the routing convention, the access
gate, or "recording a feature's usage" has a precedent in this codebase yet — every decision
below is a first-of-its-kind call other feature pages (#5 timeline, #6 reminders, #8 passport,
etc.) will likely follow, so getting the shape right here matters more than for a one-off change.

The catalog's own framing (`docs/farpost-feature-catalog-signup-features.md`, item #7) is
unusually concrete for a "buildable now" item: a curated decision tree over a fixed set of
categories, explicitly not LLM/free-text parsing in v1, with a named lead-gen hand-off that this
proposal already scoped down to a placeholder (see proposal.md) since the marketplace cluster
doesn't exist.

## Goals / Non-Goals

**Goals:**
- Ship one real, working `/features/diy-vs-pro` page: pick a problem category, answer a short
  branching set of questions, get a DIY-safe / needs-a-professional read.
- Establish the `/features/[slug]` route shell in the minimal shape this one feature needs —
  a slug-to-content lookup with a real 404 for unknown slugs — without inventing a generic
  "feature engine" no other feature has asked for yet.
- Gate access on an active building `Stake`, matching the catalog's literal baseline, and degrade
  honestly (a real empty state, not a fabricated result) when the signed-in user has none.
- Record the two user-facing usage stats the catalog specifies (problems checked, number routed
  to a professional) against a data shape that doesn't need to change when the next feature
  (#8, #6, etc.) needs the same two kinds of counters.

**Non-Goals:**
- No free-text/NLP problem description — the catalog names this explicitly as a future upgrade,
  not v1. v1 is category selection + structured branching questions.
- No real professional-matching integration — the hand-off is a labeled placeholder until the
  marketplace cluster exists (proposal.md's scoping call).
- No sitewide aggregate stat ("share of checks routed to a professional this month") — needs real
  usage to be honest; deferred per the catalog's own caution against fabricated-looking numbers.
- No multi-building selector. This feature's decision tree doesn't read any building-specific
  field (no roof age, no address) — its only relationship to a building is the access gate itself
  ("does this user own *a* building"), so which specific building is irrelevant to it. The
  catalog's "which building" selector note applies to features that actually read per-building
  data (e.g. #5's roof/HVAC ages); this one has nothing to select a building *for*.

## Decisions

**Decision: decision-tree content is a static TypeScript data module, not a database table.**
Matches the proposal's framing (content-authoring, not data-sourcing) and the catalog's own
description of this as curated, versioned content. A `web/src/lib/features/diy-vs-pro/tree.ts`
module exports a typed tree: category → ordered questions (each with a fixed set of answer
options) → either a next question or a terminal `{ verdict: "diy" | "pro", reasoning: string }`.
Changing the tree is a code change (reviewed, versioned, testable), not a CMS edit — appropriate
for curated safety-relevant content where a bad edit has real consequences.
- *Alternative considered:* a database-backed content table, editable by admins without a
  deploy. Rejected for v1 — no admin-authoring UI exists anywhere in the app yet, and this
  content genuinely needs review (it's safety-adjacent: telling someone "this is DIY-safe" when
  it isn't is a real harm), so a reviewed code change is the more honest v1 than an
  unreviewed admin text box that doesn't exist yet anyway.

**Decision: `/features/[slug]` is a single dynamic route with a slug-keyed content registry.**
`web/src/app/features/[slug]/page.tsx` looks up `slug` in a small registry
(`web/src/lib/features/registry.ts`) mapping known slugs to their page component; unknown slugs
call Next's `notFound()`. Only `"diy-vs-pro"` is registered by this change.
- *Alternative considered:* a literal `web/src/app/features/diy-vs-pro/page.tsx` static route,
  deferring the `[slug]` pattern until a second feature actually needs it. Rejected because
  Robin's 2026-07-27 routing decision already committed to `/features/[slug]` as the pattern for
  all 11 catalog items — building the literal-folder version now would mean redoing the routing
  layer on the very next feature change instead of once, for no savings today (the dynamic
  version costs the same amount of code as the static one).

**Decision: usage tracking is one small generic table, `feature_usage_event`, not a
per-feature table.**
Fields: `id` (uuid pk), `user_id` (text, FK to `user`, not null), `feature_slug` (text, not
null — soft-validated against the same registry as the route, not a DB enum, matching the
`Membership.role`/`role_type` pattern), `event_type` (text, not null, `CHECK (event_type IN
('checked', 'routed_to_professional'))`), `metadata` (jsonb, nullable), `created_at` (timestamptz,
not null, default now). This feature only ever writes `feature_slug = 'diy-vs-pro'`, but the
shape needs no migration when #6/#8/etc. need the same "count this kind of event for this
feature, per user" pattern — it's the minimum shape this feature already needs, not speculative
generality bolted on early.
- *Alternative considered:* a `diy_pro_check` table scoped to just this feature (category
  answered, verdict reached, timestamp). Rejected: the catalog's own usage-stat rows follow an
  identical "count of X, count of Y" shape across most of the 11 items, and a bespoke table per
  feature would mean re-deriving the same two-counter query pattern 10 more times for no benefit
  — this isn't designing for a hypothetical, it's recognizing a pattern already visible in a
  document that exists today.

**Decision: the access gate checks for any `stake` row matching `subjectType = 'building'`,
`status = 'active'`, `userId = <signed-in user>` — no filter on `role`.**
The catalog's baseline text is "available to a building owner (an active Stake on a building)"
with no narrower role qualifier, so the gate is implemented exactly that literally. A stake with
`role = 'tenant'` and `status = 'active'` on a building currently passes this gate too — flagged
here explicitly since the catalog's plain-English "building owner" phrasing could be read more
narrowly than what's actually implemented. Revisit if Robin wants ownership-only access.

**Decision: the "needs a professional" hand-off is an inline placeholder message plus a
`routed_to_professional` event write, not a link to any route.**
No `/pro-match` or similar route is created — there is nothing real behind it. The copy makes
the "coming soon" status explicit rather than implying a real connection is one click away, per
the standing rule against implying capability that doesn't exist yet.

## Risks / Trade-offs

- **[Risk]** A curated decision tree can be wrong or incomplete for a real safety-relevant
  problem (e.g. under-representing when "DIY" advice is actually unsafe for gas/electrical work).
  → **Mitigation:** v1's tree is deliberately narrow (4 named categories, not "any home problem"),
  every terminal node requires an explicit `reasoning` string so a wrong verdict is auditable
  post-hoc, and any category/question not confidently curated is left out of v1 rather than
  guessed at.
- **[Risk]** Because no building-claiming flow exists yet, the active-`Stake` gate will show the
  empty state for nearly all real accounts today, undercutting the point of shipping this now.
  → **Mitigation:** accepted as an honest, temporary state (explicitly called out in proposal.md)
  rather than building a workaround (e.g. a fake dev-only bypass) that would mask the real gap;
  the feature itself is still real and ready the moment claiming ships.
- **[Risk]** `feature_usage_event.feature_slug` has no database foreign key to a `Feature`
  table (none exists) — a typo'd slug would silently create orphaned rows.
  → **Mitigation:** the API layer validates `feature_slug` against the same registry the route
  uses, so a typo fails at the request layer, not silently at the database layer — same pattern
  already established for `Membership.role` vs. `role_type`.

## Open Questions

- Should the access gate eventually narrow to ownership-specific roles rather than any active
  stake on a building? Left open, flagged to Robin in this design rather than assumed either way.
- Where does `web/src/lib/features/registry.ts` end up living long-term once 10 more features
  register into it — still just a flat object at this size, revisit if it grows unwieldy.
