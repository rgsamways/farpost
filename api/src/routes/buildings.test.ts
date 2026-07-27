import { randomUUID } from "node:crypto";
import { desc, eq, like } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { db, schema } from "../db/client.js";

// Real-DB, no mocking — including the session itself: a real magic-link
// sign-in via `app.inject`, matching auth.test.ts's own established
// pattern, not a mocked `getSessionUser`.
vi.mock("../auth/send-magic-link.js", () => ({
  sendMagicLink: vi.fn().mockResolvedValue(undefined),
}));

function verificationForEmail(email: string) {
  return like(schema.verification.value, `%"email":"${email}"%`);
}

function cookieHeader(setCookie: string | string[] | undefined): string {
  const values = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  return values.map((c) => c.split(";")[0]).join("; ");
}

async function signIn(app: ReturnType<typeof buildApp>, email: string) {
  await app.inject({ method: "POST", url: "/api/auth/sign-in/magic-link", payload: { email } });
  const [row] = await db
    .select()
    .from(schema.verification)
    .where(verificationForEmail(email))
    .orderBy(desc(schema.verification.createdAt));
  const verifyRes = await app.inject({
    method: "GET",
    url: `/api/auth/magic-link/verify?token=${row.identifier}&callbackURL=%2F`,
  });
  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  return { cookie: cookieHeader(verifyRes.headers["set-cookie"]), userId: user.id };
}

async function cleanupUser(email: string) {
  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (user) {
    await db.delete(schema.stake).where(eq(schema.stake.userId, user.id));
    await db.delete(schema.session).where(eq(schema.session.userId, user.id));
    await db.delete(schema.account).where(eq(schema.account.userId, user.id));
    await db.delete(schema.user).where(eq(schema.user.id, user.id));
  }
  await db.delete(schema.verification).where(verificationForEmail(email));
}

const OWNER_EMAIL = `buildings-route-owner-${randomUUID()}@example.com`;
const NON_OWNER_EMAIL = `buildings-route-non-owner-${randomUUID()}@example.com`;
const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;

async function cleanup() {
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.stake).where(eq(schema.stake.subjectId, building.id));
  }
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
  await cleanupUser(OWNER_EMAIL);
  await cleanupUser(NON_OWNER_EMAIL);
}

describe("GET /api/buildings", () => {
  afterEach(cleanup);

  it("returns the building for an owner with an active owner stake", async () => {
    const app = buildApp();
    const { cookie, userId } = await signIn(app, OWNER_EMAIL);

    const [property] = await db
      .insert(schema.property)
      .values({ slug: TEST_PROPERTY_SLUG })
      .returning();
    const [building] = await db
      .insert(schema.building)
      .values({ propertyId: property.id, slug: TEST_BUILDING_SLUG })
      .returning();
    await db.insert(schema.stake).values({
      userId,
      subjectType: "building",
      subjectId: building.id,
      role: "owner",
      status: "active",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/buildings",
      headers: { cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(building.id);
  });

  it("returns an empty list for a user with no stakes", async () => {
    const app = buildApp();
    const { cookie } = await signIn(app, NON_OWNER_EMAIL);

    const res = await app.inject({
      method: "GET",
      url: "/api/buildings",
      headers: { cookie },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/api/buildings" });
    expect(res.statusCode).toBe(401);
  });
});
