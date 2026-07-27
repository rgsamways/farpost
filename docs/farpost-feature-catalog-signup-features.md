# Feature catalog — signup-day features

**Status:** draft / planning doc — not an OpenSpec change yet. None of these are close enough to
build-ready for that (see "Recommended build order" below); several are still blocked on
external-data research the source lightbulb already flagged as undone.

**Source:** `c:\dev\robinsamways\docs\lightbulbs\rsw-lb-farpost-new-signup-features.md`
(2026-07-26, unscoped brainstorm). This doc turns that list's 11 items into per-feature specs,
in the shape requested for the account page's existing "Features" section
(`web/src/app/account/page.tsx`) and for each feature's own dedicated page.

**Baseline for every feature below:** available to a building owner (an active `Stake` on a
building) immediately after signup — no professional `Membership` required. Deviations from
that baseline are called out per feature. Where a feature reads or writes building data, it's
implicitly scoped to one of the owner's buildings; for owners with more than one building this
needs a "which building" selector, not called out per-item below since it's the same answer
every time.

**Two layers of "build path" text, don't conflate them:**
- The **engineering-honest version** below (data blocked, sequencing, real dependencies) — for
  us, drives what gets built when.
- A **consumer-facing "what's coming" teaser** for the actual account-page card — softer, no
  internal caveats like "data licensing unresearched." E.g. internally "BLOCKED on an
  unresearched construction-cost index" becomes, on the card, "Regional cost data — coming
  soon." Only the internal version is written out per-feature below; the public copy is a later
  copywriting pass once a feature is actually being built.

## Recommended build order

The 11 items split cleanly into four tiers by what's actually stopping them — this is the
single most useful thing to take from this doc before touching any of the individual specs:

1. **Buildable now, no external data needed** — #5 maintenance timeline, #6 seasonal reminders,
   #7 DIY-vs-pro helper, #8 systems passport. Pure computation over user-entered data or static
   reference content Robin/team can compile once. Natural first wave, and #8 in particular is
   the foundation several later features read from.
2. **Buildable once a prior item in this list exists** — #2 (needs #1's output), #10 (needs
   several others' outputs to synthesize).
3. **Blocked on real external data that hasn't been researched/confirmed** — #1 rebuild-cost
   estimator, #3 equity snapshot, #4 ROI estimator, #9 risk awareness. Same open question the
   source lightbulb already flagged: needs a research pass like the one already done for NAR/
   parcel data (`project_canada_gov_data_inventory_2026-07-12` memory) before any of these move
   from aspirational to buildable. That prior pass covered building/parcel *existence* data —
   it did **not** cover construction-cost indices, assessed/market value, hazard layers, or
   renovation ROI survey data, so none of that can be assumed to exist just because the parcel
   research came back mostly positive.
4. **Blocked on marketplace liquidity, not data** — #11 "who's nearby." A different kind of
   blocker than tier 3: no dataset to go find, just not enough real professionals signed up yet
   in most areas. Building this before there's real density risks the opposite of the intended
   effect (an empty list reads as "nobody's here").

---

## Recognizing what the home is worth

### 1. Rebuild-cost estimator
- **What it does:** Estimates what it would cost to rebuild the property from scratch today,
  using regional construction-cost data against the building's size/type/construction details.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Current estimate ($X, as of \<date\>); number of times re-run.
- **Sitewide usage stats:** Number of rebuild estimates generated this month/across Farpost.
- **Build path:** BLOCKED — needs a real regional construction-cost index or per-sqft cost
  table; not researched (open question inherited directly from the source lightbulb). Honest
  v1 that doesn't wait on an API: a manually-curated static cost-per-sqft table by
  province/region and building type, refreshed periodically, clearly labeled as an estimate.
  Upgrade path: swap in a live cost-index API once one is found and its licensing checked;
  later refine by construction quality tier and finish level.

### 2. Insurance coverage gap checker
- **What it does:** Short questionnaire (current coverage limit, policy type) compared against
  #1's rebuild-cost estimate to flag likely underinsurance.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Current flagged gap ($X under rebuild estimate) or "no gap detected."
- **Sitewide usage stats:** Share of checked properties showing a likely coverage gap — a real,
  honest number once there's usage, not a projected one.
- **Build path:** Sequenced directly after #1 — no independent data need beyond #1's output.
  v1: simple threshold rule (coverage < rebuild estimate → flag). Upgrade: factor in
  rebuild-cost inflation trend over time, scheduled re-check reminders, direct hand-off into
  Farpost's professional-matching flow (insurance broker/agent) when a gap is flagged — this is
  the doc's own named example of a feature that doubles as lead-gen back into core matching.

