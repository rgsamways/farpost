import { sql } from "drizzle-orm";
import { index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { building } from "./building-schema.js";
import { membership } from "./membership-schema.js";

// One row per field visit to a building. `photoUrls`/`gpsAccuracyM` are
// genuinely new-for-this-rebuild (design.md Decision 8) — no old-system
// precedent, grounded instead in Farpost's own field-verified-data
// business model.
export const scoutVisit = pgTable(
  "scout_visit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => building.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => membership.id, { onDelete: "restrict" }),
    photoUrls: text("photo_urls").array().notNull().default(sql`'{}'::text[]`),
    notes: text("notes"),
    visitedAt: timestamp("visited_at").defaultNow().notNull(),
    gpsAccuracyM: numeric("gps_accuracy_m"),
  },
  (table) => [
    index("scout_visit_building_id_idx").on(table.buildingId),
    index("scout_visit_membership_id_idx").on(table.membershipId),
  ],
);
