## Why

Farpost's identity/building schema (`membership-model`, `building-record`, `asset-tracking`,
`stake-registry`) is real as of `core-building-schema`, but nothing user-facing reads from it yet
— the account page's "Features" section is still a placeholder paragraph. `docs/farpost-feature-
catalog-signup-features.md` names the DIY-vs-pro decision helper (#7) as buildable now with zero
external-data dependency: it's a content-authoring task (a curated decision tree), not a
data-sourcing one, and doubles as one of the catalog's two named lead-gen paths back into core
matching (the other, #2 insurance-gap-checker, is sequenced after #1's rebuild-cost estimator and
still blocked). Building this first turns the platform's very first real feature page live,
using the already-decided `/features/[slug]` routing convention (2026-07-27) for the first time.

## What Changes

- Creates a new `/features/diy-vs-pro` page (served by a `/features/[slug]` dynamic route, so
  later features slot into the same route without a redesign): a short plain-language problem
  description form, a curated rules/decision-tree lookup (electrical, plumbing, roofing,
  structural categories) returning a DIY-safe / needs-a-professional read, and — when the read is
  "needs a professional" — a clearly-labeled hand-off step.
- The decision tree is static, versioned application content (a TypeScript data module), not a
  database table — matches the catalog's own framing of this as content-authoring, not
  data-sourcing, and needs no new schema.
- **Scoping call, stated plainly because the catalog's wording could be read as promising more:**
  the "direct hand-off into Farpost's real matching flow" cannot be a real functional match yet —
  the Job/dispatch/marketplace cluster is explicitly deferred (`core-building-schema`'s own
  proposal) and no professionals are onboarded. The hand-off in this change is a clearly-labeled
  "we'll connect you with a vetted professional — coming soon" step, not a working match. Wiring
  it to a real match is a follow-on change once the marketplace cluster exists, per
  [[feedback-no-pilot-ever-existed]]'s standing rule against implying capability that isn't real.
- Access follows the catalog's stated baseline: available to a building owner (an active `Stake`
  on a `Building`) immediately after signup. Since no building-claiming flow exists yet in the
  app, this will show its "no building yet" empty state for effectively every real account today
  — a real, current limitation, not something this change works around.
- Records two usage stats the catalog specifies: number of problems checked and number routed to
  a professional (the latter counts hitting the "coming soon" hand-off step, not a real match,
  until that follow-on change lands) — both scoped to the signed-in user's own history for now,
  with the sitewide aggregate (share of checks routed to a professional) deferred until there's
  real usage to aggregate.

## Capabilities

### New Capabilities
- `diy-pro-decision-helper`: the `/features/[slug]` route shell (generalized only as far as this
  one feature needs, not a speculative multi-feature engine), the curated decision-tree content
  and lookup logic, the DIY-vs-pro read, the placeholder professional hand-off step, and
  per-user usage-stat recording.

### Modified Capabilities
None — no existing capability's requirements change. This reads `stake-registry` (checking for
an active ownership `Stake`) without modifying it.

## Impact

- **New:** a `web/src/app/features/[slug]/` dynamic route, its decision-tree content module, and
  whatever usage-stat storage the design settles on (likely a small new table, scoped in
  design.md rather than assumed here).
- **Reads, doesn't modify:** `stake-registry` (`Stake` table) for the active-ownership gate.
- **Not affected:** `Job`/marketplace cluster (still doesn't exist), `membership-model`,
  `building-record`, `asset-tracking` schemas (no changes).
- **Explicitly deferred:** a real professional-matching hand-off (needs the marketplace cluster);
  the sitewide "share of checks routed to a professional" stat (needs real usage); LLM-assisted
  free-text triage (the catalog's own named upgrade path, not v1).
