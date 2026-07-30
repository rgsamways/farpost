import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { assertBuildingOwner } from "../authz/building-access.js";
import { getSessionUser } from "../auth/session.js";
import { db, schema } from "../db/client.js";

interface AssetBody {
  assetType: string;
  label?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  warrantyExpiryDate?: string;
  installedDate?: string;
  lastServicedDate?: string;
  conditionStatus?: string;
  photoUrls?: string[];
  conditionNotes?: string[];
}

// All optional except assetType, per specs/systems-passport/spec.md.
const assetBodySchema = {
  type: "object",
  required: ["assetType"],
  properties: {
    assetType: { type: "string" },
    label: { type: "string" },
    manufacturer: { type: "string" },
    model: { type: "string" },
    serialNumber: { type: "string" },
    location: { type: "string" },
    warrantyExpiryDate: { type: "string" },
    installedDate: { type: "string" },
    lastServicedDate: { type: "string" },
    conditionStatus: { type: "string" },
    photoUrls: { type: "array", items: { type: "string" } },
    conditionNotes: { type: "array", items: { type: "string" } },
  },
} as const;

// PATCH allows any subset of the same fields (assetType stays optional
// here — an existing asset already has one).
const assetPatchBodySchema = {
  type: "object",
  properties: assetBodySchema.properties,
} as const;

export async function assetsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { buildingId: string } }>(
    "/api/buildings/:buildingId/assets",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.code(401).send({ error: "unauthenticated" });

      const isOwner = await assertBuildingOwner(user.id, request.params.buildingId);
      if (!isOwner) return reply.code(403).send({ error: "forbidden" });

      const rows = await db
        .select()
        .from(schema.asset)
        .where(
          and(
            eq(schema.asset.subjectType, "building"),
            eq(schema.asset.subjectId, request.params.buildingId),
          ),
        );

      return reply.send(rows);
    },
  );

  fastify.post<{ Params: { buildingId: string }; Body: AssetBody }>(
    "/api/buildings/:buildingId/assets",
    { schema: { body: assetBodySchema } },
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.code(401).send({ error: "unauthenticated" });

      const isOwner = await assertBuildingOwner(user.id, request.params.buildingId);
      if (!isOwner) return reply.code(403).send({ error: "forbidden" });

      const body = request.body;
      const [created] = await db
        .insert(schema.asset)
        .values({
          subjectType: "building",
          subjectId: request.params.buildingId,
          assetType: body.assetType,
          label: body.label,
          manufacturer: body.manufacturer,
          model: body.model,
          serialNumber: body.serialNumber,
          location: body.location,
          warrantyExpiryDate: body.warrantyExpiryDate,
          installedDate: body.installedDate,
          lastServicedDate: body.lastServicedDate,
          conditionStatus: body.conditionStatus,
          photoUrls: body.photoUrls,
          conditionNotes: body.conditionNotes,
        })
        .returning();

      return reply.code(201).send(created);
    },
  );

  fastify.patch<{ Params: { assetId: string }; Body: Partial<AssetBody> }>(
    "/api/assets/:assetId",
    { schema: { body: assetPatchBodySchema } },
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.code(401).send({ error: "unauthenticated" });

      const [existing] = await db
        .select()
        .from(schema.asset)
        .where(eq(schema.asset.id, request.params.assetId));
      if (!existing) return reply.code(404).send({ error: "asset_not_found" });

      // Never trust a client-supplied building id for authorization on an
      // existing row — look up the asset's real subject first.
      const isOwner = await assertBuildingOwner(user.id, existing.subjectId);
      if (!isOwner) return reply.code(403).send({ error: "forbidden" });

      const [updated] = await db
        .update(schema.asset)
        .set(request.body)
        .where(eq(schema.asset.id, existing.id))
        .returning();

      return reply.send(updated);
    },
  );
}
