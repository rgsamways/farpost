import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;
const TEST_ASSET_LABEL = `test-asset-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.asset).where(eq(schema.asset.label, TEST_ASSET_LABEL));
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

async function insertTestPropertyBuildingUnit() {
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
  return { property, building, unit };
}

describe("asset.subject_type", () => {
  afterEach(cleanup);

  it("can attach directly to a Property", async () => {
    const { property } = await insertTestPropertyBuildingUnit();
    const [row] = await db
      .insert(schema.asset)
      .values({ subjectType: "property", subjectId: property.id, label: TEST_ASSET_LABEL })
      .returning();
    expect(row.subjectType).toBe("property");
  });

  it("can attach to a Building", async () => {
    const { building } = await insertTestPropertyBuildingUnit();
    const [row] = await db
      .insert(schema.asset)
      .values({ subjectType: "building", subjectId: building.id, label: TEST_ASSET_LABEL })
      .returning();
    expect(row.subjectType).toBe("building");
  });

  it("can attach to a Unit", async () => {
    const { unit } = await insertTestPropertyBuildingUnit();
    const [row] = await db
      .insert(schema.asset)
      .values({ subjectType: "unit", subjectId: unit.id, label: TEST_ASSET_LABEL })
      .returning();
    expect(row.subjectType).toBe("unit");
  });

  it("rejects an invalid subject_type", async () => {
    await expect(
      db.insert(schema.asset).values({
        subjectType: "job" as any,
        subjectId: randomUUID(),
        label: TEST_ASSET_LABEL,
      }),
    ).rejects.toThrow();
  });
});

describe("asset manufacturer/warranty detail", () => {
  afterEach(cleanup);

  it("persists manufacturer, model, serial_number, and warranty_expiry_date", async () => {
    const { property } = await insertTestPropertyBuildingUnit();
    const [row] = await db
      .insert(schema.asset)
      .values({
        subjectType: "property",
        subjectId: property.id,
        label: TEST_ASSET_LABEL,
        manufacturer: "Carrier",
        model: "Infinity 98",
        serialNumber: "SN-12345",
        warrantyExpiryDate: "2030-01-01",
      })
      .returning();

    expect(row.manufacturer).toBe("Carrier");
    expect(row.model).toBe("Infinity 98");
    expect(row.serialNumber).toBe("SN-12345");
    expect(row.warrantyExpiryDate).toBe("2030-01-01");
  });
});

describe("asset location/last_serviced_date detail", () => {
  afterEach(cleanup);

  it("persists location and last_serviced_date independently of installed_date", async () => {
    const { property } = await insertTestPropertyBuildingUnit();
    const [row] = await db
      .insert(schema.asset)
      .values({
        subjectType: "property",
        subjectId: property.id,
        label: TEST_ASSET_LABEL,
        location: "basement",
        installedDate: "2018-06-01",
        lastServicedDate: "2024-03-15",
      })
      .returning();

    expect(row.location).toBe("basement");
    expect(row.installedDate).toBe("2018-06-01");
    expect(row.lastServicedDate).toBe("2024-03-15");
  });
});
