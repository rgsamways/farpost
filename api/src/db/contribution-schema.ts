import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { building } from "./building-schema.js";
import { membership } from "./membership-schema.js";

// One append-only row per submitted building fact, replacing the old
// system's untyped `list[dict]`. `category` deliberately gets NO CHECK
// constraint — same rationale and vocabulary as fact_staleness (design.md
// Decision 1). Do not add one here.
export const CONTRIBUTION_REVIEW_STATUS_VALUES = [
  "pending",
  "verified",
  "flagged",
  "rejected",
] as const;
export const CONTRIBUTION_SOURCE_METHOD_VALUES = [
  "field_visit",
  "professional_audit",
  "permit_record",
  "form_submission",
] as const;

export const contribution = pgTable(
  "contribution",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => building.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => membership.id, { onDelete: "restrict" }),
    category: text("category").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    // Denormalized cache of the contributor's role at time of
    // contribution — the real gap found against the old system's `role`
    // field (design.md Decision 5), same pattern as
    // Event.actorRole/EventRecipient.recipientRole.
    contributorRole: text("contributor_role"),
    confidenceLevel: integer("confidence_level").notNull(),
    reviewStatus: text("review_status", { enum: CONTRIBUTION_REVIEW_STATUS_VALUES })
      .notNull()
      .default("pending"),
    sourceMethod: text("source_method", { enum: CONTRIBUTION_SOURCE_METHOD_VALUES }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("contribution_confidence_level_check", sql`${table.confidenceLevel} BETWEEN 1 AND 5`),
    check(
      "contribution_review_status_check",
      sql`${table.reviewStatus} IN (${sql.raw(CONTRIBUTION_REVIEW_STATUS_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "contribution_source_method_check",
      sql`${table.sourceMethod} IN (${sql.raw(CONTRIBUTION_SOURCE_METHOD_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    index("contribution_building_id_idx").on(table.buildingId),
    index("contribution_membership_id_idx").on(table.membershipId),
  ],
);
