import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { checklistTemplate } from "./checklist-template-schema.js";

// One ordered question within a ChecklistTemplate, scoped to the asset
// types it applies to. `ON DELETE RESTRICT` against its template — per
// core-schema-relationships-and-indexes-2026-07-27.md's explicit call: "a
// template with a published version's items shouldn't disappear out from
// under historical runs."
export const checklistTemplateItem = pgTable(
  "checklist_template_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    checklistTemplateId: uuid("checklist_template_id")
      .notNull()
      .references(() => checklistTemplate.id, { onDelete: "restrict" }),
    sequence: integer("sequence").notNull(),
    category: text("category"),
    title: text("title").notNull(),
    description: text("description"),
    expectedAssetTypes: text("expected_asset_types").array(),
    recommendedActionOnFail: text("recommended_action_on_fail"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("checklist_template_item_template_id_idx").on(table.checklistTemplateId)],
);
