import { and, desc, eq, like } from "drizzle-orm";
import { buildApp } from "../../src/app.js";
import { db, schema } from "../../src/db/client.js";

// Reusable, idempotent dev-seed helpers. Every per-feature seed script
// (api/scripts/<feature>/seed.ts) is expected to compose these rather than
// duplicate this logic — see openspec/changes/systems-passport-dev-seed/design.md
// Decision 4.

function verificationForEmail(email: string) {
  return like(schema.verification.value, `%"email":"${email}"%`);
}

/**
 * Returns the existing User for `email` if one exists; otherwise creates one
 * via the real magic-link sign-in flow (not a direct table insert) — the
 * same three-call sequence buildings.test.ts/assets.test.ts use, except the
 * send step here is NOT mocked: this is meant to send a real email through
 * the real path (see design.md Decision 1).
 */
export async function signInOrCreateUser(
  email: string,
): Promise<{ userId: string; created: boolean }> {
  const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (existing) {
    return { userId: existing.id, created: false };
  }

  const app = buildApp();
  try {
    await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/magic-link",
      payload: { email },
    });

    const [verificationRow] = await db
      .select()
      .from(schema.verification)
      .where(verificationForEmail(email))
      .orderBy(desc(schema.verification.createdAt));

    if (!verificationRow) {
      throw new Error(
        `No verification token found for ${email} after requesting a magic link — check RESEND_API_KEY/BETTER_AUTH_SECRET are set.`,
      );
    }

    await app.inject({
      method: "GET",
      url: `/api/auth/magic-link/verify?token=${verificationRow.identifier}&callbackURL=%2F`,
    });

    const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    if (!user) {
      throw new Error(`Sign-in completed but no User row exists for ${email}.`);
    }

    return { userId: user.id, created: true };
  } finally {
    await app.close();
  }
}

/**
 * Grants `role` as an active Membership for `userId`, idempotently — reuses
 * the existing row if one is already active for that (userId, role) pair,
 * matching membership-schema.ts's own partial unique index. Marked as
 * seeded via `metadata.seeded = true` (see design.md Decision 3).
 */
export async function grantMembership(
  userId: string,
  role: string,
): Promise<{ membershipId: string; created: boolean }> {
  const [existing] = await db
    .select()
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.userId, userId),
        eq(schema.membership.role, role),
        eq(schema.membership.status, "active"),
      ),
    );
  if (existing) {
    return { membershipId: existing.id, created: false };
  }

  const [created] = await db
    .insert(schema.membership)
    .values({
      userId,
      role,
      status: "active",
      metadata: { seeded: true },
    })
    .returning();

  return { membershipId: created.id, created: true };
}

/**
 * Ensures a Property + Building (looked up by `slug`, not a random one —
 * this is a long-lived dev fixture, not a disposable per-test row) and an
 * active owner Stake linking `userId` to it. Marked as seeded via
 * `building.acquisitionChannel = "seed"` (see design.md Decision 3).
 */
export async function ensureOwnedBuilding(
  userId: string,
  slug: string,
): Promise<{ buildingId: string; propertyId: string; created: boolean }> {
  const [existingBuilding] = await db
    .select()
    .from(schema.building)
    .where(eq(schema.building.slug, slug));

  if (existingBuilding) {
    await ensureOwnerStake(userId, existingBuilding.id);
    return {
      buildingId: existingBuilding.id,
      propertyId: existingBuilding.propertyId,
      created: false,
    };
  }

  const [property] = await db
    .insert(schema.property)
    .values({ slug: `${slug}-property` })
    .returning();

  const [building] = await db
    .insert(schema.building)
    .values({
      propertyId: property.id,
      slug,
      acquisitionChannel: "seed",
    })
    .returning();

  await ensureOwnerStake(userId, building.id);

  return { buildingId: building.id, propertyId: property.id, created: true };
}

async function ensureOwnerStake(userId: string, buildingId: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(schema.stake)
    .where(
      and(
        eq(schema.stake.subjectType, "building"),
        eq(schema.stake.subjectId, buildingId),
        eq(schema.stake.userId, userId),
        eq(schema.stake.role, "owner"),
        eq(schema.stake.status, "active"),
      ),
    );
  if (existing) return;

  await db.insert(schema.stake).values({
    userId,
    subjectType: "building",
    subjectId: buildingId,
    role: "owner",
    status: "active",
  });
}
