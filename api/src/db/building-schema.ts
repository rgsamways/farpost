import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { geographyPoint } from "./geography-types.js";
import { property } from "./property-schema.js";

// Layer 2 of the building cluster — a structure on a `Property`, carrying
// its own structural attributes. Owner contact info deliberately has no
// column here — that lives on `Stake.contact_snapshot` instead (the fix
// for the old system's duplicated ownership representation).
export const building = pgTable(
  "building",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => property.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    nfcTagId: text("nfc_tag_id"),
    address: text("address"),
    postalCode: text("postal_code"),
    postalPrefix: text("postal_prefix"),
    location: geographyPoint("location"),
    buildingType: text("building_type"),
    acquisitionChannel: text("acquisition_channel"),
    status: text("status"),
    activatedAt: timestamp("activated_at"),
    activationCount: integer("activation_count").notNull().default(0),
    neighbourhoodNotes: text("neighbourhood_notes"),
    roofType: text("roof_type"),
    roofInstalledYear: integer("roof_installed_year"),
    foundationType: text("foundation_type"),
    foundationUpdatedYear: integer("foundation_updated_year"),
    electricalType: text("electrical_type"),
    electricalUpdatedYear: integer("electrical_updated_year"),
    plumbingType: text("plumbing_type"),
    plumbingUpdatedYear: integer("plumbing_updated_year"),
    heatingType: text("heating_type"),
    heatingInstalledYear: integer("heating_installed_year"),
    yearBuilt: integer("year_built"),
    ownerControls: jsonb("owner_controls").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Maintained by the shared `set_updated_at()` trigger (attached in a
    // later custom migration once this table exists) — not Drizzle's
    // `$onUpdate`, so direct SQL writes are covered too.
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("building_property_id_idx").on(table.propertyId),
    uniqueIndex("building_nfc_tag_id_idx")
      .on(table.nfcTagId)
      .where(sql`${table.nfcTagId} IS NOT NULL`),
    index("building_location_gist_idx").using("gist", table.location),
    index("building_postal_prefix_idx").on(table.postalPrefix),
  ],
);
