import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { building } from "./building-schema.js";

// Layer 3 of the building cluster — an individually-occupiable space
// within a `Building` (zero-to-many; most buildings have none, e.g. a
// single-family home).
export const unit = pgTable(
  "unit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => building.id, { onDelete: "restrict" }),
    nfcTagId: text("nfc_tag_id"),
    unitLabel: text("unit_label").notNull(),
    unitType: text("unit_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("unit_building_id_idx").on(table.buildingId),
    uniqueIndex("unit_nfc_tag_id_idx")
      .on(table.nfcTagId)
      .where(sql`${table.nfcTagId} IS NOT NULL`),
  ],
);
