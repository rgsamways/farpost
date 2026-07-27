import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { job } from "./job-schema.js";

// Pure 1:1 extension of `job` — two-party (requester/assignee) notes.
// `ON DELETE CASCADE` since this row is meaningless without its parent Job.
export const jobNotes = pgTable("job_notes", {
  jobId: uuid("job_id")
    .primaryKey()
    .references(() => job.id, { onDelete: "cascade" }),
  requesterNotes: text("requester_notes"),
  assigneeNotes: text("assignee_notes"),
});
