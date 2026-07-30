# Handoff: systems-passport dev-seed tooling, and one naming problem to fix before it's committed

**What this file is:** a handoff from a robinsamways.ca-rooted session that did real, hands-on
work directly in `c:\dev\farpost` this session — not a design doc, a record of what actually got
built, run, and verified, plus one real, unresolved problem to fix before any of it is
committed. Written so a Farpost-native session can pick this up without re-deriving context.
Copy this into `c:\dev\farpost\docs\` (or wherever Farpost's own handoff convention expects it)
and read it fully before touching anything named "seed" in this repo.

**Process note, worth weighing honestly:** this work was done from a session rooted in
robinsamways.ca that turned out to have full filesystem access to this repo — not a native
Farpost session with this repo's own `CLAUDE.md` auto-loaded and enforced throughout. Everything
below was grounded in real, freshly-read files (schema, tests, existing docs), but at least one
real miss already happened *because* of this gap — see the naming problem below, found only
because Robin happened to ask a pointed question about it. Treat every claim in this doc the way
`farpost-drift-audit` already treats any implementer's report: independently re-check it against
real code before trusting it, don't just take it on faith.

## The one thing that actually needs doing: rename "seed"

**The problem:** this session built dev/test-data tooling and called it "seed" — `api/scripts/
dev-seed/`, `npm run seed:systems-passport`, `acquisitionChannel: "seed"`. That word is already
taken. `docs/core-building-model.md` (open question 4) names a real, different, already-planned
concept: **"Wave-0 bulk-seed data"** — pre-populating `Property`/`Building` rows platform-wide
from a *real* government address/building-footprint source (Hastings County OpenData, or the
NAR/NRCan sources from the 2026-07-12 gov-data-inventory research), so a new owner can *claim* an
already-existing row instead of creating one from scratch. That's real data, meant to become real
buildings. What this session built is the opposite: obviously-fake data, meant to never be
mistaken for real. Same word, two different, load-bearing meanings — the exact "one concept
represented two ways" shape this whole rebuild exists to avoid (see `CLAUDE.md`'s own guard rule
about the old `Professional.roles` duplication).

**Current real-world blast radius, checked directly, not assumed:**
- The literal string `"seed"` sits in `building.acquisition_channel` for one row in **both** the
  local dev database and the **production** database (Railway, `postgis-db` service) — a
  building slugged `robin-home`, created for manual testing.
- The term is baked into: `api/scripts/dev-seed/lib.ts` and `lib.test.ts`, `api/scripts/
  systems-passport/seed.ts`, `api/package.json`'s `"seed:systems-passport"` script,
  `openspec/changes/archive/2026-07-28-systems-passport-dev-seed/` (its own name, `proposal.md`,
  `design.md`, `tasks.md`, `specs/dev-seed-tooling/spec.md`), `openspec/specs/dev-seed-tooling/
  spec.md`, `docs/drift-audit-log.md`'s newest entry, and `docs/farpost-story.md`'s newest entry.

**Real risk level right now: low, but not zero.** The fake row is unmistakably fake (slug
`robin-home`, placeholder "Main roof"/"hvac" assets) and structurally nothing like what a real
Wave-0 bulk import would produce, so there's no live confusion today. But it's a landmine for
whoever builds Wave-0 later and greps for "seed" expecting only their own concept to show up.

**Robin's explicit instruction: hold off.** Nothing has been renamed yet, in code, docs, or
either database. He said "hold off" when this was found — don't fix it proactively without his
go-ahead. When he does want it fixed, the plan already discussed with him: rename the concept to
`fixture` (matches this codebase's own test files, which already call disposable test data a
"fixture" — reinforcing existing vocabulary, not adding a third term), applied consistently
across the code/docs list above, plus correcting the one `acquisition_channel` value in *both*
databases.

## What was actually built (real files, not a plan)

Farpost's `systems-passport` (its first real end-to-end feature) shipped and archived with a
named, real gap: verification used a one-off, unpreserved direct-DB insert. This change fixed
that with reusable, idempotent tooling:

- `api/scripts/dev-seed/lib.ts` — `signInOrCreateUser` (real magic-link flow, not a raw insert),
  `grantMembership`, `ensureOwnedBuilding`. Meant to be imported by every future per-feature seed
  script, not duplicated.
- `api/scripts/dev-seed/lib.test.ts` — 3 real-DB idempotency tests, passing.
- `api/scripts/systems-passport/seed.ts` + `npm run seed:systems-passport` — gives
  `rgsamways@gmail.com` admin+owner Memberships, an owned Building, two starter Assets.
- `docs/features/systems-passport/test-plan.md` — narrative test doc, one section per scenario,
  each with what's tested/how/the real code snippet, complementing (not replacing)
  `buildings.test.ts`/`assets.test.ts`.
- Full OpenSpec lifecycle: proposed, designed, specced, implemented, drift-audited, archived —
  see `openspec/changes/archive/2026-07-28-systems-passport-dev-seed/`. `openspec validate
  --specs --strict` passes clean (24/24) as of archiving.

**Nothing has been committed to git in either repo.** Everything above is real, on-disk,
uncommitted working-tree state. `git status --short` in `c:\dev\farpost` will show exactly the
files listed above as modified/untracked.

## What was actually verified (not just claimed)

- **Dev DB:** direct `psql` queries (not the script's own log output) confirmed row counts and
  field values after the first run, then re-confirmed identical ids/counts after a second run —
  genuine idempotency.
- **Dev browser:** headless Chromium via Playwright, using the technique already documented in
  `.claude/skills/run/SKILL.md` (real sign-in via the actual form, token pulled from
  `verification` — not mocked). Screenshots were viewed directly, not just a passing assertion.
  Found and fixed one real bug in the verification script itself along the way (Windows
  cmd.exe shell-quoting broke a `psql -c` call with nested double quotes — fixed by piping SQL
  over stdin instead). Verification script and screenshots were throwaway, deleted after use.
- **Production:** confirmed the `run`/`railway run` approach can't reach it at all — Railway
  keeps the database on a private, internal-only hostname
  (`postgis-db.railway.internal`), unreachable from outside Railway's network. What worked
  instead: Railway's public TCP proxy, found via `npx railway variables --service postgis-db
  --kv` (look for `RAILWAY_TCP_PROXY_DOMAIN`/`RAILWAY_TCP_PROXY_PORT`), combined with the same
  user/password/dbname as the internal `DATABASE_URL`. (`railway connect --tunnel-only` was
  tried first — needs an SSH key pair that doesn't exist on this machine; the public-proxy
  connection string sidesteps that without generating new keys.) Before writing anything, did a
  read-only check confirming production had exactly one real user (`rgsamways@gmail.com`, the
  same account, already existing from earlier `wire-better-auth` testing per
  `docs/drift-audit-log.md`), zero buildings, zero stakes — genuinely low-risk to seed. Ran the
  real seed script against it via that connection, then independently re-queried to confirm the
  rows landed correctly. This technique isn't written down anywhere in Farpost's own docs yet —
  worth adding to `.claude/skills/run/SKILL.md` or a new skill if production-DB access like this
  ever needs to happen again.

## Suggested next steps for whoever picks this up

1. Decide when to do the "seed" → "fixture" rename (Robin said hold off, not "never" — check
   with him before starting).
2. Consider formalizing the seed-marking convention discussed with Robin: replace the
   inconsistent `acquisitionChannel`/`metadata.seeded` pair with one purpose-built `text` field
   (matching the `membership.status`/`stake.status` enum-with-CHECK-constraint idiom already used
   elsewhere in this schema), added only to the two "root" tables (`Building`, `Membership`) —
   not all ~30 tables, which would recreate the exact duplication-drift risk this rebuild exists
   to avoid.
3. Whatever the final term ends up being, it needs to *not* collide with anything else already
   named in this repo's docs — that's the actual lesson here, not just "avoid the word seed."
