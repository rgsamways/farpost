## Why

Nothing exists yet in the rebuilt Farpost repo beyond planning docs and process tooling — no Next.js app, no visible UI at all. Robin wants to see the new Farpost's actual look before anything else gets built, and has given a concrete, specific desktop layout (a full-width sticky brand header, aligned precisely to the 3-column framing already ported from robinsamways.ca) rather than an abstract wireframe. This change turns that into the first real, running piece of the rebuild.

## What Changes

- Scaffold a new Next.js (App Router, TypeScript, Tailwind) frontend at `web/` — nothing currently exists to build into.
- Port the 3-column desktop/laptop framing from `docs/handoff-2026-07-26-farpost-framing-scaffold.md` (tiered left nav, sticky-header center column, right rail + PageOutline anchor nav) — laptop/desktop breakpoint only. Mobile is a separate, later change (`docs/standard-methodology.md` rule 3: two shapes, one per breakpoint, not one shape stretched across both).
- Add a new full-width, sticky brand header band (not present in the original robinsamways.ca port) carrying the FARPOST wordmark + tagline, left-aligned to the left nav column's edge, and settings/sign-in icons right-aligned to the right rail's edge — replacing the icons' previous floating position in `RightRail.tsx`.
- Drop the left nav's own separate "Farpost" text label, now redundant with the new header.
- Apply Farpost's real brand tokens (navy/orange/off-white/slate, `docs/archives/farpost-brand-tokens.md`) and font (Inter, confirmed against the real legacy `farpost-web` app's shipped code) in place of the currently-ported scaffold's inherited robinsamways.ca monospace identity.
- Populate the left nav with Farpost's first real nav structure (Platform: Dashboard, Jobs > Open/In Progress/Completed, Buildings; Network: Professionals, Requests; Account: Billing, Team) — not placeholder labels.
- **BREAKING**: N/A — nothing exists yet for this to break.

## Capabilities

### New Capabilities
- `desktop-app-shell`: the laptop/desktop page framing every future Farpost page renders inside — the full-width sticky brand header, tiered left navigation, center content column, and right rail with an auto-generated in-page anchor outline.

### Modified Capabilities
(none — first change in the project, `openspec/specs/` is currently empty)

## Impact

- New `web/` directory: full Next.js project (package.json, tsconfig, Tailwind config, App Router structure).
- No backend/API impact — this change is frontend-shell only, no data fetching or auth wiring yet (the session-conditional sign-in icon renders in its default/signed-out state; wiring it to better-auth is separate, later work).
- No mobile-breakpoint impact — desktop/laptop (`xl:` and above) only, per the two-shapes-per-breakpoint rule.
