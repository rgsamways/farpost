import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_SLUG = `test-property-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.property).where(eq(schema.property.slug, TEST_SLUG));
}

describe("property", () => {
  afterEach(cleanup);

  it("persists with no boundary, centroid, or external_ids", async () => {
    const [row] = await db.insert(schema.property).values({ slug: TEST_SLUG }).returning();
    expect(row.boundary).toBeNull();
    expect(row.centroid).toBeNull();
    expect(row.externalIds).toBeNull();
  });

  it("rejects a duplicate slug", async () => {
    await db.insert(schema.property).values({ slug: TEST_SLUG });

    await expect(db.insert(schema.property).values({ slug: TEST_SLUG })).rejects.toThrow();
  });
});
