import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { building } from "./building-schema.js";
import { checklistTemplate } from "./checklist-template-schema.js";
import { membership } from "./membership-schema.js";

// A single execution of a ChecklistTemplate against a Building, performed
// by a Membership, pinned to the exact template version used
// (`checklistTemplateVersion`) so a run stays traceable even after its
// template evolves. `overallStatus`'s three-value vocabulary was invented
// during this change's design (design.md's judgment call, same treatment
// as ComplianceRecord.verification_status in job-dispatch-schema) — not
// sourced from a prior doc. Flagged for a future deliberate look, not
// assumed settled.
export const CHECKLIST_RUN_OVERALL_STATUS_VALUES = ["in_progress", "clean", "issues_found"] as const;

export const checklistRun = pgTable(
  "checklist_run",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => building.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => membership.id, { onDelete: "restrict" }),
    checklistTemplateId: uuid("checklist_template_id")
      .notNull()
      .references(() => checklistTemplate.id, { onDelete: "restrict" }),
    checklistTemplateVersion: integer("checklist_template_version").notNull(),
    completedAt: timestamp("completed_at"),
    overallStatus: text("overall_status", { enum: CHECKLIST_RUN_OVERALL_STATUS_VALUES }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "checklist_run_overall_status_check",
      sql`${table.overallStatus} IN (${sql.raw(CHECKLIST_RUN_OVERALL_STATUS_VALUES.map((v) => `'${v}'`).join(", "))}) OR ${table.overallStatus} IS NULL`,
    ),
    index("checklist_run_building_id_idx").on(table.buildingId),
    index("checklist_run_membership_id_idx").on(table.membershipId),
    index("checklist_run_checklist_template_id_idx").on(table.checklistTemplateId),
  ],
);
