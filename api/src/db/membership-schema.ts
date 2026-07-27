import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Layer 2 of docs/core-user-model.md: "what can this person generically do
// on this platform" — one table, one source of truth per role held, instead
// of duplicating that across per-role fields/tables. `role` stays plain,
// unconstrained `text` (not an enum) — a future Farpost-specific
// role-curation screen validates it, not this shared shape. Nothing writes
// a row here yet; this change only proves the shape is real.
export const membership = pgTable("membership", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  status: text("status", { enum: ["pending", "active", "suspended", "revoked"] })
    .notNull()
    .default("active"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
});
