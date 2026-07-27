## Why

Robin reviewed the running `/dashboard` page in a browser after `scaffold-desktop-framing` archived and found the header band needs real spacing/alignment refinement now that it's rendering for real rather than as a static mock — six specific, concrete adjustments, five cosmetic and one that reverses an already-archived requirement.

## What Changes

- Add 15px vertical breathing room above/below the brand block (FARPOST wordmark + tagline) in the header.
- Add 15px vertical breathing room above/below the header's icon button group, and 15px horizontal gap between the two icons.
- **Reverse the icon cluster's alignment anchor**: today it's right-aligned to the right rail's right edge; it should instead be left-aligned to the right rail's left edge (where "On this page" starts). **BREAKING** in the narrow sense that it replaces the prior change's own requirement text, not the underlying mechanism.
- Change the tagline's color from muted/slate to the orange accent token.
- Add 15px margin between the header's bottom edge and the left nav's "PLATFORM" heading.
- Add 15px margin between the header's bottom edge and the right rail's "On this page" heading.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `desktop-app-shell`: the "Header icons align with the right rail column" requirement changes from right-edge-to-right-edge alignment to left-edge-to-left-edge alignment. All other changes in this proposal are spacing/color implementation details that don't alter any existing requirement's wording or testable behavior.

## Impact

- `web/src/components/Header.tsx`: padding/gap classes, icon cluster justify-direction (`justify-end` → `justify-start`, `pr-5` → `pl-5`), tagline color class.
- `web/src/components/Header.test.tsx`: structural assertions may need updating to match the new alignment direction.
- `web/src/components/DrawerNav.tsx`, `web/src/components/RightRail.tsx`: top spacing/margin below the header (items 5 and 6).
- No change to `design.md`'s Decision 1 mechanism (shared `xl:w-64` mirrored columns) — only which side of that shared column the header's icon content hugs.
