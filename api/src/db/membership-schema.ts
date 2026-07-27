import { sql } from "drizzle-orm";
import { check, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Layer 2 of docs/core-user-model.md: "what can this person generically do
// on this platform" — one table, one source of truth per role held, instead
// of duplicating that across per-role fields/tables. `role` stays plain,
// unconstrained `text` (not an enum) — a future Farpost-specific
// role-curation screen validates it, not this shared shape.
export const MEMBERSHIP_STATUS_VALUES = ["pending", "active", "suspended", "revoked"] as const;

export const membership = pgTable(
  "membership",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status", { enum: MEMBERSHIP_STATUS_VALUES }).notNull().default("active"),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    // Additive, database-level backstop behind the TS-level `enum` above —
    // catches direct SQL/migration writes that bypass Drizzle.
    check(
      "membership_status_check",
      sql`${table.status} IN (${sql.raw(MEMBERSHIP_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    // No plain-active-role duplicate: a revoked-then-regranted role is still
    // allowed since the index only covers status = 'active' rows.
    uniqueIndex("membership_user_id_role_active_idx")
      .on(table.userId, table.role)
      .where(sql`${table.status} = 'active'`),
  ],
);
