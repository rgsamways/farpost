import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_NAME = `Test Checklist ${randomUUID()}`;

async function cleanup() {
  const [template] = await db
    .select()
    .from(schema.checklistTemplate)
    .where(eq(schema.checklistTemplate.name, TEST_NAME));
  if (template) {
    await db
      .delete(schema.checklistTemplateItem)
      .where(eq(schema.checklistTemplateItem.checklistTemplateId, template.id));
  }
  await db.delete(schema.checklistTemplate).where(eq(schema.checklistTemplate.name, TEST_NAME));
}

async function insertTestTemplate() {
  const [template] = await db
    .insert(schema.checklistTemplate)
    .values({ name: TEST_NAME })
    .returning();
  return template;
}

describe("checklist_template_item", () => {
  afterEach(cleanup);

  it("allows multiple ordered items per template", async () => {
    const template = await insertTestTemplate();
    await db.insert(schema.checklistTemplateItem).values([
      { checklistTemplateId: template.id, sequence: 1, title: "Item 1" },
      { checklistTemplateId: template.id, sequence: 2, title: "Item 2" },
      { checklistTemplateId: template.id, sequence: 3, title: "Item 3" },
    ]);

    const rows = await db
      .select()
      .from(schema.checklistTemplateItem)
      .where(eq(schema.checklistTemplateItem.checklistTemplateId, template.id));
    expect(rows.map((r) => r.sequence).sort()).toEqual([1, 2, 3]);
  });

  it("blocks deleting a template that has items", async () => {
    const template = await insertTestTemplate();
    await db
      .insert(schema.checklistTemplateItem)
      .values({ checklistTemplateId: template.id, sequence: 1, title: "Item 1" });

    await expect(
      db.delete(schema.checklistTemplate).where(eq(schema.checklistTemplate.id, template.id)),
    ).rejects.toThrow();
  });

  it("requires an existing ChecklistTemplate", async () => {
    await expect(
      db.insert(schema.checklistTemplateItem).values({
        checklistTemplateId: randomUUID(),
        sequence: 1,
        title: "Item 1",
      }),
    ).rejects.toThrow();
  });
});
