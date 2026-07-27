import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
import { job } from "./job-schema.js";

// The per-candidate dispatch-offer record. `ON DELETE CASCADE` against
// `job.id` since this row is meaningless without its parent Job.
export const WORK_REQUEST_RESPONSE_VALUES = ["accepted", "declined", "timeout"] as const;

export const workRequestAttempt = pgTable(
  "work_request_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => job.id, { onDelete: "cascade" }),
    candidateUserId: text("candidate_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    attemptNumber: integer("attempt_number").notNull(),
    dispatchedAt: timestamp("dispatched_at").defaultNow().notNull(),
    timeoutAt: timestamp("timeout_at").notNull(),
    respondedAt: timestamp("responded_at"),
    response: text("response", { enum: WORK_REQUEST_RESPONSE_VALUES }),
    declineReason: text("decline_reason"),
  },
  (table) => [
    check(
      "work_request_attempt_response_check",
      sql`${table.response} IN (${sql.raw(WORK_REQUEST_RESPONSE_VALUES.map((v) => `'${v}'`).join(", "))}) OR ${table.response} IS NULL`,
    ),
    index("work_request_attempt_job_id_idx").on(table.jobId),
    index("work_request_attempt_candidate_user_id_idx").on(table.candidateUserId),
    // Postgres partial-index predicates must be immutable — `timeout_at >
    // now()` can't be baked into the predicate itself (now() is STABLE,
    // not IMMUTABLE; CREATE INDEX rejects it). This index narrows to
    // "unresponded" only; the "not yet timed out" half of design.md's
    // "outstanding offers" query is a runtime filter on top of it, applied
    // by whatever dispatch-timeout sweep reads this table.
    index("work_request_attempt_unresponded_idx")
      .on(table.timeoutAt)
      .where(sql`${table.respondedAt} IS NULL`),
  ],
);
