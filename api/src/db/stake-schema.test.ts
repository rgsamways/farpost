import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.stake).where(eq(schema.stake.role, "test-role"));
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.unit).where(eq(schema.unit.buildingId, building.id));
  }
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
}

async function insertTestBuildingAndUnit() {
  const [property] = await db
    .insert(schema.property)
    .values({ slug: TEST_PROPERTY_SLUG })
    .returning();
  const [building] = await db
    .insert(schema.building)
    .values({ propertyId: property.id, slug: TEST_BUILDING_SLUG })
    .returning();
  const [unit] = await db
    .insert(schema.unit)
    .values({ buildingId: building.id, unitLabel: "Unit A" })
    .returning();
  return { building, unit };
}

describe("stake", () => {
  afterEach(cleanup);

  it("persists an unclaimed stake with a null user_id and a contact_snapshot", async () => {
    const { building } = await insertTestBuildingAndUnit();
    const [row] = await db
      .insert(schema.stake)
      .values({
        subjectType: "building",
        subjectId: building.id,
        role: "test-role",
        status: "unclaimed",
        contactSnapshot: { name: "Suspected Owner", email: "owner@example.com", phone: "555-0100" },
      })
      .returning();

    expect(row.userId).toBeNull();
    expect(row.contactSnapshot).toEqual({
      name: "Suspected Owner",
      email: "owner@example.com",
      phone: "555-0100",
    });
  });

  it("persists a stake with subject_type unit", async () => {
    const { unit } = await insertTestBuildingAndUnit();
    const [row] = await db
      .insert(schema.stake)
      .values({
        subjectType: "unit",
        subjectId: unit.id,
        role: "test-role",
        status: "active",
      })
      .returning();

    expect(row.subjectType).toBe("unit");
    expect(row.subjectId).toBe(unit.id);
  });

  it("transitions from pending_verification to active with verification_method and verified_at", async () => {
    const { building } = await insertTestBuildingAndUnit();
    const [row] = await db
      .insert(schema.stake)
      .values({
        subjectType: "building",
        subjectId: building.id,
        role: "test-role",
        status: "pending_verification",
      })
      .returning();
    expect(row.verifiedAt).toBeNull();

    const verifiedAt = new Date();
    const [updated] = await db
      .update(schema.stake)
      .set({ status: "active", verificationMethod: "admin_reviewed", verifiedAt })
      .where(eq(schema.stake.id, row.id))
      .returning();

    expect(updated.status).toBe("active");
    expect(updated.verificationMethod).toBe("admin_reviewed");
    expect(updated.verifiedAt).not.toBeNull();
  });

  it("rejects an invalid status value", async () => {
    const { building } = await insertTestBuildingAndUnit();
    await expect(
      db.insert(schema.stake).values({
        subjectType: "building",
        subjectId: building.id,
        role: "test-role",
        status: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid verification_method value", async () => {
    const { building } = await insertTestBuildingAndUnit();
    await expect(
      db.insert(schema.stake).values({
        subjectType: "building",
        subjectId: building.id,
        role: "test-role",
        status: "active",
        verificationMethod: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("leaves renewal fields null when not specified", async () => {
    const { building } = await insertTestBuildingAndUnit();
    const [row] = await db
      .insert(schema.stake)
      .values({
        subjectType: "building",
        subjectId: building.id,
        role: "test-role",
        status: "active",
      })
      .returning();

    expect(row.renewalDate).toBeNull();
    expect(row.renewalReminderSentAt).toBeNull();
  });
});
