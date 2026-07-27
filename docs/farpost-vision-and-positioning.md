# Farpost — vision and positioning

**What this file is:** Robin's own stated vision for what Farpost is ultimately trying to be, given directly on 2026-07-26 during the rebuild's planning session, merged with the differentiation read from that same conversation. This is a north-star document, not a spec — it doesn't require OpenSpec change management, but future proposals should be checked against it for fit.

## Robin's vision, in his own terms

Farpost is meant to become **the** building-intelligence platform — not a niche tool, a category-defining one.

The entry point is personal, not professional: someone joins because they have real value tied to a building, most often their home, but not only that — a business owner who cares about the building their business runs out of (his own example: a friend who owns and operates a brewery) fits exactly the same shape. The underlying motivation is universal regardless of building type: people want the place they depend on to be safe, sound, and running optimally.

Most users, though, are professionals in some way, and many professional roles naturally involve buildings and properties already — so Farpost should also be the place professionals go to make their services known to everyone who might need them. The professional and the personal/ownership sides aren't two different products; they're two natural entry points into the same underlying record.

The intended arc for any single building is a full lifecycle, not a point-in-time transaction: it starts the moment someone claims and identifies it (physically, via an NFC/RFID tag), and it should still be useful at literally whatever moment finds them needing it next — which could be almost anything. Robin's own examples, deliberately spanning from crisis to trivial: a flooded basement, a property going up for sale, a job that needs doing, a list of manuals that always gets lost, a place to hang a picture. The aspiration, in his words: Farpost should be "the one-stop shop for all things that matter to the places you spend your time" — useful for everyone, not just professionals or claims work.

## How this connects to what's already decided

This vision isn't a new direction — it's the reason several already-resolved design calls look the way they do, now with the actual motivation behind them made explicit:

- **Why `Membership` and `Stake` are two separate axes** (`docs/core-user-model.md`, `farpost-schema-draft.html`'s worked example): a homeowner, a professional, and an admin can be the same person because in Robin's vision they usually *are* — his brewery-owner friend is simultaneously an owner who cares about his building and, plausibly, a professional in some other trade. The schema already had to support one person holding both kinds of relationship at once; this vision is why that's not an edge case, it's the expected shape.
- **Why the entry point can't be role-gated** — someone claiming their own home with an NFC tag has no `Membership` row yet, possibly ever. `Stake` (a plain person↔building fact) has to be enough on its own to get real value from day one, before anyone decides whether they're also "a professional" on the platform.
- **Why `Job.subject_type`/`subject_id` had to generalize past claims** (schema changelog v11): "a flooded basement" and "a job waiting to be done" and "a property for sale" are all genuinely different `target_role`/`subject_type` combinations against the exact same generic `Job` shape — a claim-shaped table could never have covered this list.
- **The rural/field-verified data-moat read from earlier this session still holds, but this reframes *how* the density gets built.** The earlier read assumed dedicated scouts as the main mechanism for building up field-verified records. Robin's framing adds a second, probably larger mechanism: an owner who genuinely cares about their own home has a real, self-motivated reason to document it accurately themselves — claiming a building via NFC tag *is* a scouting act, just performed by the person with the most reason to get it right. That's a cheaper, more scalable path to record density than dedicated scouts alone, and it's consistent with `Membership.role = "owner"` and `SCOUT_VISIT` both existing as ordinary, non-privileged ways the same underlying record gets built up.

## A gap this surfaced, not yet designed

"A list of manuals that always gets lost" doesn't have an obvious home in the current schema draft. `ASSET` carries `photos`/`condition_notes`, and `JOB_ATTACHMENT` exists but is scoped to a specific `Job`, not a building generally. A building-level, not-job-scoped document store (manuals, warranties, deeds — the "junk drawer" a household actually keeps) looks like a real, missing piece of Robin's own stated vision, not a hypothetical. Logged as `docs/lightbulbs/farpost-lb-building-document-library.md` rather than designed here, per the methodology's "give unscoped ideas a real home the moment they're noticed" rule.

## One-sentence distillation

Farpost is the living record of a building — kept current by the people who care about it and the professionals who keep it running — so that whatever moment needs it next, the answer is already there.
