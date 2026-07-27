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
    await db
      .delete(schema.complianceRecord)
      .where(eq(schema.complianceRecord.membershipId, membership.id));
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

describe("compliance_record", () => {
  afterEach(cleanup);

  it("allows a Membership to hold multiple compliance records", async () => {
    const membership = await insertTestMembership();
    await db.insert(schema.complianceRecord).values([
      { membershipId: membership.id, credentialType: "WSIB", verificationStatus: "pending" },
      { membershipId: membership.id, credentialType: "ESA", verificationStatus: "verified" },
    ]);

    const rows = await db
      .select()
      .from(schema.complianceRecord)
      .where(eq(schema.complianceRecord.membershipId, membership.id));
    expect(rows).toHaveLength(2);
  });

  it("rejects an invalid verification_status", async () => {
    const membership = await insertTestMembership();
    await expect(
      db.insert(schema.complianceRecord).values({
        membershipId: membership.id,
        credentialType: "WSIB",
        verificationStatus: "bogus" as any,
      }),
    ).rejects.toThrow();
  });
});
