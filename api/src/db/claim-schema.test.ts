import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;
const TEST_REQUESTER_ID = `test-requester-${randomUUID()}`;
const TEST_INSURER_FILE_NUMBER = `test-claim-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.job).where(eq(schema.job.requesterUserId, TEST_REQUESTER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_REQUESTER_ID));
  await db
    .delete(schema.claim)
    .where(eq(schema.claim.insurerFileNumber, TEST_INSURER_FILE_NUMBER));
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
}

async function insertTestBuilding() {
  const [property] = await db
    .insert(schema.property)
    .values({ slug: TEST_PROPERTY_SLUG })
    .returning();
  const [building] = await db
    .insert(schema.building)
    .values({ propertyId: property.id, slug: TEST_BUILDING_SLUG })
    .returning();
  return building;
}

describe("claim", () => {
  afterEach(cleanup);

  it("persists with building_id null", async () => {
    const [row] = await db
      .insert(schema.claim)
      .values({ insurerFileNumber: TEST_INSURER_FILE_NUMBER })
      .returning();
    expect(row.buildingId).toBeNull();
  });

  it("can be linked to a Building once its address resolves", async () => {
    const building = await insertTestBuilding();
    const [row] = await db
      .insert(schema.claim)
      .values({ insurerFileNumber: TEST_INSURER_FILE_NUMBER })
      .returning();
    expect(row.buildingId).toBeNull();

    const [updated] = await db
      .update(schema.claim)
      .set({ buildingId: building.id })
      .where(eq(schema.claim.id, row.id))
      .returning();
    expect(updated.buildingId).toBe(building.id);
  });

  it("blocks deleting a Building that has a linked Claim", async () => {
    const building = await insertTestBuilding();
    await db.insert(schema.claim).values({
      insurerFileNumber: TEST_INSURER_FILE_NUMBER,
      buildingId: building.id,
    });

    await expect(
      db.delete(schema.building).where(eq(schema.building.id, building.id)),
    ).rejects.toThrow();
  });

  it("persists damage_types and damage_description independently", async () => {
    const [row] = await db
      .insert(schema.claim)
      .values({
        insurerFileNumber: TEST_INSURER_FILE_NUMBER,
        damageTypes: ["water", "structural"],
        damageDescription: "Basement flooding from burst pipe, wall damage",
      })
      .returning();

    expect(row.damageTypes).toEqual(["water", "structural"]);
    expect(row.damageDescription).toBe("Basement flooding from burst pipe, wall damage");
  });

  it("allows two Jobs to reference the same Claim", async () => {
    const [claimRow] = await db
      .insert(schema.claim)
      .values({ insurerFileNumber: TEST_INSURER_FILE_NUMBER })
      .returning();
    await db
      .insert(schema.user)
      .values({ id: TEST_REQUESTER_ID, name: "Test Requester", email: `${TEST_REQUESTER_ID}@example.com` });

    await db.insert(schema.job).values([
      {
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "adjuster",
        subjectType: "claim",
        subjectId: claimRow.id,
        description: "Initial inspection",
      },
      {
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "claim",
        subjectId: claimRow.id,
        description: "Follow-up repair",
      },
    ]);

    const rows = await db
      .select()
      .from(schema.job)
      .where(eq(schema.job.subjectId, claimRow.id));
    expect(rows).toHaveLength(2);
  });
});
