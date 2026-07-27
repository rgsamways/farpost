import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_USER_ID = `test-user-${randomUUID()}`;
const TEST_SLUG = `test-professional-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.professionalProfile).where(eq(schema.professionalProfile.slug, TEST_SLUG));
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

describe("professional_profile", () => {
  afterEach(cleanup);

  it("rejects a duplicate slug", async () => {
    const membership = await insertTestMembership();
    await db.insert(schema.professionalProfile).values({
      membershipId: membership.id,
      firstName: "Jane",
      lastName: "Doe",
      slug: TEST_SLUG,
    });

    await db.insert(schema.user).values({
      id: `${TEST_USER_ID}-2`,
      name: "Test User 2",
      email: `${TEST_USER_ID}-2@example.com`,
    });
    const [membership2] = await db
      .insert(schema.membership)
      .values({ userId: `${TEST_USER_ID}-2`, role: "contractor" })
      .returning();

    await expect(
      db.insert(schema.professionalProfile).values({
        membershipId: membership2.id,
        firstName: "John",
        lastName: "Smith",
        slug: TEST_SLUG,
      }),
    ).rejects.toThrow();

    await db.delete(schema.membership).where(eq(schema.membership.userId, `${TEST_USER_ID}-2`));
    await db.delete(schema.user).where(eq(schema.user.id, `${TEST_USER_ID}-2`));
  });

  it("rejects an insert with a membership_id that does not exist", async () => {
    await expect(
      db.insert(schema.professionalProfile).values({
        membershipId: randomUUID(),
        firstName: "Jane",
        lastName: "Doe",
        slug: TEST_SLUG,
      }),
    ).rejects.toThrow();
  });

  it("blocks deleting a Membership that has a ProfessionalProfile", async () => {
    const membership = await insertTestMembership();
    await db.insert(schema.professionalProfile).values({
      membershipId: membership.id,
      firstName: "Jane",
      lastName: "Doe",
      slug: TEST_SLUG,
    });

    await expect(
      db.delete(schema.membership).where(eq(schema.membership.id, membership.id)),
    ).rejects.toThrow();
  });

  it("has no average_rating or review_count column", async () => {
    const membership = await insertTestMembership();
    await expect(
      db.execute(
        sql`INSERT INTO "professional_profile" ("membership_id", "first_name", "last_name", "slug", "average_rating") VALUES (${membership.id}, 'Jane', 'Doe', ${TEST_SLUG}, 5)`,
      ),
    ).rejects.toThrow();
  });
});
