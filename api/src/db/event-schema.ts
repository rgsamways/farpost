import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// A single append-only record of something that happened. `subjectId` is
// intentionally NOT wired as a Drizzle relation/foreign key — the target
// table depends on `subjectType` and is resolved at the application layer,
// matching the established pattern from asset-schema.ts/stake-schema.ts/
// job-schema.ts.
//
// Real type correction, not a transcription: the source design doc
// (core-schema-full-design-2026-07-27.md) types `actor_user_id` as `uuid`.
// Checked against the actual built `user` table (auth-schema.ts) — `id` is
// `text` (better-auth's own convention, already followed by every other
// user-referencing column: job.requesterUserId, stake.userId,
// workRequestAttempt.candidateUserId, etc.). `text` used here instead.
export const EVENT_SUBJECT_TYPE_VALUES = ["building", "claim", "job"] as const;
export const EVENT_URGENCY_VALUES = ["normal", "high"] as const;
export const EVENT_DELIVERY_STATUS_VALUES = ["pending", "processing", "delivered"] as const;

export const event = pgTable(
  "event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "restrict" }),
    // Denormalized cache — accepted drift risk per the full-design doc's own note.
    actorRole: text("actor_role"),
    subjectType: text("subject_type", { enum: EVENT_SUBJECT_TYPE_VALUES }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    urgency: text("urgency", { enum: EVENT_URGENCY_VALUES }).notNull().default("normal"),
    deliveryStatus: text("delivery_status", { enum: EVENT_DELIVERY_STATUS_VALUES })
      .notNull()
      .default("pending"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "event_subject_type_check",
      sql`${table.subjectType} IN (${sql.raw(EVENT_SUBJECT_TYPE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "event_urgency_check",
      sql`${table.urgency} IN (${sql.raw(EVENT_URGENCY_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "event_delivery_status_check",
      sql`${table.deliveryStatus} IN (${sql.raw(EVENT_DELIVERY_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("event_created_at_idx").on(table.createdAt.desc()),
    index("event_subject_idx").on(table.subjectType, table.subjectId),
    index("event_undelivered_idx")
      .on(table.deliveryStatus)
      .where(sql`${table.deliveryStatus} != 'delivered'`),
  ],
);
