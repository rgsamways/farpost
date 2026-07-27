## 1. Header brand block spacing

- [x] 1.1 Add 15px of vertical space above and below the FARPOST wordmark + tagline block in `Header.tsx`

## 2. Header icon cluster: spacing and alignment reversal

- [x] 2.1 Add 15px of vertical space above and below the icon button group
- [x] 2.2 Add 15px of horizontal gap between the settings icon and the sign-in icon
- [x] 2.3 Flip the icon cluster's alignment from `justify-end` + `pr-5` to `justify-start` + `pl-5`, so its left edge matches the right rail's left edge (spec: "Header icons align with the right rail column", MODIFIED)
- [x] 2.4 Update `Header.test.tsx` to assert the new left-alignment classes (`justify-start`/`pl-5`), not just column width

## 3. Tagline color

- [x] 3.1 Change the tagline text color from the muted/slate token to the orange accent token

## 4. Spacing below the header band

- [x] 4.1 Add 15px margin between the header's bottom edge and the left nav's "PLATFORM" heading (`DrawerNav.tsx`)
- [x] 4.2 Add 15px margin between the header's bottom edge and the right rail's "On this page" heading (`RightRail.tsx`)

## 5. Verification

- [x] 5.1 `npm run build`, `npm run lint`, `npm test` all pass
- [x] 5.2 Visually verify all six changes on the real `/dashboard` page in a browser at the `xl` breakpoint
