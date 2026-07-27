import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// The person-to-subject relationship registry (docs/core-building-model.md).
// Two hard rules, both encoded here: (1) subject_type/subject_id is always
// the target, user_id is always the person — subject_id is intentionally
// NOT wired as a Drizzle relation/foreign key, since the target table
// depends on subject_type and is resolved at the application layer, per
// core-schema-relationships-and-indexes-2026-07-27.md. (2) every access
// check must filter on subject AND user together — see the compound
// indexes below, which deliberately omit a plain `user_id` index.
export const STAKE_SUBJECT_TYPE_VALUES = ["property", "building", "unit", "asset"] as const;
export const STAKE_STATUS_VALUES = [
  "pending",
  "active",
  "historical",
  "pending_verification",
  "unclaimed",
  "disputed",
] as const;
export const STAKE_VERIFICATION_METHOD_VALUES = [
  "self_asserted",
  "admin_reviewed",
  "external_id_matched",
] as const;

export const stake = pgTable(
  "stake",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "restrict" }),
    subjectType: text("subject_type", { enum: STAKE_SUBJECT_TYPE_VALUES }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    role: text("role").notNull(),
    kind: text("kind"),
    status: text("status", { enum: STAKE_STATUS_VALUES }).notNull(),
    weight: numeric("weight"),
    verificationMethod: text("verification_method", { enum: STAKE_VERIFICATION_METHOD_VALUES }),
    contactSnapshot: jsonb("contact_snapshot").$type<Record<string, unknown>>(),
    verifiedAt: timestamp("verified_at"),
    renewalDate: date("renewal_date"),
    renewalReminderSentAt: timestamp("renewal_reminder_sent_at"),
    establishedAt: timestamp("established_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
  },
  (table) => [
    check(
      "stake_subject_type_check",
      sql`${table.subjectType} IN (${sql.raw(STAKE_SUBJECT_TYPE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "stake_status_check",
      sql`${table.status} IN (${sql.raw(STAKE_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "stake_verification_method_check",
      sql`${table.verificationMethod} IN (${sql.raw(STAKE_VERIFICATION_METHOD_VALUES.map((v) => `'${v}'`).join(", "))}) OR ${table.verificationMethod} IS NULL`,
    ),
    // Compound only, by design — no plain index on user_id alone, so a
    // lookup that forgets the subject doesn't get a clean index hit either.
    index("stake_subject_status_idx").on(table.subjectType, table.subjectId, table.status),
    index("stake_user_status_idx").on(table.userId, table.status),
    index("stake_renewal_due_idx")
      .on(table.renewalDate)
      .where(sql`${table.renewalReminderSentAt} IS NULL`),
  ],
);
