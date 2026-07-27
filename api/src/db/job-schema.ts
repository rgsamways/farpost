import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// The work record itself — a requester asking for work against a
// polymorphic subject (Claim/Building/Property/Asset), matched to an
// assignee. `subjectId` is intentionally NOT wired as a Drizzle relation/
// foreign key — the target table depends on `subjectType` and is resolved
// at the application layer, matching the established pattern from
// asset-schema.ts/stake-schema.ts.
export const JOB_SUBJECT_TYPE_VALUES = ["claim", "building", "property", "asset"] as const;
// Nine values: the eight confirmed against the real archived
// ClaimStatus/JobStatus enums, plus 'cancelled' (design.md's own addition —
// cancelled_at needed a matching status value, not just a non-null date).
export const JOB_STATUS_VALUES = [
  "pending",
  "dispatched",
  "accepted",
  "in_progress",
  "documented",
  "approved",
  "paid",
  "exhausted",
  "cancelled",
] as const;
export const JOB_ACTIVE_STATUS_VALUES = [
  "pending",
  "dispatched",
  "accepted",
  "in_progress",
] as const;
export const JOB_PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;

export const job = pgTable(
  "job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterUserId: text("requester_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    // Soft-validated against role_type.key at the application layer, same
    // pattern as Membership.role — no database foreign key.
    targetRole: text("target_role").notNull(),
    assigneeUserId: text("assignee_user_id").references(() => user.id, { onDelete: "restrict" }),
    subjectType: text("subject_type", { enum: JOB_SUBJECT_TYPE_VALUES }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    description: text("description").notNull(),
    acceptedAt: timestamp("accepted_at"),
    arrivedAt: timestamp("arrived_at"),
    completedAt: timestamp("completed_at"),
    approvedAt: timestamp("approved_at"),
    scheduledAt: timestamp("scheduled_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    scopeNotes: text("scope_notes"),
    reportUrl: text("report_url"),
    status: text("status", { enum: JOB_STATUS_VALUES }).notNull().default("pending"),
    priority: text("priority", { enum: JOB_PRIORITY_VALUES }).notNull().default("medium"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Maintained by the shared set_updated_at() trigger (attached in a
    // custom migration once this table exists), not Drizzle's $onUpdate.
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "job_subject_type_check",
      sql`${table.subjectType} IN (${sql.raw(JOB_SUBJECT_TYPE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "job_status_check",
      sql`${table.status} IN (${sql.raw(JOB_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "job_priority_check",
      sql`${table.priority} IN (${sql.raw(JOB_PRIORITY_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("job_requester_user_id_idx").on(table.requesterUserId),
    index("job_assignee_user_id_idx").on(table.assigneeUserId),
    index("job_subject_idx").on(table.subjectType, table.subjectId),
    index("job_active_status_idx")
      .on(table.status)
      .where(
        sql`${table.status} IN (${sql.raw(JOB_ACTIVE_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
      ),
  ],
);
