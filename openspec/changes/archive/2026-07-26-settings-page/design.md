## Context

robinsamways.ca has a real, working version of this exact mechanism (theme + font size + reduced motion, `web/src/components/settings/*`). Farpost only needs two of the three — no theme, per Robin's explicit call (no plans to give Farpost light/dark mode). Read directly from the real source, not guessed: `web/src/lib/fontScale.ts`, `reducedMotion.ts`, the two setting components, and `SettingsBootstrap.tsx`.

## Goals / Non-Goals

**Goals:**
- Port the proven localStorage-plus-CSS-variable/class mechanism, dropping only the theme third.
- Make reduced motion do something real and checkable in Farpost's own shell, not just store a flag.

**Non-Goals:**
- No theme setting, no dark palette. If Farpost ever wants theming, that's a fresh decision with its own color design, not something this change should partially set up.
- No new settings beyond these two — Robin's own words: "if we think of other UI settings along the way, we'll add them then."

## Decisions

### 1. Port the mechanism as-is, drop theme entirely rather than stub it

Each setting is self-contained: a storage key, a `resolveInitial*` function, and (for font size) a plain value lookup (`fontScaleValue`). `SettingsBootstrap` applies both on every mount so a setting made on `/settings` is still in effect on `/dashboard` after a fresh page load, mirroring exactly why robinsamways.ca's own version exists ("the one place all three persisted settings get applied on mount, on every page").

**Alternative considered:** build a theme toggle now that does nothing yet (Farpost has no dark colors), just so the settings page "looks complete" against the reference. Rejected — a control with no real effect is worse than no control; add it later as its own real decision when Farpost actually wants theming.

### 2. Reduced motion gets two real, existing targets in Farpost's shell

robinsamways.ca's reduced-motion class disables its own nav slide and outline-click glow — Farpost doesn't have an outline-click glow, but it does have two real animated behaviors already shipped: `DrawerNav`'s mobile nav `transition-transform duration-200 ease-out` slide-in, and `PageOutline.handleSelect`'s `scrollIntoView({ behavior: "smooth" })`. Both get a `.reduce-motion`-aware branch — the transition duration drops to `duration-0` (or the transition class is conditionally omitted) when the class is present, and `scrollIntoView`'s `behavior` is read fresh at click time (`document.documentElement.classList.contains("reduce-motion")`) rather than cached, matching robinsamways.ca's own stated reasoning for that pattern.

### 3. `--font-scale` applied on `html`, not `body`

Matches robinsamways.ca's own real code exactly, including its own reasoning: `html`'s font-size isn't self-referential against `--font-scale` (the `1rem` baseline is the browser default, not `html`'s own computed size), so the multiplier is always a clean multiple of the true default rather than compounding on re-application.

## Risks / Trade-offs

- **[Risk]** Reading `.reduce-motion`'s presence at click time (rather than via React state) means `PageOutline` and `DrawerNav` each need a direct DOM check rather than a prop — slightly less "React-idiomatic," but it's the same trade-off robinsamways.ca already made deliberately (`ReducedMotionSetting.tsx`'s own comment: "no event bus between components needed"). Not treating this as a real risk, just noting the precedent it follows.
