## 1. Project scaffolding

- [x] 1.1 Scaffold a new Next.js (App Router, TypeScript) project at `web/`
- [x] 1.2 Add and configure Tailwind CSS
- [x] 1.3 Add `lucide-react` (icons used by the ported `DrawerNav`/`RightRail`/`PageOutline`)
- [x] 1.4 Configure `next/font/google` Inter, exposed as a CSS variable (matching the real legacy app's `--font-inter` pattern)

## 2. Brand tokens

- [x] 2.1 Add CSS variables in `globals.css` for navy `#16243D`, signal orange `#E8743B`, off-white `#F3F1EC`, slate gray `#6B7280` (from `docs/archives/farpost-brand-tokens.md`), plus a `--font-mono` variable reserved for small metadata text
- [x] 2.2 Set `body` to use the Inter variable as its font-family, matching the old app's real Tailwind config (`sans: ["var(--font-inter)", "system-ui", "sans-serif"]`)

## 3. Layout mechanism

- [x] 3.1 Port `MobileNavContext.tsx` verbatim from `docs/handoff-2026-07-26-farpost-framing-scaffold.md`
- [x] 3.2 Port `navTree.ts` verbatim
- [x] 3.3 Port `slugify.ts` and `SectionHeader.tsx` verbatim
- [x] 3.4 Build `layout.tsx`'s 3-column composition, repurposing the ported masking-div structure (design.md Decision 1) into the real `Header` component described in section 6 below, rather than a decorative `aria-hidden` mask — remove `aria-hidden="true"` and ensure the interactive elements inside it have real accessible labels and a sane focus order (design.md's flagged accessibility risk)

## 4. Left navigation

- [x] 4.1 Port `DrawerNav.tsx`'s tiered/collapsible mechanism (recursive `NavItem`, `isExpanded`/`pathMatches`, mobile full-viewport takeover) — mobile-specific behavior can remain as ported for now, real mobile design is a separate change
- [x] 4.2 Remove `DrawerNav.tsx`'s own "Farpost" brand link/label — the header now owns the brand (spec: "Left nav omits a redundant brand label")
- [x] 4.3 Replace `NAV_GROUPS`' placeholder content with Farpost's real structure: Platform (Dashboard; Jobs > Open/In Progress/Completed; Buildings), Network (Professionals; Requests), Account (Billing; Team)

## 5. Right rail and page outline

- [x] 5.1 Port `RightRail.tsx`'s structural shell, removing the icon cluster that currently floats inside it (icons move to the header — section 6)
- [x] 5.2 Confirm the rail keeps a fixed `xl:w-64` width regardless of content (spec: "Right rail renders at a fixed width") — do not switch to a content-sized width
- [x] 5.3 Port `PageOutline.tsx` verbatim (DOM-scan mechanism, `MIN_SECTIONS_TO_SHOW` gating, `IntersectionObserver` active-section highlighting)
- [x] 5.4 Recalibrate `PageOutline`'s `IntersectionObserver` `rootMargin` and `main h2[id]`'s `scroll-margin-top` against this project's real sticky-header height (both the new brand header and the center column's own sticky per-page header stack, so the offset is the combined height, not just one of them)

## 6. New brand header component

- [x] 6.1 Build a new `Header` component rendering inside the repurposed masking-div structure (task 3.4): left column holds the FARPOST wordmark + tagline, right column holds a settings icon and a sign-in/account icon (default signed-out visual state — no better-auth wiring yet)
- [x] 6.2 Style the header as a full-width band (navy background, orange bottom rule), `position: sticky; top: 0`, sitting above the nav/rail's own sticky behavior
- [x] 6.3 Verify the wordmark's left edge and the icon cluster's right edge land exactly on the nav column's left edge and the rail column's right edge respectively, at the `xl` breakpoint

## 7. Center column

- [x] 7.1 Build the center column's own sticky per-page header (kicker + `h1` + rule), matching the static mock's `sticky-header` pattern
- [x] 7.2 Build one real page (e.g. `/dashboard`) using 2+ `SectionHeader` sections, so `PageOutline` has real content to scan instead of needing to fake any

## 8. Tests

- [x] 8.1 Component test: header wordmark and icon-cluster alignment against nav/rail column widths at the `xl` breakpoint
- [x] 8.2 Component test: `DrawerNav` renders the three real nav groups and does not render a "Farpost" label
- [x] 8.3 Component test: `PageOutline` renders no outline below `MIN_SECTIONS_TO_SHOW`, and renders/highlights correctly at or above it
- [x] 8.4 Visual/manual check: confirm rendered navy/orange match the brand token hex values exactly (not approximated Tailwind defaults)

## 9. Drift-audit prep

- [x] 9.1 Note in the change's final report whether the 256px right-rail width held up against the one real page built in task 7.2, or needs the tuning design.md already flagged as likely
- [x] 9.2 Note whether the `CLAUDE.md`-sourced color-scope assumption (design.md Decision 4) needs Robin's correction before archiving
