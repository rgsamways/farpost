## Why

Mobile currently has no real header — just two disconnected floating pills (a bordered "Farpost" button from `DrawerNav.tsx`, a bare hamburger from `RightRail.tsx`) sitting over the page with no background. Robin wants mobile to get the same navy/orange sticky header treatment as desktop, with a real icon cluster, based on reference screenshots he provided.

## What Changes

- Mobile gets a full-width, sticky navy header with the orange bottom accent line — the same visual treatment `xl:` already has, extended down to mobile widths.
- The FARPOST wordmark + "Building intelligence for rural Canada" tagline render as plain text (no button/pill styling), clickable through to `/` from any page.
- A 3-icon cluster renders on the right, in this exact order: sign-in/profile, hamburger (opens the mobile nav), settings. The sign-in icon is session-conditional — it shows a sign-in icon when signed out and will show a profile icon when signed in, via the same DOM-attribute CSS toggle already documented in the original framing-scaffold handoff, even though nothing sets that attribute yet (that's `sign-in-and-account-pages`, later).
- `Header.tsx` becomes the single component owning the header at both breakpoints, replacing `DrawerNav.tsx`'s and `RightRail.tsx`'s separate floating mobile bars — one place for the navy/sticky treatment instead of two that could drift apart.

## Capabilities

### New Capabilities
- `mobile-app-shell`: the mobile-breakpoint header — sticky navy/orange band, brand link, and the sign-in/hamburger/settings icon cluster.

### Modified Capabilities
(none — this doesn't change any `desktop-app-shell` requirement, it adds the mobile-scoped equivalent)

## Impact

- `web/src/components/Header.tsx`: gains a mobile-scoped render path (currently `xl:`-only content), becomes a client component (needs `useMobileNav` for the hamburger).
- `web/src/components/DrawerNav.tsx`: removes its own floating mobile brand pill.
- `web/src/components/RightRail.tsx`: removes its own floating mobile hamburger bar.
- No backend/auth dependency — the sign-in icon's signed-in state is structurally wired but defaults to signed-out until `wire-better-auth` exists.
