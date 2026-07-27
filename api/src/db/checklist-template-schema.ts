import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// A named, versioned, curated question set (e.g. "Electrical Safety
// Checklist"). `(name, version)` gets a real UNIQUE constraint — two
// templates sharing both would be a genuine data-integrity failure (which
// one did a given ChecklistRun actually pin to?), not a coincidence to
// tolerate.
export const CHECKLIST_TEMPLATE_STATUS_VALUES = ["draft", "active", "deprecated"] as const;

export const checklistTemplate = pgTable(
  "checklist_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    version: integer("version").notNull().default(1),
    status: text("status", { enum: CHECKLIST_TEMPLATE_STATUS_VALUES }).notNull().default("draft"),
    assetTypes: text("asset_types").array(),
    curatorId: text("curator_id").references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Maintained by the shared set_updated_at() trigger (attached in a
    // custom migration once this table exists), not Drizzle's $onUpdate —
    // same pattern as building.updated_at/job.updated_at.
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "checklist_template_status_check",
      sql`${table.status} IN (${sql.raw(CHECKLIST_TEMPLATE_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    unique("checklist_template_name_version_unique").on(table.name, table.version),
  ],
);
