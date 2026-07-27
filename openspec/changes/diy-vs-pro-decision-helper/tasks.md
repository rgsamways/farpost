## 1. feature_usage_event schema (`diy-pro-decision-helper` capability)

- [ ] 1.1 Create `api/src/db/feature-usage-event-schema.ts` with the `feature_usage_event` table
      per `specs/diy-pro-decision-helper/spec.md`, following `membership-schema.ts`/
      `stake-schema.ts`'s existing conventions (file-per-table, `pgTable`, `check()` for the
      `event_type` CHECK constraint).
- [ ] 1.2 Register the file in `api/drizzle.config.ts`'s `schema` array.
- [ ] 1.3 Run `drizzle-kit generate`, review the generated SQL against the spec (confirm the
      `event_type` CHECK constraint is present in the SQL, not just the Drizzle TS), and apply
      the migration to the dev database.

## 2. API: recording and reading usage events

- [ ] 2.1 Add a Fastify route module (e.g. `api/src/features/feature-usage.ts`, registered from
      `app.ts` the same way `authPlugin` is) exposing `POST /api/features/:slug/events` — takes
      `event_type`, validates `slug` against a small server-side feature registry (reject
      unknown slugs before writing), requires an authenticated session, and inserts a
      `feature_usage_event` row for the signed-in user.
- [ ] 2.2 Add `GET /api/features/:slug/usage` — requires an authenticated session, returns the
      signed-in user's own `checked` and `routed_to_professional` counts for that `feature_slug`
      only (no cross-user data, no sitewide aggregate).
- [ ] 2.3 Add a route or reusable check (e.g. `GET /api/features/:slug/access`, or logic shared
      with 2.1/2.2) that checks for a `stake` row matching `subjectType = 'building'`,
      `status = 'active'`, `userId` = the signed-in user, per design.md's literal
      any-role interpretation.

## 3. Web: route shell and content

- [ ] 3.1 Create `web/src/lib/features/registry.ts` — a small slug-to-metadata registry, with
      `"diy-vs-pro"` as its first (and only) entry.
- [ ] 3.2 Create `web/src/app/features/[slug]/page.tsx` — looks up `slug` in the registry, calls
      Next's `notFound()` for unregistered slugs, otherwise renders the registered feature's
      component. Follow the existing `PageHeader`/`SectionHeader` pattern from `account/page.tsx`.
- [ ] 3.3 Create `web/src/lib/features/diy-vs-pro/tree.ts` — the curated decision-tree content
      module (electrical, plumbing, roofing, structural categories), typed so every terminal
      node requires a `verdict` (`"diy"` | `"pro"`) and a non-empty `reasoning` string, per
      design.md's decision to keep this reviewed static content rather than DB-backed.
- [ ] 3.4 Write the actual curated question/answer content for all four categories — a real
      content-authoring pass, not placeholder text. Keep v1 narrow (a handful of common problems
      per category) rather than attempting exhaustive coverage.

## 4. Web: the decision-tree component

- [ ] 4.1 Build the category-selection + branching-question UI component, walking `tree.ts` one
      question at a time, matching the existing app's visual conventions (`SectionHeader`,
      existing button/text styles from `account/page.tsx`).
- [ ] 4.2 On reaching a terminal `diy` verdict: show the verdict and reasoning, call
      `POST /api/features/diy-vs-pro/events` with `event_type: "checked"`.
- [ ] 4.3 On reaching a terminal `pro` verdict: show the verdict and reasoning, show the
      placeholder hand-off message (explicitly "coming soon", no link implying a real match), and
      call `POST .../events` twice — `"checked"` and `"routed_to_professional"` — or once with
      both effects handled server-side; either is fine as long as both rows land per spec.
- [ ] 4.4 Wire the access gate: call `GET /api/features/diy-vs-pro/access` (or equivalent) on
      page load; render the decision-tree component only when it passes, otherwise render the
      explicit "you need a claimed building" empty state instead of the tool.
- [ ] 4.5 Render the signed-in user's own usage counts (from `GET .../usage`) on the page.

## 5. Tests (ship with the feature, per `docs/standard-methodology.md` rule 6)

- [ ] 5.1 Add `feature-usage-event-schema.test.ts` (real-DB, no mocking, matching existing
      `*-schema.test.ts` conventions) covering: a `checked` event persists, an invalid
      `event_type` is rejected.
- [ ] 5.2 Add API route tests covering: `POST .../events` rejects an unregistered `slug`, rejects
      an unauthenticated request, and inserts a row for a valid authenticated request;
      `GET .../usage` returns only the signed-in user's own counts, scoped correctly when another
      user has events for the same feature.
- [ ] 5.3 Add a test covering the access gate: a user with an active `subjectType: 'building'`
      stake passes; a user with only a `historical` or `pending_verification` stake, or no stake
      at all, does not.
- [ ] 5.4 Add a frontend test covering: `/features/not-a-real-feature` 404s; a `diy` verdict
      records exactly one `checked` event and zero `routed_to_professional` events; a `pro`
      verdict records one of each; the hand-off message contains no link/button that suggests a
      real match.

## 6. Verification

- [ ] 6.1 Manually walk at least one full path per category (electrical, plumbing, roofing,
      structural) in a running dev instance, confirming each ends in a sensible verdict with
      real reasoning text, not placeholder copy.
- [ ] 6.2 Confirm, against the real dev database, that a test user with a manually-inserted
      active building `stake` sees the tool, and a test user without one sees the empty state.
- [ ] 6.3 Run `openspec validate --changes` (or the equivalent strict validation) and confirm it
      passes clean.
