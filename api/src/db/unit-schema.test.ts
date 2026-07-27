import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.unit).where(eq(schema.unit.unitLabel, "Unit A"));
  await db.delete(schema.unit).where(eq(schema.unit.unitLabel, "Unit B"));
  await db.delete(schema.unit).where(eq(schema.unit.unitLabel, "Unit C"));
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

describe("unit", () => {
  afterEach(cleanup);

  it("allows a Building to have zero Units", async () => {
    const building = await insertTestBuilding();
    const rows = await db.select().from(schema.unit).where(eq(schema.unit.buildingId, building.id));
    expect(rows).toHaveLength(0);
  });

  it("allows a Building to have multiple Units", async () => {
    const building = await insertTestBuilding();
    await db.insert(schema.unit).values([
      { buildingId: building.id, unitLabel: "Unit A" },
      { buildingId: building.id, unitLabel: "Unit B" },
      { buildingId: building.id, unitLabel: "Unit C" },
    ]);

    const rows = await db.select().from(schema.unit).where(eq(schema.unit.buildingId, building.id));
    expect(rows).toHaveLength(3);
  });

  it("blocks deleting a Building that has a Unit", async () => {
    const building = await insertTestBuilding();
    await db.insert(schema.unit).values({ buildingId: building.id, unitLabel: "Unit A" });

    await expect(
      db.delete(schema.building).where(eq(schema.building.id, building.id)),
    ).rejects.toThrow();
  });

  it("rejects a duplicate nfc_tag_id across two Units", async () => {
    const building = await insertTestBuilding();
    const tagId = `tag-${randomUUID()}`;
    await db.insert(schema.unit).values({ buildingId: building.id, unitLabel: "Unit A", nfcTagId: tagId });

    await expect(
      db.insert(schema.unit).values({ buildingId: building.id, unitLabel: "Unit B", nfcTagId: tagId }),
    ).rejects.toThrow();
  });

  it("permits multiple Units with a null nfc_tag_id", async () => {
    const building = await insertTestBuilding();
    await db.insert(schema.unit).values([
      { buildingId: building.id, unitLabel: "Unit A" },
      { buildingId: building.id, unitLabel: "Unit B" },
    ]);

    const rows = await db.select().from(schema.unit).where(eq(schema.unit.buildingId, building.id));
    expect(rows).toHaveLength(2);
  });
});
