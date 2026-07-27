## Context

Mobile currently has no real header at all — `DrawerNav.tsx` and `RightRail.tsx` each render their own small `xl:hidden` floating bar (a bordered brand pill, a bare hamburger button), transparent, with nothing behind them. Robin wants the same navy/orange sticky treatment `xl:` already has, plus a real 3-icon cluster, based on reference screenshots (Chrome's own toolbar icon-cluster style, and a mockup of the target header shape).

## Goals / Non-Goals

**Goals:**
- One real, visible mobile header: sticky navy band, orange bottom rule, brand text, three icons in the specified order.
- Consolidate the header into one component (`Header.tsx`) for both breakpoints, rather than two separate floating pieces that happened to both need the same treatment.
- Structurally support the sign-in→profile session-conditional swap now, even though nothing sets the real signal yet.

**Non-Goals:**
- Wiring the sign-in icon to real session state — that's `wire-better-auth`/`sign-in-and-account-pages`, later. This change only builds the DOM/CSS toggle mechanism and defaults it to signed-out.
- Building the `/account` page the profile icon will eventually link to — same reason, later change. The link target is wired now (`/account`) and will 404 until that change ships, matching the precedent already set by `/settings` and `/sign-in` in the very first scaffold change.

## Decisions

### 1. Consolidate into `Header.tsx`, remove the two floating mobile bars

`DrawerNav.tsx`'s brand pill and `RightRail.tsx`'s hamburger bar both need the exact same navy/orange/sticky treatment `Header.tsx` already owns at `xl:`. Keeping them as three separate places that each need to independently get this right is exactly the kind of duplication this project's process exists to avoid. `Header.tsx` gains a mobile-scoped render path (currently everything in it is `xl:`-only), and picks up `useMobileNav()` for the hamburger's `onClick` — making it a client component, which it wasn't before.

**Alternative considered:** just reskin `DrawerNav`'s and `RightRail`'s existing mobile bars to navy/orange in place. Rejected — that's two places sharing one visual identity by copy-paste rather than by structure, the same problem already fixed once for desktop's icon/wordmark alignment.

### 2. The header becomes content-driven height at all breakpoints, not just `xl:`

`header-spacing-and-icon-alignment` already made the `xl:` header `h-auto` instead of a fixed number, and recalibrated every downstream offset (`DrawerNav`/`RightRail` clearance, `PageHeader`'s sticky offset, `PageOutline`'s scroll calibration) against the real measured height. Mobile's header is getting the same real content (wordmark, tagline, three icons) instead of a thin transparent strip, so the same principle applies: `h-auto` at all breakpoints, and the mobile-scoped downstream offsets (`layout.tsx`'s content `pt-16`, `PageHeader`'s mobile `top-16`) get recalibrated against mobile's own real measured height — **measured against a running dev server, not hand-calculated**, same discipline as last time.

**Known, deliberately deferred gap:** `globals.css`'s `main h2[id] { scroll-margin-top: 179px; }` has no mobile-specific value — it's calibrated for the `xl:` header+PageHeader combination only. Not fixing this here: `PageOutline` itself only renders `xl:block` today, so the one real consequence is someone loading a direct `#anchor` URL on mobile getting a slightly-off scroll position, not the primary click-to-scroll interaction. Worth a real fix whenever `PageOutline` itself becomes mobile-aware, not invented here as a guess.

### 3. Session-conditional icon: build the real dual-link CSS-toggle mechanism now, defaulted to signed-out

The original framing-scaffold handoff already specified this pattern (`AccountOrSignInLinks`): both the signed-in and signed-out links exist in the DOM at all times; a `data-signed-in` attribute on `<html>` (toggled by CSS only) decides which one shows. Building the real mechanism now — both links present, hidden via `[data-signed-in] .signed-out-only { display: none }` / the inverse — means `wire-better-auth` only has to set the attribute on real session events later, not retrofit this structure. Icons: `LogIn` (signed-out, links to `/sign-in`) and `User` (signed-in, links to `/account`) from `lucide-react`, matching the icon library already in use.

**Alternative considered:** render only the signed-out state now, add the signed-in variant later when auth exists. Rejected — that would mean touching this component again for a purely structural addition once real session data exists, instead of building the known-correct shape once.

## Risks / Trade-offs

- **[Risk]** `Header.tsx` becoming a client component changes nothing observable today (no interactivity currently needed beyond the hamburger, which already required client-side state via `useMobileNav`), but it's worth noting explicitly since the desktop-only version never needed to be one. → No mitigation needed, just noting the change for the record.
- **[Risk]** The mobile scroll-margin gap (Decision 2) could surprise someone following a direct anchor link on a phone. → **Mitigation:** flagged here and in `tasks.md`'s final task rather than silently left undocumented.
