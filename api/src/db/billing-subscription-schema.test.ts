import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_USER_ID = `test-user-${randomUUID()}`;

async function cleanup() {
  await db
    .delete(schema.billingSubscription)
    .where(eq(schema.billingSubscription.userId, TEST_USER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_USER_ID));
}

async function insertTestUser() {
  await db.insert(schema.user).values({
    id: TEST_USER_ID,
    name: "Test User",
    email: `${TEST_USER_ID}@example.com`,
  });
}

function periodFields() {
  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date(currentPeriodStart.getTime() + 365 * 24 * 60 * 60 * 1000);
  return { currentPeriodStart, currentPeriodEnd, periodChargedCents: 1200 };
}

describe("billing_subscription", () => {
  afterEach(cleanup);

  it("defaults status to active and period_number to 1", async () => {
    await insertTestUser();
    const [row] = await db
      .insert(schema.billingSubscription)
      .values({
        userId: TEST_USER_ID,
        interval: "annual",
        priceCents: 1200,
        ...periodFields(),
      })
      .returning();
    expect(row.status).toBe("active");
    expect(row.periodNumber).toBe(1);
  });

  it("rejects a second active subscription for the same user", async () => {
    await insertTestUser();
    await db.insert(schema.billingSubscription).values({
      userId: TEST_USER_ID,
      interval: "annual",
      priceCents: 1200,
      ...periodFields(),
    });

    await expect(
      db.insert(schema.billingSubscription).values({
        userId: TEST_USER_ID,
        interval: "annual",
        priceCents: 1200,
        ...periodFields(),
      }),
    ).rejects.toThrow();
  });

  it("allows a second canceled subscription for the same user", async () => {
    await insertTestUser();
    await db.insert(schema.billingSubscription).values({
      userId: TEST_USER_ID,
      interval: "annual",
      priceCents: 1200,
      status: "canceled",
      ...periodFields(),
    });
    await db.insert(schema.billingSubscription).values({
      userId: TEST_USER_ID,
      interval: "annual",
      priceCents: 1200,
      status: "canceled",
      ...periodFields(),
    });

    const rows = await db
      .select()
      .from(schema.billingSubscription)
      .where(eq(schema.billingSubscription.userId, TEST_USER_ID));
    expect(rows).toHaveLength(2);
  });

  it("rejects an invalid interval", async () => {
    await insertTestUser();
    await expect(
      db.insert(schema.billingSubscription).values({
        userId: TEST_USER_ID,
        interval: "bogus" as any,
        priceCents: 1200,
        ...periodFields(),
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid status", async () => {
    await insertTestUser();
    await expect(
      db.insert(schema.billingSubscription).values({
        userId: TEST_USER_ID,
        interval: "annual",
        priceCents: 1200,
        status: "bogus" as any,
        ...periodFields(),
      }),
    ).rejects.toThrow();
  });

  it("allows canceled_at to be null", async () => {
    await insertTestUser();
    const [row] = await db
      .insert(schema.billingSubscription)
      .values({
        userId: TEST_USER_ID,
        interval: "annual",
        priceCents: 1200,
        ...periodFields(),
      })
      .returning();
    expect(row.canceledAt).toBeNull();
  });

  it("rejects an insert with a user_id that does not exist", async () => {
    await expect(
      db.insert(schema.billingSubscription).values({
        userId: randomUUID(),
        interval: "annual",
        priceCents: 1200,
        ...periodFields(),
      }),
    ).rejects.toThrow();
  });
});
