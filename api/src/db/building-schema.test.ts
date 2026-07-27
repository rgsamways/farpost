import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;
const TEST_BUILDING_SLUG_2 = `test-building-2-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG_2));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
}

async function insertTestProperty() {
  const [property] = await db
    .insert(schema.property)
    .values({ slug: TEST_PROPERTY_SLUG })
    .returning();
  return property;
}

describe("building", () => {
  afterEach(cleanup);

  it("rejects an insert with a property_id that does not exist", async () => {
    await expect(
      db.insert(schema.building).values({
        propertyId: randomUUID(),
        slug: TEST_BUILDING_SLUG,
      }),
    ).rejects.toThrow();
  });

  it("blocks deleting a Property that has a Building", async () => {
    const property = await insertTestProperty();
    await db.insert(schema.building).values({ propertyId: property.id, slug: TEST_BUILDING_SLUG });

    await expect(
      db.delete(schema.property).where(eq(schema.property.id, property.id)),
    ).rejects.toThrow();
  });

  it("persists a structural attribute with both type and age", async () => {
    const property = await insertTestProperty();
    const [building] = await db
      .insert(schema.building)
      .values({
        propertyId: property.id,
        slug: TEST_BUILDING_SLUG,
        roofType: "asphalt_shingle",
        roofInstalledYear: 2015,
      })
      .returning();

    expect(building.roofType).toBe("asphalt_shingle");
    expect(building.roofInstalledYear).toBe(2015);
  });

  it("has no owner_name, owner_email, or owner_phone column", async () => {
    const property = await insertTestProperty();
    await expect(
      db.execute(
        sql`INSERT INTO "building" ("property_id", "slug", "owner_name") VALUES (${property.id}, ${TEST_BUILDING_SLUG}, 'Someone')`,
      ),
    ).rejects.toThrow();
  });

  it("rejects a duplicate nfc_tag_id across two Buildings", async () => {
    const property = await insertTestProperty();
    const tagId = `tag-${randomUUID()}`;
    await db.insert(schema.building).values({
      propertyId: property.id,
      slug: TEST_BUILDING_SLUG,
      nfcTagId: tagId,
    });

    await expect(
      db.insert(schema.building).values({
        propertyId: property.id,
        slug: TEST_BUILDING_SLUG_2,
        nfcTagId: tagId,
      }),
    ).rejects.toThrow();
  });

  it("permits multiple Buildings with a null nfc_tag_id", async () => {
    const property = await insertTestProperty();
    await db.insert(schema.building).values({ propertyId: property.id, slug: TEST_BUILDING_SLUG });
    await db
      .insert(schema.building)
      .values({ propertyId: property.id, slug: TEST_BUILDING_SLUG_2 });

    const rows = await db
      .select()
      .from(schema.building)
      .where(eq(schema.building.propertyId, property.id));
    expect(rows).toHaveLength(2);
  });
});
