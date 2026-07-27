import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_EVENT_TYPE = `TEST.EVENT.${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.event).where(eq(schema.event.eventType, TEST_EVENT_TYPE));
}

describe("event", () => {
  afterEach(cleanup);

  it("persists with a null actor for a system-generated event", async () => {
    const [row] = await db
      .insert(schema.event)
      .values({
        eventType: TEST_EVENT_TYPE,
        subjectType: "job",
        subjectId: randomUUID(),
      })
      .returning();
    expect(row.actorUserId).toBeNull();
  });

  it("rejects an invalid subject_type", async () => {
    await expect(
      db.insert(schema.event).values({
        eventType: TEST_EVENT_TYPE,
        subjectType: "unit" as any,
        subjectId: randomUUID(),
      }),
    ).rejects.toThrow();
  });

  it("defaults delivery_status to pending", async () => {
    const [row] = await db
      .insert(schema.event)
      .values({
        eventType: TEST_EVENT_TYPE,
        subjectType: "job",
        subjectId: randomUUID(),
      })
      .returning();
    expect(row.deliveryStatus).toBe("pending");
  });

  it("rejects an invalid delivery_status", async () => {
    await expect(
      db.insert(schema.event).values({
        eventType: TEST_EVENT_TYPE,
        subjectType: "job",
        subjectId: randomUUID(),
        deliveryStatus: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid urgency", async () => {
    await expect(
      db.insert(schema.event).values({
        eventType: TEST_EVENT_TYPE,
        subjectType: "job",
        subjectId: randomUUID(),
        urgency: "bogus" as any,
      }),
    ).rejects.toThrow();
  });
});
