## 1. Consolidate the header component

- [x] 1.1 Make `Header.tsx` a client component (`"use client"`), wire `useMobileNav()` for the hamburger's `onClick`
- [x] 1.2 Remove `DrawerNav.tsx`'s floating mobile brand pill
- [x] 1.3 Remove `RightRail.tsx`'s floating mobile hamburger bar

## 2. Mobile header content

- [x] 2.1 Add a mobile-scoped render path in `Header.tsx`: FARPOST wordmark + "Building intelligence for rural Canada" tagline as plain text (no button styling), wordmark links to `/`
- [x] 2.2 Add the 3-icon cluster in order: sign-in/profile, hamburger, settings
- [x] 2.3 Build the sign-in/profile icon as a dual-link, CSS-toggled pair (`LogIn` → `/sign-in`, `User` → `/account`), driven by a `data-signed-in` attribute on `<html>`, defaulting to signed-out since the attribute is never set yet

## 3. Header styling at all breakpoints

- [x] 3.1 Change `layout.tsx`'s `<header>` from `bg-background border-transparent` (mobile) / `xl:bg-navy xl:border-orange` to navy background + orange border at all breakpoints
- [x] 3.2 Change the header's height from a mobile-specific fixed value to `h-auto` at all breakpoints, matching the `xl:` precedent from `header-spacing-and-icon-alignment`

## 4. Recalibrate downstream mobile offsets

- [x] 4.1 Measure the real rendered mobile header height against a running dev server — do not hand-calculate
- [x] 4.2 Update `layout.tsx`'s content wrapper mobile top padding (`pt-16`) to match the real measured height
- [x] 4.3 Update `PageHeader.tsx`'s mobile sticky offset (`top-16`) to match the same real measured height
- [x] 4.4 Note in the final report that `globals.css`'s `main h2[id] { scroll-margin-top }` is not mobile-calibrated (deliberately deferred per design.md — `PageOutline` doesn't render below `xl` yet)

## 5. Tests and verification

- [x] 5.1 Component test: header renders wordmark (plain text, no button classes), tagline, and all three icons in order at mobile widths
- [x] 5.2 Component test: sign-in icon shows by default (no `data-signed-in`), profile icon shows when the attribute is set
- [x] 5.3 Component test: tapping the hamburger opens the mobile nav
- [x] 5.4 `npm run build`, `npm run lint`, `npm test` all pass
- [x] 5.5 Manual check in browser at a real mobile viewport width: header stays pinned while scrolling, brand is clickable with no button look, icon cluster matches the specified order and spacing
