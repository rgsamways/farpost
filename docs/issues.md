# Issues / QA notes

Quick "take a look at this and tell me what's missing or wrong" capture — screenshots, console warnings, small visual bugs, real drift caught after something was archived. This is not the Sreditor R&D log (`.sreditor/`) and not a formal OpenSpec change proposal — just a running list Robin flags as he spots things in the running app, for CLI to pick up and check off.

Each entry should include the literal handoff text given to CLI, not just a summary, so this file stays a self-contained record of what CLI was actually told — per `docs/standard-methodology.md` rule 6's contemporaneous-logging requirement.

## Open

### Recurring dev-server collision between Chat's running dev server and CLI's own build/verification steps

Happened three times during the `wire-better-auth`/`sign-in-and-account-pages` work (2026-07-27), each time the same way: Chat runs `npm run dev` in `web/` in the background so Robin can look at things in a browser; CLI separately runs `next build` (and once `next start`) in the same directory for its own manual verification; the two collide over the shared `.next` Turbopack cache (`Persisting failed: Another write batch or compaction is already active`), which corrupts the running dev server's manifests and leaves it serving 500s, sometimes with an orphaned process still holding the port that a plain restart doesn't clear (needed a direct `taskkill` twice). CLI's own theory (`web/AGENTS.md`'s "not the Next.js you know" warning, a persistent server left behind by `next build`) is plausible as a contributing factor but doesn't fully explain the observed `.next` cache corruption — the two are likely compounding.

**Handoff given to CLI (2026-07-27):** Before running `next build`, `next start`, or any other command that writes to `.next/` in `web/`, check for and stop any already-running dev server on ports 3000-3002 first (`netstat`/`taskkill` on Windows), rather than let a build collide with a live dev server's cache. If Chat's own dev server was running and gets corrupted as a side effect, that's expected and will get cleaned up separately — the point is avoiding the collision in the first place, not treating a stopped dev server as unexpected.

**Resolution:** Not yet fully resolved — mitigated reactively each time (clear `.next`, kill orphaned processes, restart) rather than prevented. Worth a real fix if it keeps happening: either CLI should stop any dev server it finds before its own build steps (per the handoff above), or Chat should stop its own dev server before handing off any change that touches `web/`, restarting it only when Robin wants to look at something.


### Font-scale settings can grow the sticky headers beyond their hardcoded offsets

Flagged by Chat while drafting `settings-page`, logged by CLI per Chat's instruction during that change's implementation (2026-07-26). Literal handoff text:

> One thing to flag in the settings-page report specifically, don't fix it, just log it clearly: font-size scaling (--font-scale) could make both headers' real rendered height grow beyond what their hardcoded pixel offsets assume (pt-16, top-16, the 73.75px/179px figures from the earlier desktop change) — meaning someone using "Large" or "Extra Large" text could see content crowd slightly under a header. This is a real gap Chat identified, not something to solve in this pass — note it plainly in your final report (and it's fine to add it to docs/issues.md yourself if you want it captured immediately) rather than silently letting it slide.

Concretely: `layout.tsx`'s `pt-[73.75px]`/`xl:pt-[73.75px]`, `PageHeader.tsx`'s `top-[73.75px]`, and `globals.css`'s `main h2[id] { scroll-margin-top: 179px }` are all hardcoded pixel figures measured once at the default `--font-scale: 1`. `FontSizeSetting`'s "Large" (1.125×) and "Extra Large" (1.25×) options scale all text sitewide, including the header's own wordmark/tagline/icon-cluster content, which could grow the header's real rendered height past these fixed offsets — the visible symptom would be page content crowding slightly under the sticky header at larger font sizes. Not reproduced/measured yet, just identified as a real structural risk. Would need re-measuring the header at each font scale (or switching to a content-driven offset that doesn't need hardcoding) to actually fix.
