import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_REQUESTER_ID = `test-requester-${randomUUID()}`;

async function cleanup() {
  await db
    .delete(schema.job)
    .where(eq(schema.job.requesterUserId, TEST_REQUESTER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_REQUESTER_ID));
}

async function insertTestRequester() {
  const [requester] = await db
    .insert(schema.user)
    .values({ id: TEST_REQUESTER_ID, name: "Test Requester", email: `${TEST_REQUESTER_ID}@example.com` })
    .returning();
  return requester;
}

describe("job.status", () => {
  afterEach(cleanup);

  it("defaults to pending", async () => {
    await insertTestRequester();
    const [row] = await db
      .insert(schema.job)
      .values({
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "building",
        subjectId: randomUUID(),
        description: "Fix the roof",
      })
      .returning();
    expect(row.status).toBe("pending");
  });

  it("rejects an invalid status value", async () => {
    await insertTestRequester();
    await expect(
      db.insert(schema.job).values({
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "building",
        subjectId: randomUUID(),
        description: "Fix the roof",
        status: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("persists status = 'cancelled' alongside cancelled_at", async () => {
    await insertTestRequester();
    const [row] = await db
      .insert(schema.job)
      .values({
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "building",
        subjectId: randomUUID(),
        description: "Fix the roof",
      })
      .returning();

    const cancelledAt = new Date();
    const [updated] = await db
      .update(schema.job)
      .set({ status: "cancelled", cancelledAt, cancellationReason: "Requester changed their mind" })
      .where(eq(schema.job.id, row.id))
      .returning();

    expect(updated.status).toBe("cancelled");
    expect(updated.cancelledAt).not.toBeNull();
    expect(updated.cancellationReason).toBe("Requester changed their mind");
  });
});

describe("job.subject_type", () => {
  afterEach(cleanup);

  it("rejects an invalid subject_type", async () => {
    await insertTestRequester();
    await expect(
      db.insert(schema.job).values({
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "unit" as any,
        subjectId: randomUUID(),
        description: "Fix the roof",
      }),
    ).rejects.toThrow();
  });
});

describe("job.assignee_user_id", () => {
  afterEach(cleanup);

  it("persists with a null assignee", async () => {
    await insertTestRequester();
    const [row] = await db
      .insert(schema.job)
      .values({
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "building",
        subjectId: randomUUID(),
        description: "Fix the roof",
      })
      .returning();
    expect(row.assigneeUserId).toBeNull();
  });
});

describe("job.priority", () => {
  afterEach(cleanup);

  it("rejects an invalid priority value", async () => {
    await insertTestRequester();
    await expect(
      db.insert(schema.job).values({
        requesterUserId: TEST_REQUESTER_ID,
        targetRole: "contractor",
        subjectType: "building",
        subjectId: randomUUID(),
        description: "Fix the roof",
        priority: "bogus" as any,
      }),
    ).rejects.toThrow();
  });
});
