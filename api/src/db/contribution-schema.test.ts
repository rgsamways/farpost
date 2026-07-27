import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;
const TEST_USER_ID = `test-user-${randomUUID()}`;

async function cleanup() {
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.contribution).where(eq(schema.contribution.buildingId, building.id));
  }
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
  await db.delete(schema.membership).where(eq(schema.membership.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
}

async function insertTestFixtures() {
  const [property] = await db
    .insert(schema.property)
    .values({ slug: TEST_PROPERTY_SLUG })
    .returning();
  const [building] = await db
    .insert(schema.building)
    .values({ propertyId: property.id, slug: TEST_BUILDING_SLUG })
    .returning();
  await db.insert(schema.user).values({
    id: TEST_USER_ID,
    name: "Test User",
    email: `${TEST_USER_ID}@example.com`,
  });
  const [membership] = await db
    .insert(schema.membership)
    .values({ userId: TEST_USER_ID, role: "contributor" })
    .returning();
  return { building, membership };
}

describe("contribution", () => {
  afterEach(cleanup);

  it("persists with a null contributor_role", async () => {
    const { building, membership } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.contribution)
      .values({
        buildingId: building.id,
        membershipId: membership.id,
        category: "roof",
        payload: { note: "New shingles installed" },
        confidenceLevel: 4,
        sourceMethod: "field_visit",
      })
      .returning();
    expect(row.contributorRole).toBeNull();
  });

  it("defaults review_status to pending", async () => {
    const { building, membership } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.contribution)
      .values({
        buildingId: building.id,
        membershipId: membership.id,
        category: "roof",
        payload: {},
        confidenceLevel: 4,
        sourceMethod: "field_visit",
      })
      .returning();
    expect(row.reviewStatus).toBe("pending");
  });

  it("rejects an invalid review_status", async () => {
    const { building, membership } = await insertTestFixtures();
    await expect(
      db.insert(schema.contribution).values({
        buildingId: building.id,
        membershipId: membership.id,
        category: "roof",
        payload: {},
        confidenceLevel: 4,
        sourceMethod: "field_visit",
        reviewStatus: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("rejects an out-of-range confidence_level", async () => {
    const { building, membership } = await insertTestFixtures();
    await expect(
      db.insert(schema.contribution).values({
        buildingId: building.id,
        membershipId: membership.id,
        category: "roof",
        payload: {},
        confidenceLevel: 0,
        sourceMethod: "field_visit",
      }),
    ).rejects.toThrow();
  });

  it("allows two contributions for the same building and category to persist independently", async () => {
    const { building, membership } = await insertTestFixtures();
    await db.insert(schema.contribution).values([
      {
        buildingId: building.id,
        membershipId: membership.id,
        category: "roof",
        payload: { note: "first" },
        confidenceLevel: 3,
        sourceMethod: "field_visit",
      },
      {
        buildingId: building.id,
        membershipId: membership.id,
        category: "roof",
        payload: { note: "second" },
        confidenceLevel: 5,
        sourceMethod: "professional_audit",
      },
    ]);

    const rows = await db
      .select()
      .from(schema.contribution)
      .where(eq(schema.contribution.buildingId, building.id));
    expect(rows).toHaveLength(2);
  });

  it("rejects an insert with a building_id that does not exist", async () => {
    const { membership } = await insertTestFixtures();
    await expect(
      db.insert(schema.contribution).values({
        buildingId: randomUUID(),
        membershipId: membership.id,
        category: "roof",
        payload: {},
        confidenceLevel: 4,
        sourceMethod: "field_visit",
      }),
    ).rejects.toThrow();
  });

  it("rejects an insert with a membership_id that does not exist", async () => {
    const { building } = await insertTestFixtures();
    await expect(
      db.insert(schema.contribution).values({
        buildingId: building.id,
        membershipId: randomUUID(),
        category: "roof",
        payload: {},
        confidenceLevel: 4,
        sourceMethod: "field_visit",
      }),
    ).rejects.toThrow();
  });
});
