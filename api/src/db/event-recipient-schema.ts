import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
import { event } from "./event-schema.js";

// Replaces the old model's jsonb `relevance` list with a real,
// independently-queryable per-recipient row: which users an event is
// relevant to, why, and whether each has read it. `ON DELETE CASCADE`
// against `event.id` — a pure child row, meaningless without its parent.
//
// Same real type correction as event-schema.ts: `recipient_user_id` is
// `text`, not the source design doc's literal (incorrect) `uuid` — matches
// the real `user.id` column type.
export const eventRecipient = pgTable(
  "event_recipient",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    recipientUserId: text("recipient_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    // Denormalized cache, same reasoning as event.actorRole.
    recipientRole: text("recipient_role"),
    // Free text (e.g. "building_owner", "assigned_inspector") — soft by
    // design, not a CHECK-constrained vocabulary. Neither design doc
    // carries the old RelevanceTag.reason fixed set forward as a
    // constraint, so none is invented here.
    reason: text("reason"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("event_recipient_recipient_created_idx").on(table.recipientUserId, table.createdAt.desc()),
    index("event_recipient_event_id_idx").on(table.eventId),
    index("event_recipient_unread_idx").on(table.readAt).where(sql`${table.readAt} IS NULL`),
  ],
);
