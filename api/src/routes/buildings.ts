import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "../auth/session.js";
import { db, schema } from "../db/client.js";

// Farpost's first protected routes. Scoped to owned buildings only — not a
// general buildings-listing endpoint (design.md Decision 4).
export async function buildingsRoutes(fastify: FastifyInstance) {
  fastify.get("/api/buildings", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });

    const rows = await db
      .select({
        id: schema.building.id,
        slug: schema.building.slug,
        address: schema.building.address,
      })
      .from(schema.stake)
      .innerJoin(schema.building, eq(schema.building.id, schema.stake.subjectId))
      .where(
        and(
          eq(schema.stake.subjectType, "building"),
          eq(schema.stake.userId, user.id),
          eq(schema.stake.role, "owner"),
          eq(schema.stake.status, "active"),
        ),
      );

    return reply.send(rows);
  });
}
