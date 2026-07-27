import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_NAME = `Test Checklist ${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.checklistTemplate).where(eq(schema.checklistTemplate.name, TEST_NAME));
}

describe("checklist_template", () => {
  afterEach(cleanup);

  it("defaults status to draft", async () => {
    const [row] = await db
      .insert(schema.checklistTemplate)
      .values({ name: TEST_NAME })
      .returning();
    expect(row.status).toBe("draft");
  });

  it("rejects an invalid status value", async () => {
    await expect(
      db.insert(schema.checklistTemplate).values({ name: TEST_NAME, status: "bogus" as any }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate (name, version) pair", async () => {
    await db.insert(schema.checklistTemplate).values({ name: TEST_NAME, version: 1 });

    await expect(
      db.insert(schema.checklistTemplate).values({ name: TEST_NAME, version: 1 }),
    ).rejects.toThrow();
  });

  it("allows the same name with a different version", async () => {
    await db.insert(schema.checklistTemplate).values({ name: TEST_NAME, version: 1 });
    await db.insert(schema.checklistTemplate).values({ name: TEST_NAME, version: 2 });

    const rows = await db
      .select()
      .from(schema.checklistTemplate)
      .where(eq(schema.checklistTemplate.name, TEST_NAME));
    expect(rows).toHaveLength(2);
  });

  it("persists with curator_id null", async () => {
    const [row] = await db
      .insert(schema.checklistTemplate)
      .values({ name: TEST_NAME })
      .returning();
    expect(row.curatorId).toBeNull();
  });
});
