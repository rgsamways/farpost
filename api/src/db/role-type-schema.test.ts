import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_USER_ID = `test-user-${randomUUID()}`;
const TEST_ROLE_KEY = `test-role-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.membership).where(eq(schema.membership.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
  await db.delete(schema.roleType).where(eq(schema.roleType.key, TEST_ROLE_KEY));
}

describe("role_type", () => {
  afterEach(cleanup);

  it("does not constrain membership.role via a database foreign key", async () => {
    await db.insert(schema.user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `${TEST_USER_ID}@example.com`,
    });

    // No role_type row exists for this key at all.
    await db.insert(schema.membership).values({ userId: TEST_USER_ID, role: TEST_ROLE_KEY });

    const [row] = await db
      .select()
      .from(schema.membership)
      .where(eq(schema.membership.userId, TEST_USER_ID));
    expect(row.role).toBe(TEST_ROLE_KEY);
  });

  it("is independently manageable without affecting existing memberships", async () => {
    await db.insert(schema.user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `${TEST_USER_ID}@example.com`,
    });
    await db.insert(schema.membership).values({ userId: TEST_USER_ID, role: TEST_ROLE_KEY });

    await db.insert(schema.roleType).values({ key: TEST_ROLE_KEY, displayName: "Test Role" });
    await db
      .update(schema.roleType)
      .set({ status: "deprecated" })
      .where(eq(schema.roleType.key, TEST_ROLE_KEY));

    const [membershipRow] = await db
      .select()
      .from(schema.membership)
      .where(eq(schema.membership.userId, TEST_USER_ID));
    expect(membershipRow.role).toBe(TEST_ROLE_KEY);
  });
});
