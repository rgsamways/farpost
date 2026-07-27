import { boolean, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { membership } from "./membership-schema.js";

// One-to-one public-facing professional identity layered on a `Membership`
// row. Deliberately has no `average_rating`/`review_count` columns — those
// belong to a future reviews/reputation feature, not this profile shape.
export const professionalProfile = pgTable("professional_profile", {
  membershipId: uuid("membership_id")
    .primaryKey()
    .references(() => membership.id, { onDelete: "restrict" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  slug: text("slug").notNull().unique(),
  phone: text("phone"),
  serviceArea: jsonb("service_area").$type<Record<string, unknown>>(),
  visibility: jsonb("visibility").$type<Record<string, unknown>>(),
  stripeCustomerId: text("stripe_customer_id"),
  underwritingDigestEnabled: boolean("underwriting_digest_enabled").notNull().default(false),
  extra: jsonb("extra").$type<Record<string, unknown>>(),
  yearsInBusiness: integer("years_in_business"),
  bioText: text("bio_text"),
});
