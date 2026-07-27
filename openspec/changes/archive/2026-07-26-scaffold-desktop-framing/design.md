## Context

`docs/handoff-2026-07-26-farpost-framing-scaffold.md` already ported robinsamways.ca's 3-column framing mechanism (`DrawerNav`, `RightRail`, `PageOutline`, `MobileNavContext`, `navTree.ts`, `slugify.ts`/`SectionHeader.tsx`) as real source, explicitly flagging what's mechanism (portable) vs. content (Farpost's own to supply): nav content, theme colors, and a new element that port didn't anticipate — a full-width brand header. Robin hand-mocked the header requirement directly (a screenshot of `docs/farpost-framing-mockup.html`, edited in GIMP) rather than describing it abstractly, so this design works from that concrete reference plus his direct chat answers, not from guesswork.

## Goals / Non-Goals

**Goals:**
- Land the exact desktop header/alignment behavior Robin specified: full-width sticky brand band, wordmark left-aligned to the nav column's edge, settings/sign-in icons right-aligned to the right rail's edge, no drift between the header's alignment and the columns beneath it.
- Resolve, with real evidence rather than silent assumption, the two open branding questions raised this session: which font, and whether the printed-card brand palette applies to the web app.
- Ship a real, buildable Next.js project — this change stands up the entire frontend from nothing.

**Non-Goals:**
- Mobile breakpoint (separate change, per the two-shapes-per-breakpoint rule).
- Auth wiring (the sign-in icon renders in its default/signed-out visual state only; wiring to better-auth session events is separate work once better-auth exists).
- Any data fetching — nav items render, but no real Jobs/Buildings/Professionals data exists yet.

## Decisions

### 1. Header alignment: extend the existing masking-div mechanism instead of inventing new alignment logic

The already-ported `layout.tsx` has a `pointer-events-none fixed inset-x-0 top-0 ... mx-auto flex max-w-6xl` div with three children mirroring the nav-width/content-width/rail-width columns — built purely as a decorative scroll mask in the original port. Rather than build a second, separate alignment system for the new real header content, this change repurposes that exact structure: same three mirrored-width columns, but the left column now renders the real wordmark/tagline and the right column renders the real settings/sign-in icons. Because both the header and the nav/rail below share literally the same column-width values, they can't drift out of alignment independently — no hand-tuned pixel offsets to keep in sync.

**Alternative considered:** absolutely-position the header's brand/icons using measured offsets matching the nav/rail widths. Rejected — two independent sources of truth for the same width value is exactly the kind of duplication this whole rebuild exists to avoid (per `CLAUDE.md`'s guard rule about the old role-modeling bug).

### 2. Right rail gets a fixed width, not a content-sized one

Robin's stated concern: long anchor-nav text could push the header's icons further right than intended. The already-ported scaffold already uses a fixed `xl:w-64` (256px) for the right rail, not a width that grows with content — this change keeps that fixed width rather than switching to something content-sized, so anchor text wraps within the column instead of resizing it. Documented explicitly as **not fully tuned** — Robin's own words, "we may have to tinker with that a bit" — 256px is a starting point carried over from the working static mock, not a measured-and-final value.

**Alternative considered:** a max-width (`max-w-*`) on a naturally content-sized rail, allowing it to shrink on pages with little anchor content. Rejected for this first pass — a fixed width is simpler and already proven in the static mock; revisit only if a real page makes the fixed width look wrong.

### 3. Font: Inter, matching what the old app actually shipped — not the still-open print-card candidate list

`docs/archives/farpost-brand-tokens.md` leaves the wordmark font (Archivo Narrow vs. Barlow Condensed) and body font (Inter vs. Source Sans) as open either/or choices — but that document is scoped to the printed NFC card design session specifically. The real, previously-shipped `farpost-web` app (checked directly in `c:\dev\archives\farpost\farpost-web`, not inferred) already had a concrete, working answer: Inter via `next/font/google`, used for both body text and the wordmark itself (`.wordmark` in `s04-tokens.css` sets `font-weight: 700` with no separate font-family — it's Inter Bold, not a condensed display face). This change carries that forward: Inter as the only sans font, a `--font-mono` variable available for small metadata text only (matching the old app's `JetBrains Mono` usage), no condensed display face introduced.