### 3. Home equity snapshot
- **What it does:** Self-reported purchase price and mortgage balance against a current
  estimated value, to show equity built.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Estimated equity ($X), last updated \<date\>.
- **Sitewide usage stats:** Number of owners actively tracking equity (deliberately not an
  aggregate dollar figure — that reads as an odd, faintly invasive stat to broadcast).
- **Build path:** BLOCKED, worse than #1 — needs a "current estimated value," which in Canada
  means comparable-sales or assessed-value data, and the 2026-07-12 gov-data-inventory pass
  already confirmed assessed value is gated in every province researched, with no open bulk
  source anywhere. Honest v1: let "current estimated value" be a self-reported, owner-updated
  number, explicitly labeled as the owner's own estimate, not a market valuation. Upgrade: a
  real AVM (automated valuation model) integration if and when one exists at a reasonable
  cost/license — genuinely unknown today, not just unresearched.

### 4. Home improvement ROI estimator
- **What it does:** Pick a common upgrade (kitchen remodel, roof, deck) and see typical cost vs.
  resale value recovered, grounded in the real estate industry's own Cost vs. Value survey data.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Number of upgrades compared; most recent comparison.
- **Sitewide usage stats:** Most-compared upgrade across Farpost this month — a genuinely fun,
  engagement-shaped stat, not just a vanity number.
