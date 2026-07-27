import { boolean, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { building } from "./building-schema.js";
import { geographyPoint } from "./geography-types.js";

// The insurance-claim intake record a `Job` can optionally originate from
// (`Job.subject_type = 'claim'`). `buildingId` IS wired as a normal Drizzle
// relation in relations.ts (`claimRelations`) — it's a real, single-target,
// nullable FK, not a polymorphic pair, so it doesn't need the
// application-layer resolution that `Job.subjectType`/`subjectId` does.
//
// Deliberately has NO `status` column —
// confirmed against the real archived system (design.md's Context section):
// the old Claim.status was retired once Job.status was generalized past
// claim-dispatch, and `closed_at` is Claim's only remaining lifecycle
// signal. Do not re-add a status column here; that's a real, considered
// decision, not an oversight.
export const claim = pgTable(
  "claim",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingId: uuid("building_id").references(() => building.id, { onDelete: "restrict" }),
    insurerFileNumber: text("insurer_file_number"),
    propertyPostalCode: text("property_postal_code"),
    propertyType: text("property_type"),
    propertyAddress: text("property_address"),
    siteContactName: text("site_contact_name"),
    siteContactPhone: text("site_contact_phone"),
    urgency: text("urgency"),
    perilType: text("peril_type"),
    damageDescription: text("damage_description"),
    coordinates: geographyPoint("coordinates"),
    damageTypes: text("damage_types").array(),
    responseWindowHours: integer("response_window_hours"),
    priorClaimsAtAddress: integer("prior_claims_at_address"),
    repeatProperty: boolean("repeat_property").notNull().default(false),
    estimatedLossAmount: numeric("estimated_loss_amount"),
    deductible: numeric("deductible"),
    adjusterAssignedAt: timestamp("adjuster_assigned_at"),
    closedAt: timestamp("closed_at"),
  },
  (table) => [
    index("claim_building_id_idx").on(table.buildingId),
    index("claim_insurer_file_number_idx").on(table.insurerFileNumber),
    index("claim_coordinates_gist_idx").using("gist", table.coordinates),
  ],
);
