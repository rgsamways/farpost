# Lightbulb: a building-level document library

**Noticed:** 2026-07-26, while merging Robin's stated vision (`docs/farpost-vision-and-positioning.md`) with the current schema draft.

**The gap:** Robin's own example of an everyday reason someone would use Farpost — "a list of manuals that always gets lost" — has no clean home in `farpost-schema-draft.html`'s current shape. `ASSET` carries `photos`/`condition_notes` per piece of equipment, and `JOB_ATTACHMENT` exists but is scoped to one `Job`, not to the building generally. There's no table today for the loose documents a household or business actually accumulates about a building as a whole — manuals, warranties, deeds, permits — independent of any specific job or asset.

**Not designed here — just flagged.** Worth its own pass whenever core-object design resumes: likely shape is a `BUILDING_DOCUMENT`-style table (building_id, doc_type free text, label, url, uploaded_by membership_id, uploaded_at), same generic-attachment pattern `JOB_ATTACHMENT` already uses, just scoped one level up. Whether it needs asset-level linkage too (a manual for *this* specific furnace vs. the building generally) isn't decided.
