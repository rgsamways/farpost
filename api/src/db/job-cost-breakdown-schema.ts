import { sql } from "drizzle-orm";
import { check, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { job } from "./job-schema.js";

// Pure 1:1 extension of `job` — distinguishes an estimate from an actual
// invoice, with real Canadian tax fields. `ON DELETE CASCADE` since this
// row is meaningless without its parent Job.
export const JOB_COST_BREAKDOWN_TYPE_VALUES = ["estimate", "actual"] as const;

export const jobCostBreakdown = pgTable(
  "job_cost_breakdown",
  {
    jobId: uuid("job_id")
      .primaryKey()
      .references(() => job.id, { onDelete: "cascade" }),
    labourHours: numeric("labour_hours"),
    labourRate: numeric("labour_rate"),
    materials: numeric("materials"),
    equipment: numeric("equipment"),
    travel: numeric("travel"),
    total: numeric("total"),
    taxRate: numeric("tax_rate"),
    taxAmount: numeric("tax_amount"),
    breakdownType: text("breakdown_type", { enum: JOB_COST_BREAKDOWN_TYPE_VALUES }).notNull(),
    measurementNotes: text("measurement_notes"),
  },
  (table) => [
    check(
      "job_cost_breakdown_type_check",
      sql`${table.breakdownType} IN (${sql.raw(JOB_COST_BREAKDOWN_TYPE_VALUES.map((v) => `'${v}'`).join(", "))})`,
    ),
  ],
);
