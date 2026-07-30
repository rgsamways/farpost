import { and, eq } from "drizzle-orm";
import { ensureOwnedBuilding, grantMembership, signInOrCreateUser } from "../dev-seed/lib.js";
import { db, schema } from "../../src/db/client.js";

// Gives a real dev account everything systems-passport needs to be
// manually testable: admin + owner Memberships, an owned Building, and two
// starter Assets. Idempotent — safe to re-run against a database that
// already has this data. See openspec/changes/systems-passport-dev-seed/.

const OWNER_EMAIL = "rgsamways@gmail.com";
const BUILDING_SLUG = "robin-home";

async function ensureStarterAssets(buildingId: string) {
  const existing = await db
    .select()
    .from(schema.asset)
    .where(and(eq(schema.asset.subjectType, "building"), eq(schema.asset.subjectId, buildingId)));

  if (existing.length > 0) {
    return { assets: existing, created: false };
  }

  const created = await db
    .insert(schema.asset)
    .values([
      {
        subjectType: "building",
        subjectId: buildingId,
        assetType: "roof",
        label: "Main roof",
        installedDate: "2018-06-01",
        conditionStatus: "good",
      },
      {
        // Deliberately minimal — only the required field — matching the
        // test-plan's "add a system with no optional fields" scenario.
        subjectType: "building",
        subjectId: buildingId,
        assetType: "hvac",
      },
    ])
    .returning();

  return { assets: created, created: true };
}

async function main() {
  console.log(`Seeding systems-passport dev data for ${OWNER_EMAIL}...`);

  const { userId, created: userCreated } = await signInOrCreateUser(OWNER_EMAIL);
  console.log(
    `  User ${userId}: ${userCreated ? "created via a real magic-link sign-in (check your inbox)" : "already existed"}`,
  );

  const admin = await grantMembership(userId, "admin");
  console.log(`  Admin membership ${admin.membershipId}: ${admin.created ? "granted" : "already active"}`);

  const owner = await grantMembership(userId, "owner");
  console.log(`  Owner membership ${owner.membershipId}: ${owner.created ? "granted" : "already active"}`);

  const building = await ensureOwnedBuilding(userId, BUILDING_SLUG);
  console.log(`  Building ${building.buildingId}: ${building.created ? "created" : "already existed"}`);

  const { assets, created: assetsCreated } = await ensureStarterAssets(building.buildingId);
  console.log(
    `  Assets: ${assets.length} on the building (${assetsCreated ? "just seeded" : "already present"})`,
  );

  console.log("Done — sign in as rgsamways@gmail.com and visit /features/systems-passport.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    // The Drizzle pg Pool has no process-exit hook of its own — this is a
    // short-lived script that has already awaited every write it makes, so
    // a forced exit here is safe, not a shortcut around unflushed work.
    process.exit(process.exitCode ?? 0);
  });
