import { randomUUID } from "node:crypto";
import { desc, eq, like } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { db, schema } from "../db/client.js";

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

const OWNER_EMAIL = `assets-route-owner-${randomUUID()}@example.com`;
const NON_OWNER_EMAIL = `assets-route-non-owner-${randomUUID()}@example.com`;
const TEST_PROPERTY_SLUG = `test-property-${randomUUID()}`;
const TEST_BUILDING_SLUG = `test-building-${randomUUID()}`;

async function cleanup() {
  const [building] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  if (building) {
    await db.delete(schema.asset).where(eq(schema.asset.subjectId, building.id));
    await db.delete(schema.stake).where(eq(schema.stake.subjectId, building.id));
  }
  await db.delete(schema.building).where(eq(schema.building.slug, TEST_BUILDING_SLUG));
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_PROPERTY_SLUG));
  await cleanupUser(OWNER_EMAIL);
  await cleanupUser(NON_OWNER_EMAIL);
}

async function setUpOwnedBuilding() {
  const app = buildApp();
  const owner = await signIn(app, OWNER_EMAIL);
  const [property] = await db
    .insert(schema.property)
    .values({ slug: TEST_PROPERTY_SLUG })
    .returning();
  const [building] = await db
    .insert(schema.building)
    .values({ propertyId: property.id, slug: TEST_BUILDING_SLUG })
    .returning();
  await db.insert(schema.stake).values({
    userId: owner.userId,
    subjectType: "building",
    subjectId: building.id,
    role: "owner",
    status: "active",
  });
  return { app, building, ownerCookie: owner.cookie };
}

describe("building assets routes", () => {
  afterEach(cleanup);

  it("lets an owner list, add, and update assets on their building", async () => {
    const { app, building, ownerCookie } = await setUpOwnedBuilding();

    const listBefore = await app.inject({
      method: "GET",
      url: `/api/buildings/${building.id}/assets`,
      headers: { cookie: ownerCookie },
    });
    expect(listBefore.statusCode).toBe(200);
    expect(JSON.parse(listBefore.body)).toEqual([]);

    const created = await app.inject({
      method: "POST",
      url: `/api/buildings/${building.id}/assets`,
      headers: { cookie: ownerCookie },
      payload: { assetType: "roof", installedDate: "2015-06-01" },
    });
    expect(created.statusCode).toBe(201);
    const asset = JSON.parse(created.body);
    expect(asset.assetType).toBe("roof");
    expect(asset.subjectType).toBe("building");
    expect(asset.subjectId).toBe(building.id);

    const updated = await app.inject({
      method: "PATCH",
      url: `/api/assets/${asset.id}`,
      headers: { cookie: ownerCookie },
      payload: { conditionStatus: "needs_repair" },
    });
    expect(updated.statusCode).toBe(200);
    expect(JSON.parse(updated.body).conditionStatus).toBe("needs_repair");
  });

  it("forbids a non-owner from listing, adding, or updating assets", async () => {
    const { app, building, ownerCookie } = await setUpOwnedBuilding();
    const nonOwner = await signIn(app, NON_OWNER_EMAIL);

    const created = await app.inject({
      method: "POST",
      url: `/api/buildings/${building.id}/assets`,
      headers: { cookie: ownerCookie },
      payload: { assetType: "furnace" },
    });
    const asset = JSON.parse(created.body);

    const list = await app.inject({
      method: "GET",
      url: `/api/buildings/${building.id}/assets`,
      headers: { cookie: nonOwner.cookie },
    });
    expect(list.statusCode).toBe(403);

    const add = await app.inject({
      method: "POST",
      url: `/api/buildings/${building.id}/assets`,
      headers: { cookie: nonOwner.cookie },
      payload: { assetType: "water_heater" },
    });
    expect(add.statusCode).toBe(403);

    const update = await app.inject({
      method: "PATCH",
      url: `/api/assets/${asset.id}`,
      headers: { cookie: nonOwner.cookie },
      payload: { conditionStatus: "good" },
    });
    expect(update.statusCode).toBe(403);
  });

  it("rejects unauthenticated requests with 401", async () => {
    const { app, building } = await setUpOwnedBuilding();

    const list = await app.inject({ method: "GET", url: `/api/buildings/${building.id}/assets` });
    expect(list.statusCode).toBe(401);

    const add = await app.inject({
      method: "POST",
      url: `/api/buildings/${building.id}/assets`,
      payload: { assetType: "roof" },
    });
    expect(add.statusCode).toBe(401);

    const update = await app.inject({
      method: "PATCH",
      url: `/api/assets/${randomUUID()}`,
      payload: { conditionStatus: "good" },
    });
    expect(update.statusCode).toBe(401);
  });

  it("returns 404 for a PATCH on a nonexistent asset", async () => {
    const { app, ownerCookie } = await setUpOwnedBuilding();

    const res = await app.inject({
      method: "PATCH",
      url: `/api/assets/${randomUUID()}`,
      headers: { cookie: ownerCookie },
      payload: { conditionStatus: "good" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("rejects a POST missing assetType with a validation error, not a raw DB error", async () => {
    const { app, building, ownerCookie } = await setUpOwnedBuilding();

    const res = await app.inject({
      method: "POST",
      url: `/api/buildings/${building.id}/assets`,
      headers: { cookie: ownerCookie },
      payload: { label: "Missing type" },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    // A structured Fastify validation error (message names the missing
    // field), not a raw Postgres error surfacing (which would carry
    // driver-specific fields like `detail`/`severity`/`table` instead).
    expect(body.message).toContain("assetType");
    expect(body).not.toHaveProperty("detail");
    expect(body).not.toHaveProperty("severity");
  });
});
