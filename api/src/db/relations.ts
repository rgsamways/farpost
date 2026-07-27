import { relations } from "drizzle-orm";
import { building } from "./building-schema.js";
import { property } from "./property-schema.js";
import { unit } from "./unit-schema.js";

// property <-> building <-> unit one-to-many chains, so query code can use
// Drizzle's relational query API instead of hand-written joins. Kept in a
// standalone file (rather than alongside each table) since these three
// tables reference each other bidirectionally.
//
// `asset` and `stake` are deliberately NOT related here — their
// `subjectType`/`subjectId` polymorphic pair isn't a real foreign key (see
// the comments on asset-schema.ts and stake-schema.ts) and is resolved at
// the application layer per subject type instead.
export const propertyRelations = relations(property, ({ many }) => ({
  buildings: many(building),
}));

export const buildingRelations = relations(building, ({ one, many }) => ({
  property: one(property, {
    fields: [building.propertyId],
    references: [property.id],
  }),
  units: many(unit),
}));

export const unitRelations = relations(unit, ({ one }) => ({
  building: one(building, {
    fields: [unit.buildingId],
    references: [building.id],
  }),
}));
