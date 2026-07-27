# Handoff: what to know before building starts on Farpost's rebuild

**What this file is:** a consolidated pre-build briefing, written from inside the
robinsamways.ca repo, for whichever session works inside Farpost's own repo on its
rebuild. Farpost is its own independent project in its own repo — it is not a "piece" or
a "silo" of robinsamways.ca (that concept is retired entirely, 2026-07-25). This file
exists only because the conventions below were worked out, tested, and proven across
Robin's other projects (mainly robinsamways.ca itself and Vocare) before Farpost's rebuild
started, and he wants them adopted here by his own explicit choice — not because Farpost
is organizationally part of anything else. Read this whole file, and the four documents it
points to, before writing any code. Once picked up and acted on, this file (and the other
robinsamways.ca-side handoffs it references) can be deleted from wherever it landed —
none of them were meant to live permanently outside robinsamways.ca's own `docs/`.

## The four things to actually read

1. **`docs/standard-methodology.md`** (robinsamways.ca repo) — the tech stack decision and
   why (Fastify + Drizzle + Postgres + better-auth, evidence-based not asserted), the
   mobile/desktop scaffold split, and the development-practices rule summarized below.
2. **`docs/handoff-2026-07-26-farpost-framing-scaffold.md`** (robinsamways.ca repo) — the
   actual current source code for the laptop/desktop scaffold: tiered left nav, sticky
   center header, right rail with account/settings icons plus an inline anchor nav.
3. **`docs/core-user-model.md`** (robinsamways.ca repo) — the shared identity design
   (better-auth's own `user` table + a generic `Membership` table, `role` as plain text,
   distributed as a git dependency).
4. **`docs/core-billing-model.md`** (robinsamways.ca repo) — the shared billing shapes
   (one uniform $12/year subscription, a postpaid fulfillment fee, a prepaid credit pack).

## Tech stack, in one paragraph

Fastify, Drizzle ORM, Postgres, better-auth — not chosen from a clean slate, found by
auditing what Vocare had already converged on before that combination was ever
consciously named as "the stack." The Fastify-over-Express half is separately backed by
real comparative research (Express's decade-long major-version gap, no correct built-in
async error handling until Express 5 in late 2024, vs. Fastify's schema-first/async-native
design from 2016 onward) — a deliberate, evidence-based trade against the more
market-visible choice, not an unresearched default.

## Development practices — the part most worth getting right before anything else starts

This is the half of "how we build" that's easiest to skip because it doesn't show up in a
tech-stack list, and it's the one Robin was most explicit about wanting understood clearly
before this rebuild begins:

- **Write the plan before writing code.** A proposal (why), a design doc for anything with
  a real technical decision or ambiguity (how, with alternatives considered), explicit
  testable requirements, and a task checklist — agreed *before* implementation, not
  reconstructed afterward to match whatever got built. robinsamways.ca uses OpenSpec as the
  tool for this; adopt whatever tool fits Farpost's repo, but keep the actual discipline —
  spec first, code second.
- **Separate the planning session from the building session.** Don't let one session both
  invent scope and implement it in the same continuous flow with no checkpoint in between —
  that's exactly how scope creep or an unvetted architectural choice slips in unnoticed.
- **Tests ship in the same change as the feature**, representative of the actual new
  behavior, not deferred to a "we'll add tests later" pass that never quite happens.
- **A drift audit is a real re-check, not a rubber stamp.** After something is built,
  check the literal, current spec text against what was actually implemented — not just
  "does it run," but "does the spec's own wording still describe the truth." Concretely
  proven necessary today, more than once: a report can say "drift-audited and synced" in
  good faith and still miss a stale sentence a second, independent read catches.
- **Log real bugs, decisions, and handoffs contemporaneously**, in enough detail that a
  different session — or the same session a week later — can pick up exactly where the
  last one stopped without re-deriving context from scratch. robinsamways.ca's
  `docs/issues.md` is the concrete shape this takes: literal handoff text given, literal
  resolution recorded, not just a checkbox.
- **Give unscoped ideas a real, individual home** the moment they're noticed, rather than
  letting them live only in chat history until someone happens to remember them.
- **Track a code-health trend line, not just a point-in-time check** — line count,
  complexity, and duplication, measured at real checkpoints, specifically so creeping
  duplication gets caught early instead of discovered as a refactor emergency later.

## Scaffold, in one paragraph

Two shapes, one per breakpoint, not one shape stretched across both. Mobile keeps Vocare's
own already-proven house style (simple header, footer nav). Laptop/desktop adopts
robinsamways.ca's own real, shipped framing — the actual current source is in
`docs/handoff-2026-07-26-farpost-framing-scaffold.md`, including what's directly portable
(the layout/interaction mechanism) versus what Farpost has to supply itself (nav content,
theme, wiring the session-conditional icon to better-auth instead of robinsamways.ca's own
magic-link session handling).

## The one thing to get right before starting

None of the four documents above are a request to copy robinsamways.ca's code verbatim
into a different product with different content and a different backend. They're a
request to adopt the *discipline* and the *stack decision* — evidence-based, already
proven across two other real projects — while building Farpost's own actual thing, on its
own actual timeline, as its own actual project.
