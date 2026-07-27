import { sql } from "drizzle-orm";
import { check, date, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Polymorphic registry of trackable equipment/systems. `subjectId` is
// intentionally NOT wired as a Drizzle relation/foreign key — it may point
// at `property.id`, `building.id`, or `unit.id` depending on `subjectType`,
// and is resolved at the application layer per subject type (matching the
// "not a real enforced FK" note in
// core-schema-relationships-and-indexes-2026-07-27.md).
export const ASSET_SUBJECT_TYPE_VALUES = ["property", "building", "unit"] as const;

export const asset = pgTable(
  "asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectType: text("subject_type", { enum: ASSET_SUBJECT_TYPE_VALUES }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    assetId: text("asset_id"),
    assetType: text("asset_type"),
    label: text("label"),
    manufacturer: text("manufacturer"),
    model: text("model"),
    serialNumber: text("serial_number"),
    warrantyExpiryDate: date("warranty_expiry_date"),
    installedDate: date("installed_date"),
    conditionStatus: text("condition_status"),
    photoUrls: text("photo_urls").array(),
    conditionNotes: text("condition_notes").array(),
    compliance: jsonb("compliance").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "asset_subject_type_check",
      sql`${table.subjectType} IN (${sql.raw(ASSET_SUBJECT_TYPE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("asset_subject_idx").on(table.subjectType, table.subjectId),
  ],
);
