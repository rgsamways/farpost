## 1. Utilities

- [x] 1.1 Port `fontScale.ts` (types, storage key, `resolveInitialFontScale`, `fontScaleValue`)
- [x] 1.2 Port `reducedMotion.ts` (types, storage key, `resolveInitialReducedMotionPref`, `shouldReduceMotion`)

## 2. Global CSS

- [x] 2.1 Add `--font-scale: 1;` and `html { font-size: calc(1rem * var(--font-scale)); }` to `globals.css`
- [x] 2.2 Add a `.reduce-motion` class hook to `globals.css` (no rules yet beyond what tasks 4/5 add)

## 3. Setting components

- [x] 3.1 Build `FontSizeSetting.tsx` (Farpost-styled: accent/muted/foreground tokens, not robinsamways.ca's), four options, persists on change
- [x] 3.2 Build `ReducedMotionSetting.tsx` (Farpost-styled), three options, persists on change and updates the `.reduce-motion` class immediately

## 4. Reduced-motion real effects

- [x] 4.1 `DrawerNav.tsx`: mobile nav's slide-in transition is skipped when `.reduce-motion` is present on `<html>`
- [x] 4.2 `PageOutline.tsx`: `handleSelect`'s `scrollIntoView` reads `.reduce-motion`'s presence at click time and uses `behavior: "auto"` instead of `"smooth"` when present

## 5. Bootstrap and page

- [x] 5.1 Build `SettingsBootstrap.tsx` (font-scale + reduced-motion only, no theme) and mount it once in `layout.tsx`
- [x] 5.2 Build `/settings/page.tsx` using `PageHeader` + `SectionHeader` for "FONT SIZE" and "REDUCED MOTION" sections, each with brief explanatory copy matching the tone of robinsamways.ca's own settings page

## 6. Tests and verification

- [x] 6.1 Component test: `FontSizeSetting` persists selection and updates `--font-scale`
- [x] 6.2 Component test: `ReducedMotionSetting` persists selection and toggles the `.reduce-motion` class
- [x] 6.3 Component test: `/settings` renders both controls and no theme control
- [x] 6.4 `npm run build`, `npm run lint`, `npm test` all pass
- [x] 6.5 Manual check in browser: change each setting, reload, confirm it held; confirm the mobile nav slide and outline scroll both go instant under reduced motion
