import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;
const TEST_USER_ID = `test-user-${randomUUID()}`;
const TEST_TEMPLATE_NAME = `Test Checklist ${randomUUID()}`;
const TEST_ASSET_LABEL = `test-asset-${randomUUID()}`;

async function cleanup() {
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.checklistRun).where(eq(schema.checklistRun.buildingId, building.id));
  }
  await db.delete(schema.asset).where(eq(schema.asset.label, TEST_ASSET_LABEL));
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
  await db.delete(schema.membership).where(eq(schema.membership.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
  const [template] = await db
    .select()
    .from(schema.checklistTemplate)
    .where(eq(schema.checklistTemplate.name, TEST_TEMPLATE_NAME));
  if (template) {
    await db
      .delete(schema.checklistTemplateItem)
      .where(eq(schema.checklistTemplateItem.checklistTemplateId, template.id));
  }
  await db
    .delete(schema.checklistTemplate)
    .where(eq(schema.checklistTemplate.name, TEST_TEMPLATE_NAME));
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
    .values({ userId: TEST_USER_ID, role: "inspector" })
    .returning();
  const [template] = await db
    .insert(schema.checklistTemplate)
    .values({ name: TEST_TEMPLATE_NAME })
    .returning();
  const [item] = await db
    .insert(schema.checklistTemplateItem)
    .values({ checklistTemplateId: template.id, sequence: 1, title: "Check the roof" })
    .returning();
  const [run] = await db
    .insert(schema.checklistRun)
    .values({
      buildingId: building.id,
      membershipId: membership.id,
      checklistTemplateId: template.id,
      checklistTemplateVersion: template.version,
    })
    .returning();
  const [asset] = await db
    .insert(schema.asset)
    .values({ subjectType: "building", subjectId: building.id, label: TEST_ASSET_LABEL })
    .returning();
  return { run, item, asset };
}

describe("checklist_result", () => {
  afterEach(cleanup);

  it("persists with asset_id null", async () => {
    const { run, item } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.checklistResult)
      .values({
        checklistRunId: run.id,
        checklistTemplateItemId: item.id,
        conditionStatus: "inspected_acceptable",
      })
      .returning();

    expect(row.assetId).toBeNull();
  });

  it("correctly references its checklist_template_item_id", async () => {
    const { run, item } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.checklistResult)
      .values({
        checklistRunId: run.id,
        checklistTemplateItemId: item.id,
        conditionStatus: "inspected_acceptable",
      })
      .returning();

    expect(row.checklistTemplateItemId).toBe(item.id);
  });

  it("persists with a real asset_id", async () => {
    const { run, item, asset } = await insertTestFixtures();
    const [row] = await db
      .insert(schema.checklistResult)
      .values({
        checklistRunId: run.id,
        checklistTemplateItemId: item.id,
        assetId: asset.id,
        conditionStatus: "safety_concern",
      })
      .returning();

    expect(row.assetId).toBe(asset.id);
  });

  it("rejects an invalid condition_status", async () => {
    const { run, item } = await insertTestFixtures();
    await expect(
      db.insert(schema.checklistResult).values({
        checklistRunId: run.id,
        checklistTemplateItemId: item.id,
        conditionStatus: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("is deleted when its ChecklistRun is deleted", async () => {
    const { run, item } = await insertTestFixtures();
    await db.insert(schema.checklistResult).values({
      checklistRunId: run.id,
      checklistTemplateItemId: item.id,
      conditionStatus: "inspected_acceptable",
    });

    await db.delete(schema.checklistRun).where(eq(schema.checklistRun.id, run.id));

    const rows = await db
      .select()
      .from(schema.checklistResult)
      .where(eq(schema.checklistResult.checklistRunId, run.id));
    expect(rows).toHaveLength(0);
  });
});
