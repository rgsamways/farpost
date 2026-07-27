import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/client.js";

// Reusable owner-authorization check — every owner-scoped route in this
// change (and every future one) calls this instead of inlining the same
// Stake query per route.
export async function assertBuildingOwner(userId: string, buildingId: string): Promise<boolean> {
  const [stake] = await db
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
  return stake != null;
}
