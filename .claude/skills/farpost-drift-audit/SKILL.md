---
name: farpost-drift-audit
description: Real drift audit — checks a just-archived OpenSpec change's literal spec wording against actual current code/behavior. Run this before drafting the next proposal, not as a rubber stamp. Also appends a plain-language entry to docs/farpost-story.md.
license: MIT
metadata:
  author: farpost
  version: "1.0"
---

Farpost's own drift-audit checkpoint, built fresh for this rebuild (the old drift-audit skill was deleted in the 2026-07-26 wipe and is not being restored as-is — this is a new design for the new stack/workflow, per `CLAUDE.md`'s guard rule).

**Trigger point:** run this after an OpenSpec change is archived, before starting the next `/opsx:propose`. Exact cadence (every change vs. only higher-risk ones) is a judgment call for whoever's running this — Robin explicitly delegated the "which points" decision (2026-07-26). Default to auditing every archived change unless there's a real reason to batch (e.g. several small, low-risk changes landing back to back).

**What this is not:** not "did the build pass" or "did tests pass" — those are necessary but don't answer the actual question. A drift audit checks whether the spec's own literal wording still describes the truth of what's running.

## Steps

1. **Find un-audited archived changes.** Read `docs/drift-audit-log.md` to see what's already been audited. Run `openspec list --json` / check `openspec/changes/archive/` for changes archived since the last logged audit.

2. **For each un-audited change, read the real spec deltas** under `openspec/changes/archive/<name>/` (specs, design doc, tasks.md) — not a summary of them, the literal requirement/scenario text.

3. **Check the literal wording against the actual current code**, not against what the implementer's own final report claimed. Read the real files the change touched. For each requirement/scenario in the spec, confirm it's still true right now — a report saying "done" or "verified" is not evidence on its own; independently re-check it. Look specifically for:
   - Requirements whose wording no longer matches what the code does (the code moved on, the spec didn't, or vice versa)
   - Tasks marked complete that don't have real, matching test coverage
   - Silent scope changes — something the spec promised that quietly got dropped or simplified during implementation with no note anywhere

4. **Log any drift found in `docs/issues.md`**, following that file's existing convention (literal finding, literal handoff text, dated).

5. **Record the audit itself in `docs/drift-audit-log.md`** — one line per archived change: date audited, change name, clean or drift-found, link to the issues.md entry if drift was found. This is what step 1 reads next time, so don't skip it even when the audit is clean.

6. **Append an entry to `docs/farpost-story.md`** — the running, public-facing build narrative (see that file's own header for its audience and tone). Write it in plain language for someone who isn't reading code: what shipped, why it exists, what it does, how it benefits them. If the audit caught real drift, it's fine to mention that honestly (briefly, not defensively) — the story doc is meant to capture the real process, not a polished-only version of it.

## Guardrails

- Don't skip straight to "looks fine" — read the actual current files for at least every requirement the change's spec listed, don't sample.
- A clean audit still gets logged in `docs/drift-audit-log.md` and still gets a `docs/farpost-story.md` entry — silence isn't the same as "nothing happened."
- If you genuinely can't verify a requirement (no way to observe the behavior directly), say so explicitly in the log rather than assuming it's fine.
