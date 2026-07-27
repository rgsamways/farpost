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

describe("membership.status", () => {
  afterEach(cleanup);

  it("rejects a status value outside the CHECK constraint", async () => {
    await db.insert(schema.user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `${TEST_USER_ID}@example.com`,
    });

    await expect(
      db.insert(schema.membership).values({
        userId: TEST_USER_ID,
        role: "agent",
        // biome-ignore lint: intentionally invalid to exercise the DB-level CHECK constraint
        status: "bogus" as any,
      }),
    ).rejects.toThrow();
  });
});

describe("membership (user_id, role) active-uniqueness", () => {
  afterEach(cleanup);

  it("rejects a second active grant of the same role for the same user", async () => {
    await db.insert(schema.user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `${TEST_USER_ID}@example.com`,
    });
    await db.insert(schema.membership).values({ userId: TEST_USER_ID, role: "agent" });

    await expect(
      db.insert(schema.membership).values({ userId: TEST_USER_ID, role: "agent" }),
    ).rejects.toThrow();
  });

  it("permits a revoked-then-regranted role", async () => {
    await db.insert(schema.user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: `${TEST_USER_ID}@example.com`,
    });
    const [first] = await db
      .insert(schema.membership)
      .values({ userId: TEST_USER_ID, role: "agent" })
      .returning();
    await db
      .update(schema.membership)
      .set({ status: "revoked" })
      .where(eq(schema.membership.id, first.id));

    await db.insert(schema.membership).values({ userId: TEST_USER_ID, role: "agent" });

    const rows = await db
      .select()
      .from(schema.membership)
      .where(eq(schema.membership.userId, TEST_USER_ID));
    expect(rows).toHaveLength(2);
  });
});
