import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { membership } from "./membership-schema.js";

// A standing, queryable rule: "notify this Membership when this kind of
// event happens about this building/area." A future fan-out process reads
// this table to decide who becomes an EventRecipient — no FK to `event`
// itself, since a subscription is matched against *future* events by
// value, not linked to any specific event row (design.md Decision 4).
//
// `anchor_type`'s three-value vocabulary and `anchor_value`'s nullability
// are grounded in the old system's real production usage
// (app/models/subscription.py), not invented fresh — see design.md's
// Context section. `channels`/`frequency_preference` are honest
// preference-capture fields; no delivery engine reads them yet.
export const NOTIFICATION_SUBSCRIPTION_ANCHOR_TYPE_VALUES = [
  "building",
  "postal_code",
  "all",
] as const;
export const NOTIFICATION_SUBSCRIPTION_FREQUENCY_PREFERENCE_VALUES = [
  "immediate",
  "daily_digest",
  "weekly_digest",
  "never",
] as const;

export const notificationSubscription = pgTable(
  "notification_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => membership.id, { onDelete: "restrict" }),
    eventType: text("event_type").notNull(),
    anchorType: text("anchor_type", {
      enum: NOTIFICATION_SUBSCRIPTION_ANCHOR_TYPE_VALUES,
    }).notNull(),
    // Null when anchorType = 'all'; populated for 'building'/'postal_code'.
    anchorValue: text("anchor_value"),
    channels: text("channels").array().notNull().default(sql`'{}'::text[]`),
    active: boolean("active").notNull().default(true),
    frequencyPreference: text("frequency_preference", {
      enum: NOTIFICATION_SUBSCRIPTION_FREQUENCY_PREFERENCE_VALUES,
    })
      .notNull()
      .default("immediate"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "notification_subscription_anchor_type_check",
      sql`${table.anchorType} IN (${sql.raw(NOTIFICATION_SUBSCRIPTION_ANCHOR_TYPE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "notification_subscription_frequency_preference_check",
      sql`${table.frequencyPreference} IN (${sql.raw(NOTIFICATION_SUBSCRIPTION_FREQUENCY_PREFERENCE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("notification_subscription_membership_id_idx").on(table.membershipId),
    // The relationships doc's own "likely the single most
    // performance-critical index in the whole schema" — the fan-out
    // engine's core "which subscriptions match this new event" query.
    // Partial on active = true: an inactive subscription should never
    // match a live fan-out (not in the original doc's index row; a direct
    // application of the "index for the real query shape" discipline used
    // on Stake/ComplianceRecord/WorkRequestAttempt).
    index("notification_subscription_fanout_idx")
      .on(table.eventType, table.anchorType, table.anchorValue)
      .where(sql`${table.active} = true`),
  ],
);
