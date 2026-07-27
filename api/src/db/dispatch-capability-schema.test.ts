import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_USER_ID = `test-user-${randomUUID()}`;

async function cleanup() {
  const [membership] = await db
    .select()
    .from(schema.membership)
    .where(eq(schema.membership.userId, TEST_USER_ID));
  if (membership) {
    await db.delete(schema.dispatchCapability).where(eq(schema.dispatchCapability.membershipId, membership.id));
  }
  await db.delete(schema.membership).where(eq(schema.membership.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
}

async function insertTestMembership() {
  await db.insert(schema.user).values({
    id: TEST_USER_ID,
    name: "Test User",
    email: `${TEST_USER_ID}@example.com`,
  });
  const [membership] = await db
    .insert(schema.membership)
    .values({ userId: TEST_USER_ID, role: "contractor" })
    .returning();
  return membership;
}

describe("dispatch_capability", () => {
  afterEach(cleanup);

  it("defaults eligible to false", async () => {
    const membership = await insertTestMembership();
    const [row] = await db
      .insert(schema.dispatchCapability)
      .values({ membershipId: membership.id })
      .returning();
    expect(row.eligible).toBe(false);
  });

  it("rejects an insert with a membership_id that does not exist", async () => {
    await expect(
      db.insert(schema.dispatchCapability).values({ membershipId: randomUUID() }),
    ).rejects.toThrow();
  });
});
