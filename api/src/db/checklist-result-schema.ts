import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { asset } from "./asset-schema.js";
import { checklistRun } from "./checklist-run-schema.js";
import { checklistTemplateItem } from "./checklist-template-item-schema.js";

// One row per question answered during a ChecklistRun. `assetId` is
// nullable — "a result can apply to the building as a whole." `ON DELETE
// CASCADE` against its run since a result is meaningless without one (the
// one CASCADE in this change, per design.md); `RESTRICT` against the item
// and asset it references.
export const CHECKLIST_RESULT_CONDITION_STATUS_VALUES = [
  "inspected_acceptable",
  "not_inspected",
  "not_present",
  "safety_concern",
  "repair_needed",
  "defect_follow_up",
] as const;

export const checklistResult = pgTable(
  "checklist_result",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    checklistRunId: uuid("checklist_run_id")
      .notNull()
      .references(() => checklistRun.id, { onDelete: "cascade" }),
    checklistTemplateItemId: uuid("checklist_template_item_id")
      .notNull()
      .references(() => checklistTemplateItem.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id").references(() => asset.id, { onDelete: "restrict" }),
    conditionStatus: text("condition_status", {
      enum: CHECKLIST_RESULT_CONDITION_STATUS_VALUES,
    }).notNull(),
    recommendedAction: text("recommended_action"),
    notes: text("notes"),
  },
  (table) => [
    check(
      "checklist_result_condition_status_check",
      sql`${table.conditionStatus} IN (${sql.raw(CHECKLIST_RESULT_CONDITION_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("checklist_result_checklist_run_id_idx").on(table.checklistRunId),
    index("checklist_result_asset_id_idx").on(table.assetId),
    index("checklist_result_checklist_template_item_id_idx").on(table.checklistTemplateItemId),
  ],
);
