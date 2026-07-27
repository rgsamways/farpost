import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_USER_ID = `test-user-${randomUUID()}`;
const TEST_EVENT_TYPE = `TEST.EVENT.${randomUUID()}`;

async function cleanup() {
  const [membership] = await db
    .select()
    .from(schema.membership)
    .where(eq(schema.membership.userId, TEST_USER_ID));
  if (membership) {
    await db
      .delete(schema.notificationSubscription)
      .where(eq(schema.notificationSubscription.membershipId, membership.id));
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
    .values({ userId: TEST_USER_ID, role: "inspector" })
    .returning();
  return membership;
}

describe("notification_subscription", () => {
  afterEach(cleanup);

  it("persists a building-anchored subscription", async () => {
    const membership = await insertTestMembership();
    const [row] = await db
      .insert(schema.notificationSubscription)
      .values({
        membershipId: membership.id,
        eventType: TEST_EVENT_TYPE,
        anchorType: "building",
        anchorValue: randomUUID(),
      })
      .returning();
    expect(row.anchorType).toBe("building");
    expect(row.anchorValue).not.toBeNull();
  });

  it("persists a postal-code-anchored subscription", async () => {
    const membership = await insertTestMembership();
    const [row] = await db
      .insert(schema.notificationSubscription)
      .values({
        membershipId: membership.id,
        eventType: TEST_EVENT_TYPE,
        anchorType: "postal_code",
        anchorValue: "K0L",
      })
      .returning();
    expect(row.anchorType).toBe("postal_code");
    expect(row.anchorValue).toBe("K0L");
  });

  it("persists a global subscription with a null anchor_value", async () => {
    const membership = await insertTestMembership();
    const [row] = await db
      .insert(schema.notificationSubscription)
      .values({
        membershipId: membership.id,
        eventType: TEST_EVENT_TYPE,
        anchorType: "all",
      })
      .returning();
    expect(row.anchorType).toBe("all");
    expect(row.anchorValue).toBeNull();
  });

  it("rejects an invalid anchor_type", async () => {
    const membership = await insertTestMembership();
    await expect(
      db.insert(schema.notificationSubscription).values({
        membershipId: membership.id,
        eventType: TEST_EVENT_TYPE,
        anchorType: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("defaults frequency_preference to immediate", async () => {
    const membership = await insertTestMembership();
    const [row] = await db
      .insert(schema.notificationSubscription)
      .values({ membershipId: membership.id, eventType: TEST_EVENT_TYPE, anchorType: "all" })
      .returning();
    expect(row.frequencyPreference).toBe("immediate");
  });

  it("rejects an invalid frequency_preference", async () => {
    const membership = await insertTestMembership();
    await expect(
      db.insert(schema.notificationSubscription).values({
        membershipId: membership.id,
        eventType: TEST_EVENT_TYPE,
        anchorType: "all",
        frequencyPreference: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("defaults active to true", async () => {
    const membership = await insertTestMembership();
    const [row] = await db
      .insert(schema.notificationSubscription)
      .values({ membershipId: membership.id, eventType: TEST_EVENT_TYPE, anchorType: "all" })
      .returning();
    expect(row.active).toBe(true);
  });

  it("rejects an insert with a membership_id that does not exist", async () => {
    await expect(
      db.insert(schema.notificationSubscription).values({
        membershipId: randomUUID(),
        eventType: TEST_EVENT_TYPE,
        anchorType: "all",
      }),
    ).rejects.toThrow();
  });

  it("blocks deleting a Membership that has an active subscription", async () => {
    const membership = await insertTestMembership();
    await db.insert(schema.notificationSubscription).values({
      membershipId: membership.id,
      eventType: TEST_EVENT_TYPE,
      anchorType: "all",
    });

    await expect(
      db.delete(schema.membership).where(eq(schema.membership.id, membership.id)),
    ).rejects.toThrow();
  });
});
