import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// One row per active/historical subscription, attached directly to
// `user_id` — no `Membership` scoping, matching the canonical cross-project
// billing doc's own explicit decision (a user with multiple Memberships
// still has exactly one subscription). Field list corrected against that
// canonical doc, not Farpost's own schema-summary doc: `plan`/
// `cancel_at_period_end` don't exist here; `interval`/`price_cents`/
// `canceled_at` do (design.md Decisions 3-4).
export const BILLING_SUBSCRIPTION_INTERVAL_VALUES = ["monthly", "annual"] as const;
export const BILLING_SUBSCRIPTION_STATUS_VALUES = ["active", "canceled", "past_due"] as const;

export const billingSubscription = pgTable(
  "billing_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    interval: text("interval", { enum: BILLING_SUBSCRIPTION_INTERVAL_VALUES }).notNull(),
    priceCents: integer("price_cents").notNull(),
    status: text("status", { enum: BILLING_SUBSCRIPTION_STATUS_VALUES })
      .notNull()
      .default("active"),
    periodNumber: integer("period_number").notNull().default(1),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    periodChargedCents: integer("period_charged_cents").notNull(),
    canceledAt: timestamp("canceled_at"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "billing_subscription_interval_check",
      sql`${table.interval} IN (${sql.raw(BILLING_SUBSCRIPTION_INTERVAL_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "billing_subscription_status_check",
      sql`${table.status} IN (${sql.raw(BILLING_SUBSCRIPTION_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    // One active subscription per user, enforced at the database — a
    // canceled-then-resubscribed user is still allowed since the index
    // only covers status = 'active' rows (same shape as
    // membership_user_id_role_active_idx).
    uniqueIndex("billing_subscription_user_id_active_idx")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
  ],
);
