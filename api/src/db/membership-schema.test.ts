import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_USER_ID = `test-user-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.membership).where(eq(schema.membership.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
}

describe("membership.role", () => {
  afterEach(cleanup);

  it("accepts an arbitrary role string, not a fixed enum", async () => {
    await db.insert(schema.user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `${TEST_USER_ID}@example.com`,
    });

    const arbitraryRole = "home_security_professional";
    await db.insert(schema.membership).values({ userId: TEST_USER_ID, role: arbitraryRole });

    const [row] = await db
      .select()
      .from(schema.membership)
      .where(eq(schema.membership.userId, TEST_USER_ID));
    expect(row.role).toBe(arbitraryRole);
    expect(row.status).toBe("active");
  });
});
