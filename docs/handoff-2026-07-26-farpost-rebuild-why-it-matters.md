# Handoff: why the Farpost rebuild matters, not just how to do it

**What this file is:** a companion to `docs/handoff-2026-07-26-farpost-rebuild-methodology-briefing.md`, written for the same audience — whichever session works inside Farpost's own repo on its rebuild. That file covers the *what* (tech stack, development practices, scaffold). This one covers the *why* — the actual weight behind this rebuild, which is easy to lose if all that survives the handoff is a list of conventions to follow. Read both before starting. Like the other robinsamways.ca-side handoffs, this can be deleted from wherever it lands once it's been read and acted on.

## This is not a rebuild for its own sake

Farpost is a real, live production system — 39 Beanie/MongoDB models, 39 Next.js routes, 75+ OpenSpec-tracked specs — that has actually shipped and actually runs: rural Ontario building intelligence, real professionals, real jobs, a real live dispatch engine, a real per-job platform fee already collected in production. This isn't a toy being rebuilt because a newer stack sounded interesting. It's being rebuilt because a real, structural bug was found in it, and because the stack it's moving to was found by evidence, not chosen on a whim.

## The actual bug that justified starting over

Diagnosing why Farpost's identity/roles model felt overcomplicated surfaced a real duplication: a `Professional` record carries a `roles: list[str]` field, and separately has ten per-role child tables — `adjuster`, `contractor`, `agent`, and so on — joined back to it by a bare string, with no real foreign key. "Role" is modeled two different ways at once, in the same schema, simultaneously.

The root cause matters as much as the bug itself: it wasn't a bad decision. `User`-as-root-identity was the *right* correction to an earlier, role-first design — but the retrofit that introduced it never removed the old skeleton it was meant to replace, so both versions kept running side by side. That's the generalizable lesson (`docs/lightbulbs/rsw-lb-role-modeled-twice-dev-log-entry.md`): a good fix, arriving late, that never finished the job of tearing out what it replaced. A rebuild is the honest way to actually close that gap, rather than layering a third partial fix on top of the first two.

## The stack was found, not picked

Auditing the real dependency files across Vocare, Farpost, Sreditor, and Smallburg — not deciding from a blank page — found that Vocare had *already* converged on Fastify, Drizzle ORM, Postgres, and better-auth before that combination was ever consciously named as "the stack" (`docs/lightbulbs/rsw-lb-own-stack-discovery-dev-log-entry.md`). The insight wasn't "here's a stack I like" — it was "I looked at what I'd already built and recognized the decision I'd already made, independently, more than once." Farpost's move onto that same stack is deliberate convergence onto evidence, not a fresh guess.

The Fastify-over-Express half of that stack has its own separate, real research behind it, not just inherited preference: Express went a decade without a major version and didn't have correct built-in async/await error handling until Express 5 (October 2024); Fastify was designed from 2016 onward specifically to fix that, plus schema-first validation and plugin encapsulation as first-class features. Choosing Fastify anyway — despite Express having roughly 10x the downloads and being the framework most job postings name explicitly — was a knowing trade of market visibility for technical merit (`docs/lightbulbs/rsw-lb-fastify-vs-express-dev-log-entry.md`).

## There's a real personal stake in this, not just an engineering one

Two attempted AI-conducted technical interviews surfaced something worth being honest about: fast, cold, timed recall of syntax-level terminology is a real weak spot, even though the actual reasoning ability those interviews were supposedly testing — diagnosing a bug, explaining why it broke — held up the whole time. The gap wasn't understanding; it was retrieving the right word for something already understood, fast, out loud, on the clock (`docs/lightbulbs/rsw-lb-ai-interview-format-mismatch-dev-log-entry.md`). Rebuilding Farpost in a stack chosen for genuine hands-on depth, not just reading-level familiarity, is a direct, deliberate response to that — proof of real capability that a timed format can miss, built the slow way rather than crammed for.

## This rebuild is deliberately decoupled from everything else in flight

Robin is running several things in parallel right now — this Farpost rebuild, the robinsamways.ca site itself, and a separate suite of apps (Vocare, plus two newer, still-unscoped ideas: Jernel, a journaling engine, and Baby Kitty, a multi-calendar coordination tool). It would be easy to assume Farpost's rebuild is blocked on or blocking that suite work — it explicitly is not. The sequencing decision, made directly: Farpost's rebuild proceeds on its own timeline, for its own real reasons (the stack, the role-modeling bug, Mongo→Postgres) — independent of whether or when the suite apps come together. Don't let "but what about the suite" stall this work; that's a separate, deliberately decoupled track.

One thing *is* worth carrying forward cheaply, without it becoming a dependency: there's a longer-term, explicitly parked idea that Farpost could eventually let its real professional roles (a realtor, an adjuster, a contractor) and the homeowners on the other side of a transaction practice the real conversations their work involves, via a shared anchor/audience conversation-practice engine originally designed for Vocare. This is motivation and context for shaping Farpost's own identity/account design so it *could* plug into that later — not a design constraint that should slow this rebuild down, and not something to start building now.

## What's genuinely still undesigned — don't assume more has been decided than has

To keep this handoff honest rather than overstating how settled things are:

- **Offline-first** is a stated goal for Robin's projects generally but has no design or groundwork anywhere yet — it's new, not deferred.
- **Core objects beyond User and billing** (`docs/core-user-model.md`, `docs/core-billing-model.md`) remain undesigned. Those two are closed out and real; nothing else has been through the same evidence-based process yet.
- **Farpost's own optional role-curation layer** on top of the shared `Membership.role` (plain text, no enum, no admin-curation apparatus in the shared package) is Farpost's own call to make or skip — not required by the shared design.
- **The anchor/audience practice-engine integration** mentioned above is design-only, parked, and explicitly not something to start building as part of this rebuild.

## The point of writing this down separately

The methodology briefing tells you what conventions to follow. This file exists so the actual reason they're worth following — a real bug in a real production system, a stack arrived at through evidence rather than preference, and a genuine stake in doing this rebuild properly rather than quickly — doesn't get lost in translation between one repo and another.
