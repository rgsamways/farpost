import { desc, eq, like } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import { db, schema } from "../db/client.js";

// Requires the local Docker Postgres running (`docker compose up -d` in
// `api/`) — see api/README.md. Matches Vocare's own real test pattern: no
// mocked DB, real rows.
vi.mock("./send-magic-link.js", () => ({
  sendMagicLink: vi.fn().mockResolvedValue(undefined),
}));

const TEST_EMAIL = "auth-test@example.com";

function verificationForEmail(email: string) {
  return like(schema.verification.value, `%"email":"${email}"%`);
}

async function cleanup(email: string) {
  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (user) {
    await db.delete(schema.membership).where(eq(schema.membership.userId, user.id));
    await db.delete(schema.session).where(eq(schema.session.userId, user.id));
    await db.delete(schema.account).where(eq(schema.account.userId, user.id));
    await db.delete(schema.user).where(eq(schema.user.id, user.id));
  }
  await db.delete(schema.verification).where(verificationForEmail(email));
}

async function requestMagicLink(app: ReturnType<typeof buildApp>, email: string) {
  await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/magic-link",
    payload: { email },
  });
  const [row] = await db
    .select()
    .from(schema.verification)
    .where(verificationForEmail(email))
    .orderBy(desc(schema.verification.createdAt));
  return row.identifier;
}

describe("magic-link auth", () => {
  beforeEach(async () => {
    await cleanup(TEST_EMAIL);
  });

  afterEach(async () => {
    await cleanup(TEST_EMAIL);
  });

  it("creates exactly one user on first sign-in, with no additional fields required", async () => {
    const app = buildApp();
    const token = await requestMagicLink(app, TEST_EMAIL);

    const verifyRes = await app.inject({
      method: "GET",
      url: `/api/auth/magic-link/verify?token=${token}&callbackURL=%2F`,
    });

    expect(verifyRes.statusCode).toBe(302);
    expect(verifyRes.headers["set-cookie"]).toBeDefined();

    const users = await db.select().from(schema.user).where(eq(schema.user.email, TEST_EMAIL));
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(TEST_EMAIL);
  });

  it("starts a 30-day sliding session on verify", async () => {
    const app = buildApp();
    const token = await requestMagicLink(app, TEST_EMAIL);
    const before = Date.now();

    await app.inject({
      method: "GET",
      url: `/api/auth/magic-link/verify?token=${token}&callbackURL=%2F`,
    });

    const [user] = await db.select().from(schema.user).where(eq(schema.user.email, TEST_EMAIL));
    const [session] = await db.select().from(schema.session).where(eq(schema.session.userId, user.id));
    expect(session).toBeDefined();
    const expiresInDays = (session.expiresAt.getTime() - before) / (1000 * 60 * 60 * 24);
    expect(expiresInDays).toBeGreaterThan(29.9);
    expect(expiresInDays).toBeLessThan(30.1);
  });

  it("includes CORS headers on the hijacked magic-link sign-in response", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/magic-link",
      payload: { email: TEST_EMAIL },
    });

    expect(res.headers["access-control-allow-origin"]).toBe(process.env.WEB_URL);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("handles an OPTIONS preflight with 204 and CORS headers, without hitting better-auth's handler", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/auth/sign-in/magic-link",
      headers: {
        origin: process.env.WEB_URL!,
        "access-control-request-method": "POST",
      },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(process.env.WEB_URL);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });
});
