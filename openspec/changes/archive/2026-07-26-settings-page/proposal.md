## Why

The header's cog icon has pointed at `/settings` since the first scaffold change, but the page has never existed. Robin wants a real settings page now — font size and reduced motion only, no theme/dark-mode (explicitly not planned for Farpost) — fully independent of the auth/backend work currently blocked on design decisions.

## What Changes

- Add a real `/settings` page with two working controls: font size (small/default/large/xlarge) and reduced motion (system/on/off).
- Both settings persist to `localStorage`, apply immediately on change, and apply on every page load via a bootstrap component mounted once in the root layout — not just when visiting `/settings` itself.
- Reduced motion gets a real, observable effect on two things that already exist in Farpost's shell: `DrawerNav`'s mobile nav slide-in transition and `PageOutline`'s scroll-to-section behavior — not a stored flag with nothing to show for it.
- No theme/dark-mode setting. Farpost has no dark palette and no plans for one.

## Capabilities

### New Capabilities
- `settings-page`: a real, persisted display/accessibility preferences page — font size and reduced motion, applied globally.

### Modified Capabilities
(none)

## Impact

- New: `web/src/app/settings/page.tsx`, `web/src/components/settings/FontSizeSetting.tsx`, `web/src/components/settings/ReducedMotionSetting.tsx`, `web/src/components/SettingsBootstrap.tsx`, `web/src/lib/fontScale.ts`, `web/src/lib/reducedMotion.ts`.
- `web/src/app/globals.css`: adds `--font-scale` custom property, an `html { font-size: calc(1rem * var(--font-scale)); }` rule, and a `.reduce-motion` class hook.
- `web/src/components/DrawerNav.tsx`: mobile slide-in transition respects `.reduce-motion`.
- `web/src/components/PageOutline.tsx`: `scrollIntoView` behavior respects `.reduce-motion` at click time.
- `web/src/app/layout.tsx`: mounts `SettingsBootstrap` once, alongside `MobileNavProvider`.
