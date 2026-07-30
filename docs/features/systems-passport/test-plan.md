# Systems passport — test plan

A narrative walkthrough of how this feature is actually verified: what's being tested, how, and
the real code that does it. This complements `api/src/routes/buildings.test.ts` and
`assets.test.ts` — those already cover the owner/non-owner/unauthenticated matrix with real,
disposable per-test fixtures — it doesn't re-specify them. This doc is for the manual,
persistent-account path: signing in as a real account and clicking through the real UI, backed
by a repeatable script instead of a one-off insert.

See `openspec/changes/systems-passport-dev-seed/` for why this exists: the feature's own original
proposal named a real gap ("no building-claim flow exists... verification used a direct dev-DB
insert of a test building + Stake"), and that insert was never preserved as something repeatable.

## Precondition: seed a real owner account

Everything below assumes `rgsamways@gmail.com` already has an owner+admin Membership and an
owned Building. One command does this, idempotently:

```
cd api && npm run seed:systems-passport
```

```ts
// api/scripts/systems-passport/seed.ts
const { userId, created: userCreated } = await signInOrCreateUser(OWNER_EMAIL);
const admin = await grantMembership(userId, "admin");
const owner = await grantMembership(userId, "owner");
const building = await ensureOwnedBuilding(userId, BUILDING_SLUG);
const { assets, created: assetsCreated } = await ensureStarterAssets(building.buildingId);
```

The first run sends a real magic-link email to `rgsamways@gmail.com` (the actual sign-in path,
not mocked) and seeds a "robin-home" Building with two starter systems. Re-running is a no-op —
every step checks for an existing row first.

## Scenario: Add a system with full details

**What:** an owner can record a system with every optional field filled in.
**How:** `POST /api/buildings/:buildingId/assets` with a full body.

```ts
// api/src/routes/assets.ts — POST /api/buildings/:buildingId/assets
const [created] = await db
  .insert(schema.asset)
  .values({
    subjectType: "building",
    subjectId: request.params.buildingId,
    assetType: body.assetType,
    label: body.label,
    manufacturer: body.manufacturer,
    model: body.model,
    serialNumber: body.serialNumber,
    warrantyExpiryDate: body.warrantyExpiryDate,
    installedDate: body.installedDate,
    conditionStatus: body.conditionStatus,
    photoUrls: body.photoUrls,
    conditionNotes: body.conditionNotes,
  })
  .returning();
```

**Passes if:** the response is `201` and a new `Asset` row exists with `subject_type =
'building'`, `subject_id` matching the building, and every submitted field persisted.

## Scenario: Add a system with only the required field

**What:** the UI/API doesn't assume optional fields exist — `assetType` alone is enough.
**How:** the seed script's second starter asset exercises exactly this path.

```ts
// api/scripts/systems-passport/seed.ts — the deliberately minimal one
{
  subjectType: "building",
  subjectId: buildingId,
  assetType: "hvac",
}
```

**Passes if:** the row is created with every other field `null`, and the UI renders it without
error (no assumption that `label`/`conditionStatus`/etc. are present).

## Scenario: Edit an existing system's condition

**What:** the "fills in over time" behavior from the original feature idea — not create-once.
**How:** `PATCH /api/assets/:assetId`, which re-derives the owning building from the asset itself
rather than trusting a client-supplied id.

```ts
// api/src/routes/assets.ts — PATCH /api/assets/:assetId
const [existing] = await db.select().from(schema.asset).where(eq(schema.asset.id, request.params.assetId));
if (!existing) return reply.code(404).send({ error: "asset_not_found" });

// Never trust a client-supplied building id for authorization on an existing row.
const isOwner = await assertBuildingOwner(user.id, existing.subjectId);
if (!isOwner) return reply.code(403).send({ error: "forbidden" });
```

**Passes if:** patching `{ conditionStatus: "needs_repair" }` on the seeded roof asset updates
that field and the change survives a page reload.

## Scenario: A non-owner cannot see or edit another owner's systems

**What:** ownership is enforced by the API itself, not just hidden in the UI.
**How:** a second real account, with no `Stake` on the seeded building, calling the same routes.

```ts
// api/src/authz/building-access.ts
export async function assertBuildingOwner(userId: string, buildingId: string): Promise<boolean> {
  const [stake] = await db
    .select()
    .from(schema.stake)
    .where(
      and(
        eq(schema.stake.subjectType, "building"),
        eq(schema.stake.subjectId, buildingId),
        eq(schema.stake.userId, userId),
        eq(schema.stake.role, "owner"),
        eq(schema.stake.status, "active"),
      ),
    );
  return stake != null;
}
```

**Passes if:** `GET/POST/PATCH` against the seeded building's assets all return `403` for the
second account — checked with that account's own real session cookie via a real request, not
just confirming the UI hides the add/edit buttons.

## Scenario: Empty state before anything's been added

**What:** what the passport looks like for a building with zero systems recorded.
**How:** `ensureOwnedBuilding` alone (no `ensureStarterAssets` call) leaves a building with no
`Asset` rows.

**Passes if:** `GET /api/buildings/:buildingId/assets` returns `[]` and the page renders a real
empty state rather than erroring on an assumed non-empty list.
