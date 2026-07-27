import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
import { job } from "./job-schema.js";

// Many-per-job attachment. `docType` is soft-validated against a small
// Farpost-curated list at the application layer — no database FK or CHECK,
// per specs/job-record/spec.md. `ON DELETE CASCADE` since this row is
// meaningless without its parent Job.
export const jobAttachment = pgTable(
  "job_attachment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => job.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(),
    label: text("label"),
    url: text("url").notNull(),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    mimetype: text("mimetype"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (table) => [index("job_attachment_job_id_idx").on(table.jobId)],
);
