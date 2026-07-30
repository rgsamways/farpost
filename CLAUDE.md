# Farpost — rebuild, started fresh 2026-07-26

This is a from-scratch rebuild. On 2026-07-26 the entire previous codebase (FastAPI/Beanie/MongoDB backend, Next.js frontend, 75+ OpenSpec specs) was archived and this repo was wiped to a blank slate on purpose — not a merge, not a migration in progress. Nothing in the old codebase carries forward by default.

## Guard rule — read this before assuming anything about "how Farpost works"

Do not assume any model, table, route, file path, module name, or architectural pattern from the old codebase exists here, is planned here, or should be replicated here. In particular: the old identity model doubled up "role" two different ways at once (a `roles: list[str]` field on `Professional`, plus ten separate per-role child tables joined by a bare string) — that duplication is the actual bug that justified this rebuild. If a suggestion (from Claude or from old notes) starts recreating that shape, or any other old shape, without a fresh decision, stop and flag it rather than continuing.

If you need to check what the old system actually did — for a lesson, not as a template — it's fully preserved:
- `github.com/rgsamways/farpost-legacy` (GitHub, full commit history)
- `c:\dev\archives\farpost` (local copy, includes files that were never committed to git)

## What's already decided for this rebuild

Read `docs/handoff-2026-07-26-farpost-rebuild-methodology-briefing.md` and `docs/handoff-2026-07-26-farpost-rebuild-why-it-matters.md` in full before writing a plan or any code — they carry the real reasoning, not just a conclusion. In short:

- **Stack:** Fastify + Drizzle ORM + Postgres + better-auth (Node.js/TypeScript) for the backend — found by auditing what Vocare had already converged on, not chosen from scratch. Frontend: Next.js (framework carries over as a choice, the app itself does not).
- **Scaffold:** `docs/handoff-2026-07-26-farpost-framing-scaffold.md` has real source for the 3-column layout (tiered left nav, sticky-header center column, right rail with an auto-generated "on this page" outline) ported from robinsamways.ca. `docs/farpost-framing-mockup.html` is a plain black/white static preview of the same shape.
- **Brand:** `docs/archives/farpost-brand-tokens.md` (+ card preview images) has the confirmed color palette (navy `#16243D`, signal orange `#E8743B`, off-white `#F3F1EC`, slate gray `#6B7280`) and candidate fonts (wordmark: Archivo Narrow or Barlow Condensed, not yet locked; body: Inter or Source Sans, not yet locked).
- **Process:** `docs/standard-methodology.md` — spec before code, planning and building kept as separate sessions, tests ship with the feature, contemporaneous handoff/issue logging, a real drift-audit before anything is called done.

## State as of 2026-07-26

Nothing built yet. No OpenSpec setup, no proposal, no scaffold code. The next real step is a written plan (proposal + design doc, per the methodology above) — not jumping straight into scaffolding.

## Sreditor

This project uses [Sreditor](https://github.com/rgsamways/sreditor) to capture SR&ED-eligible work as it happens, alongside the OpenSpec propose/apply/archive workflow:

- `sreditor init` -- run once, early, to record the project's stated goal, genuine technological uncertainty, and success criteria.
- `sreditor probe <change-id>` -- optional, before implementing a draft change that feels genuinely uncertain; captures the uncertainty and alternatives you're weighing.
- `sreditor reflect` -- append a dated revision to the anchor document as understanding evolves.
- `sreditor judge` / `sreditor rollup` / `sreditor report` -- run later, retrospectively, to judge archived changes and produce a T661-shaped report.
