# SR&ED Report

Generated from rollup dated 2026-07-28T22:39:11.869Z. Each section maps directly to CRA Form T661 Part 2.

---



---

## Excluded — not for filing

These groupings exist only to account for judged changes with no genuine SR&ED narrative. Do not copy into a CRA submission. Each change's own judgment reasoning is included below for transparency, ordered closest-to-eligible first, with forward-looking notes on what similar future work would need to document to qualify.

### Other judged, ungrouped work

**2026-07-27-building-provenance-schema**

*Proximity: Some signal — one CRA prong has real but incomplete signal*

This is fundamentally a database schema design and migration task: normalizing three previously-embedded document fields into standalone Postgres tables, informed by careful historical research rather than genuine unresolved technical uncertainty. The single moment of friction — a generated-column immutability error — is a known, documented Postgres limitation with a standard, well-understood fix, resolved in one pass without iterative experimentation or hypothesis testing. Everything else (category constraint decisions, contributor_role gap-filling, review_status flagged as new, ScoutVisit fields) reflects diligent requirements-gathering and design judgment, not technological uncertainty resolved through systematic investigation. None of the three CRA prongs are convincingly met.

**Path to eligibility (forward-looking):** For similar future schema/migration work to qualify, the team would need to encounter a genuine open technical question — e.g., a performance or correctness property of a proposed design that cannot be predicted from documentation or standard practice — and document a real investigation: multiple candidate approaches, why standard idioms failed or were untested for the specific case, measured before/after results (e.g., query plans, latency, concurrency behavior under load), and the resulting generalizable insight. A single documented Postgres error with a well-known one-line fix, verified by one test, does not rise to that bar; routine debugging against documented database behavior is expected professional competence, not SR&ED-eligible uncertainty.

**2026-07-27-core-building-schema**

*Proximity: Some signal — one CRA prong has real but incomplete signal*

This is the implementation phase of an already-fully-designed schema: field lists, constraint choices (text+CHECK over ENUM), cascade rules, and index plans were all decided in a prior design session and this change mechanically translates them into Drizzle files and a migration. A competent engineer following the three referenced design docs could produce this same output without needing to resolve any open technical question — the 'Open Questions' section explicitly confirms nothing here was left undecided in a way that blocks implementation. The two genuine technical snags (a drizzle-kit type-allowlist bug, a missing PostGIS extension in the dev container) are real but localized debugging of tooling/infra defects, not systematic investigation of a technological uncertainty central to the feature. That narrow signal isn't enough to carry the whole change to eligibility.

**Path to eligibility (forward-looking):** If future schema work like this encounters a genuine unresolved design question — e.g., how to enforce a cross-table invariant that isn't representable as a plain constraint, or how a polymorphic FK pattern should behave under concurrent writes — document the specific alternatives considered, why standard database/ORM patterns didn't resolve it outright, and the reasoning or experiments used to choose an approach. Tooling bugs like the drizzle-kit geography-quoting issue are worth recording as engineering notes but won't by themselves clear the bar unless they required a nontrivial technical investigation whose outcome was genuinely uncertain in advance.

**2026-07-27-sign-in-and-account-pages**

*Proximity: Some signal — one CRA prong has real but incomplete signal*

Most of this change — building `/sign-in` and `/account` pages wired to an existing auth client, and extending an already-established mobile dual-link header pattern to desktop — is routine application of known patterns explicitly copied from reference implementations (robinsamways.ca, Vocare, mobile-app-shell). The one place with a real technical wrinkle, the callbackURL cross-origin redirect bug, was resolved by manual testing plus copying a pattern already proven in another codebase, not by systematic hypothesis-driven experimentation into genuinely unknown territory. A competent developer familiar with the library's docs/config could plausibly have anticipated or quickly diagnosed this via standard debugging. The bar for SR&ED requires more than discovering how a third-party library resolves a URL and then copying an existing fix.