**Alternative considered:** finally lock in a condensed wordmark face (Archivo Narrow/Barlow Condensed) as originally floated for the print card. Rejected for this change — it was never validated in a real running app, unlike Inter, and introducing an untested font choice isn't a decision this scaffold change should make unilaterally. Worth a lightbulb if Robin wants to revisit the wordmark treatment later.

### 4. Color palette: the printed-card brand tokens, reconciling (not preserving) the old app's divergent implemented colors

The old `farpost-web` app's real CSS used `--navy: #0F172A` / `--orange: #f97316` (Tailwind slate-900/orange-500 defaults) — never reconciled with the later, printed-and-shipped NFC card palette (`--navy: #16243D`, `--orange: #E8743B`, off-white `#F3F1EC`, slate `#6B7280`, hairline navy `#2C3E5C`). `CLAUDE.md` itself calls the card palette "the confirmed color palette" without scoping that statement to print materials only. This change takes that framing at face value and uses the card palette as the web app's real token set, deliberately superseding the old app's un-reconciled colors rather than preserving them by default.

**Alternative considered:** keep the old app's Tailwind-default navy/orange since it was the actually-shipped web palette. Rejected — `CLAUDE.md` is the project's own overriding source of truth, and it names the card tokens as confirmed; silently keeping the old, never-officially-confirmed Tailwind defaults instead would be the guess, not the other way around.

**Flagged, not silently resolved:** whether `CLAUDE.md`'s "confirmed color palette" wording was meant to scope this project-wide or field/print-only is genuinely unstated in the source docs. Proceeding with project-wide per the literal wording; Robin should correct this call directly if that's not what he meant.

### 5. Header behavior: pinned while scrolling, dropped duplicate nav branding

Both confirmed directly by Robin (2026-07-26): the header stays pinned to the top of the viewport while scrolling, and the left nav's own "Farpost" text label is removed from `DrawerNav.tsx` now that the header owns the brand.

**Correction made during implementation, 2026-07-26 drift audit:** this decision originally said `position: sticky; top: 0`, contradicting Decision 1's reuse of the ported mask (which was always `position: fixed`). CLI correctly implemented `fixed` — it satisfies "pinned while scrolling" at least as well as `sticky` would, and Decision 1 is the more specific, actionable instruction — and flagged the contradiction rather than silently picking one. Wording here corrected to match what was actually decided and built, so this document doesn't preserve a self-contradiction.

## Risks / Trade-offs

- **[Risk]** The 256px fixed right-rail width might visibly clip or crowd real anchor-nav text once real pages exist, since it's carried over from the static mock rather than measured against real content. → **Mitigation:** flagged explicitly as untuned in this doc and in `tasks.md`; revisit width once a real content page with a real `PageOutline` exists.
- **[Risk]** The color-scope reconciliation (Decision 4) could be wrong if Robin actually intended the card palette to stay print-only. → **Mitigation:** documented plainly here and in `docs/farpost-story.md`'s next entry, easy to correct — it's a token-file change, not a structural one.
- **[Risk]** Reusing the masking-div mechanism for real (non-decorative) header content means that div's `aria-hidden="true"` needs to be removed and real interactive elements inside it need proper accessibility treatment (labelled icons, focus order) — it was never designed to hold real content before. → **Mitigation:** call this out explicitly as a task, not an incidental side effect.

## Open Questions

- Is the printed NFC-card brand palette meant to be Farpost's permanent web-app palette, or a placeholder until a dedicated web palette gets designed? (Decision 4's flagged assumption.)
- Should the condensed wordmark treatment (Archivo Narrow/Barlow Condensed) be revisited for the web app specifically, now that Inter's been carried forward as the practical default? Not blocking this change either way.