- **Build path:** BLOCKED — the named Cost vs. Value survey is a US industry publication
  (Remodeling Magazine's); whether a Canadian equivalent exists and is licensable hasn't been
  checked at all. v1 options: find and license a real Canadian-region survey if one exists, or
  ship with a clearly-labeled "illustrative, not survey-grounded yet" placeholder table rather
  than imply data backing that isn't there. Upgrade: real licensed data, per-region breakdown.

## Maintaining it well

### 5. Personalized maintenance timeline
- **What it does:** Generated from a few signup inputs (roof age, HVAC age, siding type)
  against published typical system lifespans — "your roof is 18 years old, average lifespan
  20–25, plan an inspection within 2 years."
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Number of systems tracked; next recommended action and due date.
- **Sitewide usage stats:** Number of active maintenance timelines; most common next-due system
  type this month.
- **Build path:** The most buildable item on this whole list. No live external API — just a
  static reference table of typical system lifespans by type (roofing, HVAC, water heater,
  siding, etc.), which is widely published, non-proprietary information easy to compile once.
  Depends on #8's systems-passport data as its input, not on anything unresearched. Real
  candidate to build in the first wave. Upgrade: factor in local climate severity, brand/model-
  specific lifespans, an inspection-history feedback loop (mark an item inspected/replaced to
  reset its clock).

### 6. Seasonal maintenance reminders
- **What it does:** Low-build-cost opt-in nudges tied to season (gutters before fall, furnace
  before winter).
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Reminders on/off; number sent; number acted on.
- **Sitewide usage stats:** Reminders sent this season; number of owners opted in.
- **Build path:** Buildable now — no external data dependency, just a static seasonal content
  calendar and a notification/delivery mechanism (not yet decided anywhere in this rebuild —
  email vs. in-app vs. SMS is an open build decision on its own). Natural pairing with #5 and #8
  since it reads the same underlying systems data. Upgrade: personalize by climate zone/region
  instead of one national calendar, add SMS, escalate an ignored reminder into #7's flow.

### 7. DIY-vs-pro decision helper
- **What it does:** Describe a problem in plain language, get a quick read on DIY-safe vs.
  needs-a-professional, with a direct path into Farpost's real matching flow when it's the
  latter.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Number of problems checked; number routed to a professional.
- **Sitewide usage stats:** Share of checks routed to a professional this month — doubles as a
  real marketplace-health/lead-gen KPI, not just a user-facing stat.
- **Build path:** Buildable now — no external data need. v1 is a content-authoring task, not a
  data-sourcing one: a curated rules/decision-tree covering common categories (electrical,
  plumbing, roofing, structural). Squarely in the first-wave tier, and one of the two items the
  source doc explicitly names as natural lead-gen back into core matching (the other is #2).
  Upgrade: move from static rules to LLM-assisted free-text triage once there's enough real
  usage to ground it; integrate directly with #11's professional preview.

### 8. Home systems "passport"
- **What it does:** A simple digital record of a building's key systems (roof, water heater,
  furnace, appliances, warranties), filled in over time by the owner.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Number of systems recorded; last updated.
- **Sitewide usage stats:** Total systems recorded across Farpost buildings.
- **Build path:** Buildable now — pure user-entered data, no external dependency. Needs a
  schema extension that ties directly into the still-undesigned
  `docs/lightbulbs/farpost-lb-building-document-library.md` gap (a building-level, not
  job-scoped, document/record store — manuals, warranties, deeds). This is the actual data
  foundation #5, #9, and #10 read from, so it's a strong candidate to build first or very early,
  not last, despite being item 8 on the original list. Upgrade: photo/manual/warranty document
  attachments (the "junk drawer" named directly in `docs/farpost-vision-and-positioning.md`),
  a professional-visible view once a job is opened against the building.

## Seeing the bigger picture

### 9. Neighborhood/regional risk awareness
- **What it does:** Flood zone, wildfire, or extreme-weather risk relevant to the property's
  actual location.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Current risk flags for this property; last checked.
- **Sitewide usage stats:** Number of properties flagged for at least one risk category.
- **Build path:** BLOCKED — the 2026-07-12 gov-data-inventory research pass covered
  building/parcel *existence* data, not hazard layers; nothing there confirms a flood/wildfire/
  extreme-weather dataset is open, per-property, and licensable. Some federal flood-risk mapping
  efforts are real and plausibly open, but that's a guess, not a confirmed finding — needs its
  own research pass before this is anything but aspirational. Don't ship a "risk score" without
  at least one confirmed, appropriately-licensed hazard layer behind it; a fabricated-looking
  risk flag would actively damage trust in a platform whose whole value prop is accurate
  building data. Upgrade once unblocked: multiple hazard types, risk trend over time,
  cross-reference into #2's insurance gap checker.

### 10. Home health score
- **What it does:** One composite, improvable number ("a credit score for your home") built
  from whatever's been entered across the other features.
- **Who it's for:** Building owner, baseline.
- **User's usage stats:** Score (N/100); change since last month.
- **Sitewide usage stats:** Average Home Health Score across Farpost.
- **Build path:** Deliberately sequenced last — a synthesis feature with no independent data of
  its own, so it can't be meaningfully built (or even fully speced) before at least a few of #1,
  #3, #5, #8, #9 exist to feed it. Flagging now rather than leaving it implicit: a composite
  "score" implies a defensible formula (weighting, what counts, how it behaves with partial/
  missing data) — that's a real design pass to do deliberately when the time comes, not
  something to bolt on informally onto whatever happens to exist by then.

### 11. (bonus) "Who's nearby" professional preview
- **What it does:** A preview of vetted professionals already active in the user's area for
  common services, before any commitment to a job.
- **Who it's for:** Building owner, baseline — the one feature in this list that's really about
  surfacing the *professional* side of the marketplace to an owner, rather than data about the
  building itself.
- **User's usage stats:** Number of professionals previewed in the user's area.
- **Sitewide usage stats:** Active professionals across Farpost's coverage area — a business-
  development metric more than a personal one; needs careful framing so it isn't a hollow
  number before there's real supply.
- **Build path:** Not a data-sourcing problem like most of the rest of this list — a marketplace
  cold-start/liquidity problem specific to Farpost itself. Showing "who's nearby" against zero
  or one real professional in a given area produces the opposite of the intended "glad I signed
  up" moment. Recommend gating this on reaching a real minimum professional density in a launch
  region, rather than building it generically and hoping supply catches up. The one item on this
  list where the honest build-path answer is "wait for real supply," not "ship a v1 now."

## Decided — where feature pages live in the app

**2026-07-27, Robin's call:** top-level `/features/[slug]` routes. Features are first-class
nav-level pages, on par with Buildings/Work/Connections — not nested under `/account` or under
a specific building. Implications, not yet built:

- The left tiered nav (`web/src/lib/navTree.ts` / `DrawerNav.tsx`'s still-placeholder
  `NAV_GROUPS`) gets its own "Features" group listing all 11, grouped by the three themes above.
- The account page's existing "Features" section (`web/src/app/account/page.tsx`) stops being
  the primary home for this content and becomes a personal-usage-stats summary that links out to
  the same `/features/[slug]` pages — no duplicated content, two entry points to one route.
- Each feature page owns its own "which building is this for" handling internally when it reads/
  writes building-scoped data, rather than the route itself encoding a building id. Degrades
  gracefully for the common near-term case of an owner with exactly one building.
