import { boolean, integer, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { membership } from "./membership-schema.js";

// One-to-one service-area/capacity eligibility layered on a `Membership`
// row — separate from `professional_profile` since eligibility is an
// operational/dispatch concern, not a public-facing identity one.
export const dispatchCapability = pgTable("dispatch_capability", {
  membershipId: uuid("membership_id")
    .primaryKey()
    .references(() => membership.id, { onDelete: "restrict" }),
  eligible: boolean("eligible").notNull().default(false),
  baseLat: numeric("base_lat"),
  baseLng: numeric("base_lng"),
  serviceRadiusKm: numeric("service_radius_km"),
  servicePostalPrefixes: text("service_postal_prefixes").array(),
  maxDriveMinutes: integer("max_drive_minutes"),
  capabilities: text("capabilities").array(),
  capacityCurrent: integer("capacity_current").notNull().default(0),
  capacityMax: integer("capacity_max"),
});
