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
    await db.delete(schema.scoutVisit).where(eq(schema.scoutVisit.buildingId, building.id));
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
    .values({ userId: TEST_USER_ID, role: "scout" })
    .returning();
  return { building, membership };
}

describe("scout_visit", () => {
  afterEach(cleanup);

  it("persists with an empty photo_urls array by default", async () => {
    const { building, membership } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.scoutVisit)
      .values({ buildingId: building.id, membershipId: membership.id })
      .returning();
    expect(row.photoUrls).toEqual([]);
  });

  it("persists with multiple photo_urls values in order", async () => {
    const { building, membership } = await insertTestFixtures();
    const urls = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
    ];
    const [row] = await db
      .insert(schema.scoutVisit)
      .values({ buildingId: building.id, membershipId: membership.id, photoUrls: urls })
      .returning();
    expect(row.photoUrls).toEqual(urls);
  });

  it("allows gps_accuracy_m to be null", async () => {
    const { building, membership } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.scoutVisit)
      .values({ buildingId: building.id, membershipId: membership.id })
      .returning();
    expect(row.gpsAccuracyM).toBeNull();
  });

  it("rejects an insert with a building_id that does not exist", async () => {
    const { membership } = await insertTestFixtures();
    await expect(
      db.insert(schema.scoutVisit).values({ buildingId: randomUUID(), membershipId: membership.id }),
    ).rejects.toThrow();
  });

  it("rejects an insert with a membership_id that does not exist", async () => {
    const { building } = await insertTestFixtures();
    await expect(
      db.insert(schema.scoutVisit).values({ buildingId: building.id, membershipId: randomUUID() }),
    ).rejects.toThrow();
  });
});
