import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;
const TEST_USER_ID = `test-user-${randomUUID()}`;
const TEST_TEMPLATE_NAME = `Test Checklist ${randomUUID()}`;

async function cleanup() {
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.checklistRun).where(eq(schema.checklistRun.buildingId, building.id));
  }
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
  await db.delete(schema.membership).where(eq(schema.membership.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
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
    .values({ name: TEST_TEMPLATE_NAME, version: 3 })
    .returning();
  return { building, membership, template };
}

describe("checklist_run", () => {
  afterEach(cleanup);

  it("pins checklist_template_version independently of the template's current version", async () => {
    const { building, membership, template } = await insertTestFixtures();
    const [run] = await db
      .insert(schema.checklistRun)
      .values({
        buildingId: building.id,
        membershipId: membership.id,
        checklistTemplateId: template.id,
        checklistTemplateVersion: 2,
      })
      .returning();

    expect(run.checklistTemplateVersion).toBe(2);
    expect(template.version).toBe(3);
  });

  it("persists with completed_at null", async () => {
    const { building, membership, template } = await insertTestFixtures();
    const [run] = await db
      .insert(schema.checklistRun)
      .values({
        buildingId: building.id,
        membershipId: membership.id,
        checklistTemplateId: template.id,
        checklistTemplateVersion: template.version,
      })
      .returning();

    expect(run.completedAt).toBeNull();
  });

  it("rejects an invalid overall_status value", async () => {
    const { building, membership, template } = await insertTestFixtures();
    await expect(
      db.insert(schema.checklistRun).values({
        buildingId: building.id,
        membershipId: membership.id,
        checklistTemplateId: template.id,
        checklistTemplateVersion: template.version,
        overallStatus: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("blocks deleting a Building that has ChecklistRuns", async () => {
    const { building, membership, template } = await insertTestFixtures();
    await db.insert(schema.checklistRun).values({
      buildingId: building.id,
      membershipId: membership.id,
      checklistTemplateId: template.id,
      checklistTemplateVersion: template.version,
    });

    await expect(
      db.delete(schema.building).where(eq(schema.building.id, building.id)),
    ).rejects.toThrow();
  });
});
