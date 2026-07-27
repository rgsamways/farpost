import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { geographyPoint, geographyPolygon } from "./geography-types.js";

// Layer 1 of the building cluster (docs/core-building-model.md) — the land
// parcel. A `Property` can exist with no `Building` yet (bulk-ingested from
// a parcel source before anyone's claimed or built on it).
export const property = pgTable(
  "property",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    externalIds: jsonb("external_ids").$type<Record<string, unknown>>(),
    civicNumber: text("civic_number"),
    address: text("address"),
    boundary: geographyPolygon("boundary"),
    centroid: geographyPoint("centroid"),
    dimensions: jsonb("dimensions").$type<Record<string, unknown>>(),
    zoningCode: text("zoning_code"),
    zoningDescription: text("zoning_description"),
    historicalDesignation: text("historical_designation"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("property_boundary_gist_idx").using("gist", table.boundary),
    index("property_centroid_gist_idx").using("gist", table.centroid),
    index("property_external_ids_gin_idx").using("gin", table.externalIds),
  ],
);
