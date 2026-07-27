import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { building } from "./building-schema.js";

// One row per (building, category), tracking when a fact was last
// documented and when it should be considered stale again. Real
// `UNIQUE (building_id, category)` constraint — the old system's
// `dict[str, FactStaleness]` shape enforced exactly this implicitly; a new
// fact for an existing category is an UPDATE on the same row, not a new
// insert.
//
// `category` deliberately gets NO CHECK constraint — grounded directly in
// the old system's own documented design intent ("an unrecognized category
// never blocks either write path", confirmed in the archived
// building-decay-model spec), not a fresh guess. Do not add one here.
export const FACT_STALENESS_SOURCE_METHOD_VALUES = [
  "field_visit",
  "professional_audit",
  "permit_record",
  "form_submission",
] as const;

export const factStaleness = pgTable(
  "fact_staleness",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => building.id, { onDelete: "restrict" }),
    category: text("category").notNull(),
    lastDocumentedAt: date("last_documented_at").notNull(),
    halfLifeMonths: integer("half_life_months").notNull(),
    // Never trusted for display, per the old system's own documented
    // guarantee — a cached scheduling aid only. GENERATED ALWAYS makes
    // that guarantee airtight at the database level instead of relying on
    // every write path to recompute it by hand.
    //
    // Real Postgres limitation found, not a Drizzle bug: design.md's
    // literal expression (`(half_life_months || ' months')::interval`)
    // fails with "generation expression is not immutable" — the text ->
    // interval cast is STABLE, not IMMUTABLE (parsing depends on
    // IntervalStyle), and Postgres requires generated-column expressions
    // to be fully immutable. `half_life_months * interval '1 month'`
    // computes the identical result via pure numeric interval scaling,
    // which Postgres does accept as immutable. Confirmed against a real
    // temp table: '2026-01-01' + 12 months -> '2027-01-01', same as the
    // spec's own worked example.
    nextStaleAt: date("next_stale_at").generatedAlwaysAs(
      sql`(last_documented_at + (half_life_months * interval '1 month'))::date`,
    ),
    notifiedAt: timestamp("notified_at"),
    sourceMethod: text("source_method", { enum: FACT_STALENESS_SOURCE_METHOD_VALUES }).notNull(),
    sourceConfidenceLevel: integer("source_confidence_level").notNull(),
  },
  (table) => [
    check(
      "fact_staleness_source_method_check",
      sql`${table.sourceMethod} IN (${sql.raw(FACT_STALENESS_SOURCE_METHOD_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
    check(
      "fact_staleness_source_confidence_level_check",
      sql`${table.sourceConfidenceLevel} BETWEEN 1 AND 5`,
    ),
    unique("fact_staleness_building_id_category_unique").on(table.buildingId, table.category),
    index("fact_staleness_building_id_idx").on(table.buildingId),
    // Models the old system's real sweep query exactly: `next_stale_at <
    // now() AND notified_at IS NULL` — the immutable half of that
    // predicate only (same `now()`-is-STABLE limitation already found on
    // work_request_attempt in job-dispatch-schema).
    index("fact_staleness_unnotified_idx")
      .on(table.nextStaleAt)
      .where(sql`${table.notifiedAt} IS NULL`),
  ],
);
