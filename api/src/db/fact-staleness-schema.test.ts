import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;

async function cleanup() {
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.factStaleness).where(eq(schema.factStaleness.buildingId, building.id));
  }
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

describe("fact_staleness", () => {
  afterEach(cleanup);

  it("persists with a correctly computed next_stale_at", async () => {
    const building = await insertTestBuilding();
    const [row] = await db
      .insert(schema.factStaleness)
      .values({
        buildingId: building.id,
        category: "roof",
        lastDocumentedAt: "2026-01-01",
        halfLifeMonths: 12,
        sourceMethod: "field_visit",
        sourceConfidenceLevel: 4,
      })
      .returning();
    expect(row.nextStaleAt).toBe("2027-01-01");
  });

  it("rejects a second row for the same building and category", async () => {
    const building = await insertTestBuilding();
    await db.insert(schema.factStaleness).values({
      buildingId: building.id,
      category: "roof",
      lastDocumentedAt: "2026-01-01",
      halfLifeMonths: 12,
      sourceMethod: "field_visit",
      sourceConfidenceLevel: 4,
    });

    await expect(
      db.insert(schema.factStaleness).values({
        buildingId: building.id,
        category: "roof",
        lastDocumentedAt: "2026-02-01",
        halfLifeMonths: 24,
        sourceMethod: "professional_audit",
        sourceConfidenceLevel: 5,
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid source_method", async () => {
    const building = await insertTestBuilding();
    await expect(
      db.insert(schema.factStaleness).values({
        buildingId: building.id,
        category: "roof",
        lastDocumentedAt: "2026-01-01",
        halfLifeMonths: 12,
        sourceMethod: "bogus" as any,
        sourceConfidenceLevel: 4,
      }),
    ).rejects.toThrow();
  });

  it("rejects an out-of-range source_confidence_level", async () => {
    const building = await insertTestBuilding();
    await expect(
      db.insert(schema.factStaleness).values({
        buildingId: building.id,
        category: "roof",
        lastDocumentedAt: "2026-01-01",
        halfLifeMonths: 12,
        sourceMethod: "field_visit",
        sourceConfidenceLevel: 6,
      }),
    ).rejects.toThrow();
  });

  it("rejects an insert with a building_id that does not exist", async () => {
    await expect(
      db.insert(schema.factStaleness).values({
        buildingId: randomUUID(),
        category: "roof",
        lastDocumentedAt: "2026-01-01",
        halfLifeMonths: 12,
        sourceMethod: "field_visit",
        sourceConfidenceLevel: 4,
      }),
    ).rejects.toThrow();
  });
});
