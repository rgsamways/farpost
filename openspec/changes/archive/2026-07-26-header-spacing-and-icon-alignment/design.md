## Context

This is a small, same-day follow-up to `scaffold-desktop-framing` after Robin reviewed the running `/dashboard` page in a browser. Five of the six requested changes are pure spacing/color adjustments; one reverses an existing requirement's alignment direction.

## Goals / Non-Goals

**Goals:**
- Land all six of Robin's requested adjustments exactly as specified.
- Keep the existing column-mirroring alignment mechanism (`design.md` Decision 1 from `scaffold-desktop-framing`) intact — only the icon cluster's justify-direction and padding side change, not the underlying "shared `xl:w-64` column" guarantee that keeps header and rail from drifting apart.

**Non-Goals:**
- No new architectural mechanism. This change doesn't introduce anything design.md would normally need to weigh alternatives on.

## Decisions

There isn't a real technical decision to make here worth a full write-up — this is a straightforward implementation change within an already-designed mechanism, not a new one. Noting that plainly rather than inventing false complexity to fill out this section:

- The icon cluster's alignment flips from `justify-end` + `pr-5` to `justify-start` + `pl-5`, mirroring exactly how `PageOutline`'s own content is already left-padded (`xl:px-5`) inside the same `xl:w-64` rail column. No new column-width math is needed — the same shared width value from Decision 1 still does the alignment work, just anchored to the opposite side.
- The five spacing/color items are literal Tailwind class additions (padding, gap, margin, and a color-token swap) with no behavioral implication beyond what's visually requested.

## Risks / Trade-offs

- **[Risk]** `Header.test.tsx`'s existing structural assertions (`columns[2].className` containing `xl:w-64`) still hold regardless of justify-direction, but don't currently assert anything about which side the icons hug — a regression in alignment direction wouldn't be caught by the existing test suite alone. → **Mitigation:** add or update an assertion that checks for the `justify-start`/`pl-5` classes specifically, per `tasks.md`.
- **[Risk]** None of this was flagged as needing tuning previously (unlike the right rail's 256px width, which was explicitly flagged as likely to need adjustment) — this is a genuinely new ask, not a resolution of a previously-known open item.