**Path to eligibility (forward-looking):** If a future change encounters a genuine library-behavior ambiguity like this again, document it as a named hypothesis (e.g., 'callbackURL resolution is ambiguous under X vs Y origin models'), show more than one candidate approach being tested against real observed behavior (not just adopting a peer codebase's known-working config), and record what general, transferable knowledge was produced beyond 'this one library does X in this one setup.' Routine UI construction against an existing SDK and copying an existing UI toggle pattern to a new breakpoint should not be included in that documentation, as neither involves a technical unknown.

**2026-07-26-header-spacing-and-icon-alignment**

*Proximity: Not close — no genuine technical question described*

This is a same-day cosmetic follow-up driven entirely by a reviewer's visual inspection, itemizing spacing, color, and alignment tweaks with exact pixel values and class names already known in advance. The design document explicitly disclaims any real technical decision, and the tasks are a straightforward checklist of Tailwind class edits plus standard build/lint/test/visual verification. There is no technological uncertainty a competent developer would need to resolve — the outcome and mechanism were known before work began.

**Path to eligibility (forward-looking):** This category of work — pixel-level spacing, color-token, and alignment adjustments made in direct response to a visual review, using known CSS/Tailwind mechanisms — is unlikely to ever qualify as SR&ED, since there is no underlying technological question being resolved. Eligibility would only become relevant if a future change involved a genuine unresolved technical question (e.g., a novel responsive-layout algorithm whose behavior across viewport sizes could not be predicted from standard practice), and that work documented a hypothesis, the experiments run to test it, and what was learned regardless of outcome.

**2026-07-26-mobile-app-shell**

*Proximity: Not close — no genuine technical question described*

This is standard front-end engineering: extending an existing responsive pattern (xl: styling) down to a new breakpoint, consolidating duplicate components, and implementing a previously-designed CSS toggle mechanism. Every design decision cites either an existing precedent (header-spacing-and-icon-alignment's h-auto approach, the framing-scaffold's dual-link toggle) or a straightforward alternative-considered/rejected analysis based on maintainability, not technical uncertainty. The 'measure against a running dev server, not hand-calculate' step is careful engineering practice, not experimentation resolving an unknown — the goal (matching padding to real rendered height) and method were never in doubt. No competent front-end developer would need to conduct research to solve this; it's routine application of known techniques and documented specifications.

**Path to eligibility (forward-looking):** This category of work — applying an established responsive design pattern to a new breakpoint, consolidating duplicate components, and implementing a previously-specified toggle mechanism — is unlikely to ever qualify for SR&ED, since it involves no genuine unknown about how to achieve the stated goal. Future work would only become eligible if it encountered a real technical unknown, e.g., an unexpected cross-browser rendering conflict with the CSS toggle mechanism that required forming and testing hypotheses about root cause, or a genuine performance/layout constraint whose solution was not obvious from existing patterns and required systematic experimentation to resolve. If that occurs, document the specific unknown, the hypotheses tried, the experiments/measurements taken to distinguish between them, and the resulting new technical knowledge — not just the calibration values themselves.

**2026-07-26-scaffold-desktop-framing**

*Proximity: Not close — no genuine technical question described*

This change is a straightforward frontend scaffold: standing up a Next.js app, porting already-built components verbatim, applying a specified color/font palette, and reusing an existing decorative div as a real header via known CSS techniques (fixed positioning, flexbox column-width matching). All the 'decisions' in design.md are business/design choices (which palette, which font, sticky vs fixed) resolved by reading documentation or checking a prior app's shipped code — not technical unknowns resolved through experimentation. Alignment between header and columns was achieved by reusing an existing shared-width mechanism, which is good engineering practice but not uncertain or novel. Nothing here required stepping outside standard web development practice.

**Path to eligibility (forward-looking):** This category of work — scaffolding, porting existing components, applying brand tokens, and standard CSS layout alignment — is routine software engineering and is unlikely to ever qualify for SR&ED regardless of documentation quality. For future changes in this project to clear the CRA bar, look for situations where the desired outcome could not be predicted by a competent developer using standard practice (e.g., a genuinely novel rendering/performance problem, an unresolved technical incompatibility between frameworks, or a measurable failure of a standard approach that required systematic experimentation to solve) — then document the specific hypotheses tested, why standard approaches failed, and the quantified before/after results.

**2026-07-26-settings-page**

*Proximity: Not close — no genuine technical question described*

This is a well-executed, well-documented feature port: an existing settings mechanism from a sister codebase is adapted with new visual styling and wired into two pre-existing animated behaviors. Every design decision cites the source implementation's own reasoning as justification, indicating the technical questions were already answered before this change began. Routine engineering — component composition, localStorage persistence, CSS custom properties, conditional class application — does not become SR&ED-eligible merely because it required care and testing.

**Path to eligibility (forward-looking):** This category of work (porting a known-working mechanism from one codebase to another with cosmetic restyling) is unlikely to ever qualify for SR&ED, since the defining feature of a port is that the technical uncertainty has already been resolved elsewhere. Future work would only become eligible if it encountered a genuinely open technical question not answered by the reference implementation — e.g., if adapting the mechanism to Farpost's specific rendering pipeline caused unexpected interactions (hydration mismatches, CSS specificity conflicts, performance regressions) that required forming a hypothesis, running experiments, and iterating to a novel solution. If that occurs, document the specific unresolved question, the alternatives tried, why standard practice didn't apply, and what was learned — not just that the final code works.

**2026-07-27-billing-subscription-schema**

*Proximity: Not close — no genuine technical question described*

This is a schema-only change that faithfully translates an already-fully-specified external design document into a Postgres table, correcting drift against a stale local summary. All decisions (field list, constraint values, PK convention) were resolved by referencing existing documentation or established project conventions, not by experimentation to resolve an unknown. The verification steps (migration review, live DB checks, constraint tests) are standard software QA practice, not systematic investigation of a technological uncertainty. No competent database engineer would find this beyond standard practice.

**Path to eligibility (forward-looking):** This category of work — implementing a schema from an already fully-specified design document — is unlikely to ever qualify for SR&ED regardless of how carefully it's done, since there's no technological question being resolved, only faithful translation of a spec into code. Future work would only become eligible if it involved a genuinely unresolved technical question (e.g., how to model a billing state machine to handle a currently-unsolved data-consistency or concurrency problem with no known solution) that required forming a hypothesis and testing it experimentally, with the outcome uncertain in advance — not simply verifying that a known constraint is implemented correctly.

**2026-07-27-checklist-schema**

*Proximity: Not close — no genuine technical question described*

This is a schema-only design/implementation task: defining tables, foreign keys, CHECK constraints, unique constraints, indexes, cascade rules, and relations, then verifying via generated SQL, psql inspection, and unit/integration tests. Every decision documented (invented enum values, unique constraint addition, cascade behavior) is a routine design judgment call resolved by consulting prior documentation, precedent from earlier changes, and stated principles — not by confronting a genuine unknown about what is technically achievable. The explicit 'flagged for sign-off' items (overall_status vocabulary) are business/domain judgment calls, not technological uncertainty. No experiment tested whether an approach would work; all steps are translation of an already-worked-out design into code, plus conventional verification testing. This is standard software engineering practice, ineligible under the CRA test.

**Path to eligibility (forward-looking):** This category of work (translating a finalized design into Drizzle/Postgres schema files following an established convention) is unlikely to ever qualify for SR&ED, because it is definitionally an application of known techniques with no open question about feasibility or approach. If a future change in this area did involve genuine uncertainty — e.g., an unproven data model needed to support conflicting versioning/consistency requirements where the correct relational structure was not knowable in advance, or a novel constraint-enforcement mechanism whose behavior under concurrent writes was uncertain — the team would need to document the specific technical question, the alternative approaches tried and why they failed or fell short, and the concrete data/tests that resolved the uncertainty, rather than a straightforward translation-and-verification record like this one.

**2026-07-27-event-log-schema**

*Proximity: Not close — no genuine technical question described*

This change is careful, disciplined schema design work: translating a design doc into Drizzle tables, catching a type discrepancy against a real built table, and verifying via tests and live DB inspection. But nothing here reflects genuine technological uncertainty as CRA defines it — the 'correction' found (uuid vs text) was resolvable by simply looking at an existing table's column type, not by experimentation. The indexing choices, cascade rules, and constraint patterns are explicitly described as continuing 'established conventions' from prior changes, i.e. routine, repeatable engineering. There is no described hypothesis about an unknown technical outcome, no experimentation among competing approaches, and no new technical knowledge generated beyond correctly applying known conventions to new tables. This is solid routine schema engineering, not SR&ED-eligible R&D.

**Path to eligibility (forward-looking):** This category of work — schema design and translation of an existing design doc into database tables, with verification against another already-built table — is unlikely to ever qualify as SR&ED, since it is fundamentally the application of known engineering conventions rather than resolution of a technical unknown. If a future schema change instead confronted a genuine unresolved question (e.g., an untested indexing/partitioning strategy needed to meet a specific, unverified performance target under real production load, where the correct approach could not be determined from documentation or convention), that would need to be framed as a hypothesis, tested with concrete before/after measurements, and the outcome (including any failed approaches) documented at decision time to support an eligibility claim.

**2026-07-27-job-dispatch-schema**

*Proximity: Not close — no genuine technical question described*

This change is a well-executed, carefully documented schema build-out that faithfully implements a pre-existing design. Its hard parts are business/data-modeling judgment calls (status vocabularies, cascade rules, resolving stale doc language against archived code) and known tooling/database constraints (drizzle-kit quoting, Postgres partial-index immutability), not unresolved technological uncertainty. A competent database engineer following the referenced design docs and standard Postgres/Drizzle practice could have produced this schema without needing experimentation to discover how to do it. That disqualifies it under prong 1, which cascades into prongs 2 and 3 not being meaningfully satisfied either.

**Path to eligibility (forward-looking):** This category of work — translating a finished design into database schema, applying known SQL/Postgres rules, and fixing previously-encountered tooling quirks — is unlikely to ever qualify as SR&ED, because the defining feature of eligible work (an unresolved technical question that standard practice can't already answer) is absent by construction: the fields, relationships, and constraints were already fully specified before this change began. Future work would only have a shot at eligibility if it hit a scenario where no established technique, library behavior, or documented database limitation existed for a problem (e.g., an untested distributed-consistency question, an unproven performance approach for a novel access pattern) and the team had to formulate a hypothesis, run experiments, and record why the outcome wasn't predictable in advance.

**2026-07-27-notification-subscription**

*Proximity: Not close — no genuine technical question described*

This change is a schema-only addition: one new table, its constraints, indexes, relations wiring, and tests. The 'research' performed was reading an old system's models and routes to determine a real-world vocabulary and confirm no separate delivery table was needed — a due-diligence/requirements exercise, not resolution of a technological uncertainty. Every design decision (CHECK constraint pattern, nullable column over sentinel string, ON DELETE RESTRICT, partial index) reflects conventions already established elsewhere in this same schema and industry-standard practice. There is no described moment where the outcome of a technical approach was unknown and had to be discovered through experimentation; it's careful, well-documented routine database design.

**Path to eligibility (forward-looking):** Pure schema/data-modeling changes like this — table definitions, constraints, indexes, migrations grounded in requirements research — are routine database engineering and are unlikely to ever qualify for SR&ED on their own. If a future related change (e.g., the fan-out/matching engine mentioned as an open question, especially resolving prefix/wildcard event-type matching or optimizing the 'most performance-critical index in the schema' under real production load) surfaces a genuine unresolved technical question — such as whether a given indexing or matching strategy can meet a specific latency/throughput target — document the specific failure of standard approaches, the hypotheses tested, the experiments run with measured results, and what was learned even if the approach failed. That kind of engine-level work is a more plausible candidate than the schema definition itself.

**2026-07-27-scaffold-fastify-backend**

*Proximity: Not close — no genuine technical question described*

This is textbook routine engineering: scaffolding a backend by directly copying a proven reference architecture from another working codebase. The design doc itself repeatedly emphasizes 'proven, running code, not a pattern recalled from documentation' and 'reusing that workflow rather than the faster-but-unversioned alternative' — these are engineering judgment calls among known options, not resolutions of technological uncertainty. A competent developer with access to Vocare's codebase could produce this scaffold via standard practice. The lone original element (DB-aware /health check) is trivial (a SELECT 1 query) and involves no uncertainty about whether or how it could be done.

**Path to eligibility (forward-looking):** This category of work — scaffolding infrastructure by mirroring an existing, working reference implementation — is unlikely to ever qualify for SR&ED, since by definition it reuses a known solution rather than confronting an unresolved technical question. Future work would only become eligible if it encountered a genuine unknown, e.g. the reference architecture didn't transfer cleanly to a new constraint (a scaling limit, an incompatible dependency version, a novel integration point with no precedent) and the team had to form a hypothesis, test multiple approaches, and document why the standard approach failed before arriving at a new one. Documenting that specific failure-and-iteration trail at the time it happens is what would be needed.

**2026-07-27-systems-passport**

*Proximity: Not close — no genuine technical question described*

This change is a textbook example of routine, if well-executed, application development: porting a proven auth pattern verbatim, writing standard authorization checks and REST endpoints with built-in framework validation, and building a client-side-gated page matching an existing convention. The team explicitly avoided invention in favor of checking real references directly at every design decision, which is good engineering practice but is the opposite of unresolved technological uncertainty. The one real bug encountered (CORS default methods blocking PATCH) was diagnosed and fixed using known facts about the framework's defaults, not resolved through a scientific method. No competent full-stack developer would find any of this beyond standard practice.

**Path to eligibility (forward-looking):** This category of work — CRUD feature-building using established internal or ported patterns — is unlikely to ever qualify for SR&ED, since by design it deliberately avoids technological uncertainty (patterns are checked and reused rather than invented). Future work would only become eligible if the team hit a genuine unknown that standard practice and documentation could not resolve in advance — for example, if adapting Vocare's auth pattern had to be substantively redesigned to handle a novel authorization model with no established solution, and the team had to form and test hypotheses about which design would work. In that case, document the specific technical question, the alternatives tried and why they failed, and the resulting new insight — not just that a reference implementation was consulted.

**2026-07-27-wire-better-auth**

*Proximity: Not close — no genuine technical question described*

This is a textbook example of routine software engineering: applying a previously-solved integration pattern (ported verbatim from a working reference implementation) to a new but structurally similar context, plus building a table whose shape was already fully specified in a separate design document. The proposal and design docs repeatedly emphasize that decisions were 'already resolved,' 'confirmed directly,' or 'ported ... not guessed at' — the opposite of technological uncertainty. No experimentation, hypothesis testing, or failed/iterated approaches are described; the only open item (real email delivery unverified due to missing API key) is a deployment/provisioning gap, not a technical unknown resolved through investigation.

**Path to eligibility (forward-looking):** This category of work — wiring a known, previously-validated third-party library configuration into a new codebase per a pre-existing internal design spec — is unlikely to ever qualify as SR&ED, because by definition it reuses solved problems rather than confronting new ones. If a future change in this space did encounter a genuine unknown (e.g., an undocumented incompatibility between better-auth's session hijacking and a specific Fastify plugin ordering that required testing multiple approaches to diagnose and resolve), that would need to be documented at the time: what was tried, why the outcome wasn't obvious from documentation or standard practice, and what was learned that generalizes beyond this one integration.

**2026-07-28-systems-passport-dev-seed**

*Proximity: Not close — no genuine technical question described*

This change is well-documented routine engineering: a dev-seed tooling library and script built by directly reusing an already-existing, already-tested authentication flow and already-existing schema fields, following a known idempotency pattern (lookup-by-natural-key vs random UUID, which the design doc itself frames as an alternative-considered decision, not an uncertainty). The 'Context' section of design.md explicitly states three things were 'checked directly before designing' rather than being unknown — this is diligence, not uncertainty resolution. Verification steps (running the script, checking psql row counts, browser screenshot checks) are standard QA/testing practice, not systematic experimentation to resolve an unknown. Nothing in the proposal, design, or tasks documents a genuine unresolved technical question that could not be answered by a competent developer using standard practice and existing documentation/tests in the codebase.

**Path to eligibility (forward-looking):** This category of work — building reusable dev-tooling/test-fixture scripts by composing already-existing, already-tested application code paths and schema fields — is unlikely to ever qualify for SR&ED, because by design it deliberately avoids introducing anything novel or uncertain (as this change's own design doc states, it reuses known patterns and explicitly rejects introducing new mechanisms). If a future change encounters a genuine technical unknown (e.g., an auth or concurrency behavior that is not already covered by existing tests and whose outcome cannot be predicted from documentation), it should document what specifically was unknown in advance, what alternative approaches were hypothesized, and what experiment or measurement resolved the uncertainty — rather than simply confirming that known techniques work as expected.
