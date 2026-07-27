import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Optional, Farpost-only curation layer on top of `Membership.role` — a
// role string is always insertable with no matching row here; this table
// only exists to let admins curate/promote roles over time.
export const roleType = pgTable("role_type", {
  key: text("key").primaryKey(),
  displayName: text("display_name").notNull(),
  tier: text("tier"),
  status: text("status"),
  privacyDefault: text("privacy_default"),
  reputationEligible: boolean("reputation_eligible").notNull().default(false),
  defaultSubscriptions: text("default_subscriptions").array(),
  copyTemplateRef: text("copy_template_ref"),
  hubConfig: text("hub_config"),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  promotedAt: timestamp("promoted_at"),
  curatorId: text("curator_id").references(() => user.id),
});
