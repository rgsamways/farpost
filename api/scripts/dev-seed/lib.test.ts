import { randomUUID } from "node:crypto";
import { and, eq, like } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db, schema } from "../../src/db/client.js";
import { ensureOwnedBuilding, grantMembership, signInOrCreateUser } from "./lib.js";

// Real-DB, no mocking except the outbound email send — this suite verifies
// idempotency (each helper called twice produces one row, not two), not the
// real-email side effect itself, which is exercised for real by the
// systems-passport seed script's own manual run (see tasks.md 5.1).
vi.mock("../../src/auth/send-magic-link.js", () => ({
  sendMagicLink: vi.fn().mockResolvedValue(undefined),
}));

const EMAIL = `dev-seed-lib-${randomUUID()}@example.com`;
const SLUG = `dev-seed-lib-${randomUUID()}`;

function verificationForEmail(email: string) {
  return like(schema.verification.value, `%"email":"${email}"%`);
}

async function cleanup() {
  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, EMAIL));
  const [building] = await db.select().from(schema.building).where(eq(schema.building.slug, SLUG));

  if (building) {
    await db.delete(schema.stake).where(eq(schema.stake.subjectId, building.id));
    await db.delete(schema.building).where(eq(schema.building.id, building.id));
    await db.delete(schema.property).where(eq(schema.property.id, building.propertyId));
  }
  if (user) {
    await db.delete(schema.membership).where(eq(schema.membership.userId, user.id));
    await db.delete(schema.session).where(eq(schema.session.userId, user.id));
    await db.delete(schema.account).where(eq(schema.account.userId, user.id));
    await db.delete(schema.user).where(eq(schema.user.id, user.id));
  }
  await db.delete(schema.verification).where(verificationForEmail(EMAIL));
}

describe("dev-seed lib", () => {
  afterEach(cleanup);

  it("signInOrCreateUser creates a user once and reuses it on a second call", async () => {
    const first = await signInOrCreateUser(EMAIL);
    const second = await signInOrCreateUser(EMAIL);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.userId).toBe(first.userId);

    const rows = await db.select().from(schema.user).where(eq(schema.user.email, EMAIL));
    expect(rows).toHaveLength(1);
  });

  it("grantMembership grants a role once and reuses it on a second call", async () => {
    const { userId } = await signInOrCreateUser(EMAIL);

    const first = await grantMembership(userId, "owner");
    const second = await grantMembership(userId, "owner");

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.membershipId).toBe(first.membershipId);

    const rows = await db
      .select()
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.userId, userId),
          eq(schema.membership.role, "owner"),
          eq(schema.membership.status, "active"),
        ),
      );
    expect(rows).toHaveLength(1);
    expect(rows[0].metadata).toEqual({ seeded: true });
  });

  it("ensureOwnedBuilding creates the fixture once and reuses it on a second call", async () => {
    const { userId } = await signInOrCreateUser(EMAIL);

    const first = await ensureOwnedBuilding(userId, SLUG);
    const second = await ensureOwnedBuilding(userId, SLUG);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.buildingId).toBe(first.buildingId);
    expect(second.propertyId).toBe(first.propertyId);

    const buildings = await db.select().from(schema.building).where(eq(schema.building.slug, SLUG));
    expect(buildings).toHaveLength(1);
    expect(buildings[0].acquisitionChannel).toBe("seed");

    const stakes = await db
      .select()
      .from(schema.stake)
      .where(
        and(
          eq(schema.stake.subjectType, "building"),
          eq(schema.stake.subjectId, first.buildingId),
          eq(schema.stake.userId, userId),
        ),
      );
    expect(stakes).toHaveLength(1);
    expect(stakes[0].role).toBe("owner");
    expect(stakes[0].status).toBe("active");
  });
});
